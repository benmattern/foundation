// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const owner = "12000000-0000-0000-0000-000000000001",
  other = "12000000-0000-0000-0000-000000000002",
  p = "22000000-0000-0000-0000-000000000001",
  p2 = "22000000-0000-0000-0000-000000000002";
let db: PGlite, q: string, a: string;
async function user(sql: string, id = owner) {
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}'`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${owner}'),('${other}');alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`,
  );
  for (const f of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec(
    `insert into projects(id,owner_id,name) values('${p}','${owner}','Session'),('${p2}','${owner}','Other')`,
  );
  q = (
    await user(
      `select * from save_question('${p}','{"title":"Taiwan 台灣?","answer":"Existing answer"}')`,
    )
  ).rows[0].id as string;
  a = (
    await user(
      `select * from save_article('${p}','{"title":"Evidence","url":"https://example.com/e"}')`,
    )
  ).rows[0].id as string;
}, 30000);
afterAll(async () => {
  await db?.close();
});
it("adopts selected stable catalog records without duplicates, rule loss or resuming paused/unfollowed sources", async () => {
  const source = {
    id: "official-test",
    name: "Fictional official",
    url: "https://example.com/official",
    feedUrl: "https://example.com/official/rss",
    topics: ["trade"],
    region: "Fictional",
    language: "English",
  };
  const payload = "'" + JSON.stringify(source) + "'";
  const id = (await user(`select select_catalog_source('${p}',${payload}) id`))
    .rows[0].id as string;
  await user(`select set_source_state('${p}','${id}','paused')`);
  await user(`select select_catalog_source('${p}',${payload})`);
  expect(
    (
      await db.query(
        `select enabled from project_subscriptions s join rss_feeds f on f.id=s.feed_id where f.source_id='${id}' and project_id='${p}'`,
      )
    ).rows[0].enabled,
  ).toBe(false);
  const renamed = {
    ...source,
    name: "Renamed",
    url: "https://example.com/new",
  };
  expect(
    (
      await user(
        `select select_catalog_source('${p}','${JSON.stringify(renamed)}') id`,
      )
    ).rows[0].id,
  ).toBe(id);
  await user(`select set_source_state('${p}','${id}','unfollowed')`);
  await user(`select select_catalog_source('${p}',${payload})`);
  expect(
    (
      await db.query(
        `select followed from project_subscriptions s join rss_feeds f on f.id=s.feed_id where f.source_id='${id}' and project_id='${p}'`,
      )
    ).rows[0].followed,
  ).toBe(false);
  await expect(
    user(`select select_catalog_source('${p}',${payload})`, other),
  ).rejects.toThrow();
  expect(
    (
      await db.query(
        `select count(*)::int n from sources where catalog_id='official-test'`,
      )
    ).rows[0].n,
  ).toBe(1);
});
it("counts a deep deduplicated period, paginates examples and isolates tuning labels from decisions", async () => {
  await db.exec(`insert into ingestion_candidates(project_id,owner_id,url,title,created_at,route,status,deferred,original_acquisition) select '${p}','${owner}','https://example.com/calibration/'||g,'Example '||g,'2026-01-10',case when g%2=0 then 'outside_scope' else 'pending' end,case when g<=30 then 'rejected' else 'pending' end,g between 31 and 40,jsonb_build_object('title','Example '||g) from generate_series(1,130)g;
 insert into ingestion_candidates(project_id,owner_id,url,title,created_at,route) values('${p}','${owner}','https://example.com/calibration/1','Repeated URL','2026-01-11','pending'),('${p2}','${owner}','https://example.com/calibration/1','Other project','2026-01-10','pending'),('${p}','${owner}','https://example.com/upper-bound','Excluded at upper','2026-02-01','pending');`);
  type W = {
    collected: number;
    dismissed: number;
    deferred: number;
    items: { id: string; status: string }[];
    has_more: boolean;
    sample_population: number;
  };
  let w = (
    await user(`select calibration_window('${p}','2026-01-01','2026-02-01') w`)
  ).rows[0].w as W;
  expect(w.collected).toBe(130);
  expect(w.dismissed).toBe(30);
  expect(w.deferred).toBe(10);
  const ids = w.items.map((c) => c.id);
  while (w.has_more) {
    w = (
      await user(
        `select calibration_window('${p}','2026-01-01','2026-02-01',null,'${w.items.at(-1)!.id}') w`,
      )
    ).rows[0].w as W;
    ids.push(...w.items.map((c) => c.id));
  }
  expect(new Set(ids).size).toBe(130);
  const c = ids[0],
    before = (
      await db.query(
        `select status,route,deferred from ingestion_candidates where id='${c}'`,
      )
    ).rows;
  await user(`select save_tuning_example('${p}','${c}',true,true)`);
  expect(
    (
      await db.query(
        `select status,route,deferred from ingestion_candidates where id='${c}'`,
      )
    ).rows,
  ).toEqual(before);
  await expect(
    user(`select save_tuning_example('${p}','${c}',false,false)`),
  ).rejects.toThrow(/changed/);
  await expect(
    user(`select save_tuning_example('${p2}','${c}',false,false)`),
  ).rejects.toThrow(/unavailable/);
  await expect(
    user(`select calibration_window('${p}','2026-01-01','2026-02-01')`, other),
  ).rejects.toThrow();
  await expect(
    user(`select calibration_window('${p}','2026-01-01','2026-12-01')`),
  ).rejects.toThrow(/90 days/);
  const sample = (
    await user(
      `select calibration_window('${p}','2026-01-01','2026-02-01',null,null,true) w`,
    )
  ).rows[0].w as W;
  expect(sample.items).toHaveLength(10);
  expect(sample.sample_population).toBe(130);
  expect(
    (await user("select * from tuning_examples", other)).rows,
  ).toHaveLength(0);
  await expect(user(`update tuning_examples set useful=false`)).rejects.toThrow(
    /permission/,
  );
});
it("paginates deep changes and advances only a captured boundary with stale-tab protection", async () => {
  await db.exec(
    `insert into research_history(project_id,owner_id,object_id,object_type,after_state) select '${p}','${owner}','${q}','research_questions',jsonb_build_object('id','${q}','title','Edit '||g) from generate_series(1,130)g`,
  );
  let w = (await user(`select session_window('${p}') w`)).rows[0].w as {
    bound: number;
    cursor: number;
    items: unknown[];
    has_more: boolean;
    count: number;
  };
  expect(w.count).toBeGreaterThan(130);
  expect(w.items).toHaveLength(50);
  const bound = w.bound;
  let n = w.items.length;
  while (w.has_more) {
    w = (await user(`select session_window('${p}',${w.cursor},${bound}) w`))
      .rows[0].w as typeof w;
    n += w.items.length;
  }
  expect(n).toBe(w.count);
  await user(
    `select save_question('${p}','{"answer":"Arrived after boundary"}','${q}',1)`,
  );
  await user(`select save_session('${p}',0,${bound},'${q}')`);
  const fresh = (await user(`select session_window('${p}') w`)).rows[0]
    .w as typeof w;
  expect(fresh.count).toBe(1);
  await expect(user(`select save_session('${p}',0,${bound})`)).rejects.toThrow(
    /another tab/,
  );
  await expect(user(`select save_session('${p}',1,999999)`)).rejects.toThrow(
    /boundary/,
  );
  await expect(user(`select session_window('${p}')`, other)).rejects.toThrow();
  await expect(
    user(`select save_session('${p2}',0,null,'${q}')`),
  ).rejects.toThrow(/unavailable/);
  await expect(
    user(
      `insert into research_changes values('${p}',999,'fake','${q}',null,'bad',now())`,
    ),
  ).rejects.toThrow();
});
it("validates saved views and snapshots only selected same-project research", async () => {
  const id = "32000000-0000-0000-0000-000000000001";
  await user(
    `select save_working_view('${p}','${id}','Last week','articles','{"period":"7","order":"oldest"}')`,
  );
  await user(
    `select save_working_view('${p}','${id}','Last week','articles','{"period":"7","order":"oldest"}')`,
  );
  expect(
    (await db.query(`select count(*)::int n from saved_views where id='${id}'`))
      .rows[0].n,
  ).toBe(1);
  await expect(
    user(
      `select save_working_view('${p}','${id}','Overwrite','articles','{}')`,
    ),
  ).rejects.toThrow(/changed/);
  await expect(
    user(
      `select save_working_view('${p}','32000000-0000-0000-0000-000000000002','Bad','articles','{"script":"bad"}')`,
    ),
  ).rejects.toThrow(/Unsupported/);
  await expect(
    user(
      `select save_working_view('${p}','32000000-0000-0000-0000-000000000002','Missing','articles','{"source":"${q}"}')`,
    ),
  ).rejects.toThrow(/unavailable/);
  await user(
    `select link_question_article('${p}','${q}','${a}','{"note":"Question-specific","disposition":"challenging"}')`,
  );
  const packet = (
    await user(`select question_packet('${p}','${q}',array['${a}']::uuid[]) p`)
  ).rows[0].p as { links: { note: string; article_revision: string }[] };
  expect(packet.links[0].note).toBe("Question-specific");
  expect(packet.links[0].article_revision).toMatch(/^[a-f0-9]{32}$/);
  await db.exec(`update articles set title='Metadata edit' where id='${a}'`);
  const changed = (
    await user(`select question_packet('${p}','${q}',array['${a}']::uuid[]) p`)
  ).rows[0].p as typeof packet;
  expect(changed.links[0].article_revision).not.toBe(
    packet.links[0].article_revision,
  );
  await expect(user(`select question_packet('${p2}','${q}')`)).rejects.toThrow(
    /unavailable/,
  );
  expect((await user("select * from saved_views", other)).rows).toHaveLength(0);
  await db.exec("set role anon");
  try {
    await expect(db.query(`select session_window('${p}')`)).rejects.toThrow(
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
