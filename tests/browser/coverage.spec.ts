import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { workflowFixture, login } from "./workflow-fixture";
test("optional pack subset, preserved selections, honest coverage and independent tuning preview", async ({
  page,
}) => {
  const s = await workflowFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (let i = 0; i < 3; i++)
    s.candidates.push({
      id: `cal-${i}`,
      project_id: "existing-project",
      url: `https://example.com/${i}`,
      canonical_url: null,
      final_url: null,
      source_id: null,
      title: `Taiwan example ${i}`,
      description: "Original example",
      published_at: "2026-10-01",
      created_at: "2026-10-16T10:00:00Z",
      updated_at: "2026-10-16T10:00:00Z",
      import_source: "rss",
      raw_metadata: {},
      warnings: [],
      status: i === 0 ? "accepted" : i === 1 ? "rejected" : "pending",
      deferred: i === 2,
      route: "outside_scope",
      converted_article_id: null,
      rejection_reason: null,
      reviewed_at: null,
      original_acquisition: {
        title: `Taiwan example ${i}`,
        description: "Original example",
      },
      rule_result: {
        version: 1,
        route: "outside_scope",
        score: 0,
        classifiedAt: "2026-10-16",
        matches: [],
        suggestedTags: [],
        warnings: [],
      },
    });
  await login(page);
  await page.goto("/sources?view=discover");
  await page
    .getByLabel("Preview source pack")
    .selectOption("Semiconductors / supply chain");
  await expect(
    page.getByText(/publisher records, 1 automatic feeds/),
  ).toBeVisible();
  await page.getByLabel("Taiwan Ministry of Finance", { exact: true }).check();
  await page
    .getByLabel("Taiwan Semiconductor Manufacturing Company", { exact: true })
    .check();
  expect(s.feeds).toHaveLength(0);
  await page
    .getByRole("button", {
      name: "Follow selected feeds / save manual sources (2)",
      exact: true,
    })
    .click();
  await expect.poll(() => s.catalogSelections.length).toBe(2);
  await expect(page.getByRole("status")).toContainText(
    "Existing pause/unfollow decisions",
  );
  expect(s.feeds).toHaveLength(1);
  const count = s.sources.length;
  await page
    .getByRole("button", {
      name: "Follow selected feeds / save manual sources (2)",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("selected.");
  expect(s.sources.length).toBe(count);
  expect(s.subscriptions).toHaveLength(1);
  await page
    .getByRole("button", { name: "Coverage and calibration", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Selected official-source coverage" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Taiwan Semiconductor Manufacturing Company — manual-only/,
    }),
  ).toBeVisible();
  await page.getByLabel("Collected from (UTC)").fill("2026-10-15");
  await page.getByLabel("Collected through (UTC)").fill("2026-10-17");
  await page
    .getByRole("button", { name: "Request outside-scope / low-ranked sample" })
    .click();
  await expect(page.getByText(/50% \(1 \/ 2\)/)).toBeVisible();
  await expect(page.getByText(/Population 3; displayed 3/)).toBeVisible();
  const statuses = s.candidates.map((c) => c.status);
  await page
    .getByRole("button", { name: "Useful for tuning", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Tuning label: Useful. This is separate from Keep/Dismiss."),
  ).toBeVisible();
  await page
    .getByText("Compare a proposed project rule with these examples", {
      exact: true,
    })
    .click();
  await page.getByLabel("Include any terms").fill("unrelated");
  await page
    .getByRole("button", { name: "Preview recent sample", exact: true })
    .click();
  await expect(
    page.getByText(/WARNING: previously Useful example would be excluded/),
  ).toBeVisible();
  expect(s.candidates.map((c) => c.status)).toEqual(statuses);
  expect(s.projects[0].rules.version).toBe(1);
  mkdirSync("artifacts.local/coverage", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts.local/coverage/calibration-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
