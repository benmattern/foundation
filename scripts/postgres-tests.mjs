import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import pg from "pg";

const bin = process.env.PG_BIN ??
  (process.platform === "win32"
    ? "C:/Program Files/PostgreSQL/18/bin"
    : "/usr/lib/postgresql/16/bin");
const executable = (name) =>
  join(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
if (!existsSync(executable("initdb"))) {
  throw new Error(
    "Set PG_BIN to a local PostgreSQL bin directory. This test never uses a database URL.",
  );
}
const root = resolve("node_modules/.tmp");
mkdirSync(root, { recursive: true });
const directory = mkdtempSync(join(root, "foundation-pg-"));
const port = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
function run(name, args) {
  // A detached PostgreSQL child must not inherit Node's capture pipes on Windows.
  const result = spawnSync(executable(name), args, {
    stdio: "ignore",
    windowsHide: true,
    timeout: 60000,
  });
  if (result.error) throw result.error;
  if (result.status) {
    throw new Error(
      `${name} exited with status ${result.status}; inspect the disposable cluster log.`,
    );
  }
}
const connections = [];
let running = false;
async function connect() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port,
    database: "postgres",
    user: "foundation_test",
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  connections.push(client);
  return client;
}
async function waitsForLock(observer, pid) {
  for (let i = 0; i < 100; i++) {
    const { rows } = await observer.query(
      "select wait_event_type from pg_stat_activity where pid=$1",
      [pid],
    );
    if (rows[0]?.wait_event_type === "Lock") return;
    await setTimeout(50);
  }
  throw new Error("Expected a second database connection to wait on a lock.");
}
try {
  run("initdb", [
    "-D",
    directory,
    "-U",
    "foundation_test",
    "-A",
    "trust",
    "--no-locale",
    "--encoding=UTF8",
  ]);
  running = true;
  run("pg_ctl", [
    "-D",
    directory,
    "-l",
    join(directory, "test.log"),
    "-o",
    `-h 127.0.0.1 -p ${port} -F`,
    "-w",
    "start",
  ]);
  const [admin, a, b] = await Promise.all([connect(), connect(), connect()]);
  const owner = "10000000-0000-0000-0000-000000000001";
  const p1 = "20000000-0000-0000-0000-000000000001",
    p2 = "20000000-0000-0000-0000-000000000002";
  const feed = "70000000-0000-0000-0000-000000000001";
  await admin.query(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to authenticated,service_role,anon;grant execute on function auth.uid() to authenticated,service_role,anon;
    insert into auth.users values('${owner}');`,
  );
  for (const file of readdirSync("supabase/migrations").sort()) {
    await admin.query(readFileSync(join("supabase/migrations", file), "utf8"));
  }
  await admin.query(
    `insert into projects(id,owner_id,name) values('${p1}','${owner}','One'),('${p2}','${owner}','Two');
    insert into rss_feeds(id,owner_id,feed_url) values('${feed}','${owner}','https://example.com/feed');
    insert into project_subscriptions(project_id,feed_id,owner_id) values('${p1}','${feed}','${owner}'),('${p2}','${feed}','${owner}');`,
  );
  const claims = await Promise.all([
    a.query("select claim_feed($1,$2) as id", [feed, owner]),
    b.query("select claim_feed($1,$2) as id", [feed, owner]),
  ]);
  const runId = claims.map((r) => r.rows[0].id).find(Boolean);
  assert.equal(claims.filter((r) => r.rows[0].id).length, 1);
  console.log("PASS: simultaneous manual/scheduled claims produce one lease");
  const rules = {
    version: 1,
    includeAny: [],
    excludeAny: [],
    defaultTags: [],
    keywordTags: [],
  };
  const results = Object.fromEntries(
    [p1, p2].map((
      project,
    ) => [project, {
      projectRules: rules,
      subscriptionRules: null,
      classification: {
        route: "pending",
        version: 1,
        suggestedTags: [],
        matches: [],
      },
    }]),
  );
  const stage = (client, url) =>
    client.query("select stage_feed_item($1,$2,$3,$4,$5) as added", [
      runId,
      url,
      `url:${url}`,
      { link: url, title: "Concurrent story" },
      results,
    ]);
  const stages = await Promise.all([
    stage(a, "https://example.com/race"),
    stage(b, "https://example.com/race"),
  ]);
  assert.deepEqual(stages.map((r) => r.rows[0].added).sort(), [0, 2]);
  assert.equal(
    Number(
      (await admin.query("select count(*) from ingestion_candidates")).rows[0]
        .count,
    ),
    2,
  );
  console.log("PASS: simultaneous staging deduplicates project candidates");
  for (const client of [a, b]) {
    await client.query(`set request.jwt.claim.sub='${owner}';`);
  }
  const candidate = (await admin.query(
    "select id from ingestion_candidates where project_id=$1",
    [p1],
  )).rows[0].id;
  const approvals = await Promise.all([
    a.query("select * from review_candidate($1,'accept')", [candidate]),
    b.query("select * from review_candidate($1,'accept')", [candidate]),
  ]);
  assert.ok(approvals[0].rows[0].converted_article_id);
  assert.equal(
    approvals[0].rows[0].converted_article_id,
    approvals[1].rows[0].converted_article_id,
  );
  assert.equal(
    Number((await admin.query("select count(*) from articles")).rows[0].count),
    1,
  );
  console.log(
    "PASS: simultaneous acceptance returns the same approved article",
  );
  const bPid = (await b.query("select pg_backend_pid() as pid")).rows[0].pid;
  await a.query("begin");
  await stage(a, "https://example.com/before-pause");
  const pause = b.query("select set_subscription($1,$2,false,null)", [
    p1,
    feed,
  ]);
  await waitsForLock(admin, bPid);
  await a.query("commit");
  await pause;
  const afterPause = await stage(a, "https://example.com/after-pause");
  assert.equal(afterPause.rows[0].added, 1);
  assert.equal(
    Number(
      (await admin.query(
        "select count(*) from ingestion_candidates where project_id=$1 and url='https://example.com/after-pause'",
        [p1],
      )).rows[0].count,
    ),
    0,
  );
  console.log(
    "PASS: pause waits for in-flight publication, then prevents new project candidates",
  );
  await a.query("begin");
  await a.query("select review_candidate($1,'accept')", [
    (await admin.query(
      "select id from ingestion_candidates where project_id=$1 and status='pending' limit 1",
      [p2],
    )).rows[0].id,
  ]);
  const contested = (await a.query(
    "select id from ingestion_candidates where project_id=$1 and status='accepted' limit 1",
    [p2],
  )).rows[0].id;
  const reject = b.query("select review_candidate($1,'reject')", [contested])
    .then(() => null, (error) => error);
  await waitsForLock(admin, bPid);
  await a.query("commit");
  assert.equal((await reject).code, "40001");
  console.log(
    "PASS: conflicting accept/reject serializes and rejects the stale decision",
  );
  assert.equal(
    (await admin.query(
      "select finish_feed($1,'success','[]',null,'stale-validator') as status",
      [runId],
    )).rows[0].status,
    "partial",
  );
  assert.equal(
    (await admin.query("select etag from rss_feeds where id=$1", [feed]))
      .rows[0].etag,
    null,
  );
  console.log(
    "PASS: subscription change prevents stale completion from caching a validator",
  );
} finally {
  for (const client of connections) {
    await client.query("rollback").catch(() => {});
    await client.end().catch(() => {});
  }
  if (running && existsSync(join(directory, "postmaster.pid"))) {
    run("pg_ctl", ["-D", directory, "-m", "immediate", "-w", "stop"]);
  }
  // Delete only the unique disposable cluster created by this script, after stopping it.
  const target = realpathSync(directory),
    expectedRoot = realpathSync(root) + sep;
  if (
    !target.startsWith(expectedRoot) ||
    !target.slice(expectedRoot.length).startsWith("foundation-pg-")
  ) throw new Error("Refusing unsafe test-cluster cleanup");
  rmSync(target, { recursive: true, force: true });
}
