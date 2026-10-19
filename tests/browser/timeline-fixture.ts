import type { Page } from "@playwright/test";
import type { TimelineDetail, EventReference } from "../../src/types/timeline";
import { dateBounds } from "../../src/lib/timeline";
import { workflowFixture } from "./workflow-fixture";

// UI transport fixture only. Actual SQL/security and concurrency run separately.
export async function timelineFixture(page: Page) {
  const research = await workflowFixture(page);
  const now = "2026-10-19T12:00:00Z";
  research.articles.push({
    id: "fictional-article",
    project_id: "existing-project",
    source_id: "legacy-source",
    title: "Fictional launch report",
    url: "https://example.com/fictional-launch",
    summary: "Fictional evidence for browser acceptance.",
    published_at: "2024-04-09T10:00:00Z",
    created_at: now,
  });
  const state = {
    events: [] as TimelineDetail[],
    failPage: false,
    failSave: false,
    stale: false,
    reads: [] as number[],
  };
  const receipts = new Map<string, TimelineDetail>();
  const options = {
    article: [
      {
        id: "fictional-article",
        label: "Fictional launch report",
        detail: "Legacy manual publisher",
      },
    ],
    entity: [{ id: "fictional-entity", label: "Fictional Observatory" }],
    question: [
      {
        id: "fictional-question",
        label: "What changed in the fictional program?",
      },
    ],
    source: [{ id: "legacy-source", label: "Legacy manual publisher" }],
  };
  await page.route(
    "https://foundation-test.invalid/rest/v1/rpc/**",
    async (route) => {
      const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
      if (
        ![
          "timeline_page",
          "timeline_event",
          "timeline_options",
          "save_event",
          "remove_timeline_event",
        ].includes(name)
      )
        return route.fallback();
      if (route.request().method() === "OPTIONS")
        return route.fulfill({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
          },
        });
      const body = route.request().postDataJSON();
      const reply = (value: unknown, status = 200) =>
        route.fulfill({
          status,
          json: value,
          headers: { "access-control-allow-origin": "*" },
        });
      if (name === "timeline_options") {
        const items = options[body.p_kind as keyof typeof options].filter((o) =>
          o.label.toLowerCase().includes(body.p_search.toLowerCase()),
        );
        return reply({ items, has_more: false });
      }
      if (name === "timeline_page") {
        if (state.failPage)
          return reply({ message: "Fictional timeline network failure" }, 500);
        const f = body.p_filters;
        const items = state.events
          .filter(
            (e) =>
              (!f.search ||
                e.title.toLowerCase().includes(f.search.toLowerCase())) &&
              (!f.type || e.event_type === f.type) &&
              (!f.from || (e.timeline_end && e.timeline_end >= f.from)) &&
              (!f.to || (e.timeline_start && e.timeline_start <= f.to)) &&
              ["article", "entity", "question", "source"].every(
                (kind) =>
                  !f[kind] ||
                  e.references.some((r) =>
                    kind === "source"
                      ? r.snapshot.source_id === f.source
                      : r.kind === kind && r.target_id === f[kind],
                  ),
              ),
          )
          .sort((a, b) =>
            a.timeline_start === b.timeline_start
              ? a.id.localeCompare(b.id)
              : !a.timeline_start
                ? 1
                : !b.timeline_start
                  ? -1
                  : a.timeline_start.localeCompare(b.timeline_start) *
                    (f.order === "desc" ? -1 : 1),
          );
        state.reads.push(body.p_offset);
        return reply({
          items: items.slice(body.p_offset, body.p_offset + 50),
          total: state.events.length,
          matched: items.length,
          has_more: items.length > body.p_offset + 50,
        });
      }
      if (name === "timeline_event")
        return reply(state.events.find((e) => e.id === body.p_id));
      if (name === "remove_timeline_event") {
        state.events = state.events.filter((e) => e.id !== body.p_id);
        return reply(null);
      }
      const v = body.p_values;
      if (state.failSave)
        return reply({ message: "Fictional save failed; retry safely" }, 500);
      if (state.stale)
        return reply({ message: "Event changed. Reload before editing." }, 409);
      if (receipts.has(v.request_id)) return reply(receipts.get(v.request_id));
      const prior = state.events.find((e) => e.id === body.p_id);
      const references = v.references.map((r: EventReference) => ({
        ...r,
        available: true,
        snapshot: {
          id: r.target_id,
          title: options[r.kind].find((o) => o.id === r.target_id)!.label,
          ...(r.kind === "article"
            ? {
                url: "https://example.com/fictional-launch",
                source_id: "legacy-source",
                source_name: "Legacy manual publisher",
                published_at: "2024-04-09T10:00:00Z",
                collected_at: "2024-04-10T08:00:00Z",
                approved_at: now,
              }
            : {}),
        },
      }));
      const e = {
        ...v,
        id: prior?.id ?? crypto.randomUUID(),
        project_id: "existing-project",
        created_at: prior?.created_at ?? now,
        updated_at: now,
        occurred_at: null,
        version: (prior?.version ?? 0) + 1,
        date_start: v.date_start || null,
        date_end: v.date_end || null,
        date_origin: "explicit",
        timeline_start: dateBounds(v.date_start)?.[0] ?? null,
        timeline_end: dateBounds(v.date_end || v.date_start)?.[1] ?? null,
        references,
        history: [],
        evidence_count: references.filter(
          (r: EventReference) => r.kind === "article",
        ).length,
        entity_count: references.filter(
          (r: EventReference) => r.kind === "entity",
        ).length,
        question_count: references.filter(
          (r: EventReference) => r.kind === "question",
        ).length,
      } as TimelineDetail;
      state.events = [...state.events.filter((x) => x.id !== e.id), e];
      receipts.set(v.request_id, e);
      return reply(e);
    },
  );
  return { state, research };
}
