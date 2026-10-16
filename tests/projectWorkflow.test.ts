import { describe, expect, it } from "vitest";
import {
  collectionError,
  feedHealth,
  overviewState,
  projectFeeds,
} from "../src/lib/projectWorkflow";
import type { RssFeed } from "../src/types/rssFeed";

const feed: RssFeed = {
  id: "feed",
  source_id: "source",
  title: "Publisher",
  feed_url: "https://example.org/feed",
  is_active: true,
  last_checked_at: null,
  last_success_at: null,
  created_at: "2026-10-16",
  updated_at: "2026-10-16",
};
const empty = {
  enabled: 0,
  running: false,
  failed: false,
  checked: false,
  pending: 0,
  outside: 0,
  kept: 0,
};
describe("project workflow guidance", () => {
  it("does not count owner-wide feeds without this project's enabled subscriptions", () => {
    expect(projectFeeds([feed], [])).toEqual([]);
    expect(
      projectFeeds(
        [feed],
        [
          {
            project_id: "active",
            feed_id: "feed",
            enabled: false,
            rules: null,
          },
        ],
      ),
    ).toEqual([]);
    expect(
      projectFeeds(
        [{ ...feed, is_active: false }],
        [{ project_id: "active", feed_id: "feed", enabled: true, rules: null }],
      ),
    ).toEqual([]);
    expect(
      projectFeeds(
        [feed],
        [{ project_id: "active", feed_id: "feed", enabled: true, rules: null }],
      ),
    ).toEqual([feed]);
  });
  it("distinguishes setup, unchecked, collecting, empty, outside-scope, failure and kept states", () => {
    expect(overviewState(empty).action).toBe("Choose sources");
    expect(overviewState({ ...empty, enabled: 1 }).title).toBe(
      "Ready for your first collection",
    );
    expect(overviewState({ ...empty, enabled: 1, running: true }).title).toBe(
      "Your sources are collecting",
    );
    expect(overviewState({ ...empty, enabled: 1, checked: true }).title).toBe(
      "No new items to review yet",
    );
    expect(
      overviewState({ ...empty, enabled: 1, checked: true, outside: 12 }).to,
    ).toContain("outside_scope");
    expect(overviewState({ ...empty, enabled: 1, failed: true }).title).toBe(
      "Some sources need attention",
    );
    expect(overviewState({ ...empty, pending: 3 }).title).toBe(
      "3 items await your review",
    );
    expect(
      overviewState({ ...empty, enabled: 1, checked: true, kept: 2 }).action,
    ).toBe("Open library");
    expect(overviewState({ ...empty, pending: 3, archived: true }).action).toBe(
      "Open project settings",
    );
  });
  it("retains failure guidance even if an old run falls outside the 50-run history window", () => {
    expect(
      feedHealth(
        { ...feed, failure_count: 2, last_checked_at: "2026-10-16" },
        [],
      ).kind,
    ).toBe("error");
    expect(feedHealth(feed, []).kind).toBe("new");
    expect(feedHealth({ ...feed, is_active: false }, []).kind).toBe("paused");
  });
  it("gives actionable upstream errors instead of describing a failed feed as empty", () => {
    expect(collectionError("403")).toContain("publisher refused");
    expect(collectionError("signal aborted")).toContain("Retry");
    expect(collectionError("Unable to resolve hostname")).toContain(
      "Check its address",
    );
    expect(collectionError("XML parse failure")).toContain("manual capture");
  });
});
