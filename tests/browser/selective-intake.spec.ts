import { test, expect } from "@playwright/test";
import { workflowFixture, login } from "./workflow-fixture";
import { mkdirSync } from "node:fs";
test("explicit grouped setup, durable source states and Later restoration", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  await login(page);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Selective research");
  await page.getByLabel("Inbox preference").selectOption("restricted");
  await page.getByLabel(/Matching terms/).fill("Taiwan\nJapan");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Selective research", exact: true }),
  ).toBeVisible();
  expect(state.projects.at(-1)?.rules).toMatchObject({
    format: 2,
    mode: "restricted",
  });
  await page.goto("/sources?view=discover");
  await page
    .getByRole("button", { name: "Follow source", exact: true })
    .first()
    .click();
  await page
    .getByRole("navigation", { name: "Source views" })
    .getByRole("button", { name: "Following", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause source", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume source", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Unfollow source", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume source", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Source views" })
    .getByRole("button", { name: "Your saved sources", exact: true })
    .click();
  await page
    .getByRole("article")
    .filter({ hasText: state.sources.at(-1)!.name })
    .getByRole("button", { name: "Follow source", exact: true })
    .click();
  await page.getByRole("button", { name: "Check now", exact: true }).click();
  await page.getByRole("link", { name: "Open inbox", exact: true }).click();
  await page
    .getByRole("button", { name: "Fetch preview on demand", exact: true })
    .first()
    .click();
  await expect.poll(() => state.previews.length).toBe(1);
  expect(state.candidates[0].description).not.toBe(state.previews[0].excerpt);
  await page
    .getByRole("button", {
      name: "Use this preview for explicit rule reapplication",
      exact: true,
    })
    .first()
    .click();
  await expect
    .poll(() => state.candidates[0].matching_preview?.id)
    .toBe("preview-0");
  await page
    .getByRole("button", { name: "Later", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /^Later \d/ }).click();
  await expect(
    page.getByRole("button", { name: "Restore to inbox", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore to inbox", exact: true })
    .click();
  await expect.poll(() => state.candidates[0].deferred).toBe(false);
  await page.getByRole("button", { name: /^Awaiting review \d/ }).click();
  await page.getByLabel(/Enable review shortcuts/).check();
  const search = page.getByRole("searchbox", { name: "Search inbox" });
  await search.fill("");
  await search.press("l");
  expect(state.candidates[0].deferred).toBe(false);
  await search.fill("");
  await expect(
    page.getByRole("button", { name: "Later", exact: true }).first(),
  ).toBeVisible();
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("l");
  await expect.poll(() => state.candidates[0].deferred).toBe(true);
  await page.goto("/project");
  await expect(page.getByLabel("Inbox preference")).toHaveValue("restricted");
  await page.getByRole("button", { name: "Add OR group", exact: true }).click();
  await page
    .getByLabel("Any of these terms (one per line)")
    .last()
    .fill("semiconductor");
  mkdirSync("artifacts.local/selective", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts.local/selective/rules-${width}.png`,
      fullPage: true,
    });
  }
});
