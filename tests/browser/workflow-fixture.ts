import type { Page } from "@playwright/test";
import type { Project, Subscription } from "../../src/types/project";
import type { Source } from "../../src/types/source";
import type { RssFeed } from "../../src/types/rssFeed";
import type { IngestionCandidate } from "../../src/types/ingestionCandidate";
import type { CollectionRun } from "../../src/services/rssFeedService";
import { sourceCatalog } from "../../src/lib/sourceCatalog";
import type { WorkingView } from "../../src/types/session";
import type {
  Question,
  QuestionArticle,
  Finding,
  Entity,
  Mention,
  ArticleNote,
} from "../../src/types/research";

const owner = "10000000-0000-0000-0000-000000000001";
const rules = {
  version: 1,
  includeAny: [],
  excludeAny: [],
  defaultTags: [],
  keywordTags: [],
};
const now = "2026-10-16T12:00:00Z";
export async function workflowFixture(page: Page) {
  const state = {
    projects: [
      {
        id: "existing-project",
        owner_id: owner,
        name: "Existing research",
        description: "Preserved research",
        topics: [],
        keywords: [],
        archived: false,
        rules,
      },
    ] as Project[],
    sources: [
      {
        id: "legacy-source",
        name: "Legacy manual publisher",
        url: "https://example.com",
        category: "Research",
        notes: "Preserved source",
        created_at: now,
      },
    ] as Source[],
    feeds: [] as RssFeed[],
    subscriptions: [] as Subscription[],
    candidates: [] as (IngestionCandidate & { project_id: string })[],
    runs: [] as CollectionRun[],
    articles: [] as {
      id: string;
      project_id: string;
      source_id: string | null;
      title: string;
      url: string;
      summary: string;
      published_at: string | null;
      created_at: string;
    }[],
    failFeedSave: false,
    failSubscription: false,
    failCheck: false,
    sourceWrites: 0,
    feedWrites: 0,
    checks: 0,
    sourceStates: [] as {
      project_id: string;
      source_id: string;
      state: string;
      version: number;
    }[],
    questions: [] as Question[],
    links: [] as QuestionArticle[],
    findings: [] as Finding[],
    entities: [] as Entity[],
    mentions: [] as (Mention & { project_id: string })[],
    notes: [] as (ArticleNote & { project_id: string })[],
    failResearchSave: false,
    views: [] as (WorkingView & { project_id: string })[],
    session: {
      reviewed: 0,
      version: 0,
      current_question: null as string | null,
    },
    previews: [] as {
      id: string;
      candidate_id: string;
      project_id: string;
      origin_url: string;
      excerpt: string;
      retrieved_at: string;
    }[],
  };
  function candidate(
    project: string,
    source: string | null,
    title: string,
    url: string,
  ) {
    const item = {
      id: `candidate-${state.candidates.length}`,
      project_id: project,
      source_id: source,
      title,
      url,
      description:
        "Publisher excerpt about research. This is not full article text.",
      canonical_url: null,
      final_url: null,
      published_at: now,
      tag_ids: [],
      status: "pending" as const,
      route: "pending" as const,
      import_source: "rss" as const,
      raw_metadata: {},
      warnings: [],
      converted_article_id: null,
      created_at: now,
      updated_at: now,
      reviewed_at: null,
      rejection_reason: null,
    };
    state.candidates.push(item);
    return item;
  }
  await page.route("https://foundation-test.invalid/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 200, headers });
    let result: unknown = [];
    let status = 200;
    const body = request.postData() ? request.postDataJSON() : {};
    const table = url.pathname.split("/").at(-1);
    const project = url.searchParams.get("project_id")?.replace(/^eq\./, "");
    if (url.pathname.startsWith("/auth/v1/")) {
      const user = {
        id: owner,
        email: "analyst@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: now,
        app_metadata: {},
        user_metadata: {},
      };
      const payload = Buffer.from(
        JSON.stringify({
          sub: owner,
          role: "authenticated",
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString("base64url");
      result =
        table === "user"
          ? user
          : {
              access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test`,
              token_type: "bearer",
              expires_in: 3600,
              refresh_token: "test-refresh",
              user,
            };
    } else if (table === "saved_views") {
      result = state.views.filter((v) => v.project_id === project);
    } else if (table === "save_working_view") {
      const prior = state.views.find((v) => v.id === body.p_id);
      if (body.p_delete)
        state.views = state.views.filter((v) => v.id !== body.p_id);
      else if (prior)
        Object.assign(prior, {
          name: body.p_name,
          filters: body.p_filters,
          version: prior.version + 1,
        });
      else
        state.views.push({
          id: body.p_id,
          project_id: body.p_project,
          name: body.p_name,
          surface: body.p_surface,
          filters: body.p_filters,
          version: 1,
        });
      result = state.views.find((v) => v.id === body.p_id) ?? {};
    } else if (table === "session_window") {
      result = {
        ...state.session,
        bound: state.questions.length,
        count: Math.max(0, state.questions.length - state.session.reviewed),
        first_visit: !state.session.version,
        items: [],
        cursor: state.questions.length,
        has_more: false,
        pending: state.candidates.filter(
          (c) => c.status === "pending" && !c.deferred,
        ).length,
        later: state.candidates.filter((c) => c.deferred).length,
      };
    } else if (table === "save_session") {
      state.session.version++;
      if (body.p_bound !== null) state.session.reviewed = body.p_bound;
      if (body.p_question) state.session.current_question = body.p_question;
      result = state.session;
    } else if (table === "question_choices") {
      result = {
        links: state.links.filter(
          (l) =>
            l.project_id === body.p_project &&
            l.question_id === body.p_question &&
            (!body.p_after || l.id > body.p_after),
        ),
        findings: state.findings.filter(
          (f) => f.question_id === body.p_question,
        ),
      };
    } else if (table === "question_packet") {
      result = {
        as_of: now,
        project: state.projects.find((p) => p.id === body.p_project),
        question: state.questions.find((q) => q.id === body.p_question),
        links: state.links
          .filter(
            (l) =>
              l.question_id === body.p_question &&
              (body.p_articles.includes(l.id) ||
                body.p_articles.includes(l.article_id)),
          )
          .map((l) => ({
            ...l,
            article: state.articles.find((a) => a.id === l.article_id) ?? null,
            source: "Legacy publisher",
            entities: [],
            events: [],
          })),
        findings: state.findings.filter(
          (f) =>
            f.question_id === body.p_question && body.p_findings.includes(f.id),
        ),
      };
    } else if (
      [
        "research_questions",
        "question_articles",
        "research_findings",
        "entities",
        "entity_mentions",
        "article_notes",
      ].includes(table ?? "")
    ) {
      const rows =
        table === "research_questions"
          ? state.questions
          : table === "question_articles"
            ? state.links
            : table === "research_findings"
              ? state.findings
              : table === "entities"
                ? state.entities
                : table === "entity_mentions"
                  ? state.mentions
                  : state.notes;
      result = rows.filter(
        (r) => !("project_id" in r) || r.project_id === project,
      );
    } else if (table === "research_evidence") {
      const a = state.articles.find(
        (a) => a.id === body.p_article && a.project_id === body.p_project,
      );
      result = a
        ? [
            {
              field: "acquisition_title",
              text: a.title,
              origin: "Original acquisition title",
            },
            {
              field: "acquisition_excerpt",
              text: "Acme expanded in Taiwan. US operations remain under review.",
              origin: "Original acquisition excerpt; not full article",
            },
          ]
        : [];
    } else if (table === "save_question") {
      if (state.failResearchSave) {
        state.failResearchSave = false;
        status = 409;
        result = { message: "Question changed; reload before saving" };
      } else {
        const q = state.questions.find((q) => q.id === body.p_id);
        if (q) {
          Object.assign(q, body.p_values);
          q.version++;
          result = q;
        } else {
          const q = {
            id: `question-${state.questions.length}`,
            project_id: body.p_project,
            title: "",
            description: "",
            answer: "",
            followups: "",
            status: "open" as const,
            version: 1,
            ...body.p_values,
          };
          state.questions.push(q);
          result = q;
        }
      }
    } else if (table === "link_question_article") {
      let l = state.links.find(
        (l) =>
          l.question_id === body.p_question && l.article_id === body.p_article,
      );
      const a = state.articles.find((a) => a.id === body.p_article)!;
      if (l) {
        Object.assign(l, body.p_values);
        l.version++;
      } else {
        l = {
          id: `link-${state.links.length}`,
          project_id: body.p_project,
          question_id: body.p_question,
          article_id: body.p_article,
          article_snapshot: { id: a.id, title: a.title },
          disposition: "background",
          note: "",
          linked: true,
          version: 1,
          ...body.p_values,
        };
        state.links.push(l);
      }
      result = l;
    } else if (table === "save_article_note") {
      let n = state.notes.find((n) => n.article_id === body.p_article);
      if (n) {
        n.body = body.p_body;
        n.version++;
      } else {
        n = {
          id: `note-${state.notes.length}`,
          project_id: body.p_project,
          article_id: body.p_article,
          article_snapshot: { id: body.p_article, title: "Snapshot" },
          body: body.p_body,
          version: 1,
        };
        state.notes.push(n);
      }
      result = n;
    } else if (table === "save_finding") {
      let f = state.findings.find((f) => f.id === body.p_id);
      if (f) {
        Object.assign(f, body.p_values);
        f.version++;
      } else {
        f = {
          id: `finding-${state.findings.length}`,
          question_id: body.p_question,
          observed: "",
          interpretation: "",
          uncertainties: "",
          citations: [],
          version: 1,
          ...body.p_values,
        };
        state.findings.push(f!);
      }
      result = f;
    } else if (table === "save_entity") {
      let e = state.entities.find((e) => e.id === body.p_id);
      if (e) {
        Object.assign(e, body.p_values);
        e.version++;
      } else {
        e = {
          id: `entity-${state.entities.length}`,
          name: "",
          entity_type: "organization",
          aliases: [],
          description: "",
          reference_url: "",
          version: 1,
          ...body.p_values,
        };
        state.entities.push(e!);
      }
      result = e;
    } else if (table === "save_mentions") {
      let added = 0;
      for (const draft of body.p_suggestions) {
        if (
          state.mentions.some(
            (m) =>
              m.article_id === body.p_article &&
              m.entity_id === draft.entity_id &&
              m.matched_alias === draft.alias &&
              m.source_field ===
                (body.p_manual ? "manual analyst association" : draft.field),
          )
        )
          continue;
        const a = state.articles.find((a) => a.id === body.p_article)!;
        state.mentions.push({
          id: `mention-${state.mentions.length}`,
          project_id: body.p_project,
          article_id: a.id,
          article_snapshot: { id: a.id, title: a.title },
          entity_id: draft.entity_id,
          matched_alias: draft.alias,
          source_field: body.p_manual
            ? "manual analyst association"
            : draft.field,
          snapshot: draft.snapshot ?? "",
          span: draft.span,
          matcher_version: 1,
          state: body.p_manual ? "confirmed" : "suggested",
          manual: body.p_manual,
          version: 1,
          updated_at: now,
        });
        added++;
      }
      result = added;
    } else if (table === "review_mention") {
      const m = state.mentions.find((m) => m.id === body.p_id)!;
      m.state = body.p_state;
      m.version++;
      result = m;
    } else if (table === "candidate_previews")
      result = state.previews.filter(
        (p) =>
          p.project_id === project &&
          `eq.${p.candidate_id}` === url.searchParams.get("candidate_id"),
      );
    else if (table === "fetch-url-metadata")
      result = {
        requestedUrl: body.url,
        finalUrl: body.url,
        canonicalUrl: null,
        title: "Page metadata",
        description: "Separately retrieved page metadata excerpt.",
        siteName: null,
        publishedAt: null,
        sourceHints: { hostname: "example.com", siteName: null },
        warnings: [],
      };
    else if (table === "save_candidate_preview") {
      const c = state.candidates.find((c) => c.id === body.p_id)!;
      const p = {
        id: `preview-${state.previews.length}`,
        candidate_id: c.id,
        project_id: c.project_id,
        origin_url: body.p_url,
        excerpt: body.p_excerpt,
        retrieved_at: now,
      };
      state.previews.push(p);
      result = p;
    } else if (table === "projects") {
      if (request.method() === "POST") {
        const p = {
          ...body,
          id: `project-${state.projects.length}`,
          owner_id: owner,
          topics: body.topics ?? [],
          keywords: body.keywords ?? [],
          description: body.description ?? "",
          archived: false,
          rules: body.rules ?? rules,
        };
        state.projects.push(p);
        result = p;
      } else if (request.method() === "PATCH") {
        const p = state.projects.find(
          (p) => `eq.${p.id}` === url.searchParams.get("id"),
        )!;
        Object.assign(p, body);
        result = p;
      } else result = state.projects;
    } else if (table === "sources") {
      if (request.method() === "POST") {
        state.sourceWrites++;
        const source = {
          ...body,
          id: `source-${state.sources.length}`,
          created_at: now,
        };
        state.sources.push(source);
        result = source;
      } else if (request.method() === "PATCH") {
        const source = state.sources.find(
          (s) => `eq.${s.id}` === url.searchParams.get("id"),
        )!;
        Object.assign(source, body);
        result = source;
      } else result = state.sources;
    } else if (table === "rss_feeds") {
      if (request.method() === "POST") {
        if (state.failFeedSave) {
          state.failFeedSave = false;
          status = 500;
          result = { message: "Simulated feed save failure" };
        } else {
          state.feedWrites++;
          const feed = {
            ...body,
            id: `feed-${state.feeds.length}`,
            last_checked_at: null,
            last_success_at: null,
            created_at: now,
            updated_at: now,
          };
          state.feeds.push(feed);
          result = feed;
        }
      } else if (request.method() === "PATCH") {
        const feed = state.feeds.find(
          (f) => `eq.${f.id}` === url.searchParams.get("id"),
        )!;
        Object.assign(feed, body);
        result = feed;
      } else result = state.feeds;
    } else if (table === "project_sources")
      result = state.sourceStates.filter((s) => s.project_id === project);
    else if (table === "project_subscriptions")
      result = state.subscriptions.filter((s) => s.project_id === project);
    else if (table === "collection_runs") result = [...state.runs].reverse();
    else if (table === "articles")
      result = state.articles.filter((a) => a.project_id === project);
    else if (table === "search_candidates") {
      const f = body.p_filters;
      const items = state.candidates.filter(
        (c) =>
          c.project_id === body.p_project &&
          (f.status === "later"
            ? c.status === "pending" && c.deferred
            : c.status === f.status &&
              (c.status !== "pending" || !c.deferred)) &&
          (!f.route || c.route === f.route) &&
          (!body.p_search ||
            c.title?.toLowerCase().includes(body.p_search.toLowerCase())) &&
          (!f.source || f.source === "all" || c.source_id === f.source),
      );
      result = {
        items: items.slice((f.page ?? 0) * 50, ((f.page ?? 0) + 1) * 50),
        count: items.length,
      };
    } else if (table === "enable_catalog_feed") {
      const catalog = sourceCatalog.find(
        (s) => s.feedUrl === body.p_catalog.feedUrl,
      )!;
      const source = {
        id: `catalog-source-${state.sources.length}`,
        name: catalog.name,
        url: catalog.url,
        category: "Research",
        notes: "",
        created_at: now,
      };
      const feed = {
        id: `catalog-feed-${state.feeds.length}`,
        source_id: source.id,
        title: catalog.name,
        feed_url: catalog.feedUrl,
        is_active: true,
        last_checked_at: null,
        last_success_at: null,
        created_at: now,
        updated_at: now,
      };
      state.sources.push(source);
      state.feeds.push(feed);
      state.subscriptions.push({
        project_id: body.p_project,
        feed_id: feed.id,
        enabled: true,
        rules: null,
      });
      result = null;
    } else if (table === "set_subscription") {
      if (state.failSubscription) {
        state.failSubscription = false;
        status = 500;
        result = { message: "Simulated subscription failure" };
      } else {
        const s = state.subscriptions.find(
          (s) => s.project_id === body.p_project && s.feed_id === body.p_feed,
        );
        if (s)
          Object.assign(s, { enabled: body.p_enabled, rules: body.p_rules });
        else
          state.subscriptions.push({
            project_id: body.p_project,
            feed_id: body.p_feed,
            enabled: body.p_enabled,
            rules: body.p_rules,
          });
        result = null;
      }
    } else if (table === "set_source_enabled" || table === "set_source_state") {
      const enabled =
        table === "set_source_state"
          ? body.p_state === "following"
          : body.p_enabled;
      if (table === "set_source_state") {
        const s = state.sourceStates.find(
          (s) =>
            s.project_id === body.p_project && s.source_id === body.p_source,
        );
        if (s) {
          s.state = body.p_state;
          s.version++;
        } else
          state.sourceStates.push({
            project_id: body.p_project,
            source_id: body.p_source,
            state: body.p_state,
            version: 1,
          });
      }
      for (const feed of state.feeds.filter(
        (f) => f.source_id === body.p_source,
      )) {
        const s = state.subscriptions.find(
          (s) => s.project_id === body.p_project && s.feed_id === feed.id,
        );
        if (s) {
          s.enabled = enabled;
          s.followed = body.p_state !== "unfollowed";
        } else
          state.subscriptions.push({
            project_id: body.p_project,
            feed_id: feed.id,
            enabled,
            followed: body.p_state !== "unfollowed",
            rules: null,
          });
      }
      result = null;
    } else if (table === "collect-feeds") {
      state.checks++;
      const feed = state.feeds.find((f) => f.id === body.feed_id)!;
      feed.last_checked_at = now;
      state.runs.push({
        id: `run-${state.runs.length}`,
        feed_id: feed.id,
        status: state.failCheck ? "error" : "success",
        started_at: now,
        finished_at: now,
        fetched: state.failCheck ? 0 : 1,
        staged: state.failCheck ? 0 : 999,
        error: state.failCheck
          ? "RSS feed fetch failed with status 403."
          : null,
        warnings: [],
      });
      if (!state.failCheck) {
        feed.last_success_at = now;
        candidate(
          body.project_id,
          feed.source_id,
          "Supply chain research update",
          "https://example.com/research",
        );
      }
      result = {
        outcomes: [
          {
            feedId: feed.id,
            status: state.failCheck ? "error" : "success",
            fetched: 1,
            staged: 999,
            error: state.failCheck
              ? "RSS feed fetch failed with status 403."
              : null,
          },
        ],
      };
    } else if (table === "capture_candidate") {
      result = candidate(
        body.p_project,
        body.p_values.source_id,
        body.p_values.title || "Manually captured link",
        body.p_values.url,
      );
    } else if (table === "review_candidate") {
      const c = state.candidates.find((c) => c.id === body.p_id)!;
      if (body.p_action === "accept") {
        Object.assign(c, body.p_values);
        c.status = "accepted";
        c.converted_article_id = `article-${state.articles.length}`;
        state.articles.push({
          id: c.converted_article_id,
          project_id: c.project_id,
          source_id: c.source_id,
          title: c.title!,
          url: c.url,
          summary: c.description ?? "",
          published_at: c.published_at,
          created_at: now,
        });
      } else if (body.p_action === "reject") c.status = "rejected";
      else if (body.p_action === "duplicate") c.status = "duplicate";
      else if (body.p_action === "restore") {
        c.status = "pending";
        c.deferred = false;
      } else if (body.p_action === "later") c.deferred = true;
      else if (body.p_action === "use_preview")
        c.matching_preview = state.previews.find(
          (p) => p.id === body.p_values.preview_id,
        );
      else Object.assign(c, body.p_values);
      result = c;
    }
    if (Array.isArray(result)) {
      const offset = Number(url.searchParams.get("offset") ?? 0);
      result = result.slice(
        offset,
        offset + Number(url.searchParams.get("limit") ?? 1000),
      );
    }
    return route.fulfill({ status, json: result, headers });
  });
  return state;
}
export async function login(page: Page, path = "/") {
  await page.goto(path);
  await page.getByLabel("Email", { exact: true }).fill("analyst@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("local-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
