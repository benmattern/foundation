import { supabase } from "../lib/supabaseClient";
import type { Article } from "../types/article";
import type {
  ArticleEvent,
  EventStatus,
  FoundationEvent,
  FoundationEventWithArticles,
} from "../types/event";

export type CreateEventInput = {
  title: string;
  description: string;
  event_type: string;
  status: EventStatus;
  occurred_at: string;
  location: string;
  article_ids?: string[];
};

export type UpdateEventInput = CreateEventInput;

export async function getEvents(): Promise<FoundationEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getEventsWithArticles(): Promise<FoundationEventWithArticles[]> {
  const [events, articleEvents, articles] = await Promise.all([
    getEvents(),
    getArticleEvents(),
    getArticlesForEvents(),
  ]);

  return composeEventsWithArticles(events, articleEvents, articles);
}

export async function getEventWithArticlesById(
  id: string
): Promise<FoundationEventWithArticles> {
  const [event, articleEvents, articles] = await Promise.all([
    getEventById(id),
    getArticleEventsByEventId(id),
    getArticlesForEvents(),
  ]);

  return composeEventsWithArticles([event], articleEvents, articles)[0];
}

export async function createEvent(
  event: CreateEventInput
): Promise<FoundationEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: event.title,
      description: event.description || null,
      event_type: event.event_type || null,
      status: event.status,
      occurred_at: event.occurred_at
        ? new Date(event.occurred_at).toISOString()
        : null,
      location: event.location || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await replaceEventArticles(data.id, event.article_ids ?? []);

  return data;
}

export async function updateEvent(
  id: string,
  event: UpdateEventInput
): Promise<FoundationEvent> {
  const { data, error } = await supabase
    .from("events")
    .update({
      title: event.title,
      description: event.description || null,
      event_type: event.event_type || null,
      status: event.status,
      occurred_at: event.occurred_at
        ? new Date(event.occurred_at).toISOString()
        : null,
      location: event.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await replaceEventArticles(id, event.article_ids ?? []);

  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function getEventById(id: string): Promise<FoundationEvent> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function replaceEventArticles(
  eventId: string,
  articleIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("article_events")
    .delete()
    .eq("event_id", eventId);

  if (deleteError) {
    throw deleteError;
  }

  const uniqueArticleIds = [...new Set(articleIds)];

  if (uniqueArticleIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("article_events")
    .insert(
      uniqueArticleIds.map((articleId) => ({
        article_id: articleId,
        event_id: eventId,
      }))
    );

  if (insertError) {
    throw insertError;
  }
}

async function getArticleEvents(): Promise<ArticleEvent[]> {
  const { data, error } = await supabase
    .from("article_events")
    .select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getArticleEventsByEventId(
  eventId: string
): Promise<ArticleEvent[]> {
  const { data, error } = await supabase
    .from("article_events")
    .select("*")
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getArticlesForEvents(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function composeEventsWithArticles(
  events: FoundationEvent[],
  articleEvents: ArticleEvent[],
  articles: Article[]
): FoundationEventWithArticles[] {
  const articlesById = new Map(articles.map((article) => [article.id, article]));
  const articleIdsByEventId = articleEvents.reduce<Map<string, string[]>>(
    (map, articleEvent) => {
      const current = map.get(articleEvent.event_id) ?? [];
      current.push(articleEvent.article_id);
      map.set(articleEvent.event_id, current);

      return map;
    },
    new Map()
  );

  return events.map((event) => ({
    ...event,
    articles: (articleIdsByEventId.get(event.id) ?? [])
      .map((articleId) => articlesById.get(articleId))
      .filter((article): article is Article => Boolean(article)),
  }));
}
