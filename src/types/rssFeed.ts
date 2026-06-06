export type RssFeed = {
  id: string;
  feed_url: string;
  source_id: string | null;
  title: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RssFeedItem = {
  title: string | null;
  link: string;
  guid: string | null;
  description: string | null;
  publishedAt: string | null;
  raw: Record<string, unknown>;
  warnings: string[];
};

export type FetchRssFeedResponse = {
  feedTitle: string | null;
  feedUrl: string;
  finalUrl: string | null;
  items: RssFeedItem[];
  warnings: string[];
};

export type RssFetchSummary = {
  feedTitle: string;
  fetchedItemCount: number;
  createdCandidateCount: number;
  skippedDuplicateCount: number;
  warnings: string[];
  errors: string[];
};
