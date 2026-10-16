import { supabase } from "../lib/supabaseClient";
import { normalizeImportUrl } from "../lib/urlImport";
import { activeProjectId } from "./projectService";
import { queryAll } from "./queryAll";
import type { RssFeed, RssFetchSummary } from "../types/rssFeed";
export type UpsertRssFeedInput = {
  feed_url: string;
  source_id: string | null;
  title: string;
  is_active: boolean;
};
export function getRssFeeds(): Promise<RssFeed[]> {
  return queryAll<RssFeed>((from, to) =>
    supabase.from("rss_feeds").select("*").order("created_at", {
      ascending: false,
    }).order("id").range(from, to)
  );
}
export async function createRssFeed(
  feed: UpsertRssFeedInput,
): Promise<RssFeed> {
  const { data, error } = await supabase.from("rss_feeds").insert({
    ...feed,
    feed_url: normalizeImportUrl(feed.feed_url),
  }).select().single();
  if (error) throw error;
  return data;
}
export async function updateRssFeed(
  id: string,
  feed: UpsertRssFeedInput,
): Promise<RssFeed> {
  const { data, error } = await supabase.from("rss_feeds").update({
    ...feed,
    feed_url: normalizeImportUrl(feed.feed_url),
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function fetchRssFeed(feed: RssFeed): Promise<RssFetchSummary> {
  const { data, error } = await supabase.functions.invoke("collect-feeds", {
    body: { feed_id: feed.id, project_id: activeProjectId() },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  const outcome = data?.outcomes?.[0];
  if (!outcome) throw new Error("No eligible feed was found.");
  if (outcome.status === "paused_or_running") {
    throw new Error(
      "Feed is paused or already being collected. Check run history.",
    );
  }
  return {
    feedTitle: feed.title || feed.feed_url,
    fetchedItemCount: outcome.fetched ?? 0,
    createdCandidateCount: outcome.staged ?? 0,
    skippedDuplicateCount: 0,
    warnings: [
      ...(outcome.warnings ?? []),
      "Created count includes enabled projects following this feed; repeat identities are retained without another candidate.",
    ],
    errors: outcome.error ? [outcome.error] : [],
  };
}
export type CollectionRun = {
  id: string;
  feed_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  fetched: number;
  staged: number;
  error: string | null;
  warnings: string[];
};
export async function getCollectionRuns(): Promise<CollectionRun[]> {
  const { data, error } = await supabase.from("collection_runs").select("*")
    .order("started_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}
