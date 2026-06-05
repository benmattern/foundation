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
- Client-side article search by title and summary.
- Client-side article filtering by one tag.
- Client-side article filtering by one source.
- Clear filters button, filtered result count, and filtered empty state.
- `ArticleFilters` component.
- Supabase service layer for sources, articles, tags, and events.
- Shared Card component and low-risk UI cleanup pass.

Not implemented yet:
- Event tags.
- Event entity linking.
- Timeline visualization.
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
- Financial Signals.
- Authentication, app auth flows, and RLS-managed access.
- AI-assisted ingestion, summarization, tagging, or entity extraction.

The next milestone is a decision point between Dashboard v1 and Events v1.1. Neither has started.

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
- Dashboard v1: real article/tag/event counts and recent intelligence views.
- Events v1.1: additional event workflow polish after search/filtering.
- Article detail page and advanced article workflows.

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
