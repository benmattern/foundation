import type { Article } from "../types/article";
import type { FoundationEvent } from "../types/event";

export function getValidDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getEffectiveArticleDate(article: Article): Date | null {
  return getValidDate(article.published_at ?? article.created_at);
}

export function getEventDate(event: FoundationEvent): Date | null {
  return getValidDate(event.occurred_at ?? event.created_at);
}

export function getNewestArticle<T extends Article>(articles: T[]): T | null {
  return getDatedArticles(articles).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )[0]?.article ?? null;
}

export function getOldestArticle<T extends Article>(articles: T[]): T | null {
  return getDatedArticles(articles).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )[0]?.article ?? null;
}

export function getTimelineArticles<T extends Article>(articles: T[]): T[] {
  return [...articles].sort((a, b) => {
    const aDate = getEffectiveArticleDate(a);
    const bDate = getEffectiveArticleDate(b);

    if (!aDate && !bDate) return a.title.localeCompare(b.title);
    if (!aDate) return 1;
    if (!bDate) return -1;

    return aDate.getTime() - bDate.getTime();
  });
}

export function getLastActivityDate(
  event: FoundationEvent,
  articles: Article[]
): Date | null {
  const eventUpdatedAt = getValidDate(event.updated_at);
  const newestArticle = getNewestArticle(articles);
  const newestArticleDate = newestArticle
    ? getEffectiveArticleDate(newestArticle)
    : null;

  if (!eventUpdatedAt && !newestArticleDate) return null;
  if (!eventUpdatedAt) return newestArticleDate;
  if (!newestArticleDate) return eventUpdatedAt;

  return eventUpdatedAt.getTime() >= newestArticleDate.getTime()
    ? eventUpdatedAt
    : newestArticleDate;
}

export function formatDate(date: Date | null): string {
  if (!date) return "Unknown date";

  return date.toLocaleDateString();
}

export function formatArticleDate(article: Article | null): string {
  if (!article) return "No supporting article";

  return formatDate(getEffectiveArticleDate(article));
}

export function getRelativeDateLabel(dateValue: string | null): string {
  const date = getValidDate(dateValue);

  if (!date) return "Unknown";

  const today = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const dayDifference = Math.round(
    (today.getTime() - date.getTime()) / millisecondsPerDay
  );

  if (dayDifference === 0) return "Today";
  if (dayDifference > 0) {
    return `${dayDifference} day${dayDifference === 1 ? "" : "s"} ago`;
  }

  const futureDays = Math.abs(dayDifference);
  return `In ${futureDays} day${futureDays === 1 ? "" : "s"}`;
}

function getDatedArticles<T extends Article>(articles: T[]) {
  return articles
    .map((article) => ({
      article,
      date: getEffectiveArticleDate(article),
    }))
    .filter(
      (item): item is { article: T; date: Date } => item.date !== null
    );
}
