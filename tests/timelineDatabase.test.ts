// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const owner = "18000000-0000-0000-0000-000000000001",
  other = "18000000-0000-0000-0000-000000000002";
const project = "28000000-0000-0000-0000-000000000001",
  project2 = "28000000-0000-0000-0000-000000000002";
const legacy = "38000000-0000-0000-0000-000000000001";
const source = "48000000-0000-0000-0000-000000000001";
let db: PGlite,
  article: string,
  entity: string,
  question: string,
  foreignArticle: string;
const json = (v: unknown) => `'${JSON.stringify(v).replaceAll("'", "''")}'`;
async function user(sql: string, identity = owner) {
  await db.exec(
    `set role authenticated;set request.jwt.claim.sub='${identity}'`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
async function save(values: Record<string, unknown>, id?: string) {
  return (
    await user(
      `select * from save_event('${project}',${json(values)}${id ? `, '${id}'` : ""})`,
    )
  ).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${owner}'),('${other}');alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`,
  );
  const migrations = readdirSync("supabase/migrations").sort();
  for (const f of migrations.slice(0, -1))
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  await db.exec(
    `insert into projects(id,owner_id,name) values('${project}','${owner}','Timeline'),('${project2}','${owner}','Other');insert into events(id,project_id,owner_id,title,occurred_at,created_at,updated_at) values('${legacy}','${project}','${owner}','Legacy fictional event','2024-03-02T23:30:00-08:00','2024-04-01T00:00:00Z','2024-04-02T00:00:00Z');`,
  );
  article = (
    await user(
      `select * from save_article('${project}','{"title":"Fictional report","url":"https://example.com/timeline","published_at":"2024-03-05"}')`,
    )
  ).rows[0].id as string;
  await db.exec(
    `insert into sources(id,owner_id,name,url) values('${source}','${owner}','Fictional publisher','https://example.com');update articles set source_id='${source}' where id='${article}';`,
  );
  foreignArticle = (
    await user(
      `select * from save_article('${project2}','{"title":"Other project report","url":"https://example.com/other"}')`,
    )
  ).rows[0].id as string;
  await db.exec(
    `insert into article_events values('${article}','${legacy}',now(),'${project}')`,
  );
  await db.exec(
    readFileSync("supabase/migrations/" + migrations.at(-1), "utf8"),
  );
  entity = (
    await user(
      `select * from save_entity('{"name":"Fictional Organization","entity_type":"organization"}')`,
    )
  ).rows[0].id as string;
  question = (
    await user(
      `select * from save_question('${project}','{"title":"What changed?"}')`,
    )
  ).rows[0].id as string;
}, 30000);
afterAll(async () => {
  await db?.close();
});
it("upgrades legacy IDs, timestamp meaning, update time and article joins unchanged", async () => {
  const e = (await db.query(`select * from events where id='${legacy}'`))
    .rows[0];
  expect(e.date_start).toBe("2024-03-03");
  expect(e.date_origin).toBe("legacy_timestamp");
  expect(new Date(e.occurred_at as string).toISOString()).toBe(
    "2024-03-03T07:30:00.000Z",
  );
  expect(new Date(e.created_at as string).toISOString()).toBe(
    "2024-04-01T00:00:00.000Z",
  );
  expect(new Date(e.updated_at as string).toISOString()).toBe(
    "2024-04-02T00:00:00.000Z",
  );
  expect(
    (await db.query(`select * from article_events where event_id='${legacy}'`))
      .rows,
  ).toHaveLength(1);
  expect(
    (
      await db.query(
        `select * from event_references where event_id='${legacy}'`,
      )
    ).rows,
  ).toHaveLength(1);
});
it("validates real calendars/ranges, preserves partial precision and never uses analyst creation as occurrence", async () => {
  for (const values of [
    { date_start: "2025-02-29" },
    { date_start: "0000" },
    { date_end: "2025" },
    { date_start: "2026-06", date_end: "2026-04" },
  ])
    await expect(save({ title: "Bad date", ...values })).rejects.toThrow();
  const y = await save({
    title: "Year only",
    date_start: "2023",
    date_approximate: true,
  });
  expect(y.date_start).toBe("2023");
  expect(new Date(y.timeline_start as string).toISOString().slice(0, 10)).toBe(
    "2023-01-01",
  );
  expect(new Date(y.timeline_end as string).toISOString().slice(0, 10)).toBe(
    "2023-12-31",
  );
  expect(y.occurred_at).toBeNull();
  const undated = await save({ title: "Undated" });
  expect(undated.timeline_start).toBeNull();
  const result = (
    await user(
      `select timeline_page('${project}','{"from":"2023-12-31","to":"2023-12-31"}') as value`,
    )
  ).rows[0].value as { items: { id: string }[] };
  expect(result.items.map((e) => e.id)).toContain(y.id);
});
it("records explicit authorized associations, source snapshots, notes and audit; retains removed/deleted evidence", async () => {
  const e = await save({
    title: "Fictional launch",
    date_start: "2024-04",
    references: [
      {
        kind: "article",
        target_id: article,
        disposition: "supports",
        note: "Source reports the announcement",
      },
      { kind: "entity", target_id: entity },
      { kind: "question", target_id: question },
    ],
  });
  const detail = (
    await user(`select timeline_event('${project}','${e.id}') as value`)
  ).rows[0].value as {
    references: {
      kind: string;
      snapshot: { title: string };
      available: boolean;
    }[];
    history: unknown[];
  };
  expect(detail.references).toHaveLength(3);
  expect(detail.history).toHaveLength(1);
  for (const [kind, id] of [
    ["entity", entity],
    ["question", question],
    ["article", article],
    ["source", source],
  ]) {
    const result = (
      await user(
        `select timeline_page('${project}',${json({ [kind]: id })}) as value`,
      )
    ).rows[0].value as { items: { id: string }[] };
    expect(result.items.map((v) => v.id)).toContain(e.id);
  }
  await user(`select remove_article('${project}','${article}')`);
  const retained = (
    await user(`select timeline_event('${project}','${e.id}') as value`)
  ).rows[0].value as typeof detail;
  expect(retained.references.find((r) => r.kind === "article")).toMatchObject({
    available: false,
    snapshot: { title: "Fictional report" },
  });
  await save(
    {
      version: 1,
      description: "No loss",
      references: retained.references.map((r) => ({ ...r })),
    },
    e.id as string,
  );
});
it("deduplicates retry tokens, rejects changed retries and stale/missing edits/deletes", async () => {
  const token = crypto.randomUUID(),
    values = {
      title: "Retry event",
      date_start: "2026-10-19",
      request_id: token,
    };
  const e = await save(values),
    again = await save(values);
  expect(e.id).toBe(again.id);
  await expect(save({ ...values, title: "Different" })).rejects.toThrow(
    /different content/,
  );
  const edited = await save(
    { title: "Updated", version: 1, request_id: crypto.randomUUID() },
    e.id as string,
  );
  expect(edited.version).toBe(2);
  await expect(
    save({ title: "Lost edit", version: 1 }, e.id as string),
  ).rejects.toThrow(/changed/);
  await expect(
    save({ title: "Version bypass" }, e.id as string),
  ).rejects.toThrow(/changed/);
  await expect(
    user(`select remove_event('${project}','${e.id}')`),
  ).rejects.toThrow(/revision/);
  await expect(
    user(
      `select remove_timeline_event('${project}','${e.id}',1,'${crypto.randomUUID()}')`,
    ),
  ).rejects.toThrow(/changed/);
  const deletion = crypto.randomUUID();
  await user(
    `select remove_timeline_event('${project}','${e.id}',2,'${deletion}')`,
  );
  await user(
    `select remove_timeline_event('${project}','${e.id}',2,'${deletion}')`,
  );
  await expect(save(values)).rejects.toThrow(/deleted/);
  expect(
    (
      await db.query(
        `select * from research_history where object_id='${e.id}' and after_state->>'deleted'='true'`,
      )
    ).rows,
  ).toHaveLength(1);
});
it("rejects cross-project/foreign-owner associations, direct writes and anonymous entry points", async () => {
  await expect(
    save({
      title: "Cross project",
      references: [{ kind: "article", target_id: foreignArticle }],
    }),
  ).rejects.toThrow(/unavailable/);
  await expect(
    user(`select timeline_page('${project}')`, other),
  ).rejects.toThrow(/access denied/i);
  await expect(
    user(`select save_event('${project}','{"title":"Foreign"}')`, other),
  ).rejects.toThrow(/access denied/i);
  expect(
    (await user("select * from event_references", other)).rows,
  ).toHaveLength(0);
  for (const table of [
    "events",
    "article_events",
    "event_references",
    "event_requests",
  ])
    expect(
      (
        await db.query(
          `select has_table_privilege('authenticated','${table}','TRUNCATE') as allowed`,
        )
      ).rows[0].allowed,
    ).toBe(false);
  await expect(user(`update events set title='Bypass'`)).rejects.toThrow(
    /permission denied/,
  );
  await db.exec("set role anon");
  try {
    await expect(
      db.query(`select timeline_page('${project}')`),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await db.exec("reset role");
  }
});
it("orders ties deterministically, puts undated last in either direction, and pages/filter counts on server", async () => {
  for (let i = 0; i < 53; i++)
    await save({
      title: `Page fixture ${i}`,
      date_start: "2020-02-29",
      event_type: "test-page",
    });
  const run = async (offset: number, order: string) =>
    (
      await user(
        `select timeline_page('${project}',${json({ type: "test-page", order })},${offset}) as value`,
      )
    ).rows[0].value as {
      items: { id: string }[];
      matched: number;
      has_more: boolean;
    };
  const first = await run(0, "asc"),
    second = await run(50, "asc");
  expect(first.items).toHaveLength(50);
  expect(second.items).toHaveLength(3);
  expect(first.matched).toBe(53);
  expect(first.has_more).toBe(true);
  expect(new Set([...first.items, ...second.items].map((v) => v.id)).size).toBe(
    53,
  );
  expect((await run(0, "desc")).items.map((v) => v.id)).toEqual(
    first.items.map((v) => v.id),
  );
  for (const order of ["asc", "desc"]) {
    const page = (
      await user(
        `select timeline_page('${project}',${json({ order })},50) as value`,
      )
    ).rows[0].value as { items: { timeline_start: string | null }[] };
    expect(page.items.at(-1)?.timeline_start).toBeNull();
  }
}, 30000);

it("removes associations without destroying research; constrains question/entity ownership and picker pages", async () => {
  const anotherQuestion = (
    await user(
      `select * from save_question('${project2}','{"title":"Fictional other-project question"}')`,
    )
  ).rows[0].id;
  const foreignEntity = (
    await user(
      `select * from save_entity('{"name":"Fictional foreign organization","entity_type":"organization"}')`,
      other,
    )
  ).rows[0].id;
  for (const [kind, target] of [
    ["question", anotherQuestion],
    ["entity", foreignEntity],
  ]) {
    await expect(
      save({
        title: "Fictional invalid link",
        references: [{ kind, target_id: target }],
      }),
    ).rejects.toThrow(/unavailable/);
  }
  const e = await save({
    title: "Fictional removed association",
    references: [
      { kind: "entity", target_id: entity },
      { kind: "question", target_id: question },
    ],
  });
  await save({ version: 1, references: [] }, e.id as string);
  expect(
    (
      await db.query(
        `select * from event_references where event_id='${e.id}' and not linked`,
      )
    ).rows,
  ).toHaveLength(2);
  await user(
    `select remove_timeline_event('${project}','${e.id}',2,'${crypto.randomUUID()}')`,
  );
  expect(
    (await db.query(`select * from entities where id='${entity}'`)).rows,
  ).toHaveLength(1);
  expect(
    (await db.query(`select * from research_questions where id='${question}'`))
      .rows,
  ).toHaveLength(1);
  for (let i = 0; i < 26; i++)
    await user(
      `select save_question('${project}',${json({ title: `Fictional option ${i}` })})`,
    );
  const a = (
    await user(
      `select timeline_options('${project}','question','Fictional option',0) value`,
    )
  ).rows[0].value as { items: unknown[]; has_more: boolean };
  const b = (
    await user(
      `select timeline_options('${project}','question','Fictional option',25) value`,
    )
  ).rows[0].value as typeof a;
  expect(a.items).toHaveLength(25);
  expect(a.has_more).toBe(true);
  expect(b.items).toHaveLength(1);
  for (const name of [
    `timeline_event('${project}','${legacy}')`,
    `timeline_options('${project}','article')`,
    `remove_timeline_event('${project}','${legacy}',1,'${crypto.randomUUID()}')`,
  ])
    await expect(user(`select ${name}`, other)).rejects.toThrow(
      /access denied/i,
    );
  expect((await user("select * from event_requests", other)).rows).toHaveLength(
    0,
  );
}, 30000);
