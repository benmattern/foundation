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
- Client-side article search by title and summary.
- Client-side article filtering by one tag.
- Client-side article filtering by one source.
- Clear filters button, filtered result count, and filtered empty state.
- `ArticleFilters` component.
- Supabase service layer for sources, articles, and tags.
- Shared Card component and low-risk UI cleanup pass.

Not implemented yet:
- Date filtering.
- Multi-tag filtering.
- Server-side filtering or server-side search.
- URL query params or saved filters.
- Article detail page.
- Entity, event, timeline, notes, and settings workflows.
- RSS ingestion.
- Financial Signals.
- Authentication, app auth flows, and RLS-managed access.
- AI-assisted ingestion, summarization, tagging, or entity extraction.

The next milestone is Events Planning. Events implementation has not started.

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
- Events Planning: event schema and workflow design before implementation.
- Dashboard Improvements v1: real article/tag counts and recent intelligence views.
- Article detail page and advanced article workflows.

Still open in Filtering/Search:
- Date filtering.
- Multi-tag filtering.
- Server-side filtering/search.
- URL state.
- Saved filters.

Mid term:
- Add events and article-event relationships after planning.
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
