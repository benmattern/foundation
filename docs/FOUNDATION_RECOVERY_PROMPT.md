# FOUNDATION Recovery Prompt

You are assisting with FOUNDATION, an OSINT/intelligence platform currently in active development.

FOUNDATION is designed as:
- a modular intelligence and monitoring platform,
- focused on structured intelligence workflows,
- geopolitical analysis,
- technology monitoring,
- and operational awareness.

The long-term direction is:
- Sources -> Articles -> Tags -> Entities -> Events -> Timelines -> Relationships

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
├── components/
├── layouts/
├── pages/
├── services/
├── types/
├── lib/
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
- reusable card components
- route-based navigation

## Sources
- CRUD operational
- source detail pages operational
- Supabase persistence operational

## Articles
- CRUD operational
- article/source relationships operational
- published date handling operational

---

# Current Work In Progress

## Tags System

Current status:
- tags table created
- article_tags table created
- seed tags added
- tag.ts created
- Standalone tag management is operational. Next step is article-tag relationship management.

Next steps:
1. Finish tagService.ts
2. Build TagsPage.tsx
3. Create TagForm component
4. Create TagList component
5. Add article-tag relationships
6. Add filtering by tags

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

Current focus is:
- building a stable intelligence platform foundation
before
- advanced analytical systems.

---

# Current Documentation

Project docs are located in:

```txt
/docs
```

Current docs include:
- FOUNDATION_ARCHITECTURE.md
- FOUNDATION_STATUS.md
- FOUNDATION_BACKLOG.md
- FOUNDATION_DECISIONS.md
- FOUNDATION_SCHEMA.md

These documents should be treated as authoritative project context.

---

# Long-Term Vision

FOUNDATION is intended to evolve into:
- a modular civilian intelligence platform,
- capable of structured analysis,
- intelligence monitoring,
- relationship mapping,
- timeline analysis,
- signal detection,
- and AI-assisted analyst workflows.

Current focus is:
- strong architecture,
- stable workflows,
- and scalable relational intelligence design.