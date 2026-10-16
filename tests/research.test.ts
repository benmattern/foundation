import { it, expect } from "vitest";
import {
  suggestMentions,
  coverage,
  relatedArticleIds,
} from "../src/lib/research";
import type { Entity, Mention } from "../src/types/research";
const entities: Entity[] = [
  {
    id: "one",
    name: "Acme",
    aliases: ["US"],
    entity_type: "organization",
    description: "Company",
    reference_url: "",
    version: 1,
  },
  {
    id: "two",
    name: "Acme",
    aliases: [],
    entity_type: "person",
    description: "Person",
    reference_url: "",
    version: 1,
  },
];
it("surfaces ambiguous and short known aliases without matching substrings or analyst notes", () => {
  const hits = suggestMentions(
    [
      {
        field: "acquisition_excerpt",
        text: "Acme in US, not Russia.",
        origin: "Original acquisition",
      },
    ],
    entities,
  );
  expect(hits).toHaveLength(3);
  expect(hits.filter((h) => h.alias === "Acme").every((h) => h.ambiguous)).toBe(
    true,
  );
  expect(hits.find((h) => h.alias === "US")?.short).toBe(true);
  expect(
    suggestMentions(
      [{ field: "record_title", text: "Acmeology", origin: "Record" }],
      entities,
    ),
  ).toHaveLength(0);
  expect(suggestMentions([], entities)).toEqual([]);
});
it("deduplicates confirmations by acquisition and excludes dismissed/suggested coverage", () => {
  const mentions = [
    { entity_id: "one", article_id: "a", state: "confirmed" },
    { entity_id: "one", article_id: "a", state: "confirmed" },
    { entity_id: "one", article_id: "b", state: "suggested" },
  ] as Mention[];
  const articles = [
    { id: "a", item_id: "same", source_id: null },
    { id: "b", item_id: "same", source_id: "collector" },
  ];
  const result = coverage("one", mentions, articles as never);
  expect(result.acquisitions).toBe(1);
  expect(result.sourceRecords).toBe(0);
  expect(result.unknownSources).toBe(1);
  expect(relatedArticleIds("a", mentions, [], []).size).toBe(0);
});
