import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { workflowFixture, login } from "./workflow-fixture";

async function capture(page: Page, name: string) {
  mkdirSync("artifacts.local/workflow", { recursive: true });
  for (const [size, width] of [
    ["desktop", 1440],
    ["mobile", 390],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts.local/workflow/${name}-${size}.png`,
      fullPage: true,
    });
  }
}
test("new project to source check to Keep to Library, with project switching and compatible links", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "New project" })).toBeVisible();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Pacific supply chains");
  await capture(page, "new-project");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pacific supply chains", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Choose where incoming research comes from", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Enabled sources", { exact: true }).locator(".."),
  ).toContainText("0");
  await capture(page, "overview");
  await page.getByRole("link", { name: "Choose sources", exact: true }).click();
  await page.getByLabel("Search catalog topics").fill("Taiwan");
  await expect(
    page.getByText("No curated source matches", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search catalog topics").fill("");
  await page
    .getByRole("button", { name: "Follow source", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("article")
      .getByRole("button", { name: "Following", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Source views" })
    .getByRole("button", { name: "Following", exact: true })
    .click();
  await expect(
    page.getByText("Not checked yet", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check now", exact: true }).click();
  await expect(
    page.getByText(/Check completed\. Open the inbox/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check now", exact: true }),
  ).toBeEnabled();
  await capture(page, "sources");
  await page.getByRole("link", { name: "Open inbox", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Keep", exact: true }).first(),
  ).toBeVisible();
  await capture(page, "inbox");
  await page
    .getByLabel("Search inbox", { exact: true })
    .fill("unmatched phrase");
  await expect(
    page.getByRole("heading", { name: "No items match these filters" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset inbox filters" }).click();
  await expect(
    page.getByRole("button", { name: "Keep", exact: true }).first(),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Keep", exact: true }).first().click();
  await expect(
    page.getByRole("heading", { name: "All collected items reviewed" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View in library", exact: true })
    .click();
  await expect(page).toHaveURL(/article=article-0/);
  await expect(
    page.getByText("Your kept article is highlighted below."),
  ).toBeVisible();
  await expect(page.locator("#article-article-0")).toContainText(
    "Supply chain research update",
  );
  await capture(page, "library");
  await page.getByLabel("Active project").selectOption("existing-project");
  await expect(
    page.getByText("Enabled sources", { exact: true }).locator(".."),
  ).toContainText("0");
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await expect(
    page.getByText("Supply chain research update", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/rss");
  await expect(page).toHaveURL(/\/sources\?view=collection/);
  await page.goto(`/sources/${state.sources[0].id}`);
  await expect(
    page.getByRole("heading", { name: "Legacy manual publisher" }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Manual only/)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/sources\?view=collection/);
  expect(state.checks).toBe(1);
  expect(state.articles).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("partial source/feed/subscription saves preserve entries and IDs, failed collection stays actionable", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  await login(page, "/sources?view=available");
  state.failFeedSave = true;
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await page
    .getByLabel("Source name", { exact: true })
    .fill("Independent publisher");
  await page.getByLabel("Website", { exact: true }).fill("https://example.org");
  await page
    .getByLabel("Feed URL (optional)")
    .fill("https://example.org/feed.xml");
  await page.getByRole("button", { name: "Save source", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Your entries are preserved",
  );
  await expect(page.getByLabel("Source name", { exact: true })).toHaveValue(
    "Independent publisher",
  );
  state.failSubscription = true;
  await page.getByRole("button", { name: "Retry setup", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Your entries are preserved",
  );
  expect(state.sourceWrites).toBe(1);
  expect(state.feedWrites).toBe(1);
  expect(state.subscriptions).toHaveLength(0);
  await capture(page, "partial-save");
  await page.getByRole("button", { name: "Retry setup", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.sourceWrites).toBe(1);
  expect(state.feedWrites).toBe(1);
  state.failCheck = true;
  await page.getByRole("button", { name: "Check now", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "publisher refused access",
  );
  await expect(
    page.getByText("Needs attention", { exact: false }),
  ).toBeVisible();
  await capture(page, "failed-feed");
  state.failCheck = false;
  await page.getByRole("button", { name: "Check now", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Open inbox", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause source", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Check now", exact: true }),
  ).toBeDisabled();
});

test("manual-only source and link capture remain distinct from automatic collection", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  await login(page, "/sources?view=available");
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await page
    .getByLabel("Source name", { exact: true })
    .fill("Manual research desk");
  await page.getByLabel("Website", { exact: true }).fill("https://example.net");
  await page.getByRole("button", { name: "Save source", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.feeds).toHaveLength(0);
  expect(state.subscriptions).toHaveLength(0);
  const source = page
    .getByRole("article")
    .filter({ hasText: "Manual research desk" });
  await expect(source).toContainText("Manual only");
  await source
    .getByRole("link", { name: "Capture a link", exact: true })
    .click();
  await page
    .getByPlaceholder("https://example.com/article")
    .fill("https://example.net/research-note");
  await page.getByRole("button", { name: "Prepare link", exact: true }).click();
  await page.getByRole("button", { name: /Save to.*Inbox/ }).click();
  await expect(
    page.getByText(
      "Link saved to Inbox for your review. It has not been added to Library.",
    ),
  ).toBeVisible();
  expect(state.articles).toHaveLength(0);
  expect(state.candidates).toHaveLength(1);
  await page.getByRole("link", { name: "Open inbox", exact: true }).click();
  await page
    .getByRole("button", { name: "Dismiss", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /^Dismissed/ }).click();
  await page
    .getByRole("button", { name: "Restore to inbox", exact: true })
    .click();
  await expect.poll(() => state.candidates[0].status).toBe("pending");
});

test("keyboard project setup and readable settings preserve optional scope without enabling rules", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  await login(page);
  const trigger = page.getByRole("button", {
    name: "New project",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Project name", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page
    .getByRole("link", { name: "Project settings", exact: true })
    .click();
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "A focused project for reviewing supply chain evidence.\nScope is descriptive until matching rules are explicitly configured.",
    );
  await page
    .getByLabel("Research keywords, separated by commas")
    .fill("Taiwan, semiconductors, maritime logistics");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(
    page.getByText("Project scope saved.", { exact: true }),
  ).toBeVisible();
  expect(state.projects[0].keywords).toEqual([
    "Taiwan",
    "semiconductors",
    "maritime logistics",
  ]);
  expect(state.projects[0].rules.includeAny).toEqual([]);
  await capture(page, "settings");
  await page.getByLabel("Include any terms").fill("accidental term");
  await page
    .getByRole("button", { name: "Cancel rule edits", exact: true })
    .click();
  await expect(page.getByLabel("Include any terms")).toHaveValue("");
  await capture(page, "advanced-rules");
});
