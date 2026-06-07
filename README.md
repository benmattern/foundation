# FOUNDATION

FOUNDATION is an early-stage OSINT and geopolitical analysis platform inspired by Asimov's Foundation. It is designed to collect, organize, tag, filter, and analyze open-source information, with an initial focus on the Taiwan region and related Indo-Pacific, semiconductor, maritime, supply-chain, and technology issues.

The project is currently in Phase 1: building a clear, reliable intelligence data foundation before adding advanced automation or AI-assisted workflows.

## Current Status

Implemented:
- Dashboard shell with sidebar navigation and shared layout.
- Sources workflow: create, list, view detail, and edit source records.
- Articles workflow: create and list articles, with optional source association.
- Standalone Tags workflow: create, list, and delete tags.
- Article <-> Tag relationships through `article_tags`.
- `ArticleWithTags` derived application type.
- Multi-tag assignment during article creation.
- Article management: edit article metadata, source, published date, and tags.
- Add/remove tags from existing articles.
- Delete articles.
- Tag badges displayed on article records.
- Event v1 workflow: create, list, view detail, edit, and delete events.
- Article <-> Event relationships through `article_events`.
- Link and unlink articles from events.
- Event detail pages for analyst-created intelligence objects.
- Event Refinement v1: client-side event search by title/description.
- Event Refinement v1: event filtering by status and event type.
- Event filter clear button, filtered result count, and filtered empty state.
- `EventFilters` component.
- Shared event status/type option constants.
- Events v1.1 Intelligence Summary on event detail pages.
- `FoundationEventWithArticleTags` derived application type.
- Enriched event detail loading with linked articles and tags.
- Supporting article count, newest/oldest article, event age, and last activity.
- Related tag aggregation inferred from supporting article tags.
- Chronological supporting article timeline.
- Events v1.2 Activity & Analyst Workflow on the Events list page.
- Event status overview cards for Draft, Active, Resolved, and Archived.
- Event activity indicators, including supporting article count, last activity, occurred date, status, type, and location.
- Event sorting by newest activity, newest event, oldest event, and most supporting articles.
- Shared event/date/activity helpers in `src/lib/eventMetrics.ts`.
- Dashboard v1 analyst workflow overview.
- Dashboard v1 real metric cards for Active Events, Total Events, Articles, and Sources.
- Dashboard v1 event status overview, most active events, recently updated events, top tags, and recent articles.
- Dashboard v1 client-side derived metrics through `src/lib/dashboardMetrics.ts`.
- Seed Data Script v1 in `supabase/seed.sql`.
- Repeatable fictional Taiwan-focused demo dataset for sources, articles, tags, events, and relationships.
- Fixed UUID seed strategy with seed-only cleanup.
- URL Import v1 analyst-reviewed draft workflow.
- URL normalization, duplicate article warning, and source matching by hostname.
- URL Metadata Fetch v1.1 through the deployed `fetch-url-metadata` Supabase Edge Function.
- Metadata preview/apply workflow for title, description, canonical/final URL, site name, and published date.
- URL-only article draft fallback when metadata fetch is unavailable or incomplete.
- Review Queue v1 through the `ingestion_candidates` table.
- `/ingestion` route and Ingestion sidebar navigation.
- Save to Review Queue from URL Import.
- Candidate list/review UI.
- Accept candidate as article.
- Reject candidate.
- Mark candidate duplicate.
- Candidate-to-article conversion after analyst review.
- RSS Ingestion v1 through the `rss_feeds` table.
- RSS feed management UI, `/rss` route, and RSS sidebar navigation.
- Manual Fetch Feed Now workflow through the deployed `fetch-rss-feed` Supabase Edge Function.
- RSS 2.0 and Atom parsing into Review Queue candidates.
- RSS duplicate skipping against existing ingestion candidates and articles.
- RSS fetch summary UI and end-to-end validated RSS feed-to-candidate workflow.
- Review Queue UX v1.1 status tabs for Pending, Accepted, Rejected, and Duplicate candidates with status counts.
- Pending remains the default Review Queue view and reviewed candidates move out of Pending after action.
- Review Queue UX v1.2 with narrower queue list, wider review panel, sticky review panel on larger screens, and independently scrolling queue list.
- Direct ArticleForm creation preserved.
- Client-side article search by title and summary.
- Client-side article filtering by one tag.
- Client-side article filtering by one source.
- Clear filters button, filtered result count, and filtered empty state.
- `ArticleFilters` component.
- Supabase service layer for sources, articles, tags, and events.
- Shared Card component and low-risk UI cleanup pass.

Not implemented yet:
- Event-owned tags.
- Event entity linking.
- Global timeline module.
- Event AI suggestions.
- Event severity/confidence scoring.
- Event date ranges.
- Date filtering.
- Multi-tag filtering.
- Server-side filtering or server-side search.
- URL query params or saved filters.
- Article detail page.
- Entity, timeline, notes, and settings workflows.
- Browser extension capture and custom connectors.
- Batch import and review analytics.
- Event linking during candidate acceptance.
- Transactional candidate conversion.
- Financial Signals.
- Authentication, app auth flows, and RLS-managed access.
- AI-assisted ingestion, summarization, tagging, or entity extraction.

The next milestone is a decision point between Review Queue UX v1.3, RSS Automation Planning, Article Detail Pages, Source Management cleanup, and Auth/RLS Planning.

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

Backend and data:
- Supabase
- PostgreSQL

Deployment workflow:
- Git
- GitHub
- Render Static Site

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
.env.local
```

Required variables:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Documentation

Project documentation lives in `docs/`.

Key files:
- `docs/FOUNDATION_STATUS.md` - current implementation status.
- `docs/FOUNDATION_BACKLOG.md` - prioritized development backlog.
- `docs/FOUNDATION_SCHEMA.md` - current and planned data model.
- `docs/FOUNDATION_CONVENTIONS.md` - coding, architecture, documentation, and AI-assistant workflow conventions.
- `docs/FOUNDATION_RECOVERY_PROMPT.md` - context handoff for future ChatGPT/Codex sessions.
- `docs/FOUNDATION_ARCHITECTURE.md` - broader architecture and product direction.
- `docs/FOUNDATION_DECISIONS.md` - architectural decisions and rationale.

## Roadmap

Near term:
- Decide next milestone: Review Queue UX v1.3, RSS Automation Planning, Article Detail Pages, Source Management cleanup, or Auth/RLS Planning.
- Article detail page and advanced article workflows.
- Source management cleanup.

Ingestion roadmap:
- Manual entry is the current collection workflow.
- Seed Data Script v1 is available at `supabase/seed.sql` for repeatable fictional prototype/demo data.
- URL Import v1 is implemented as an analyst-reviewed article draft workflow.
- URL Metadata Fetch v1.1 is implemented through the deployed `fetch-url-metadata` Supabase Edge Function.
- Metadata remains transient draft data and is not stored automatically.
- Review Queue v1 is implemented as a staging layer for ingestion candidates before approved article creation.
- RSS Ingestion v1 is implemented through RSS feed management, manual Fetch Feed Now, the deployed `fetch-rss-feed` Supabase Edge Function, RSS/Atom parsing, duplicate skipping, and candidate creation.
- Review Queue UX v1.1/v1.2 improves analyst throughput with status tabs, status counts, Pending workflow behavior, a sticky wider review panel, and a scrollable narrower queue list.
- Current ingestion flow: Manual URL -> Metadata Fetch -> Save to Review Queue; RSS Feed -> Fetch Feed Now -> ingestion_candidates; Review Queue -> accept/reject/duplicate; Accepted -> Article.
- Browser extension capture and custom connectors should feed Review Queue candidates in the future rather than creating articles directly.

Still open in Filtering/Search:
- Date filtering.
- Multi-tag filtering.
- Server-side filtering/search.
- URL state.
- Saved filters.

Mid term:
- Add structured entities after source, article, tag, filtering, and event workflows stabilize.
- Improve UI consistency and shared form components.
- Plan RSS automation after manual RSS ingestion has been validated.

Long term:
- Timeline intelligence.
- Watchlists.
- Analyst notes and reporting workflows.
- Financial Signals.
- Intelligence graph and relationship mapping.
- AI-assisted summarization, tagging, and entity extraction.

FOUNDATION should remain architecture-first and avoid premature complexity while the core intelligence workflows are still stabilizing.
