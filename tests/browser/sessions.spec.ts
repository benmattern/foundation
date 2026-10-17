import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { workflowFixture, login } from "./workflow-fixture";
test("session checkpoint, saved browsing view, comparison note and safe frozen brief downloads", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = await workflowFixture(page);
  s.articles.push({
    id: "a",
    project_id: "existing-project",
    source_id: "legacy-source",
    title: "Taiwan evidence",
    url: "https://example.com/evidence",
    summary: "Existing",
    published_at: "2026-10-01",
    created_at: "2026-10-16",
  });
  s.questions.push({
    id: "q",
    project_id: "existing-project",
    title: "What changed?",
    description: "Scope",
    answer: "Analyst answer 台灣",
    followups: "Check filing",
    status: "open",
    version: 1,
  });
  s.links.push({
    id: "l",
    project_id: "existing-project",
    question_id: "q",
    article_id: "a",
    article_snapshot: {
      id: "a",
      title: "Taiwan evidence",
      url: "https://example.com/evidence",
    },
    disposition: "challenging",
    note: "Counterpoint",
    linked: true,
    version: 1,
  });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Continue research" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Finish session / Mark reviewed through captured boundary",
    })
    .click();
  await expect.poll(() => s.session.reviewed).toBe(1);
  await page.goto("/articles?q=Taiwan&order=oldest");
  await page.getByText("Saved working views", { exact: true }).click();
  await page.getByLabel("View name").fill("Taiwan oldest");
  await page
    .getByRole("button", { name: "Save current filters", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Taiwan oldest", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search library").fill("No match");
  await page.getByRole("link", { name: "Taiwan oldest", exact: true }).click();
  await expect(page.getByLabel("Search library")).toHaveValue("Taiwan");
  await page.goto("/research/session?question=q");
  await page.getByRole("button", { name: "Use as current question" }).click();
  await expect.poll(() => s.session.current_question).toBe("q");
  await page
    .getByLabel("Taiwan evidence — challenging", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Assemble / regenerate selected preview" })
    .click();
  expect(errors).toEqual([]);
  await expect(page.getByLabel("Brief Markdown draft")).toHaveValue(
    /Analyst answer 台灣/,
  );
  await page
    .getByLabel("Why it matters to this question")
    .fill("Specific challenge");
  await page.getByRole("button", { name: "Save comparison note" }).click();
  await expect.poll(() => s.links[0].note).toBe("Specific challenge");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Research changed since assembly",
  );
  const regenerated = page.waitForResponse((r) =>
    r.url().endsWith("/question_packet"),
  );
  const regenerate = page.getByRole("button", {
    name: "Assemble / regenerate selected preview",
  });
  await regenerate.focus();
  await regenerate.press("Enter");
  expect((await regenerated).status()).toBe(200);
  expect((await (await regenerated).json()).links[0].note).toBe(
    "Specific challenge",
  );
  await expect(page.getByLabel("Brief Markdown draft")).toHaveValue(
    /Specific challenge/,
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download HTML for Print / Save as PDF" })
    .click();
  expect((await download).suggestedFilename()).toBe("foundation-brief.html");
  const downloaded = readFileSync((await (await download).path())!, "utf8");
  expect(downloaded).toContain("Specific challenge");
  expect(downloaded).toContain("台灣");
  expect(downloaded).not.toMatch(
    /access_token|refresh_token|sb_publishable|<script/,
  );
  await expect(
    page
      .getByRole("region", { name: "Print-friendly brief preview" })
      .locator("pre"),
  ).toContainText("Specific challenge");
  mkdirSync("artifacts.local/sessions", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts.local/sessions/brief-${width}.png`,
      fullPage: true,
    });
  }
});
