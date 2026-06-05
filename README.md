# FOUNDATION

FOUNDATION is an early-stage OSINT and geopolitical analysis platform inspired by Asimov's Foundation. It is designed to collect, organize, tag, and analyze open-source information, with an initial focus on the Taiwan region and related Indo-Pacific, semiconductor, maritime, supply-chain, and technology issues.

The project is currently in Phase 1: building a clear, reliable intelligence data foundation before adding advanced automation or AI-assisted workflows.

## Current Status

Implemented:
- Dashboard shell with sidebar navigation and shared layout.
- Sources workflow: create, list, view detail, and edit source records.
- Articles workflow: create and list articles, with optional source association.
- Tags workflow: create, list, and delete standalone tags.
- Supabase service layer for sources, articles, and tags.

Not implemented yet:
- Article-to-tag assignment.
- Article tag badges and tag filtering.
- Entity, event, timeline, notes, and settings workflows.
- Authentication and role-based access.
- AI-assisted ingestion, summarization, tagging, or entity extraction.

The next intended feature is Article <-> Tag relationship management using the existing `article_tags` join-table direction.

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
- Implement Article <-> Tag relationship management.
- Display tags on article records.
- Add article filtering by tag, source, and date.
- Improve dashboard metrics and recent intelligence views.

Mid term:
- Add events and article-event relationships.
- Add search and filtering workflows.
- Add structured entities after tag and event workflows stabilize.
- Improve UI consistency and shared form components.

Long term:
- Timeline intelligence.
- Watchlists.
- Analyst notes and reporting workflows.
- Intelligence graph and relationship mapping.
- AI-assisted summarization, tagging, and entity extraction.

FOUNDATION should remain architecture-first and avoid premature complexity while the core intelligence workflows are still stabilizing.
