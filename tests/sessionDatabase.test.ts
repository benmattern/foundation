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
  ).rows[0].p as { links: { note: string }[] };
  expect(packet.links[0].note).toBe("Question-specific");
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
