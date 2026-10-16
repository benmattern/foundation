import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleForm } from "../src/components/ArticleForm";
import { EventForm } from "../src/components/EventForm";
import { RssFeedForm } from "../src/components/RssFeedForm";
import { IngestionCandidateReview } from "../src/components/IngestionCandidateReview";
import {
  filterCandidates,
  selectVisibleCandidate,
} from "../src/lib/ingestionQueue";
import { normalizeImportUrl } from "../src/lib/urlImport";
import type { IngestionCandidate } from "../src/types/ingestionCandidate";
import type { RssFeed } from "../src/types/rssFeed";

function candidate(id: string, title = id): IngestionCandidate {
  return {
    id,
    title,
    url: `https://example.com/${id}`,
    description: null,
    source_id: null,
    canonical_url: null,
    final_url: null,
    published_at: null,
    import_source: "rss",
    status: "pending",
    raw_metadata: {},
    warnings: [],
    converted_article_id: null,
    rejection_reason: null,
    reviewed_at: null,
    updated_at: "2026-10-16",
    created_at: "2026-10-16",
  };
}
describe("form and queue regressions", () => {
  it("updates imported article drafts and resets when switching to create", () => {
    const submit = vi.fn();
    const { rerender } = render(
      <ArticleForm
        sources={[]}
        tags={[]}
        initialDraft={{ title: "First" }}
        onSubmit={submit}
      />,
    );
    expect((screen.getByPlaceholderText("Title") as HTMLInputElement).value)
      .toBe("First");
    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "Edited" },
    });
    rerender(
      <ArticleForm
        sources={[]}
        tags={[]}
        initialDraft={{ title: "Second" }}
        onSubmit={submit}
      />,
    );
    expect((screen.getByPlaceholderText("Title") as HTMLInputElement).value)
      .toBe("Second");
    rerender(
      <ArticleForm
        sources={[]}
        tags={[]}
        initialDraft={null}
        onSubmit={submit}
      />,
    );
    expect((screen.getByPlaceholderText("Title") as HTMLInputElement).value)
      .toBe("");
  });
  it("resets event and feed edit state without effects", () => {
    const submit = vi.fn();
    const { rerender, unmount } = render(
      <EventForm
        articles={[]}
        initialEvent={{
          id: "e",
          title: "Event A",
          description: null,
          event_type: null,
          status: "active",
          occurred_at: null,
          location: null,
          created_at: "",
          updated_at: "",
          articles: [],
        }}
        onSubmit={submit}
      />,
    );
    expect(screen.getByDisplayValue("Event A")).toBeTruthy();
    rerender(<EventForm articles={[]} onSubmit={submit} />);
    expect(screen.queryByDisplayValue("Event A")).toBeNull();
    unmount();
    const feed: RssFeed = {
      id: "f",
      feed_url: "https://example.com/rss",
      source_id: null,
      title: "Feed A",
      is_active: true,
      last_checked_at: null,
      created_at: "",
      updated_at: "",
    };
    const view = render(
      <RssFeedForm
        sources={[]}
        feedToEdit={feed}
        onSubmit={submit}
        onCancelEdit={() => {}}
      />,
    );
    expect(screen.getByDisplayValue("Feed A")).toBeTruthy();
    view.rerender(
      <RssFeedForm
        sources={[]}
        feedToEdit={null}
        onSubmit={submit}
        onCancelEdit={() => {}}
      />,
    );
    expect(screen.queryByDisplayValue("Feed A")).toBeNull();
  });
  it("prevents overlapping review clicks and keeps draft on failure", async () => {
    let reject!: (error: Error) => void;
    const accept = vi.fn(() =>
      new Promise<void>((_, fail) => {
        reject = fail;
      })
    );
    render(
      <IngestionCandidateReview
        candidate={candidate("a")}
        sources={[]}
        tags={[]}
        onAcceptCandidate={accept}
        onRejectCandidate={vi.fn()}
        onMarkDuplicate={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", {
      name: "Accept as Article",
    });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(accept).toHaveBeenCalledTimes(1);
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      reject(new Error("Database unavailable"));
    });
    await waitFor(() =>
      expect(screen.getAllByRole("alert")[0].textContent).toContain(
        "Database unavailable",
      )
    );
    expect(screen.getByDisplayValue("a")).toBeTruthy();
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
  });
  it("never selects an item outside combined filters, including after review", () => {
    const a = candidate("a", "Policy");
    const b = {
      ...candidate("b", "Chips"),
      source_id: "source",
      import_source: "manual_url" as const,
    };
    const filters = {
      status: "pending" as const,
      search: "chips",
      source: "source",
      importSource: "manual_url",
    };
    const visible = filterCandidates([a, b], filters);
    expect(selectVisibleCandidate(visible, a.id)?.id).toBe("b");
    expect(
      selectVisibleCandidate(
        filterCandidates([a, { ...b, status: "accepted" }], filters),
        b.id,
      ),
    ).toBeNull();
  });
  it("normalizes HTTP(S) identity and rejects explicit unsupported schemes/credentials", () => {
    expect(normalizeImportUrl(" example.com/a?utm_source=rss&keep=yes#x "))
      .toBe("https://example.com/a?keep=yes");
    for (
      const value of [
        "ftp://example.com/a",
        "mailto:a@example.com",
        "javascript:alert(1)",
        "https://u:p@example.com/",
        "",
      ]
    ) expect(() => normalizeImportUrl(value)).toThrow();
  });
});
