import {
  literalMatchesNormalized,
  normalizeRuleText,
} from "../../supabase/functions/_shared/rules";
import type {
  Entity,
  Mention,
  ResearchEvidence,
  MentionDraft,
  QuestionArticle,
} from "../types/research";
import type { Article } from "../types/article";

// Bounded dictionary scanning; suggestions are never automatic identity decisions.
export function suggestMentions(
  fields: ResearchEvidence[],
  entities: Entity[],
): MentionDraft[] {
  const scoped = entities.slice(0, 500);
  const records: { entity: Entity; alias: string; key: string }[] = [];
  const recordKeys = new Set<string>();
  function add(entity: Entity, alias: string) {
    const key = normalizeRuleText(alias),
      id = JSON.stringify([entity.id, key]);
    if (key && !recordKeys.has(id) && records.length < 1000) {
      records.push({ entity, alias, key });
      recordKeys.add(id);
    }
  }
  for (const entity of scoped) add(entity, entity.name);
  for (const entity of scoped) {
    for (const alias of entity.aliases.slice(0, 100)) add(entity, alias);
    if (records.length === 1000) break;
  }
  const prepared = fields
    .slice(0, 22)
    .map((field) => ({
      ...field,
      text: field.text.slice(0, 20000),
      normalized: normalizeRuleText(field.text.slice(0, 20000)),
    }));
  const dictionary = new Map<string, Set<string>>();
  for (const { entity, key } of records) {
    const ids = dictionary.get(key) ?? new Set<string>();
    ids.add(entity.id);
    dictionary.set(key, ids);
  }
  const result: MentionDraft[] = [];
  const seen = new Set<string>();
  for (const { entity, alias, key } of records) {
    for (const field of prepared) {
      const hit = literalMatchesNormalized(field.normalized, key, "whole")[0];
      if (!hit) continue;
      const unique = JSON.stringify([entity.id, key, field.field]);
      if (seen.has(unique)) continue;
      seen.add(unique);
      result.push({
        entity_id: entity.id,
        alias,
        field: field.field,
        snapshot: field.text,
        span: { start: hit.start, end: hit.end },
        ambiguous: (dictionary.get(key)?.size ?? 0) > 1,
        short: [...key].length <= 3,
      });
      if (result.length === 200) return result;
    }
  }
  return result;
}
export function relatedArticleIds(
  article: string,
  mentions: Mention[],
  links: QuestionArticle[],
  eventLinks: { article_id: string; event_id: string }[],
) {
  const entities = new Set(
    mentions
      .filter((m) => m.article_id === article && m.state === "confirmed")
      .map((m) => m.entity_id),
  );
  const questions = new Set(
    links
      .filter((l) => l.article_id === article && l.linked)
      .map((l) => l.question_id),
  );
  const events = new Set(
    eventLinks.filter((l) => l.article_id === article).map((l) => l.event_id),
  );
  return new Set(
    [
      ...mentions
        .filter(
          (m) =>
            m.article_id &&
            m.state === "confirmed" &&
            entities.has(m.entity_id),
        )
        .map((m) => m.article_id!),
      ...links
        .filter((l) => l.article_id && l.linked && questions.has(l.question_id))
        .map((l) => l.article_id!),
      ...eventLinks
        .filter((l) => events.has(l.event_id))
        .map((l) => l.article_id),
    ].filter((id) => id !== article),
  );
}
export function coverage(
  entity: string,
  mentions: Mention[],
  articles: Article[],
) {
  const ids = new Set(
    mentions
      .filter(
        (m) =>
          m.entity_id === entity && m.state === "confirmed" && m.article_id,
      )
      .map((m) => m.article_id),
  );
  const rows = articles.filter((a) => ids.has(a.id));
  const acquisitions = new Set(
    rows.map((a) => a.item_id ?? (a.url ? `url:${a.url}` : a.id)),
  );
  // Source identity is a collector/source record, not established publisher identity.
  return {
    articles: rows,
    acquisitions: acquisitions.size,
    sourceRecords: new Set(rows.map((a) => a.source_id).filter(Boolean)).size,
    unknownSources: rows.filter((a) => !a.source_id).length,
  };
}
