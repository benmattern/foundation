import type { ArticleWithTags } from "../types/article";
import type {
  EventListItem,
  EventStatus,
  FoundationEventWithArticles,
} from "../types/event";
import {
  getEffectiveArticleDate,
  getEventDate,
  getLastActivityDate,
} from "./eventMetrics";

export type DashboardMetrics = {
  activeEventCount: number;
  totalEventCount: number;
  articleCount: number;
  sourceCount: number;
};

export type DashboardTagSummary = {
  id: string;
  name: string;
  count: number;
};

export function getDashboardMetrics(params: {
  sourceCount: number;
  articleCount: number;
  events: FoundationEventWithArticles[];
}): DashboardMetrics {
  return {
    activeEventCount: params.events.filter((event) => event.status === "active")
      .length,
    totalEventCount: params.events.length,
    articleCount: params.articleCount,
    sourceCount: params.sourceCount,
  };
}

export function toEventListItems(
  events: FoundationEventWithArticles[]
): EventListItem[] {
  return events.map((event) => ({
    ...event,
    supportingArticleCount: event.articles.length,
    lastActivityAt: getLastActivityDate(event, event.articles),
  }));
}

export function getMostActiveEvents(
  events: EventListItem[],
  limit = 5
): EventListItem[] {
  return [...events]
    .sort(
      (a, b) =>
        b.supportingArticleCount - a.supportingArticleCount ||
        compareDatesDescending(a.lastActivityAt, b.lastActivityAt) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, limit);
}

export function getRecentlyUpdatedEvents(
  events: EventListItem[],
  limit = 5
): EventListItem[] {
  return [...events]
    .sort(
      (a, b) =>
        compareDatesDescending(a.lastActivityAt, b.lastActivityAt) ||
        compareDatesDescending(getEventDate(a), getEventDate(b)) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, limit);
}

export function getRecentArticles(
  articles: ArticleWithTags[],
  limit = 5
): ArticleWithTags[] {
  return [...articles]
    .sort(
      (a, b) =>
        compareDatesDescending(
          getEffectiveArticleDate(a),
          getEffectiveArticleDate(b)
        ) || a.title.localeCompare(b.title)
    )
    .slice(0, limit);
}

export function getTopTags(
  articles: ArticleWithTags[],
  limit = 8
): DashboardTagSummary[] {
  const tagCounts = articles.reduce<Map<string, DashboardTagSummary>>(
    (map, article) => {
      article.tags.forEach((tag) => {
        const current = map.get(tag.id);

        map.set(tag.id, {
          id: tag.id,
          name: tag.name,
          count: (current?.count ?? 0) + 1,
        });
      });

      return map;
    },
    new Map()
  );

  return [...tagCounts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function getEventStatusCounts(
  events: FoundationEventWithArticles[]
): Record<EventStatus, number> {
  return events.reduce<Record<EventStatus, number>>(
    (counts, event) => {
      counts[event.status] += 1;
      return counts;
    },
    {
      draft: 0,
      active: 0,
      resolved: 0,
      archived: 0,
    }
  );
}

function compareDatesDescending(a: Date | null, b: Date | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return b.getTime() - a.getTime();
}
