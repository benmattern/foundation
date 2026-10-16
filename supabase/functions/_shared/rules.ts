export type Rules = {
  version: number;
  includeAny: string[];
  excludeAny: string[];
  defaultTags: string[];
  keywordTags: { term: string; tag: string }[];
};
export type SearchableItem = {
  title?: string | null;
  description?: string | null;
  categories?: string[];
};
export type RuleMatch = {
  kind: "include" | "exclude" | "tag";
  term: string;
  field: "title" | "excerpt" | "categories";
  tag?: string;
};
export type RuleResult = {
  version: number;
  classifiedAt: string;
  route: "pending" | "outside_scope";
  matches: RuleMatch[];
  suggestedTags: string[];
  warnings: string[];
};

/** NFKC, Unicode lowercase and collapsed whitespace; literal substring phrases, no stemming/regex. */
export const normalizeRuleText = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();

/** null/undefined inherits. An explicitly empty list overrides the parent's list. */
export function inheritRules(
  defaults: Rules,
  overrides: Partial<{ [K in keyof Rules]: Rules[K] | null }>,
): Rules {
  return {
    version: overrides.version ?? defaults.version,
    includeAny: overrides.includeAny ?? defaults.includeAny,
    excludeAny: overrides.excludeAny ?? defaults.excludeAny,
    defaultTags: overrides.defaultTags ?? defaults.defaultTags,
    keywordTags: overrides.keywordTags ?? defaults.keywordTags,
  };
}

export function classifyItem(
  item: SearchableItem,
  rules: Rules,
  classifiedAt: string,
): RuleResult {
  if (!Number.isSafeInteger(rules.version) || rules.version < 1) {
    throw new Error("Rules require a positive version.");
  }
  if (Number.isNaN(Date.parse(classifiedAt))) {
    throw new Error("Classification time is invalid.");
  }
  const fields = [
    ["title", item.title ?? ""],
    ["excerpt", item.description ?? ""],
    // Each category is matched independently; phrases cannot span category boundaries.
    ...(item.categories ?? []).map((category) => ["categories", category]),
  ].map(([field, value]) => [field, normalizeRuleText(value)] as const);
  const matches: RuleMatch[] = [];
  function match(kind: RuleMatch["kind"], term: string, tag?: string) {
    const needle = normalizeRuleText(term);
    if (!needle) throw new Error("Rule terms must not be blank.");
    let found = false;
    for (const [field, value] of fields) {
      if (value.includes(needle)) {
        matches.push({
          kind,
          term,
          field: field as RuleMatch["field"],
          ...(tag ? { tag } : {}),
        });
        found = true;
      }
    }
    return found;
  }
  const includes = rules.includeAny.map((term) => match("include", term)).some(
    Boolean,
  );
  const excludes = rules.excludeAny.map((term) => match("exclude", term)).some(
    Boolean,
  );
  const tags = new Set(rules.defaultTags);
  for (const { term, tag } of rules.keywordTags) {
    if (match("tag", term, tag)) tags.add(tag);
  }
  const missingText = fields.every(([, value]) => !value);
  return {
    version: rules.version,
    classifiedAt,
    matches,
    suggestedTags: [...tags].sort(),
    route: missingText
      ? "pending"
      : excludes || (rules.includeAny.length > 0 && !includes)
      ? "outside_scope"
      : "pending",
    warnings: missingText
      ? ["No searchable text; manual review required."]
      : [],
  };
}

/** Analyst additions/removals are independent from replaceable rule suggestions. */
export function effectiveTags(
  result: RuleResult,
  added: string[],
  removed: string[],
): string[] {
  const suppressed = new Set(removed);
  return [
    ...new Set([
      ...result.suggestedTags.filter((tag) => !suppressed.has(tag)),
      ...added,
    ]),
  ].sort();
}
