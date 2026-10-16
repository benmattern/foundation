import type { Page } from "@playwright/test";
import type { Project, Subscription } from "../../src/types/project";
import type { Source } from "../../src/types/source";
import type { RssFeed } from "../../src/types/rssFeed";
import type { IngestionCandidate } from "../../src/types/ingestionCandidate";
import type { CollectionRun } from "../../src/services/rssFeedService";
import { sourceCatalog } from "../../src/lib/sourceCatalog";

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
          rules,
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
    } else if (table === "project_subscriptions")
      result = state.subscriptions.filter((s) => s.project_id === project);
    else if (table === "collection_runs") result = [...state.runs].reverse();
    else if (table === "articles")
      result = state.articles.filter((a) => a.project_id === project);
    else if (table === "search_candidates") {
      const f = body.p_filters;
      const items = state.candidates.filter(
        (c) =>
          c.project_id === body.p_project &&
          c.status === f.status &&
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
    } else if (table === "set_source_enabled") {
      for (const feed of state.feeds.filter(
        (f) => f.source_id === body.p_source,
      )) {
        const s = state.subscriptions.find(
          (s) => s.project_id === body.p_project && s.feed_id === feed.id,
        );
        if (s) s.enabled = body.p_enabled;
        else
          state.subscriptions.push({
            project_id: body.p_project,
            feed_id: feed.id,
            enabled: body.p_enabled,
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
      else if (body.p_action === "restore") c.status = "pending";
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
