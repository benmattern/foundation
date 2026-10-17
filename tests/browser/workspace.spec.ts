import { expect, test } from "@playwright/test";

test("sign-in, project isolation, server search, bulk scope and recovery", async ({
  page,
}) => {
  const owner = "10000000-0000-0000-0000-000000000001";
  const projects = [
    "20000000-0000-0000-0000-000000000001",
    "20000000-0000-0000-0000-000000000002",
  ];
  const rules = {
    version: 1,
    includeAny: [],
    excludeAny: [],
    defaultTags: [],
    keywordTags: [],
  };
  const candidates = projects.flatMap((project, index) =>
    [0, 1].map((n) => ({
      id: `candidate-${index}-${n}`,
      project_id: project,
      title: `Project ${index + 1} item ${n + 1}`,
      url: `https://example.com/${index}/${n}`,
      source_id: null,
      description: "Publisher excerpt",
      canonical_url: null,
      final_url: null,
      published_at: null,
      tag_ids: [],
      status: "pending",
      route: "pending",
      import_source: "rss",
      raw_metadata: {},
      warnings: [],
      converted_article_id: null,
      created_at: "2026-10-16T12:00:00Z",
      updated_at: "2026-10-16T12:00:00Z",
      reviewed_at: null,
      rejection_reason: null,
    })),
  );
  const bulkCalls: string[][] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://foundation-test.invalid/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let result: unknown = [];
    if (request.method() === "OPTIONS") {
      return route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
      });
    }
    if (url.pathname.startsWith("/auth/v1/")) {
      const user = {
        id: owner,
        email: "analyst@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: "2026-10-16T12:00:00Z",
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
      result = url.pathname.endsWith("/user")
        ? user
        : {
            access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test`,
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "test-refresh",
            user,
          };
    } else if (url.pathname === "/rest/v1/projects") {
      result = projects.map((id, i) => ({
        id,
        owner_id: owner,
        name: `Project ${i + 1}`,
        description: "",
        topics: [],
        keywords: [],
        archived: false,
        rules,
      }));
    } else if (url.pathname.endsWith("/rpc/session_window")) {
      result = {
        bound: 0,
        reviewed: 0,
        version: 0,
        current_question: null,
        first_visit: true,
        items: [],
        count: 0,
        pending: 2,
        later: 0,
        cursor: 0,
        has_more: false,
      };
    } else if (url.pathname.endsWith("/rpc/search_candidates")) {
      const body = request.postDataJSON();
      const filtered = candidates.filter(
        (c) =>
          c.project_id === body.p_project &&
          c.status === body.p_filters.status &&
          (!body.p_filters.route || c.route === body.p_filters.route) &&
          c.title.toLowerCase().includes(body.p_search.toLowerCase()),
      );
      result = { items: filtered, count: filtered.length };
    } else if (url.pathname.endsWith("/rpc/bulk_review")) {
      const body = request.postDataJSON();
      bulkCalls.push(body.p_ids);
      result = body.p_ids.map((id: string, index: number) => {
        if (index === 0) {
          candidates.find((c) => c.id === id)!.status = "rejected";
        }
        return index === 0
          ? { id, ok: true }
          : { id, ok: false, error: "Simulated conflict" };
      });
    } else if (url.pathname.endsWith("/rpc/review_candidate")) {
      const body = request.postDataJSON();
      const candidate = candidates.find((c) => c.id === body.p_id)!;
      candidate.status =
        body.p_action === "restore" ? "pending" : candidate.status;
      result = candidate;
    }
    if (Array.isArray(result)) {
      const offset = Number(url.searchParams.get("offset") ?? 0);
      result = result.slice(
        offset,
        offset + Number(url.searchParams.get("limit") ?? 1000),
      );
    }
    await route.fulfill({
      status: 200,
      json: result,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "content-range",
        "content-range": url.pathname.endsWith("/articles") ? "*/0" : "0-1/2",
      },
    });
  });
  await page.goto("/ingestion");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill("analyst@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("local-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("Active project")).toHaveValue(projects[0]);
  await expect(
    page.getByRole("button", { name: "Keep" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Project 2 item 1", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Active project").selectOption(projects[1]);
  await expect(
    page.getByRole("heading", { name: "Project 2", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Project 2 item 1", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Project 1 item 1", { exact: true })).toHaveCount(
    0,
  );
  await page.getByPlaceholder("Search candidates").fill("item 2");
  await expect(
    page.getByRole("checkbox", { name: "Project 2 item 1", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Project 2 item 2", exact: true }),
  ).toBeVisible();
  await page.getByPlaceholder("Search candidates").fill("");
  await expect(
    page.getByRole("checkbox", { name: "Project 2 item 1", exact: true }),
  ).toBeVisible();
  await page
    .getByText("Bulk review (0 selected on this page)", { exact: true })
    .click();
  await page.getByRole("checkbox", { name: /Select this page only/ }).check();
  await expect(
    page.getByText("2 selected on this page", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Dismiss selected", exact: true })
    .click();
  await expect(page.getByText(/Simulated conflict/)).toBeVisible();
  expect(bulkCalls).toEqual([["candidate-1-0", "candidate-1-1"]]);
  await page.getByRole("button", { name: /^Dismissed/ }).click();
  await page.getByRole("button", { name: "Restore to inbox" }).click();
  await page.getByRole("button", { name: /^Awaiting review/ }).click();
  await expect(
    page.getByRole("checkbox", { name: "Project 2 item 1", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
