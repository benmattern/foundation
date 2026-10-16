import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { workflowFixture, login } from "./workflow-fixture";
async function capture(page: Page, name: string) {
  mkdirSync("artifacts.local/research", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts.local/research/${name}-${width}.png`,
      fullPage: true,
    });
  }
}
test("Library to two questions, sourced finding, manual and dictionary connections", async ({
  page,
}) => {
  test.setTimeout(60000);
  const state = await workflowFixture(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  state.articles.push(
    ...["Acme expansion", "Second publication"].map((title, i) => ({
      id: `article-${i}`,
      project_id: "existing-project",
      source_id: i === 0 ? "legacy-source" : null,
      title,
      url: `https://example.com/${i}`,
      summary: "Legacy mixed summary retained.",
      published_at: "2026-10-16",
      created_at: "2026-10-16",
    })),
  );
  await login(page, "/articles");
  await page.getByLabel("Select for research", { exact: true }).first().check();
  await page.getByLabel("Select for research", { exact: true }).last().check();
  await page
    .getByRole("link", { name: "Create research question", exact: true })
    .click();
  await page
    .getByLabel("Question title", { exact: true })
    .fill("Is capacity growing?");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect.poll(() => state.links.length).toBe(2);
  await page
    .getByLabel("Evolving answer / question notes")
    .fill("Expansion is reported; capacity remains uncertain.");
  await page
    .getByLabel("Unresolved follow-ups")
    .fill("Find the original filing.");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect
    .poll(() => state.questions[0].answer)
    .toContain("capacity remains uncertain");
  await page
    .getByLabel("Why this article matters to this question")
    .first()
    .fill("Direct expansion evidence");
  await page
    .getByLabel("Evidence relationship")
    .first()
    .selectOption("supporting");
  await page
    .getByRole("button", { name: "Save evidence link", exact: true })
    .first()
    .click();
  await expect
    .poll(() => state.links[0].note)
    .toBe("Direct expansion evidence");
  await page
    .getByLabel("Observed claim / what the evidence says")
    .fill("Acme reports expansion");
  await page
    .getByLabel("Analyst interpretation", { exact: true })
    .fill("Could indicate additional capacity");
  await page.getByLabel("Open uncertainties").fill("No utilization data");
  await page
    .getByRole("group", { name: "Cite linked evidence (optional for a draft)" })
    .getByLabel("Acme expansion")
    .check();
  await page
    .getByLabel(/Supporting passage for Acme expansion/)
    .fill("Acme expanded in Taiwan.");
  await page.getByRole("button", { name: "Save finding", exact: true }).click();
  await expect.poll(() => state.findings.length).toBe(1);
  await expect(
    page.getByText("Finding saved. Reopen it above to edit.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Evolving answer / question notes")).toHaveValue(
    "Expansion is reported; capacity remains uncertain.",
  );
  await page
    .locator("summary")
    .filter({ hasText: /^Acme reports expansion$/ })
    .click();
  await expect(
    page.getByLabel("Observed claim / what the evidence says").first(),
  ).toHaveValue("Acme reports expansion");
  await page
    .getByRole("button", {
      name: "Unlink (keep note and citations)",
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.getByText("Evidence unavailable or unlinked; snapshot retained", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Observed claim / what the evidence says").first(),
  ).toHaveValue("Acme reports expansion");
  await page.getByText(/Acme expansion - Unlinked; note retained/).click();
  await page
    .getByRole("button", { name: "Link article to question", exact: true })
    .click();
  await expect.poll(() => state.links[0].linked).toBe(true);
  await capture(page, "question");
  await page
    .getByRole("button", { name: "Create research question", exact: true })
    .click();
  await expect(page.getByRole('heading',{name:'Create research question',exact:true})).toBeVisible();
  await page
    .getByLabel("Question title", { exact: true })
    .fill("Who is involved?");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect.poll(() => state.questions.length).toBe(2);
  await page
    .getByRole("group", { name: "Select Library articles to link" })
    .getByLabel("Acme expansion")
    .check();
  await page
    .getByRole("button", { name: "Link selected articles (1)", exact: true })
    .click();
  await expect.poll(() => state.links.length).toBe(3);
  await page
    .getByLabel("Why this article matters to this question")
    .fill("Identifies the company");
  await page
    .getByRole("button", { name: "Save evidence link", exact: true })
    .click();
  await expect.poll(() => state.links[2].note).toBe("Identifies the company");
  expect(state.links[0].note).toBe("Direct expansion evidence");
  await page.goto("/entities");
  await page.getByLabel("Preferred entity name").fill("Acme");
  await page
    .getByLabel("Approved aliases, one per line")
    .fill("ACME\nAcme Corp");
  await page
    .getByLabel("Entity description / disambiguation")
    .fill("Fictional manufacturer");
  await page.getByRole("button", { name: "Save entity", exact: true }).click();
  await expect.poll(() => state.entities.length).toBe(1);
  await page.goto("/articles/article-0");
  await page
    .getByLabel("Article note (analyst commentary)")
    .fill("Check utilization separately.");
  await page
    .getByRole("button", { name: "Save article note", exact: true })
    .click();
  await expect.poll(() => state.notes.length).toBe(1);
  await page
    .getByRole("button", { name: "Preview known-name rescan", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Save selected suggestions for review",
      exact: true,
    })
    .click();
  await expect.poll(() => state.mentions.length).toBe(2);
  expect(state.mentions.every((m) => m.state === "suggested")).toBe(true);
  await page
    .getByRole("button", { name: "Confirm mention", exact: true })
    .first()
    .click();
  await expect
    .poll(() => state.mentions.filter((m) => m.state === "confirmed").length)
    .toBe(1);
  await page
    .getByRole("button", { name: "Dismiss mention", exact: true })
    .last()
    .click();
  await expect
    .poll(() => state.mentions.filter((m) => m.state === "dismissed").length)
    .toBe(1);
  await page
    .getByRole("button", { name: "Preview known-name rescan", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Save selected suggestions for review",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "0 new suggestions saved" }),
  ).toBeVisible();
  expect(state.mentions.filter((m) => m.state === "dismissed")).toHaveLength(1);
  await capture(page, "article");
  await page.goto("/articles/article-1");
  await page
    .getByRole("combobox", { name: "Existing identity", exact: true })
    .selectOption("entity-0");
  await page
    .getByLabel("Manual association passage / note (optional)")
    .fill("Manual association based on original publication.");
  await page
    .getByRole("button", { name: "Link selected entity manually", exact: true })
    .click();
  await expect.poll(() => state.mentions.length).toBe(3);
  await expect(
    page.getByRole("link", { name: "Acme expansion", exact: true }).last(),
  ).toBeVisible();
  await page.goto("/entities?entity=entity-0");
  await expect(page.getByText(/2 deduplicated acquisitions/)).toBeVisible();
  await capture(page, "entity");
  await page.getByLabel("Active project").selectOption("existing-project");
  expect(errors).toEqual([]);
});
test("failed question saves preserve keyboard drafts and project switch hides connections", async ({
  page,
}) => {
  const state = await workflowFixture(page);
  await login(page, "/research");
  await page
    .getByLabel("Question title", { exact: true })
    .fill("Preserved keyboard draft");
  state.failResearchSave = true;
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("draft is preserved");
  await expect(page.getByLabel("Question title", { exact: true })).toHaveValue(
    "Preserved keyboard draft",
  );
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect.poll(() => state.questions.length).toBe(1);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Isolated project");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.getByRole('heading',{name:'Isolated project',exact:true})).toBeVisible();
  await page.goto("/research");
  await expect(
    page.getByText("Start with a question, then link kept Library articles."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Preserved keyboard draft", exact: true }),
  ).toHaveCount(0);
});
