// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const owner = "11000000-0000-0000-0000-000000000001",
  other = "11000000-0000-0000-0000-000000000002";
const project = "21000000-0000-0000-0000-000000000001",
  project2 = "21000000-0000-0000-0000-000000000002";
let db: PGlite;
let a: string, b: string, q: string, q2: string, entity: string;
async function user(sql: string, id = owner) {
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}'`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
const quote = (value: unknown) =>
  "'" + JSON.stringify(value).replaceAll("'", "''") + "'";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${owner}'),('${other}');alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`,
  );
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  await db.exec(
    `insert into projects(id,owner_id,name) values('${project}','${owner}','Research'),('${project2}','${owner}','Other project')`,
  );
  const c = (
    await user(
      `select * from capture_candidate('${project}','{"url":"https://example.com/one","title":"Acme Taiwan","description":"Acme expanded in Taiwan."}')`,
    )
  ).rows[0];
  a = (await user(`select * from review_candidate('${c.id}','accept')`)).rows[0]
    .converted_article_id as string;
  b = (
    await user(
      `select * from save_article('${project}','{"url":"https://example.com/two","title":"Second article"}')`,
    )
  ).rows[0].id as string;
  q = (
    await user(
      `select * from save_question('${project}','{"title":"What changed?"}')`,
    )
  ).rows[0].id as string;
  q2 = (
    await user(
      `select * from save_question('${project}','{"title":"Who is involved?"}')`,
    )
  ).rows[0].id as string;
}, 30000);
afterAll(async () => {
  await db?.close();
});
it("supports many-to-many independent evidence notes and optimistic edits", async () => {
  await user(
    `select link_question_article('${project}','${q}','${a}','{"note":"Supports expansion","disposition":"supporting"}')`,
  );
  await user(
    `select link_question_article('${project}','${q2}','${a}','{"note":"Identifies company","disposition":"background"}')`,
  );
  await user(
    `select link_question_article('${project}','${q}','${b}','{"disposition":"challenging"}')`,
  );
  expect(
    (await user(`select * from question_articles where article_id='${a}'`))
      .rows,
  ).toHaveLength(2);
  await user(
    `select save_question('${project}','{"answer":"Working answer","followups":"Check original filing"}','${q}',1)`,
  );
  await expect(
    user(
      `select save_question('${project}','{"answer":"Bypass"}','${q}',null)`,
    ),
  ).rejects.toThrow(/changed/);
  await expect(
    user(
      `select save_question('${project}','{"answer":"Lost edit"}','${q}',1)`,
    ),
  ).rejects.toThrow(/changed/);
  await user(
    `select save_article_note('${project}','${a}','Independent analyst note')`,
  );
  await expect(
    user(`select save_article_note('${project}','${a}','Lost note')`),
  ).rejects.toThrow(/changed/);
  expect(
    (await db.query(`select summary from articles where id='${a}'`)).rows[0]
      .summary,
  ).not.toBe("Independent analyst note");
});
it("rejects cross-project joins, owner access, anonymous calls and direct writes", async () => {
  await expect(
    user(`select link_question_article('${project2}','${q}','${a}')`),
  ).rejects.toThrow(/Question unavailable/);
  await expect(
    user(`select save_article_note('${project2}','${a}','wrong')`),
  ).rejects.toThrow(/unavailable/);
  await expect(
    user(`select save_question('${project}','{"title":"wrong"}')`, other),
  ).rejects.toThrow(/access denied/i);
  for (const table of [
    "research_questions",
    "question_articles",
    "article_notes",
    "research_findings",
    "entities",
    "entity_mentions",
    "research_history",
  ]) {
    expect((await user(`select * from ${table}`, other)).rows).toHaveLength(0);
    expect(
      (
        await db.query(
          `select has_table_privilege('authenticated','${table}','TRUNCATE') as allowed`,
        )
      ).rows[0].allowed,
    ).toBe(false);
  }
  await expect(
    user(`update research_questions set answer='tamper' where id='${q}'`),
  ).rejects.toThrow(/permission denied/);
  await db.exec("set role anon");
  try {
    await expect(
      db.query(`select save_question('${project}','{}')`),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await db.exec("reset role");
  }
});
it("stores actual citation snapshots, validates passages and retains prose after unlink/delete", async () => {
  const f = (
    await user(
      `select * from save_finding('${project}','${q}',${quote({ observed: "Expansion reported", interpretation: "Analyst interpretation", uncertainties: "Capacity unclear", citations: [{ id: a, passage: "expanded in Taiwan" }] })})`,
    )
  ).rows[0];
  expect(f.citations).toMatchObject([
    {
      id: a,
      title: "Acme Taiwan",
      passage: "expanded in Taiwan",
      passage_origin: { field: "acquisition_excerpt" },
    },
  ]);
  await expect(
    user(
      `select save_finding('${project}','${q}',${quote({ citations: [{ id: a, passage: "fabricated claim" }] })})`,
    ),
  ).rejects.toThrow(/not present/);
  await expect(
    user(
      `select save_finding('${project}','${q2}',${quote({ citations: [{ id: b }] })})`,
    ),
  ).rejects.toThrow(/linked article/);
  await user(
    `select link_question_article('${project}','${q}','${a}','{"linked":false}',1)`,
  );
  await user(
    `select save_finding('${project}','${q}',${quote({ observed: "Updated prose", citations: f.citations })},'${f.id}',1)`,
  );
  expect(
    (
      await db.query(
        `select observed from research_findings where id='${f.id}'`,
      )
    ).rows[0].observed,
  ).toBe("Updated prose");
});
it("retains dismissed/confirmed dictionary evidence on retry and enforces CAS", async () => {
  entity = (
    await user(
      `select * from save_entity('{"name":"Acme","entity_type":"organization","aliases":["ACME"]}')`,
    )
  ).rows[0].id as string;
  const fields = (
    await user(`select research_evidence('${project}','${a}') as fields`)
  ).rows[0].fields as { field: string; text: string }[];
  const field = fields.find((f) => f.field === "acquisition_excerpt")!;
  const draft = [
    {
      entity_id: entity,
      alias: "Acme",
      field: field.field,
      snapshot: field.text,
      span: { start: 0, end: 4 },
    },
  ];
  expect(
    (
      await user(
        `select save_mentions('${project}','${a}',${quote(draft)}) as n`,
      )
    ).rows[0].n,
  ).toBe(1);
  const m = (
    await user(`select * from entity_mentions where entity_id='${entity}'`)
  ).rows[0];
  await user(`select review_mention('${project}','${m.id}','dismissed',1)`);
  expect(
    (
      await user(
        `select save_mentions('${project}','${a}',${quote(draft)}) as n`,
      )
    ).rows[0].n,
  ).toBe(0);
  expect(
    (await user(`select * from entity_mentions where id='${m.id}'`)).rows[0]
      .state,
  ).toBe("dismissed");
  await expect(
    user(`select review_mention('${project}','${m.id}','confirmed',1)`),
  ).rejects.toThrow(/changed/);
  await user(`select review_mention('${project}','${m.id}','confirmed',2)`);
  await expect(
    user(`select save_mentions('${project2}','${a}',${quote(draft)})`),
  ).rejects.toThrow(/unavailable/);
  await expect(
    user(
      `select save_mentions('${project}','${a}',${quote([{ ...draft[0], snapshot: "Invented Acme evidence" }])})`,
    ),
  ).rejects.toThrow(/Evidence changed/);
  await expect(
    user(`select save_entity('{"name":"Wrong"}','${entity}',1)`, other),
  ).rejects.toThrow(/access denied/i);
  await user(`select save_entity('{"aliases":["Acme Corp"]}','${entity}',1)`);
  expect(
    (await user(`select * from entity_mentions where id='${m.id}'`)).rows[0]
      .snapshot,
  ).toBe(field.text);
  expect(
    (await user(`select * from research_history where object_id='${m.id}'`))
      .rows,
  ).toHaveLength(3);
});
it("article deletion preserves link notes, citations and mention audit as unavailable evidence", async () => {
  const event = (
    await user(
      `select * from save_event('${project}',${quote({ title: "Existing event context", status: "draft", article_ids: [a, b] })})`,
    )
  ).rows[0];
  const source = (
    await db.query(
      `insert into sources(owner_id,name,url) values('${owner}','Research source','https://example.com/source') returning id`,
    )
  ).rows[0].id;
  await user(
    `select set_source_state('${project}','${source}','unfollowed',0)`,
  );
  expect(
    (await user(`select * from research_findings where question_id='${q}'`))
      .rows,
  ).toHaveLength(1);
  await user(`select remove_article('${project}','${a}')`);
  expect(
    (await user(`select * from events where id='${event.id}'`)).rows,
  ).toHaveLength(1);
  expect(
    (await user(`select * from article_events where event_id='${event.id}'`))
      .rows,
  ).toHaveLength(1);
  expect(
    (
      await user(
        `select * from article_notes where article_snapshot->>'id'='${a}'`,
      )
    ).rows[0],
  ).toMatchObject({ article_id: null, body: "Independent analyst note" });
  expect(
    (
      await user(
        `select * from question_articles where article_snapshot->>'id'='${a}'`,
      )
    ).rows,
  ).toHaveLength(2);
  expect(
    (await user(`select * from entity_mentions where entity_id='${entity}'`))
      .rows[0].article_id,
  ).toBeNull();
  expect(
    (await user(`select * from research_findings where question_id='${q}'`))
      .rows[0].citations,
  ).toMatchObject([{ id: a, title: "Acme Taiwan" }]);
});
it("replays stable create requests without duplicating questions, findings, entities or vocabulary", async () => {
  const token = "31000000-0000-4000-8000-000000000001";
  const qv = quote({ title: "Retry-safe question", request_id: token });
  const changed = quote({
    title: "Edited after an ambiguous response",
    request_id: token,
  });
  const first = (await user(`select * from save_question('${project}',${qv})`))
    .rows[0];
  expect(
    (await user(`select * from save_question('${project}',${qv})`)).rows[0].id,
  ).toBe(first.id);
  await expect(
    user(`select save_question('${project}',${changed})`),
  ).rejects.toThrow(/already saved different content/);
  const fv = quote({ observed: "Draft retry", request_id: token });
  const finding = (
    await user(`select * from save_finding('${project}','${first.id}',${fv})`)
  ).rows[0];
  expect(
    (await user(`select * from save_finding('${project}','${first.id}',${fv})`))
      .rows[0].id,
  ).toBe(finding.id);
  const ev = quote({
    name: "Distinct retry identity",
    entity_type: "person",
    request_id: token,
  });
  const e = (await user(`select * from save_entity(${ev})`)).rows[0];
  expect((await user(`select * from save_entity(${ev})`)).rows[0].id).toBe(
    e.id,
  );
  const g = (
    await user(
      `select * from save_term_group(null,'Retry vocabulary','["Taiwan"]',0,'${token}')`,
    )
  ).rows[0];
  expect(
    (
      await user(
        `select * from save_term_group(null,'Retry vocabulary','["Taiwan"]',0,'${token}')`,
      )
    ).rows[0].id,
  ).toBe(g.id);
  const foreign = (
    await user(
      `select * from save_entity('{"name":"Foreign identity","entity_type":"place"}')`,
      other,
    )
  ).rows[0];
  await expect(
    user(
      `select save_mentions('${project}','${b}',${quote([{ entity_id: foreign.id, alias: "Foreign identity", snapshot: "" }])},true)`,
    ),
  ).rejects.toThrow(/access denied/i);
});
