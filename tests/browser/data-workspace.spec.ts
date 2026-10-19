import { test, expect } from "@playwright/test";
import { workflowFixture, login } from "./workflow-fixture";

const csv =
  "month,category,value\n2026-01-01,Chips,10\n2026-01-01,Other,5\n2026-02-01,Chips,20\n2026-02-01,Other,8";
test("real Wasm CSV, SQL, Perspective, persistence and unavailable source", async ({
  page,
}) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await workflowFixture(page);
  await login(page, "/data");
  await page.getByLabel("Dataset file", { exact: true }).setInputFiles({
    name: "trade.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page
    .getByLabel("Source attribution", { exact: true })
    .fill("Fictional trade fixture");
  await page.getByLabel("Persist dataset in this browser").check();
  await page
    .getByRole("button", { name: "Validate and import", exact: true })
    .click();
  await expect(
    page.getByText("Imported trade. Saved in this browser.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply view", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page
    .getByLabel("SQL query", { exact: true })
    .fill(
      "SELECT month, SUM(value) AS total FROM dataset WHERE category = 'Chips' GROUP BY 1 ORDER BY 1",
    );
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Calculated SQL results", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByText("Accessible record preview (first 20 rows)", { exact: true })
    .click();
  await expect(page.locator("tbody").last()).toContainText("10");
  await expect(page.locator("tbody").last()).toContainText("20");
  await page.getByLabel("Group by", { exact: true }).selectOption("month");
  await page.getByLabel("Sum field", { exact: true }).selectOption("total");
  await page
    .getByLabel("Visualization", { exact: true })
    .selectOption("Y Line");
  await expect(
    page.getByRole("button", { name: "Apply view", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("perspective-viewer")
        .evaluate(
          async (element) =>
            (
              await (
                element as HTMLElement & { save(): Promise<{ plugin: string }> }
              ).save()
            ).plugin,
        ),
    )
    .toBe("Y Line");
  await page.getByLabel("Analysis name", { exact: true }).fill("Monthly chips");
  await page
    .getByLabel("Include frozen result snapshot", { exact: false })
    .check();
  await page
    .getByRole("button", { name: "Save analysis in browser", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Monthly chips", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts.local/data-workspace/desktop-line.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.getByRole("link", { name: "Data Workspace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Monthly chips", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Monthly chips", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open analysis", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Calculated SQL results", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete dataset", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open analysis", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Frozen result snapshot", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Apply view", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page.screenshot({
    path: "artifacts.local/data-workspace/mobile-snapshot.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel('Dataset file', { exact: true }).setInputFiles({ name: 'trade.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByLabel('Source attribution', { exact: true }).fill('Reimported fictional trade');
  await page.getByRole('button', { name: 'Validate and import', exact: true }).click();
  await page.getByRole('button', { name: 'Open analysis', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calculated SQL results', exact: true })).toBeVisible({ timeout: 30000 });
});

test("project switching and anonymous gate preserve local isolation", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  const state = await workflowFixture(page);
  state.projects.push({
    ...state.projects[0],
    id: "second-project",
    name: "Separate project",
  });
  await login(page, "/data");
  await page
    .getByLabel("Dataset file", { exact: true })
    .setInputFiles({
      name: "private.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("category,value\nFiction,2"),
    });
  await page
    .getByLabel("Source attribution", { exact: true })
    .fill("Project A fixture");
  await page
    .getByRole("button", { name: "Validate and import", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "private", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Active project", { exact: true })
    .selectOption("second-project");
  await page.getByRole("link", { name: "Data Workspace", exact: true }).click();
  await expect(
    page.getByText("Import your first CSV or JSON", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "private", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Active project", { exact: true })
    .selectOption("existing-project");
  await page.getByRole("link", { name: "Data Workspace", exact: true }).click();
  await expect(
    page.getByLabel("Open dataset", { exact: true }).locator("option"),
  ).toContainText(["Choose a dataset", "private"]);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/data");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("storage unavailable, malformed/type/size failures, interruption and engine network denial", async ({
  page,
}) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await workflowFixture(page);
  await login(page, "/data");
  await expect(
    page.getByText("Browser saving is disabled", { exact: false }),
  ).toBeVisible();
  const input = page.getByLabel("Dataset file", { exact: true });
  await input.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("alert")).toContainText("Malformed JSON");
  await input.setInputFiles({
    name: "large.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText("10 MiB");
  await input.setInputFiles({
    name: "local.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("category,value\nFiction,2\nOther,3"),
  });
  await page
    .getByLabel("Source attribution", { exact: true })
    .fill("Fictional local fixture");
  await page
    .getByLabel("Type for category", { exact: true })
    .selectOption("number");
  await page
    .getByRole("button", { name: "Validate and import", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Record 1, column category",
  );
  await page
    .getByLabel("Type for category", { exact: true })
    .selectOption("text");
  await page
    .getByRole("button", { name: "Validate and import", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "local", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save dataset in browser", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("SQL query", { exact: true })
    .fill(
      "SELECT SUM(a.range * b.range) FROM range(1000000) a CROSS JOIN range(1000000) b",
    );
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await page
    .getByRole("button", { name: "Interrupt analysis", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("interrupted");
  let externalReads = 0;
  page.on("request", (request) => {
    if (request.url().includes("/never.csv")) externalReads++;
  });
  await page
    .getByLabel("SQL query", { exact: true })
    .fill(
      "SELECT * FROM \"read_csv\"('https://foundation-test.invalid/never.csv')",
    );
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    /disabled|permission|external/i,
    { timeout: 30000 },
  );
  expect(externalReads).toBe(0);
  await page
    .getByLabel("SQL query", { exact: true })
    .fill("SELECT * FROM dataset CROSS JOIN range(6000)");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(
    page.getByText("5,000 rows · truncated at 5,000 rows", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
});

test("JSON grouping, invalid SQL and session lifecycle", async ({ page }) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) =>
    console.log("DATA PAGE ERROR", error.message),
  );
  await workflowFixture(page);
  await login(page, "/data");
  await page.getByLabel("Dataset file", { exact: true }).setInputFiles({
    name: "organizations.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        {
          organization: "Fiction A",
          country: "A",
          category: "Chips",
          value: 7,
        },
        {
          organization: "Fiction B",
          country: "B",
          category: "Chips",
          value: 9,
        },
      ]),
    ),
  });
  await page
    .getByLabel("Source attribution", { exact: true })
    .fill("Fictional organizations");
  await page
    .getByRole("button", { name: "Validate and import", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Apply view", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page.getByLabel("Group by", { exact: true }).selectOption("country");
  await page.getByLabel("Visualization", { exact: true }).selectOption("Y Bar");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("perspective-viewer")
        .evaluate(
          async (element) =>
            (
              await (
                element as HTMLElement & { save(): Promise<{ plugin: string }> }
              ).save()
            ).plugin,
        ),
    )
    .toBe("Y Bar");
  await page.screenshot({
    path: "artifacts.local/data-workspace/desktop-bar.png",
    fullPage: true,
  });

  await page
    .getByLabel("SQL query", { exact: true })
    .fill("SELECT missing FROM dataset");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("missing", {
    timeout: 60000,
  });
  await page
    .getByLabel("SQL query", { exact: true })
    .fill("SELECT SUM(value) AS total FROM dataset");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Calculated SQL results", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await page.reload();
  await expect(
    page.getByText("Import your first CSV or JSON", { exact: false }),
  ).toBeVisible();
});
