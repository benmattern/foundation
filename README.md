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
- RSS ingestion.
- URL import, browser extension capture, review queue, custom connectors, and seed data script.
- Financial Signals.
- Authentication, app auth flows, and RLS-managed access.
- AI-assisted ingestion, summarization, tagging, or entity extraction.

The next milestone is a decision point between Seed Data Script and Dashboard v1. Neither has started.

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
- Seed Data Script: repeatable prototype data for sources, articles, tags, events, and relationships.
- Dashboard v1: real article/tag/event counts and recent intelligence views.
- Article detail page and advanced article workflows.

Ingestion roadmap:
- Manual entry is the current collection workflow.
- URL import, RSS ingestion, browser extension capture, review queue, and custom connectors are elevated roadmap items but are not implemented yet.

Still open in Filtering/Search:
- Date filtering.
- Multi-tag filtering.
- Server-side filtering/search.
- URL state.
- Saved filters.

Mid term:
- Add structured entities after source, article, tag, filtering, and event workflows stabilize.
- Improve UI consistency and shared form components.
- Add RSS ingestion after manual collection workflows mature.

Long term:
- Timeline intelligence.
- Watchlists.
- Analyst notes and reporting workflows.
- Financial Signals.
- Intelligence graph and relationship mapping.
- AI-assisted summarization, tagging, and entity extraction.

FOUNDATION should remain architecture-first and avoid premature complexity while the core intelligence workflows are still stabilizing.
