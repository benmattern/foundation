# FOUNDATION Recovery Prompt

You are assisting with FOUNDATION, an OSINT/intelligence platform currently in active development.

FOUNDATION is designed as:
- a modular intelligence and monitoring platform,
- focused on structured intelligence workflows,
- geopolitical analysis,
- technology monitoring,
- and operational awareness.

The current implemented relationship model is:

```txt
Sources -> Articles <-> Tags
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
- basic source count

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
- Supabase persistence

Not yet implemented:
- Edit article
- Delete article
- Article detail page
- Tag filtering
- Search
- Date filtering

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

Standalone Tags CRUD and Article <-> Tag relationships are complete for the current stage.

---

# Current Work In Progress

## Next Feature: Filtering & Search

The next implementation step should be filtering and search.

Expected first direction:
1. Add tag filtering on ArticlesPage.
2. Add article text search.
3. Add source filtering.
4. Add date filtering.
5. Keep Supabase access centralized in services.

Do not skip ahead to events, entities, timelines, RSS ingestion, Financial Signals, or AI workflows unless the user explicitly changes priority.

---

# Placeholder Or Planned Areas

## Entities

EntitiesPage exists as a placeholder only. No entity schema, service, or CRUD workflow is implemented.

## Events, Timeline, Notes, Settings

No event, timeline, notes, or settings workflows are implemented.

## RSS, AI, Financial Signals

RSS ingestion, AI-assisted workflows, and Financial Signals are future-phase concepts only.

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
5. Treat Filtering & Search as the next milestone unless the user explicitly changes priority.

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
