// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const owner = "10000000-0000-0000-0000-000000000001";
const other = "10000000-0000-0000-0000-000000000002";
const project = "20000000-0000-0000-0000-000000000001";
const project2 = "20000000-0000-0000-0000-000000000002";
let db: PGlite;
const migrations = readdirSync("supabase/migrations").sort().map((file) =>
  readFileSync(`supabase/migrations/${file}`, "utf8")
);
async function bootstrap(database: PGlite) {
  await database.exec(
    `create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    insert into auth.users values('${owner}'),('${other}');
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`,
  );
}
async function asUser(id: string, query: string) {
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`);
  try {
    return await db.query(query);
  } finally {
    await db.exec("reset role;");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await bootstrap(db);
  for (const sql of migrations) await db.exec(sql);
  await db.exec(
    `insert into public.projects(id,owner_id,name) values('${project}','${owner}','One'),('${project2}','${owner}','Two');`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});

describe("migrations and review transactions", () => {
  it("removes hosted default TRUNCATE and write grants, including column privileges", async () => {
    for (const table of ["sources","tags","projects","articles","ingestion_candidates","collected_items","collection_runs","review_history","rule_evaluations"]) {
      const grants = (await db.query(`select has_table_privilege('anon','public.${table}','TRUNCATE') as anon_truncate,
        has_table_privilege('authenticated','public.${table}','TRUNCATE') as user_truncate`)).rows[0];
      expect(grants).toEqual({anon_truncate:false,user_truncate:false});
    }
    await expect(asUser(owner,"truncate public.sources")).rejects.toThrow(/permission denied/);
    await expect(asUser(owner,`insert into collected_items(owner_id,identity_url,original_acquisition) values('${owner}','https://example.com/tamper','{}')`)).rejects.toThrow(/permission denied/);
    await expect(asUser(owner,`update projects set rules='{}' where id='${project}'`)).rejects.toThrow(/permission denied/);
    await asUser(owner,`update projects set description='Permitted metadata edit' where id='${project}'`);
  });
  it("leases feeds, stages once, preserves origins, respects pause and rejects stale workers", async () => {
    const feed = "70000000-0000-0000-0000-000000000001";
    await db.exec(
      `insert into rss_feeds(id,owner_id,feed_url) values('${feed}','${owner}','https://example.com/feed');
      insert into project_subscriptions(project_id,feed_id,owner_id) values('${project}','${feed}','${owner}'),('${project2}','${feed}','${owner}');`,
    );
    await expect(asUser(owner, `select claim_feed('${feed}','${owner}')`))
      .rejects.toThrow(/permission denied/);
    const run =
      (await db.query(`select claim_feed('${feed}','${owner}') as id`)).rows[0]
        .id;
    expect(run).toBeTruthy();
    expect(
      (await db.query(`select claim_feed('${feed}','${owner}') as id`)).rows[0]
        .id,
    ).toBeNull();
    const rules =
      '{"version":1,"includeAny":[],"excludeAny":[],"defaultTags":[],"keywordTags":[]}';
    const results = JSON.stringify(
      Object.fromEntries(
        [project, project2].map((
          p,
        ) => [p, {
          projectRules: JSON.parse(rules),
          subscriptionRules: null,
          classification: {
            route: "pending",
            version: 1,
            suggestedTags: [],
            matches: [],
          },
        }]),
      ),
    );
    const item =
      '{"link":"https://example.com/rss-story","title":"Feed story","guid":"guid-1"}';
    const stage =
      `select stage_feed_item('${run}','https://example.com/rss-story','id:guid-1','${item}','${results}') as added`;
    expect((await db.query(stage)).rows[0].added).toBe(2);
    expect((await db.query(stage)).rows[0].added).toBe(0);
    await asUser(
      owner,
      `select set_subscription('${project}','${feed}',false,null)`,
    );
    expect(
      (await db.query(
        `select stage_feed_item('${run}','https://example.com/rss-after-pause','id:guid-2','{"link":"https://example.com/rss-after-pause","title":"After pause"}','${results}') as added`,
      )).rows[0].added,
    ).toBe(1);
    expect(
      (await db.query(
        `select * from ingestion_candidates where project_id='${project}' and url='https://example.com/rss-after-pause'`,
      )).rows,
    ).toHaveLength(0);
    await db.exec(
      `select finish_feed('${run}','partial','["A skipped item"]',null,'etag-should-not-stick');`,
    );
    const state = (await db.query(
      `select etag,last_success_at,failure_count from rss_feeds where id='${feed}'`,
    )).rows[0];
    expect(state).toMatchObject({
      etag: null,
      last_success_at: null,
      failure_count: 1,
    });
    await expect(db.query(stage)).rejects.toThrow(/lease unavailable/);
    const next =
      (await db.query(`select claim_feed('${feed}','${owner}') as id`)).rows[0]
        .id;
    await db.exec(
      `update collection_runs set lease_until=now()-interval '1 second' where id='${next}';`,
    );
    const replacement =
      (await db.query(`select claim_feed('${feed}','${owner}') as id`)).rows[0]
        .id;
    expect(replacement).not.toBe(next);
    await expect(db.query(`select finish_feed('${next}','success')`)).rejects
      .toThrow(/lease unavailable/);
    await db.exec(
      `select finish_feed('${replacement}','success'); update project_subscriptions set enabled=false where feed_id='${feed}';`,
    );
    expect(
      (await db.query(`select claim_feed('${feed}','${owner}') as id`)).rows[0]
        .id,
    ).toBeNull();
  });
  it("isolates owners, rejects anonymous access and cross-owner project writes", async () => {
    expect((await asUser(owner, "select * from projects")).rows).toHaveLength(
      2,
    );
    expect((await asUser(other, "select * from projects")).rows).toHaveLength(
      0,
    );
    await expect(
      asUser(
        other,
        `select capture_candidate('${project}','{"url":"https://example.com/private"}')`,
      ),
    ).rejects.toThrow(/denied/);
    await db.exec("set role anon;");
    await expect(db.query("select * from projects")).rejects.toThrow(
      /permission denied/,
    );
    await db.exec("reset role;");
  });
  it("deduplicates capture, shares acquisition but keeps project decisions separate", async () => {
    const values = '{"url":"https://example.com/story","title":"Original"}';
    const a = await asUser(
      owner,
      `select (capture_candidate('${project}','${values}')).*`,
    );
    const b = await asUser(
      owner,
      `select (capture_candidate('${project}','${values}')).*`,
    );
    const c = await asUser(
      owner,
      `select (capture_candidate('${project2}','${values}')).*`,
    );
    expect(a.rows[0].id).toBe(b.rows[0].id);
    expect(a.rows[0].item_id).toBe(c.rows[0].item_id);
    const id = a.rows[0].id;
    await asUser(
      owner,
      `select review_candidate('${id}','accept','{"title":"Analyst edit"}')`,
    );
    await asUser(
      owner,
      `select review_candidate('${id}','accept','{"title":"Retry must not overwrite"}')`,
    );
    expect((await db.query("select * from articles")).rows).toHaveLength(1);
    expect((await db.query("select title from articles")).rows[0].title).toBe(
      "Analyst edit",
    );
    expect(
      (await db.query(
        `select status from ingestion_candidates where project_id='${project2}'`,
      )).rows[0].status,
    ).toBe("pending");
    expect(
      (await db.query(
        "select original_acquisition->>'title' as title from collected_items where identity_url='https://example.com/story'",
      )).rows[0].title,
    ).toBe("Original");
    await expect(asUser(owner, `select review_candidate('${id}','reject')`))
      .rejects.toThrow(/already reviewed/);
  });
  it("rolls back invalid-tag acceptance including candidate edits", async () => {
    const row = (await asUser(
      owner,
      `select (capture_candidate('${project}','{"url":"https://example.com/fail","title":"Before"}')).*`,
    )).rows[0];
    await expect(
      asUser(
        owner,
        `select review_candidate('${row.id}','accept','{"title":"After","tag_ids":["30000000-0000-0000-0000-000000000001"]}')`,
      ),
    ).rejects.toThrow(/Tag access denied/);
    expect(
      (await db.query(
        `select title,status from ingestion_candidates where id='${row.id}'`,
      )).rows[0],
    ).toMatchObject({ title: "Before", status: "pending" });
    expect(
      (await db.query(
        "select * from articles where url='https://example.com/fail'",
      )).rows,
    ).toHaveLength(0);
  });
  it("rejects foreign project event links and preserves atomicity", async () => {
    const articleId =
      (await db.query("select id from articles limit 1")).rows[0].id;
    await expect(
      asUser(
        owner,
        `select save_event('${project2}','{"title":"Bad event","status":"draft","article_ids":["${articleId}"]}')`,
      ),
    ).rejects.toThrow(/access denied/);
    expect((await db.query("select * from events")).rows).toHaveLength(0);
  });
  it(
    "requires verified legacy ownership and preserves IDs and relationships on upgrade",
    async () => {
      const legacy = new PGlite();
      try {
        await bootstrap(legacy);
        await legacy.exec(migrations[0]);
        await legacy.exec(
          `insert into sources(id,name,url) values('40000000-0000-0000-0000-000000000001','Legacy','https://example.com');
        insert into articles(id,source_id,title,url) values('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Legacy article','https://example.com/old');
        insert into events(id,title) values('60000000-0000-0000-0000-000000000001','Legacy event');
        insert into article_events(article_id,event_id) values('50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001');`,
        );
        await legacy.exec(
          `insert into tags(id,name) values('80000000-0000-0000-0000-000000000010','Legacy tag');
        insert into article_tags(article_id,tag_id) values('50000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000010');`,
        );
        await legacy.exec("begin;");
        await expect(legacy.exec(migrations[1])).rejects.toThrow(
          /legacy_owner_id/,
        );
        await legacy.exec("rollback;");
        await legacy.exec(`set app.legacy_owner_id='${owner}';`);
        for (const sql of migrations.slice(1)) await legacy.exec(sql);
        expect((await legacy.query("select * from article_tags")).rows)
          .toHaveLength(1);
        const linked = await legacy.query(
          "select a.id,a.owner_id,e.project_id=a.project_id as same_project from article_events ae join articles a on a.id=ae.article_id join events e on e.id=ae.event_id",
        );
        expect(linked.rows[0]).toMatchObject({
          id: "50000000-0000-0000-0000-000000000001",
          owner_id: owner,
          same_project: true,
        });
      } finally {
        await legacy.close();
      }
    },
    30000,
  );
  it("searches and counts beyond 1000 rows with stable pages and literal user text", async () => {
    await db.exec(
      `insert into ingestion_candidates(owner_id,project_id,url,title,created_at)
      select '${owner}','${project}','https://example.com/search/'||n,'SearchFixture '||n,'2026-10-16T12:00:00Z' from generate_series(1,1105) n;`,
    );
    const first = (await asUser(
      owner,
      `select search_candidates('${project}','{"status":"pending","page":0}','SearchFixture') as result`,
    )).rows[0].result as { count: number; items: { id: string }[] };
    const second = (await asUser(
      owner,
      `select search_candidates('${project}','{"status":"pending","page":1}','SearchFixture') as result`,
    )).rows[0].result as { count: number; items: { id: string }[] };
    expect(first.count).toBe(1105);
    expect(first.items).toHaveLength(50);
    expect(second.items).toHaveLength(50);
    expect(first.items.some((a) => second.items.some((b) => a.id === b.id)))
      .toBe(false);
    const literal = (await asUser(
      owner,
      `select search_candidates('${project}','{"status":"pending"}','%') as result`,
    )).rows[0].result as { count: number };
    expect(literal.count).toBe(0);
    await expect(
      asUser(
        other,
        `select search_candidates('${project}','{"status":"pending"}','SearchFixture')`,
      ),
    ).rejects.toThrow(/denied/);
  });
  it("records bulk per-item outcomes and makes fictional seeds repeatable", async () => {
    const row = (await asUser(
      owner,
      `select (capture_candidate('${project}','{"url":"https://example.com/bulk","title":"Bulk item"}')).*`,
    )).rows[0];
    const result = (await asUser(
      owner,
      `select bulk_review('${project}',array['${row.id}'::uuid,'99999999-9999-4999-8999-999999999999'::uuid],'reject') as result`,
    )).rows[0].result as { ok: boolean }[];
    expect(result.map((r) => r.ok)).toEqual([true, false]);
    expect((await db.query("select * from bulk_review_runs")).rows)
      .toHaveLength(1);
    await db.exec(`set app.demo_owner_id='${owner}';`);
    const seed = readFileSync("supabase/seed.sql", "utf8");
    await db.exec(seed);
    await db.exec(seed);
    expect(
      (await db.query(
        "select * from article_events where project_id='00000000-0000-4000-8000-000000000001'",
      )).rows,
    ).toHaveLength(1);
  });
  it("enables catalog feeds idempotently, scopes source pauses, and refreshes validators on resume", async () => {
    const catalog =
      '{"name":"Catalog example","url":"https://catalog.example/","feedUrl":"https://catalog.example/rss","topics":["technology"],"region":"Global","language":"English"}';
    await asUser(
      owner,
      `select enable_catalog_feed('${project}','${catalog}')`,
    );
    await asUser(
      owner,
      `select enable_catalog_feed('${project}','${catalog}')`,
    );
    await asUser(
      owner,
      `select enable_catalog_feed('${project2}','${catalog}')`,
    );
    const feeds = (await db.query(
      "select * from rss_feeds where feed_url='https://catalog.example/rss'",
    )).rows;
    expect(feeds).toHaveLength(1);
    await asUser(
      owner,
      `select set_source_enabled('${project}','${feeds[0].source_id}',false)`,
    );
    const states = (await db.query(
      `select project_id,enabled from project_subscriptions where feed_id='${
        feeds[0].id
      }' order by project_id`,
    )).rows;
    expect(states.map((s) => s.enabled)).toEqual([false, true]);
    await db.exec(
      `update rss_feeds set etag='old-validator' where id='${feeds[0].id}'`,
    );
    await asUser(
      owner,
      `select set_source_enabled('${project}','${feeds[0].source_id}',true)`,
    );
    expect(
      (await db.query(`select etag from rss_feeds where id='${feeds[0].id}'`))
        .rows[0].etag,
    ).toBeNull();
  });
  it("rejects stale subscription edits and preserves overrides when enabling a catalog source again", async () => {
    const feed = (await db.query(
      "select * from rss_feeds where feed_url='https://catalog.example/rss'",
    )).rows[0];
    const override =
      '{"version":2,"includeAny":[],"excludeAny":["advertisement"],"defaultTags":[],"keywordTags":[]}';
    await asUser(
      owner,
      `select set_subscription('${project}','${feed.id}',true,'${override}','{"rules":null}')`,
    );
    await expect(
      asUser(
        owner,
        `select set_subscription('${project}','${feed.id}',true,null,'{"rules":null}')`,
      ),
    ).rejects.toThrow(/rules changed/);
    const catalog =
      '{"name":"Catalog example","url":"https://catalog.example/","feedUrl":"https://catalog.example/rss","topics":["technology"],"region":"Global","language":"English"}';
    await asUser(
      owner,
      `select enable_catalog_feed('${project}','${catalog}')`,
    );
    const actual = (await db.query(
      `select rules from project_subscriptions where project_id='${project}' and feed_id='${feed.id}'`,
    )).rows[0].rules;
    expect(actual).toEqual(JSON.parse(override));
  });
  it("preserves multiple origins and original acquisition when a publisher updates an item", async () => {
    const f1 = "90000000-0000-0000-0000-000000000001",
      f2 = "90000000-0000-0000-0000-000000000002";
    await db.exec(
      `insert into rss_feeds(id,owner_id,feed_url) values('${f1}','${owner}','https://example.com/first-feed'),('${f2}','${owner}','https://example.com/second-feed');
      insert into project_subscriptions(project_id,feed_id,owner_id) values('${project}','${f1}','${owner}'),('${project}','${f2}','${owner}');`,
    );
    const rules =
      (await db.query(`select rules from projects where id='${project}'`))
        .rows[0].rules;
    const results = JSON.stringify({
      [project]: {
        projectRules: rules,
        subscriptionRules: null,
        classification: {
          route: "pending",
          version: 1,
          suggestedTags: [],
          matches: [],
        },
      },
    });
    const original =
      '{"link":"https://example.com/multi-origin","title":"First evidence"}';
    for (const feed of [f1, f2]) {
      const run =
        (await db.query(`select claim_feed('${feed}','${owner}') as id`))
          .rows[0].id;
      await db.query(
        `select stage_feed_item('${run}','https://example.com/multi-origin','id:publisher-id','${original}','${results}')`,
      );
      await db.query(
        `select stage_feed_item('${run}','https://example.com/multi-origin','id:publisher-id','{"link":"https://example.com/multi-origin","title":"Updated evidence"}','${results}')`,
      );
      await db.query(`select finish_feed('${run}','success')`);
    }
    const items = (await db.query(
      "select * from collected_items where identity_url='https://example.com/multi-origin'",
    )).rows;
    expect(items).toHaveLength(1);
    expect((items[0].original_acquisition as { title: string }).title).toBe(
      "First evidence",
    );
    expect(
      (await db.query(
        `select * from ingestion_candidates where item_id='${items[0].id}'`,
      )).rows,
    ).toHaveLength(1);
    expect(
      (await db.query(
        `select * from item_origins where item_id='${items[0].id}'`,
      )).rows,
    ).toHaveLength(2);
    expect(
      (await db.query(
        `select * from item_observations where item_id='${items[0].id}'`,
      )).rows,
    ).toHaveLength(4);
  });
  it("reapplies versioned rules without changing analyst edits, routes or tag decisions", async () => {
    const tag1 = "80000000-0000-0000-0000-000000000001";
    const tag2 = "80000000-0000-0000-0000-000000000002";
    await db.exec(
      `insert into tags(id,owner_id,name) values('${tag1}','${owner}','Rule tag'),('${tag2}','${owner}','Analyst tag')`,
    );
    const row = (await asUser(
      owner,
      `select (capture_candidate('${project}','{"url":"https://example.com/reapply","title":"Original evidence"}')).*`,
    )).rows[0];
    await asUser(
      owner,
      `select review_candidate('${row.id}','save','{"title":"Analyst edit","tag_ids":["${tag2}"]}')`,
    );
    await asUser(owner, `select review_candidate('${row.id}','outside_scope')`);
    const projectRules = JSON.stringify(
      (await db.query(`select rules from projects where id='${project}'`))
        .rows[0].rules,
    );
    const classification = JSON.stringify({
      version: 2,
      route: "pending",
      suggestedTags: [tag1],
      matches: [],
      classifiedAt: "2026-10-16T12:00:00Z",
      warnings: [],
    });
    await asUser(
      owner,
      `select apply_candidate_rules('${row.id}','${classification}','${projectRules}',null)`,
    );
    const candidate = (await db.query(
      `select title,route,tag_ids,original_acquisition from ingestion_candidates where id='${row.id}'`,
    )).rows[0];
    expect(candidate.title).toBe("Analyst edit");
    expect(candidate.route).toBe("outside_scope");
    expect(candidate.tag_ids).toEqual(expect.arrayContaining([tag1, tag2]));
    expect((candidate.original_acquisition as { title: string }).title).toBe(
      "Original evidence",
    );
    expect(
      (await db.query(
        `select * from rule_evaluations where candidate_id='${row.id}'`,
      )).rows,
    ).toHaveLength(1);
  });
});
