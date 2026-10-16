export type Criterion = {
  terms: string[];
  fields: ("title" | "excerpt" | "categories")[];
  mode: "whole" | "substring";
  group?: { id: string; version: number; name: string; terms: string[] };
};
export type Rules = {
  format?: 2;
  mode?: "all" | "restricted";
  groups?: Criterion[][];
  exclusions?: Criterion[];
  version: number;
  includeAny: string[];
  excludeAny: string[];
  defaultTags: string[];
  keywordTags: { term: string; tag: string }[];
};
export type SearchableItem = {
  evidenceOrigin?: string;
  title?: string | null;
  description?: string | null;
  categories?: string[];
};
export type RuleMatch = {
  kind: "include" | "exclude" | "tag";
  term: string;
  field: "title" | "excerpt" | "categories";
  tag?: string;
  passage?: string;
};
export type RuleResult = {
  version: number;
  classifiedAt: string;
  route: "pending" | "outside_scope";
  matches: RuleMatch[];
  suggestedTags: string[];
  warnings: string[];
  evidenceOrigin?: string;
  score?: number;
  scoreVersion?: number;
  reason?: string;
};

/** NFKC, Unicode lowercase and collapsed whitespace; literal substring phrases, no stemming/regex. */
export const normalizeRuleText = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();

/** null/undefined inherits. An explicitly empty list overrides the parent's list. */
function inheritLegacy(
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

function classifyLegacy(
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
  const includes = rules.includeAny
    .map((term) => match("include", term))
    .some(Boolean);
  const excludes = rules.excludeAny
    .map((term) => match("exclude", term))
    .some(Boolean);
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

export function inheritRules(
  defaults: Rules,
  overrides: Partial<{ [K in keyof Rules]: Rules[K] | null }>,
): Rules {
  if (!Object.keys(overrides).length) return defaults;
  const legacy = inheritLegacy(defaults, overrides);
  if (overrides.format !== 2 && "includeAny" in overrides) return legacy;
  return {
    ...legacy,
    format: overrides.format ?? defaults.format,
    mode: overrides.mode ?? defaults.mode,
    groups: overrides.groups ?? defaults.groups,
    exclusions: overrides.exclusions ?? defaults.exclusions,
  };
}
export function validateCriterion(c: Criterion) {
  const terms = [...(c.terms ?? []), ...(c.group?.terms ?? [])];
  if (
    !terms.length ||
    terms.length > 100 ||
    terms.some(
      (t) => typeof t !== "string" || !normalizeRuleText(t) || t.length > 200,
    )
  )
    throw Error(
      "Each condition needs 1-100 nonblank terms of at most 200 characters.",
    );
  if (
    !c.fields?.length ||
    c.fields.length > 3 ||
    c.fields.some((f) => !["title", "excerpt", "categories"].includes(f)) ||
    !["whole", "substring"].includes(c.mode)
  )
    throw Error("Choose valid fields and an explicit match mode.");
  if (
    c.group &&
    (!c.group.id ||
      !Number.isSafeInteger(c.group.version) ||
      c.group.version < 1)
  )
    throw Error("Invalid pinned term group.");
}
export function validateRules(r: Rules) {
  if (!Number.isSafeInteger(r.version) || r.version < 1)
    throw Error("Rules require a positive version.");
  if (r.format !== undefined && r.format !== 2)
    throw Error("Unsupported rule format.");
  if (r.format === 2) {
    if (
      !["all", "restricted"].includes(r.mode ?? "") ||
      (r.groups?.length ?? 0) > 8 ||
      (r.exclusions?.length ?? 0) > 8
    )
      throw Error("Choose an intake mode and at most eight groups/exclusions.");
    if (r.mode === "restricted" && !r.groups?.length)
      throw Error("Restricted intake needs an inclusion group.");
    for (const group of r.groups ?? []) {
      if (!group.length || group.length > 8)
        throw Error("Each group needs 1-8 conditions.");
      group.forEach(validateCriterion);
    }
    (r.exclusions ?? []).forEach(validateCriterion);
  }
}
/** Whole terms use Unicode letters/marks/numbers/underscore as word characters.
 * Hyphens/apostrophes are boundaries; punctuation within a phrase stays literal.
 * CJK adjacent letters are not boundaries: choose substring explicitly. */
export function literalMatches(
  text: string,
  term: string,
  mode: "whole" | "substring",
) {
  return literalMatchesNormalized(
    normalizeRuleText(text),
    normalizeRuleText(term),
    mode,
  );
}
/** Same matcher for callers scanning a dictionary over pre-normalized fields. */
export function literalMatchesNormalized(
  hay: string,
  needle: string,
  mode: "whole" | "substring",
) {
  if (!needle) return [];
  const hits: { start: number; end: number; passage: string }[] = [];
  let from = 0;
  while (from <= hay.length && hits.length < 20) {
    const start = hay.indexOf(needle, from);
    if (start < 0) break;
    const end = start + needle.length;
    const before = Array.from(hay.slice(0, start)).at(-1) ?? "",
      after = Array.from(hay.slice(end))[0] ?? "";
    if (
      mode === "substring" ||
      (!/[\p{L}\p{M}\p{N}_]/u.test(before) &&
        !/[\p{L}\p{M}\p{N}_]/u.test(after))
    )
      hits.push({
        start,
        end,
        passage: hay.slice(
          Math.max(0, start - 60),
          Math.min(hay.length, end + 100),
        ),
      });
    from = end;
  }
  return hits;
}
export function relevanceScore(matches: RuleMatch[]) {
  const weighted = new Map<string, number>();
  for (const m of matches.filter((m) => m.kind === "include")) {
    const key = normalizeRuleText(m.term);
    weighted.set(
      key,
      Math.max(
        weighted.get(key) ?? 0,
        { title: 3, categories: 2, excerpt: 1 }[m.field],
      ),
    );
  }
  return Math.min(
    150,
    [...weighted.values()].reduce((sum, weight) => sum + weight, 0),
  );
}
export function classifyItem(
  item: SearchableItem,
  rules: Rules,
  classifiedAt: string,
): RuleResult {
  validateRules(rules);
  if (rules.format !== 2) {
    const result = classifyLegacy(item, rules, classifiedAt);
    return {
      ...result,
      evidenceOrigin: item.evidenceOrigin ?? "original acquisition",
      score: relevanceScore(result.matches),
      scoreVersion: 1,
      reason: "Legacy literal-substring rules",
    };
  }
  if (Number.isNaN(Date.parse(classifiedAt)))
    throw Error("Classification time is invalid.");
  const fields: [RuleMatch["field"], string][] = [
    ["title", item.title ?? ""],
    ["excerpt", item.description ?? ""],
    ...(item.categories ?? []).map(
      (c) => ["categories", c] as ["categories", string],
    ),
  ];
  const matches: RuleMatch[] = [];
  const match = (criterion: Criterion, kind: RuleMatch["kind"]) => {
    let found = false;
    for (const term of [...criterion.terms, ...(criterion.group?.terms ?? [])])
      for (const [field, text] of fields.filter(([f]) =>
        criterion.fields.includes(f),
      )) {
        const hit = literalMatches(text, term, criterion.mode)[0];
        if (hit) {
          matches.push({ kind, term, field, passage: hit.passage });
          found = true;
        }
      }
    return found;
  };
  const groups = (rules.groups ?? []).map((group) =>
    group.map((c) => match(c, "include")).every(Boolean),
  );
  const excluded = (rules.exclusions ?? [])
    .map((c) => match(c, "exclude"))
    .some(Boolean);
  const tagging = classifyLegacy(
    item,
    { ...rules, includeAny: [], excludeAny: [] },
    classifiedAt,
  );
  matches.push(...tagging.matches);
  const missing = fields.every(([, text]) => !normalizeRuleText(text));
  const included = rules.mode === "all" || groups.some(Boolean);
  return {
    evidenceOrigin: item.evidenceOrigin ?? "original acquisition",
    version: rules.version,
    classifiedAt,
    matches,
    suggestedTags: tagging.suggestedTags,
    route: missing
      ? "pending"
      : excluded || !included
        ? "outside_scope"
        : "pending",
    warnings: missing ? ["No searchable text; manual review required."] : [],
    score: relevanceScore(matches),
    scoreVersion: 1,
    reason: missing
      ? "Missing text; human review"
      : excluded
        ? "Exclusion matched"
        : included
          ? "Included by saved rules"
          : "No complete inclusion group matched",
  };
}
