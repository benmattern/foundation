# FOUNDATION Recovery Prompt

You are assisting with FOUNDATION, an OSINT/intelligence platform currently in active development.

FOUNDATION is designed as:
- a modular intelligence and monitoring platform,
- focused on structured intelligence workflows,
- geopolitical analysis,
- technology monitoring,
- and operational awareness.

The current implemented model is:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
    <-> Events v1
       -> Event Refinement v1
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
       -> Seed Data Script v1
       -> Dashboard v1
```

The long-term direction is:

```txt
Sources -> Articles -> Tags -> Events -> Entities -> Timelines -> Relationships
```

The current implementation is still early Phase 1. Do not assume advanced workflows are implemented.

---

# Current Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Backend
- Supabase
- PostgreSQL

## Deployment
- GitHub
- Render Static Site

---

# Current Frontend Architecture

Current structure:

```txt
src/
  components/
  layouts/
  pages/
  services/
  types/
  lib/
```

Architecture conventions:
- route-based pages
- reusable components
- service-layer architecture
- Supabase access isolated to services
- lowercase filenames in types/
- one service per entity/domain

---

# Current Working Features

## Dashboard
- Shared DashboardLayout
- Sidebar navigation
- reusable Card component
- reusable PageHeader component
- route-based navigation
- Dashboard v1 analyst workflow overview
- loads sources, articles with tags, tags, and events with articles using `Promise.all`
- real metric cards for Active Events, Total Events, Articles, and Sources
- events by status overview
- Most Active Events by supporting article count
- Recently Updated Events by last activity
- Top Tags by article tag occurrence
- Recent Articles by effective article date
- friendly loading/error/empty states
- dashboardMetrics helpers exist in src/lib/dashboardMetrics.ts

## Sources
- Create source
- List sources
- Source detail pages
- Edit source
- Supabase persistence

Not yet implemented:
- Delete source
- Source filtering/search

## Articles
- Create article
- List articles
- Associate article with a source
- Assign multiple tags during article creation
- Insert article_tags records after article creation
- Display tag badges on article records
- Reload articles after successful creation
- Published date handling
- Client-side search by title
- Client-side search by summary
- Client-side filter by one tag
- Client-side filter by one source
- Clear filters button
- Filtered result count
- Filtered empty state
- Edit article title
- Edit article URL
- Edit article summary
- Edit article source
- Edit article published date
- Edit article tags
- Add/remove tags from existing articles
- Retag existing articles
- Delete articles
- Reused ArticleForm for create/edit modes
- Edit/cancel support
- Supabase persistence

Not yet implemented:
- Article detail page
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL query params
- Saved filters

## Tags
- tags table exists
- article_tags table exists
- seed tags exist
- tag.ts exists
- ArticleWithTags derived application type exists
- tagService.ts exists
- TagForm exists
- TagList exists
- TagsPage exists
- Tags route exists
- Standalone create/list/delete tags works
- Tags can be assigned to new articles
- Tags display on article records
- Tags can filter articles in Filtering & Search v1

Standalone Tags CRUD, Article <-> Tag relationships, Filtering & Search v1, and Article Management v1 are complete for the current stage.

## Events
- events table exists
- article_events table exists
- event.ts exists
- eventService.ts exists
- EventForm exists
- EventList exists
- EventsPage exists
- EventDetailPage exists
- Events route exists at `/events`
- Event detail route exists at `/events/:id`
- Events sidebar navigation exists
- Create/edit/delete events works
- Link/unlink articles to events works
- Event article links are replaced through delete-then-insert service behavior
- Event detail pages work
- Event statuses are draft, active, resolved, and archived
- EventFilters exists
- Client-side event search by title/description works
- Client-side event filtering by status works
- Client-side event filtering by event type works
- Event filter clear button, filtered count, and filtered empty state work
- eventStatusOptions and eventTypeOptions are shared application constants
- FoundationEventWithArticleTags derived application type exists
- getEventWithArticleTagsById(id) exists
- Event detail pages load linked articles with tags
- EventIntelligenceSummary exists
- EventArticleTimeline exists
- Event detail pages show supporting article count, newest/oldest article, event age, last activity, related tags from supporting articles, and a chronological supporting article timeline
- eventMetrics helpers exist in src/lib/eventMetrics.ts
- EventStatusOverview exists
- Events list page shows status overview cards
- Events list cards show supporting article count, last activity, occurred date, status, type, and location
- EventFilters includes sort control
- Events can be sorted by newest activity, newest event, oldest event, and most supporting articles
- Seed Data Script v1 exists at `supabase/seed.sql`
- Repeatable fictional Taiwan-focused demo dataset is available
- Seed data includes demo sources, articles, tags, events, article_tags, and article_events
- Seed data uses fixed UUIDs and seed-only cleanup

Not yet implemented:
- Event-owned tags
- Event entity linking
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges
- URL import, RSS ingestion, browser extension capture, review queue, and custom connectors

---

# Current Work In Progress

## Next Milestone

The next priority is a decision point between Ingestion Planning / URL Import v1, Article Detail Pages, Source Management cleanup, and Events v1.3.

Seed Data Script v1 and Dashboard v1 are complete. Ingestion is elevated as a roadmap layer, but URL import, RSS ingestion, browser extension capture, review queue, and custom connectors are not implemented. Do not skip ahead to entities, timelines, RSS ingestion, Financial Signals, or AI workflows unless the user explicitly changes priority.

---

# Placeholder Or Planned Areas

## Entities

EntitiesPage exists as a placeholder only. No entity schema, service, or CRUD workflow is implemented.

## Timeline, Notes, Settings

Timeline, notes, and settings workflows are not implemented.

## RSS, AI, Financial Signals

RSS ingestion, AI-assisted workflows, and Financial Signals are future-phase concepts only.

## Ingestion

Manual entry is the current ingestion workflow. Seed Data Script v1 provides repeatable fictional prototype/demo data. URL import, RSS ingestion, browser extension capture, review queue, and custom connectors are elevated roadmap items only.

---

# Current UI Direction

Design philosophy:
- dark themed
- operational/intelligence focused
- modular dashboard architecture
- observatory/workstation aesthetic

Design inspirations:
- observatories
- intelligence workstations
- strategic operations centers
- monitoring dashboards

---

# Current Development Philosophy

Prioritize:
- modularity
- maintainability
- stable schema design
- operational usefulness
- incremental architecture

Avoid:
- premature complexity
- microservices
- Kubernetes
- distributed systems
- graph databases
- premature AI orchestration

Current focus is building a stable intelligence platform foundation before advanced analytical systems.

---

# Current Documentation

Project docs are located in:

```txt
docs/
```

Current docs include:
- FOUNDATION_ARCHITECTURE.md
- FOUNDATION_STATUS.md
- FOUNDATION_BACKLOG.md
- FOUNDATION_DECISIONS.md
- FOUNDATION_SCHEMA.md
- FOUNDATION_CONVENTIONS.md
- FOUNDATION_RECOVERY_PROMPT.md

These documents should be treated as authoritative project context, but current source code remains the final source of truth for what is actually implemented.

---

# ChatGPT/Codex Alignment

When starting a new ChatGPT or Codex session:
1. Read this recovery prompt first.
2. Read FOUNDATION_STATUS.md and FOUNDATION_BACKLOG.md.
3. Inspect the relevant source files before making changes.
4. Do not infer that planned features are implemented.
5. Treat the next milestone as a decision point between Ingestion Planning / URL Import v1, Article Detail Pages, Source Management cleanup, and Events v1.3 unless the user explicitly chooses a different direction.

---

# Long-Term Vision

FOUNDATION is intended to evolve into:
- a modular civilian intelligence platform,
- capable of structured analysis,
- intelligence monitoring,
- relationship mapping,
- timeline analysis,
- signal detection,
- financial signal awareness,
- and AI-assisted analyst workflows.

Current focus is:
- strong architecture,
- stable workflows,
- and scalable relational intelligence design.
