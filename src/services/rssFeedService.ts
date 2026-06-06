import { supabase } from "../lib/supabaseClient";
import { normalizeImportUrl } from "../lib/urlImport";
import { getArticles } from "./articleService";
import {
  createIngestionCandidate,
  getIngestionCandidates,
} from "./ingestionCandidateService";
import type { Article } from "../types/article";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import type {
  FetchRssFeedResponse,
  RssFeed,
  RssFetchSummary,
} from "../types/rssFeed";

export type UpsertRssFeedInput = {
  feed_url: string;
  source_id: string | null;
  title: string;
  is_active: boolean;
};

type FetchRssFeedFunctionResponse =
  | FetchRssFeedResponse
  | {
      error: string;
    };

export async function getRssFeeds(): Promise<RssFeed[]> {
  const { data, error } = await supabase
    .from("rss_feeds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RssFeed[];
}

export async function createRssFeed(feed: UpsertRssFeedInput): Promise<RssFeed> {
  const { data, error } = await supabase
    .from("rss_feeds")
    .insert({
      feed_url: normalizeImportUrl(feed.feed_url),
      source_id: feed.source_id || null,
      title: feed.title || null,
      is_active: feed.is_active,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as RssFeed;
}

export async function updateRssFeed(
  id: string,
  feed: UpsertRssFeedInput
): Promise<RssFeed> {
  const { data, error } = await supabase
    .from("rss_feeds")
    .update({
      feed_url: normalizeImportUrl(feed.feed_url),
      source_id: feed.source_id || null,
      title: feed.title || null,
      is_active: feed.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as RssFeed;
}

export async function fetchRssFeed(feed: RssFeed): Promise<RssFetchSummary> {
  const { data, error } =
    await supabase.functions.invoke<FetchRssFeedFunctionResponse>(
      "fetch-rss-feed",
      {
        body: { url: feed.feed_url },
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("RSS fetch returned no data.");
  }

  if ("error" in data) {
    throw new Error(data.error);
  }

  const [articles, candidates] = await Promise.all([
    getArticles(),
    getIngestionCandidates(),
  ]);
  const knownUrls = createKnownUrlSet(articles, candidates);
  const warnings = [...data.warnings];
  const errors: string[] = [];
  let createdCandidateCount = 0;
  let skippedDuplicateCount = 0;

  for (const item of data.items) {
    try {
      const normalizedItemUrl = normalizeImportUrl(item.link);

      if (knownUrls.has(normalizedItemUrl)) {
        skippedDuplicateCount += 1;
        continue;
      }

      await createIngestionCandidate({
        url: normalizedItemUrl,
        source_id: feed.source_id,
        title: item.title,
        description: item.description,
        published_at: item.publishedAt,
        import_source: "rss",
        raw_metadata: {
          feed_id: feed.id,
          feed_url: feed.feed_url,
          feed_title: data.feedTitle,
          final_feed_url: data.finalUrl,
          item,
        },
        warnings: item.warnings,
      });

      knownUrls.add(normalizedItemUrl);
      createdCandidateCount += 1;
    } catch (candidateError) {
      errors.push(
        candidateError instanceof Error
          ? candidateError.message
          : "Unable to create RSS candidate."
      );
    }
  }

  await markRssFeedChecked(feed.id);

  return {
    feedTitle: data.feedTitle ?? feed.title ?? feed.feed_url,
    fetchedItemCount: data.items.length,
    createdCandidateCount,
    skippedDuplicateCount,
    warnings,
    errors,
  };
}

async function markRssFeedChecked(id: string): Promise<void> {
  const { error } = await supabase
    .from("rss_feeds")
    .update({
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

function createKnownUrlSet(
  articles: Article[],
  candidates: IngestionCandidate[]
): Set<string> {
  const urls = new Set<string>();

  articles.forEach((article) => addKnownUrl(urls, article.url));
  candidates.forEach((candidate) => {
    addKnownUrl(urls, candidate.url);
    addKnownUrl(urls, candidate.canonical_url);
    addKnownUrl(urls, candidate.final_url);
  });

  return urls;
}

function addKnownUrl(urls: Set<string>, value: string | null): void {
  if (!value) return;

  try {
    urls.add(normalizeImportUrl(value));
  } catch {
    urls.add(value.trim());
  }
}
