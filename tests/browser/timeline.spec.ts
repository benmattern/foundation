import { test, expect } from "@playwright/test";
import { timelineFixture } from "./timeline-fixture";
import { login } from "./workflow-fixture";

test("fictional chronology, explicit evidence, return navigation, filters and guarded edits", async ({
  page,
}) => {
  const { state, research } = await timelineFixture(page);
  await login(page, "/events");
  await expect(
    page.getByText("No project events yet", { exact: true }),
  ).toBeVisible();
  const create = async (
    title: string,
    start: string,
    end = "",
    approximate = false,
  ) => {
    await page
      .getByRole("button", { name: "Create event", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Event title", { exact: true }).fill(title);
    await dialog.getByLabel("Occurrence start", { exact: true }).fill(start);
    await dialog
      .getByLabel("Occurrence end (optional range)", { exact: true })
      .fill(end);
    if (approximate)
      await dialog
        .getByLabel("Approximate / uncertain occurrence date")
        .check();
    await dialog
      .getByLabel("Event type", { exact: true })
      .fill("Fictional research");
    await dialog
      .getByLabel("Event description (analyst-entered account)", {
        exact: true,
      })
      .fill("Fictional test account. ".repeat(90));
    await dialog
      .getByRole("button", { name: "Create event", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  };
  await create("Fictional first development", "2023");
  await page
    .getByRole("link", { name: "Back to timeline", exact: true })
    .click();
  await create("Fictional range", "2024-03", "2024-05", true);
  await expect(
    page.getByText("Approximately 2024-03 to 2024-05", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to timeline", exact: true })
    .click();
  await create("Fictional launch", "2024-04-10");
  await page.getByRole("button", { name: "Edit event", exact: true }).click();
  for (const [kind, label] of [
    ["article", "Fictional launch report"],
    ["entity", "Fictional Observatory"],
    ["question", "What changed in the fictional program?"],
  ]) {
    await page.getByLabel("Record kind", { exact: true }).selectOption(kind);
    await page.getByRole("button", { name: label, exact: false }).click();
  }
  await page
    .getByLabel("Evidence role for Fictional launch report")
    .selectOption("supports");
  state.failSave = true;
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Your draft is preserved",
  );
  state.failSave = false;
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(
    page.getByText("Publisher: Legacy manual publisher", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/timeline-detail-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByText(/FOUNDATION collected: 2024-04-10/),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open article record", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fictional launch report", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Return to event", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to timeline", exact: true })
    .click();
  await expect(
    page.locator('section[aria-label="Chronological events"] h4'),
  ).toHaveText([
    "Fictional first development",
    "Fictional range",
    "Fictional launch",
  ]);
  await expect(
    page.getByRole("heading", { name: "March 2024", exact: true }),
  ).toBeVisible();
  for (const [kind, label] of [
    ["entity", "Fictional Observatory"],
    ["question", "What changed in the fictional program?"],
    ["source", "Legacy manual publisher"],
  ]) {
    await page
      .getByRole("button", { name: `Filter by ${kind}`, exact: true })
      .click();
    await page.getByRole("button", { name: label, exact: false }).click();
    await expect(
      page.locator('section[aria-label="Chronological events"] h4'),
    ).toHaveText(["Fictional launch"]);
  }
  await page
    .getByRole("link", { name: "Fictional launch", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit event", exact: true }).click();
  await page
    .getByLabel("Event title", { exact: true })
    .fill("Fictional revised launch");
  state.stale = true;
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Event changed");
  await expect(page.getByLabel("Event title", { exact: true })).toHaveValue(
    "Fictional revised launch",
  );
  state.stale = false;
  await page.getByRole("button", { name: "Save event", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Fictional revised launch",
      exact: true,
    }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  expect(state.events).toHaveLength(3);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(
    page.getByText("No events match these filters", { exact: true }),
  ).toBeVisible();
  expect(research.articles).toHaveLength(1);
  await page
    .getByRole("button", { name: "Clear all filters", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/timeline-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/timeline-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  state.failPage = true;
  await page
    .getByRole("button", { name: "Refresh timeline", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Fictional timeline network failure",
  );
  state.failPage = false;
  await page
    .getByRole("button", { name: "Retry timeline", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Fictional range", exact: true }),
  ).toBeVisible();
});

test("bounded pages, date filters, unknown dates and reversed chronology", async ({
  page,
}) => {
  const { state } = await timelineFixture(page);
  await login(page, "/events");
  await page.getByRole("button", { name: "Create event", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Event title", { exact: true })
    .fill("Fictional unknown date");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create event", exact: true })
    .click();
  await expect(page.getByText("Date unknown", { exact: true })).toBeVisible();
  const undated = state.events[0];
  state.events = [
    ...Array.from({ length: 53 }, (_, i) => ({
      ...undated,
      id: `fictional-${String(i).padStart(3, "0")}`,
      title: `Fictional page ${i}`,
      date_start: "2024-04-10",
      timeline_start: "2024-04-10",
      timeline_end: "2024-04-10",
    })),
    undated,
  ];
  await page
    .getByRole("link", { name: "Back to timeline", exact: true })
    .click();
  await expect(
    page.locator('section[aria-label="Chronological events"] h4'),
  ).toHaveCount(50);
  await page.getByRole("button", { name: "Next events", exact: true }).click();
  await expect(
    page.locator('section[aria-label="Chronological events"] h4'),
  ).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "Undated", exact: true }),
  ).toBeVisible();
  expect(state.reads).toContain(50);
  await page
    .getByLabel("Chronological order", { exact: true })
    .selectOption("desc");
  await page.getByLabel("Occurrence from", { exact: true }).fill("2024-04-11");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByText("No events match these filters", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Occurrence from", { exact: true }).fill("2024-04-10");
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.locator('section[aria-label="Chronological events"] h4'),
  ).toHaveCount(50);
  await expect(
    page.getByRole("status").filter({ hasText: "53 matching events" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Fictional page 0", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to timeline", exact: true })
    .click();
  await expect(
    page.getByLabel("Chronological order", { exact: true }),
  ).toHaveValue("desc");
  await expect(page.getByLabel("Occurrence from", { exact: true })).toHaveValue(
    "2024-04-10",
  );
});
