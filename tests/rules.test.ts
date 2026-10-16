import { describe, expect, it } from "vitest";
import {
  classifyItem,
  effectiveTags,
  inheritRules,
  type Rules,
} from "../supabase/functions/_shared/rules";
const rules: Rules = {
  version: 1,
  includeAny: ["supply chain"],
  excludeAny: ["advertisement"],
  defaultTags: ["research"],
  keywordTags: [{ term: "chip", tag: "technology" }],
};
const at = "2026-10-16T12:00:00Z";
describe("deterministic rules", () => {
  it("normalizes phrases, explains fields and keeps excludes dominant", () => {
    const result = classifyItem(
      { title: "SUPPLY\n  CHAIN chips", description: "advertisement" },
      rules,
      at,
    );
    expect(result.route).toBe("outside_scope");
    expect(result.matches).toContainEqual({
      kind: "include",
      term: "supply chain",
      field: "title",
    });
    expect(result.suggestedTags).toEqual(["research", "technology"]);
    expect(result.version).toBe(1);
  });
  it("supports Unicode literal matching and does not interpret regex", () => {
    const unicode = { ...rules, includeAny: ["台灣", "a.b"] };
    expect(classifyItem({ title: "台灣科技" }, unicode, at).route).toBe(
      "pending",
    );
    expect(classifyItem({ title: "aXb" }, unicode, at).route).toBe(
      "outside_scope",
    );
  });
  it("distinguishes inherited and empty overrides", () => {
    expect(inheritRules(rules, { includeAny: null }).includeAny).toEqual(
      rules.includeAny,
    );
    expect(
      classifyItem(
        { title: "Other" },
        inheritRules(rules, { includeAny: [] }),
        at,
      ).route,
    ).toBe("pending");
  });
  it("flags missing text for review, and matches categories independently", () => {
    expect(classifyItem({}, rules, at)).toMatchObject({
      route: "pending",
      warnings: [expect.any(String)],
    });
    expect(classifyItem({ categories: ["supply", "chain"] }, rules, at).route)
      .toBe("outside_scope");
    expect(classifyItem({ categories: ["Supply Chain"] }, rules, at).route)
      .toBe("pending");
  });
  it("preserves analyst additions/removals when suggestions change", () => {
    const result = classifyItem({ title: "chip supply chain" }, rules, at);
    expect(effectiveTags(result, ["manual"], ["technology"])).toEqual([
      "manual",
      "research",
    ]);
  });
});
