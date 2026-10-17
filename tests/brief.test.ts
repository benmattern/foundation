import { it, expect } from "vitest";
import { composeBrief, briefHtml, packetVersions } from "../src/lib/brief";
import { resolveView } from "../src/lib/workingViews";
import type { QuestionPacket } from "../src/types/session";
const p = {
  as_of: "2026-10-16T12:00:00Z",
  project: { name: "台灣", description: "Scope" },
  question: {
    id: "q",
    version: 2,
    title: "Question",
    answer: "Line one\nLine two <script>alert(1)</script>",
    followups: "",
  },
  links: [
    {
      id: "l",
      version: 1,
      article_id: null,
      article: null,
      linked: true,
      disposition: "challenging",
      note: "Counterpoint",
      article_snapshot: {
        id: "a",
        title: "Deleted source",
        url: "https://example.com",
        published_at: null,
      },
    },
  ],
  findings: [
    {
      id: "f",
      version: 3,
      observed: "Claim",
      interpretation: "Maybe",
      uncertainties: "Unknown",
      citations: [
        {
          id: "a",
          title: "Deleted source",
          url: "https://example.com",
          passage: "Quoted 台灣",
          passage_origin: {
            origin: "Original acquisition excerpt",
            field: "acquisition_excerpt",
          },
        },
      ],
    },
  ],
} as QuestionPacket;
it("deduplicates references, preserves Unicode, unavailable snapshots, prose and version manifest", () => {
  const md = composeBrief(p);
  expect(md).toContain("台灣");
  expect(md).toContain("Line one\nLine two");
  expect(md.match(/1\. Deleted source/g)).toHaveLength(1);
  expect(md).toContain("UNAVAILABLE");
  expect(md).toContain("Original acquisition excerpt");
  expect(md).toContain('"version": 3');
  expect(packetVersions({ ...p, as_of: "later" })).toBe(packetVersions(p));
});
it("exports inert self-contained HTML even after malicious draft editing", () => {
  const html = briefHtml(
    '<script>steal()</script><img src="https://evil.invalid">\n台灣',
  );
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("<img");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("default-src 'none'");
  expect(html).not.toMatch(/access_token|refresh_token|apikey/);
});
it("keeps relative periods distinct and resolves against explicit UTC boundary", () => {
  expect(
    resolveView({ period: "7" }, new Date("2026-10-16T00:00:00Z")).get("since"),
  ).toBe("2026-10-09T00:00:00.000Z");
  expect(resolveView({ since: "2026-01-01" }).get("since")).toBe("2026-01-01");
});
