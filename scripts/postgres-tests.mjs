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

const bin =
  process.env.PG_BIN ??
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
    const log = join(directory, "test.log");
    if (existsSync(log)) process.stderr.write(readFileSync(log, "utf8"));
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
    `-h 127.0.0.1 -p ${port} -F${process.platform === "win32" ? "" : ` -k ${directory}`}`,
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
    [p1, p2].map((project) => [
      project,
      {
        projectRules: rules,
        subscriptionRules: null,
        classification: {
          route: "pending",
          version: 1,
          suggestedTags: [],
          matches: [],
        },
      },
    ]),
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
  const candidate = (
    await admin.query(
      "select id from ingestion_candidates where project_id=$1",
      [p1],
    )
  ).rows[0].id;
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
      (
        await admin.query(
          "select count(*) from ingestion_candidates where project_id=$1 and url='https://example.com/after-pause'",
          [p1],
        )
      ).rows[0].count,
    ),
    0,
  );
  console.log(
    "PASS: pause waits for in-flight publication, then prevents new project candidates",
  );
  const source = (
    await admin.query(
      "insert into sources(owner_id,name,url) values($1,'Concurrency source','https://example.com') returning id",
      [owner],
    )
  ).rows[0].id;
  await admin.query("update rss_feeds set source_id=$1 where id=$2", [
    source,
    feed,
  ]);
  await a.query("select set_source_state($1,$2,'following',0)", [p1, source]);
  await a.query("begin");
  await stage(a, "https://example.com/before-unfollow");
  const unfollow = b.query("select set_source_state($1,$2,'unfollowed',1)", [
    p1,
    source,
  ]);
  await waitsForLock(admin, bPid);
  await a.query("commit");
  await unfollow;
  assert.equal(
    (await stage(a, "https://example.com/after-unfollow")).rows[0].added,
    1,
  );
  assert.equal(
    Number(
      (
        await admin.query(
          "select count(*) from ingestion_candidates where project_id=$1 and url='https://example.com/after-unfollow'",
          [p1],
        )
      ).rows[0].count,
    ),
    0,
  );
  console.log(
    "PASS: Unfollow serializes with staging and retains another project's intake",
  );
  await a.query("begin");
  await a.query("select review_candidate($1,'accept')", [
    (
      await admin.query(
        "select id from ingestion_candidates where project_id=$1 and status='pending' limit 1",
        [p2],
      )
    ).rows[0].id,
  ]);
  const contested = (
    await a.query(
      "select id from ingestion_candidates where project_id=$1 and status='accepted' limit 1",
      [p2],
    )
  ).rows[0].id;
  const reject = b
    .query("select review_candidate($1,'reject')", [contested])
    .then(
      () => null,
      (error) => error,
    );
  await waitsForLock(admin, bPid);
  await a.query("commit");
  assert.equal((await reject).code, "40001");
  console.log(
    "PASS: conflicting accept/reject serializes and rejects the stale decision",
  );
  assert.equal(
    (
      await admin.query(
        "select finish_feed($1,'success','[]',null,'stale-validator') as status",
        [runId],
      )
    ).rows[0].status,
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
  const question = (
    await a.query(
      'select * from save_question($1,\'{"title":"Concurrent investigation"}\')',
      [p1],
    )
  ).rows[0];
  const edits = await Promise.allSettled([
    a.query(
      'select * from save_question($1,\'{"answer":"First answer"}\',$2,1)',
      [p1, question.id],
    ),
    b.query(
      'select * from save_question($1,\'{"answer":"Second answer"}\',$2,1)',
      [p1, question.id],
    ),
  ]);
  assert.equal(edits.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(edits.find((r) => r.status === "rejected").reason.code, "40001");
  console.log(
    "PASS: concurrent question edits preserve the winning answer and reject the stale revision",
  );
  const approved = approvals[0].rows[0].converted_article_id;
  const links = await Promise.allSettled([
    a.query("select * from link_question_article($1,$2,$3)", [
      p1,
      question.id,
      approved,
    ]),
    b.query("select * from link_question_article($1,$2,$3)", [
      p1,
      question.id,
      approved,
    ]),
  ]);
  assert.equal(links.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(links.find((r) => r.status === "rejected").reason.code, "40001");
  const notes = await Promise.allSettled([
    a.query("select * from save_article_note($1,$2,'First note')", [
      p1,
      approved,
    ]),
    b.query("select * from save_article_note($1,$2,'Second note')", [
      p1,
      approved,
    ]),
  ]);
  assert.equal(notes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(notes.find((r) => r.status === "rejected").reason.code, "40001");
  console.log(
    "PASS: concurrent evidence-link and article-note creation reject stale overwrites",
  );
  const entity = (
    await a.query(
      'select * from save_entity(\'{"name":"Concurrent organization","entity_type":"organization"}\')',
    )
  ).rows[0];
  const payload = JSON.stringify([
    {
      entity_id: entity.id,
      alias: entity.name,
      snapshot: "Manual research association",
    },
  ]);
  const mentions = await Promise.all([
    a.query("select save_mentions($1,$2,$3,true) as n", [
      p1,
      approved,
      payload,
    ]),
    b.query("select save_mentions($1,$2,$3,true) as n", [
      p1,
      approved,
      payload,
    ]),
  ]);
  assert.deepEqual(mentions.map((r) => r.rows[0].n).sort(), [0, 1]);
  console.log(
    "PASS: simultaneous mention retries create one stable association",
  );
  const request = "31000000-0000-4000-8000-000000000001";
  const createPayload = JSON.stringify({
    title: "Retry-safe concurrent question",
    request_id: request,
  });
  const created = await Promise.all([
    a.query("select * from save_question($1,$2)", [p1, createPayload]),
    b.query("select * from save_question($1,$2)", [p1, createPayload]),
  ]);
  assert.equal(created[0].rows[0].id, created[1].rows[0].id);
  assert.equal(
    Number(
      (
        await admin.query(
          "select count(*) from research_questions where create_token=$1",
          [request],
        )
      ).rows[0].count,
    ),
    1,
  );
  console.log(
    "PASS: simultaneous create-request retries return one research object",
  );
  // A boundary read waits behind an uncommitted research change. A later edit
  // remains beyond that boundary even when Finish happens after its commit.
  await a.query("begin");
  await a.query("select save_question($1,$2)", [
    p1,
    JSON.stringify({ title: "Uncommitted session edit" }),
  ]);
  const windowRead = b.query("select session_window($1) as w", [p1]);
  await waitsForLock(admin, b.processID);
  await a.query("commit");
  const window = (await windowRead).rows[0].w;
  await a.query("select save_question($1,$2)", [
    p1,
    JSON.stringify({ title: "After captured boundary" }),
  ]);
  await b.query("select save_session($1,$2,$3)", [
    p1,
    window.version,
    window.bound,
  ]);
  const after = (await a.query("select session_window($1) as w", [p1])).rows[0]
    .w;
  assert.equal(after.count, 2); // save_question records its insert and populated update
  const finishes = await Promise.allSettled([
    a.query("select save_session($1,$2,$3)", [p1, after.version, after.bound]),
    b.query("select save_session($1,$2,$3)", [p1, after.version, after.bound]),
  ]);
  assert.equal(finishes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    finishes.find((r) => r.status === "rejected").reason.code,
    "40001",
  );
  console.log(
    "PASS: session boundaries wait for committed writers, retain later edits and reject stale-tab finish",
  );
  const catalog = {
    id: "concurrent-catalog",
    name: "Fictional selected publisher",
    url: "https://example.com/catalog-concurrency",
    feedUrl: "https://example.com/catalog-concurrency/rss",
    topics: ["trade"],
    region: "Fictional",
    language: "English",
  };
  const selected = await Promise.all([
    a.query("select select_catalog_source($1,$2) id", [p1, catalog]),
    b.query("select select_catalog_source($1,$2) id", [p1, catalog]),
  ]);
  assert.equal(selected[0].rows[0].id, selected[1].rows[0].id);
  const catalogSource = selected[0].rows[0].id;
  await a.query("begin");
  await a.query("select set_source_state($1,$2,'paused')", [p1, catalogSource]);
  const adoption = b.query("select select_catalog_source($1,$2)", [
    p1,
    catalog,
  ]);
  await waitsForLock(admin, b.processID);
  await a.query("commit");
  await adoption;
  assert.equal(
    (
      await admin.query(
        "select enabled from project_subscriptions s join rss_feeds f on f.id=s.feed_id where s.project_id=$1 and f.source_id=$2",
        [p1, catalogSource],
      )
    ).rows[0].enabled,
    false,
  );
  const tuningCandidate = (
    await admin.query(
      "select id from ingestion_candidates where project_id=$1 order by id limit 1",
      [p1],
    )
  ).rows[0].id;
  const labels = await Promise.allSettled([
    a.query("select save_tuning_example($1,$2,true,false)", [
      p1,
      tuningCandidate,
    ]),
    b.query("select save_tuning_example($1,$2,false,true)", [
      p1,
      tuningCandidate,
    ]),
  ]);
  assert.equal(labels.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    labels.find((r) => r.status === "rejected").reason.code,
    "40001",
  );
  console.log(
    "PASS: catalog selection retries deduplicate, concurrent Pause survives adoption and tuning labels reject stale edits",
  );
  const eventRequest = crypto.randomUUID();
  const eventValues = {
    title: "Fictional concurrent timeline event",
    date_start: "2024-02",
    request_id: eventRequest,
  };
  await a.query("begin");
  const savedEvent = (
    await a.query("select * from save_event($1,$2)", [p1, eventValues])
  ).rows[0];
  const retryEvent = b.query("select * from save_event($1,$2)", [
    p1,
    eventValues,
  ]);
  await waitsForLock(admin, b.processID);
  await a.query("commit");
  assert.equal((await retryEvent).rows[0].id, savedEvent.id);
  assert.equal(
    (
      await admin.query(
        "select count(*)::int n from research_history where object_id=$1",
        [savedEvent.id],
      )
    ).rows[0].n,
    1,
  );
  await a.query("begin");
  await a.query("select save_event($1,$2,$3)", [
    p1,
    {
      version: 1,
      title: "Fictional first writer",
      request_id: crypto.randomUUID(),
    },
    savedEvent.id,
  ]);
  const staleEvent = b.query("select save_event($1,$2,$3)", [
    p1,
    {
      version: 1,
      title: "Fictional stale writer",
      request_id: crypto.randomUUID(),
    },
    savedEvent.id,
  ]);
  // Attach a rejection handler before releasing the lock to avoid unhandled rejections.
  const staleResult = Promise.allSettled([staleEvent]);
  await waitsForLock(admin, b.processID);
  await a.query("commit");
  assert.equal((await staleResult)[0].reason.code, "40001");
  const deleteRequest = crypto.randomUUID();
  await a.query("begin");
  await a.query("select remove_timeline_event($1,$2,2,$3)", [
    p1,
    savedEvent.id,
    deleteRequest,
  ]);
  const retryDelete = b.query("select remove_timeline_event($1,$2,2,$3)", [
    p1,
    savedEvent.id,
    deleteRequest,
  ]);
  await waitsForLock(admin, b.processID);
  await a.query("commit");
  await retryDelete;
  assert.equal(
    (
      await admin.query(
        "select count(*)::int n from research_history where object_id=$1 and after_state->>'deleted'='true'",
        [savedEvent.id],
      )
    ).rows[0].n,
    1,
  );
  console.log(
    "PASS: timeline concurrent create/delete retries deduplicate and stale editors reject after row-lock waits",
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
  )
    throw new Error("Refusing unsafe test-cluster cleanup");
  rmSync(target, { recursive: true, force: true });
}
