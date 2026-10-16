import type { RssFeed } from "../types/rssFeed";
import type { Subscription } from "../types/project";
import type { CollectionRun } from "../services/rssFeedService";
export function projectFeeds(feeds: RssFeed[], subscriptions: Subscription[]) {
  return feeds.filter(
    (feed) =>
      feed.is_active &&
      subscriptions.some((s) => s.feed_id === feed.id && s.enabled),
  );
}
export function feedHealth(feed: RssFeed, runs: CollectionRun[]) {
  const latest = runs
    .filter((run) => run.feed_id === feed.id)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  if (!feed.is_active)
    return {
      label: "Unavailable across projects",
      kind: "paused",
      detail: "Enable workspace availability in collection details.",
    };
  if (latest?.status === "running")
    return {
      label: "Collecting",
      kind: "running",
      detail: "Collection is in progress. Refresh health shortly.",
    };
  if (
    latest?.status === "error" ||
    latest?.status === "partial" ||
    (!latest && (feed.failure_count ?? 0) > 0)
  )
    return {
      label:
        latest?.status === "partial" ? "Check incomplete" : "Needs attention",
      kind: "error",
      detail: collectionError(
        latest?.error ?? "Some items could not be collected.",
      ),
    };
  if (!feed.last_checked_at)
    return {
      label: "Not checked yet",
      kind: "new",
      detail: "Use Check now or wait for automatic collection.",
    };
  return {
    label: "Checked",
    kind: "ready",
    detail:
      "Only newly discovered items are added. Collection never adds to Library without your review.",
  };
}
export function collectionError(error: string) {
  if (/403|401|forbidden/i.test(error))
    return "The publisher refused access. Open the source or edit the feed; a paid integration may be required.";
  if (/timeout|abort/i.test(error))
    return "The publisher took too long to respond. Retry the check or pause collection.";
  if (/resolve|dns|hostname/i.test(error))
    return "The feed address could not be reached. Check its address in collection details.";
  if (/xml|parse|rss|atom|404/i.test(error))
    return "This address did not provide a readable feed. Edit the RSS/Atom address or use manual capture.";
  if (/paused|running/i.test(error))
    return "Collection is paused or already running. Refresh health or check this project's Following settings.";
  return "The check could not finish. Retry, edit the feed, or pause collection. Your saved research is unchanged.";
}
export function overviewState({
  enabled,
  running,
  failed,
  checked,
  pending,
  outside,
  kept,
  archived = false,
}: {
  enabled: number;
  running: boolean;
  failed: boolean;
  checked: boolean;
  pending: number;
  outside: number;
  kept: number;
  archived?: boolean;
}) {
  if (archived)
    return {
      title: "This project is archived",
      detail:
        "Saved research is available. Reopen the project to resume automatic collection.",
      to: "/project",
      action: "Open project settings",
    };
  if (pending)
    return {
      title: `${pending} items await your review`,
      detail:
        "Keep relevant items in your Library, or dismiss them from the Inbox.",
      to: "/ingestion?status=pending&route=pending",
      action: "Review inbox",
    };
  if (running)
    return {
      title: "Your sources are collecting",
      detail:
        "Collection is running on the server. Refresh this overview for the latest state.",
      to: "/sources",
      action: "View collection health",
    };
  if (failed)
    return {
      title: "Some sources need attention",
      detail:
        "A failed feed is not an empty feed. Other enabled sources continue collecting.",
      to: "/sources",
      action: "Check source health",
    };
  if (!enabled)
    return {
      title: kept
        ? "Grow your research library"
        : "Choose where incoming research comes from",
      detail:
        "Follow a source with a feed for automatic collection, or capture a link yourself.",
      to: "/sources?view=discover",
      action: "Choose sources",
    };
  if (!checked)
    return {
      title: "Ready for your first collection",
      detail:
        "Sources are enabled for this project but have not been checked. Check now from Sources.",
      to: "/sources",
      action: "Check sources",
    };
  if (outside)
    return {
      title: "Items are outside your current scope",
      detail:
        "Review the outside-scope Inbox or adjust your matching rules. Nothing is silently deleted.",
      to: "/ingestion?route=outside_scope",
      action: "Review outside-scope items",
    };
  if (kept)
    return {
      title: "Your library is taking shape",
      detail:
        "No items await review. Automatic collection will check for new material.",
      to: "/articles",
      action: "Open library",
    };
  return {
    title: "No new items to review yet",
    detail:
      "The checked feeds have no new matching items. Try another source or capture a link; collection does not approve articles automatically.",
    to: "/sources",
    action: "Review sources",
  };
}
