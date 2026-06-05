import type { Article, ArticleWithTags } from "./article";

export type EventStatus = "draft" | "active" | "resolved" | "archived";

export const eventStatusOptions: EventStatus[] = [
  "draft",
  "active",
  "resolved",
  "archived",
];

export const eventTypeOptions = [
  "military",
  "diplomatic",
  "economic",
  "technology",
  "cyber",
  "policy",
  "election",
  "maritime",
  "supply_chain",
  "other",
];

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

export type FoundationEventWithArticleTags = FoundationEvent & {
  articles: ArticleWithTags[];
};
