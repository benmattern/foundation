import { describe, it, expect } from "vitest";
import {
  classifyItem,
  literalMatches,
  inheritRules,
  type Rules,
} from "../supabase/functions/_shared/rules";
const c = (terms: string[], mode: "whole" | "substring" = "whole") => ({
  terms,
  mode,
  fields: ["title", "excerpt", "categories"] as (
    | "title"
    | "excerpt"
    | "categories"
  )[],
});
const rules: Rules = {
  version: 2,
  format: 2,
  mode: "restricted",
  groups: [
    [c(["Taiwan", "South China Sea"])],
    [c(["Japan", "Philippines"]), c(["shipping", "semiconductor"])],
  ],
  exclusions: [c(["advertisement"])],
  includeAny: [],
  excludeAny: [],
  defaultTags: [],
  keywordTags: [],
};
describe("versioned selective intake", () => {
  it("evaluates bounded OR-of-AND groups and exclusion precedence", () => {
    for (const title of [
      "Taiwan economy",
      "Japan shipping",
      "Philippines semiconductor",
    ])
      expect(
        classifyItem({ title }, rules, new Date().toISOString()).route,
      ).toBe("pending");
    for (const title of [
      "Japan elections",
      "shipping alone",
      "Taiwan advertisement",
    ])
      expect(
        classifyItem({ title }, rules, new Date().toISOString()).route,
      ).toBe("outside_scope");
    expect(
      classifyItem({}, rules, new Date().toISOString()).warnings.length,
    ).toBe(1);
  });
  it("defines Unicode, apostrophe, hyphen, punctuation and literal boundaries", () => {
    expect(literalMatches("Russia US shipping", "US", "whole")).toHaveLength(1);
    expect(
      literalMatches("TSMC's export-controls", "TSMC", "whole"),
    ).toHaveLength(1);
    expect(literalMatches("export-controls", "controls", "whole")).toHaveLength(
      1,
    );
    expect(literalMatches("中国台湾科技", "台湾", "whole")).toHaveLength(0);
    expect(literalMatches("中国台湾科技", "台湾", "substring")).toHaveLength(1);
    expect(
      literalMatches("ＣＨＩＰ\n controls", "chip controls", "whole"),
    ).toHaveLength(1);
    expect(literalMatches("aXb", "a.b", "substring")).toHaveLength(0);
  });
  it("rejects empty restricted groups and keeps legacy substring overrides literal", () => {
    expect(() =>
      classifyItem({}, { ...rules, groups: [[]] }, new Date().toISOString()),
    ).toThrow();
    const legacy = {
      version: 3,
      includeAny: ["US"],
      excludeAny: [],
      defaultTags: [],
      keywordTags: [],
    };
    expect(
      classifyItem({ title: "Russia" }, legacy, new Date().toISOString()).route,
    ).toBe("pending");
    expect(inheritRules(rules, legacy).format).toBeUndefined();
  });
  it("pins member snapshots and bounds distinct-term scoring without repeated-occurrence inflation", () => {
    const r = { ...rules, groups: [[c(["shipping"])]] };
    const one = classifyItem(
      { title: "shipping", description: "shipping shipping" },
      r,
      new Date().toISOString(),
    );
    const repeated = classifyItem(
      { title: "shipping shipping shipping", description: "shipping" },
      r,
      new Date().toISOString(),
    );
    expect(one.score).toBe(3);
    expect(repeated.score).toBe(3);
    expect(one.matches[0].passage).toContain("shipping");
  });
});
