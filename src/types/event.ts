import type { Article } from "./article";

export type EventStatus = "draft" | "active" | "resolved" | "archived";

export type FoundationEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  status: EventStatus;
  occurred_at: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleEvent = {
  article_id: string;
  event_id: string;
  created_at: string;
};

export type FoundationEventWithArticles = FoundationEvent & {
  articles: Article[];
};
