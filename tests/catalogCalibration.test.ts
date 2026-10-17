import { it, expect } from "vitest";
import {
  sourceCatalog,
  sourcePacks,
  verificationStale,
} from "../src/lib/sourceCatalog";
import { previewCalibration } from "../src/lib/calibration";
import type { CalibrationItem } from "../src/services/coverageService";
import type { Rules } from "../supabase/functions/_shared/rules";
import { parseFeedXml } from "../supabase/functions/_shared/feed";
it("keeps stable unique catalog identifiers, evidenced endpoints and overlapping optional packs", () => {
  expect(sourceCatalog).toHaveLength(10);
  expect(new Set(sourceCatalog.map((s) => s.id)).size).toBe(10);
  for (const s of sourceCatalog) {
    expect(new URL(s.listedAt).protocol).toBe("https:");
    expect(s.check.length).toBeGreaterThan(20);
    expect(s.packs.every((p) => sourcePacks.includes(p))).toBe(true);
    if (s.connector === "Manual") expect(s.feedUrl).toBe("");
    else {
      expect(new URL(s.feedUrl).protocol).toBe("https:");
      expect(s.check).toContain("200");
    }
  }
  expect(verificationStale("2026-01-01", Date.parse("2026-10-16"))).toBe(true);
  expect(verificationStale("2026-10-17", Date.parse("2026-10-17"))).toBe(false);
});
it("uses deterministic synthetic catalog feed shapes; missing ECB excerpt stays missing", () => {
  for (const s of sourceCatalog.filter((s) => s.feedUrl)) {
    const body =
      s.connector === "Atom"
        ? '<feed xmlns="http://www.w3.org/2005/Atom"><title>Fictional</title><entry><id>x</id><title>Release</title><link href="https://example.com/item"/><updated>2026-10-16</updated><summary>Fictional excerpt</summary></entry></feed>'
        : `<rss version="2.0"><channel><title>Fictional</title><item><title>Release 台灣</title><link>https://example.com/item</link><pubDate>2026-10-16</pubDate>${s.fields.includes("excerpt") ? "<description>Fictional excerpt</description>" : ""}</item></channel></rss>`;
    const parsed = parseFeedXml(body, new URL(s.feedUrl), []);
    expect(parsed.items).toHaveLength(1);
    expect(!!parsed.items[0].description).toBe(s.fields.includes("excerpt"));
  }
});
it("warns about losing useful examples, respects overrides, and withholds held-out rows without mutations", () => {
  const rules: Rules = {
    version: 1,
    includeAny: [],
    excludeAny: [],
    defaultTags: [],
    keywordTags: [],
  };
  const c = {
    id: "c",
    title: "Taiwan chips",
    original_acquisition: { title: "Taiwan chips", description: "original" },
    raw_metadata: {},
    feedback: { useful: true, held_out: false, version: 1 },
    current_project_rules: rules,
    current_subscription_rules: null,
  } as unknown as CalibrationItem;
  const initial = JSON.stringify(c),
    draft = { ...rules, version: 2, includeAny: ["unrelated"] };
  expect(previewCalibration([c], draft, "2026-10-16")[0].lost).toBe(true);
  expect(JSON.stringify(c)).toBe(initial);
  expect(
    previewCalibration(
      [{ ...c, current_subscription_rules: { includeAny: [] } }],
      draft,
      "2026-10-16",
    )[0].lost,
  ).toBe(false);
  expect(
    previewCalibration(
      [{ ...c, feedback: { ...c.feedback!, held_out: true } }],
      draft,
      "2026-10-16",
    )[0],
  ).toMatchObject({ held_out: true, route: null, lost: false });
});
