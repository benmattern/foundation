import { activeProjectId } from "./projectService";
import { queryAll } from "./queryAll";
import { supabase } from "../lib/supabaseClient";
import { getArticles, getArticlesWithTags } from "./articleService";
import type { Article, ArticleWithTags } from "../types/article";
import type {
  ArticleEvent,
  FoundationEvent,
  FoundationEventWithArticles,
  FoundationEventWithArticleTags,
} from "../types/event";

export function getEvents(): Promise<FoundationEvent[]> {
  const project = activeProjectId();
  return queryAll<FoundationEvent>((from, to) =>
    supabase
      .from("events")
      .select("*")
      .eq("project_id", project)
      .order("occurred_at", { ascending: false, nullsFirst: false })
      .order("id")
      .range(from, to),
  );
}
export async function getEventsWithArticles(): Promise<
  FoundationEventWithArticles[]
> {
  const [events, articleEvents, articles] = await Promise.all([
    getEvents(),
    getArticleEvents(),
    getArticlesForEvents(),
  ]);

  return composeEventsWithArticles(events, articleEvents, articles);
}

export async function getEventWithArticlesById(
  id: string,
): Promise<FoundationEventWithArticles> {
  const [event, articleEvents, articles] = await Promise.all([
    getEventById(id),
    getArticleEventsByEventId(id),
    getArticlesForEvents(),
  ]);

  return composeEventsWithArticles([event], articleEvents, articles)[0];
}

export async function getEventWithArticleTagsById(
  id: string,
): Promise<FoundationEventWithArticleTags> {
  const [event, articleEvents, articles] = await Promise.all([
    getEventById(id),
    getArticleEventsByEventId(id),
    getArticlesWithTags(),
  ]);

  return composeEventsWithArticleTags([event], articleEvents, articles)[0];
}

async function getEventById(id: string): Promise<FoundationEvent> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("project_id", activeProjectId())
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getArticleEvents(): Promise<ArticleEvent[]> {
  const project = activeProjectId();
  return queryAll<ArticleEvent>((from, to) =>
    supabase
      .from("article_events")
      .select("*")
      .eq("project_id", project)
      .order("article_id")
      .order("event_id")
      .range(from, to),
  );
}
async function getArticleEventsByEventId(
  eventId: string,
): Promise<ArticleEvent[]> {
  return (await getArticleEvents()).filter((link) => link.event_id === eventId);
}
async function getArticlesForEvents(): Promise<Article[]> {
  return getArticles();
}
function composeEventsWithArticles(
  events: FoundationEvent[],
  articleEvents: ArticleEvent[],
  articles: Article[],
): FoundationEventWithArticles[] {
  const articlesById = new Map(
    articles.map((article) => [article.id, article]),
  );
  const articleIdsByEventId = articleEvents.reduce<Map<string, string[]>>(
    (map, articleEvent) => {
      const current = map.get(articleEvent.event_id) ?? [];
      current.push(articleEvent.article_id);
      map.set(articleEvent.event_id, current);

      return map;
    },
    new Map(),
  );

  return events.map((event) => ({
    ...event,
    articles: (articleIdsByEventId.get(event.id) ?? [])
      .map((articleId) => articlesById.get(articleId))
      .filter((article): article is Article => Boolean(article)),
  }));
}

function composeEventsWithArticleTags(
  events: FoundationEvent[],
  articleEvents: ArticleEvent[],
  articles: ArticleWithTags[],
): FoundationEventWithArticleTags[] {
  const articlesById = new Map(
    articles.map((article) => [article.id, article]),
  );
  const articleIdsByEventId = articleEvents.reduce<Map<string, string[]>>(
    (map, articleEvent) => {
      const current = map.get(articleEvent.event_id) ?? [];
      current.push(articleEvent.article_id);
      map.set(articleEvent.event_id, current);

      return map;
    },
    new Map(),
  );

  return events.map((event) => ({
    ...event,
    articles: (articleIdsByEventId.get(event.id) ?? [])
      .map((articleId) => articlesById.get(articleId))
      .filter((article): article is ArticleWithTags => Boolean(article)),
  }));
}
