# FOUNDATION Current Status

## Project Status

FOUNDATION is currently in early Phase 1 development.

The application has moved from initial prototype setup into a functioning modular web application with working foundational CRUD flows, Supabase persistence, route-based pages, and a service-layer architecture.

The current focus is:
- establishing core intelligence data structures,
- stabilizing architecture,
- and building foundational workflows before advanced automation or AI-assisted analysis.

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

# Current Deployment Status

## Deployment

The intended deployment flow is:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

## Environment Variables

Required:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

# Current Working Features

# Dashboard

## Implemented
- Shared DashboardLayout
- Sidebar navigation
- Route-based page structure
- Reusable Card component
- Reusable PageHeader component
- Basic source count metric

## Current Status

Operational but minimal. Article and entity metrics are not yet connected to real data.

---

# Sources

## Implemented
- Create source
- Edit source
- Source detail pages
- Source listing
- Supabase persistence
- Service layer integration

## Not Yet Implemented
- Delete source
- Source search/filtering
- Source health/feed status

## Current Database Fields
- id
- name
- url
- category
- notes
- created_at

## Current Status

Operational for create, list, detail, and edit workflows.

---

# Articles

## Implemented
- Create article
- Associate article with a source
- Article listing
- Published date handling
- Supabase persistence
- Service layer integration

## Not Yet Implemented
- Edit article
- Delete article
- Article detail page
- Article tag assignment
- Tag badges on article records
- Article filtering/search

## Current Status

Operational for create and list workflows.

## Current Relationship Direction

```txt
Sources -> Articles
```

Next:

```txt
Articles <-> Tags
```

---

# Tags

## Implemented
- tags table created
- article_tags join table created
- seed tags added
- tag.ts created
- tagService.ts created
- TagForm component created
- TagList component created
- TagsPage created
- Tags route added
- Sidebar navigation added
- Create/list/delete tags working

## Current Status

Standalone Tags CRUD is complete for the current stage.

## Next Feature
- Add article-tag relationship management
- Allow multiple tags per article
- Display tags on articles
- Filter articles by tags

---

# Placeholder Or Planned Areas

## Entities

EntitiesPage exists as a placeholder only. No entity schema, service, or CRUD workflow is implemented yet.

## Timelines, Notes, Settings

Sidebar entries exist for Timeline, Notes, and Settings, but route pages and workflows are not implemented yet.

---

# Current Frontend Architecture

## Current Structure

```txt
src/
  components/
  layouts/
  pages/
  services/
  types/
  lib/
```

---

# Current Architectural Conventions

# Services

## Pattern
- One service file per domain/entity
- Supabase logic isolated to services
- Components/pages do not directly query Supabase

## Current Services
- sourceService.ts
- articleService.ts
- tagService.ts

---

# Types

## Conventions
- lowercase filenames
- singular naming
- one type file per entity/domain

Examples:
- source.ts
- article.ts
- tag.ts

---

# Current Database Direction

## Current Implemented Direction

```txt
Sources -> Articles
Tags
```

## Next Relationship

```txt
Articles <-> Tags
```

## Expanded Long-Term Direction

```txt
Sources
  -> Articles
    -> Tags
    -> Entities
      -> Events
        -> Timelines
          -> Relationships
```

---

# Immediate Priorities

1. Article-tag relationships
2. Article tag display and filtering
3. Dashboard metrics connected to real data
4. Search and filtering
5. Event system
6. RSS ingestion

---

# Mid-Term Priorities

- Entity modeling
- Timeline visualization
- Watchlists
- Correlation workflows
- AI-assisted summaries

---

# Long-Term Priorities

- Intelligence graph
- Signal detection
- Trend analysis
- Predictive indicators
- Multi-tenant architecture
- Advanced OSINT tooling

---

# Known Technical Debt

## Current Areas To Improve
- Article-tag relationship implementation
- Search/filtering architecture
- Data normalization
- UI consistency
- Empty shared UI primitives for Input, Textarea, and EmptyState
- Event/timeline schema design
- Form validation consistency
- Better typing standardization across components
- Documentation drift between implemented and planned features

---

# Current Security/Auth Status

- No application auth flow is implemented yet.
- No local migrations or RLS policies are present in the repo.
- Supabase security must be managed in the Supabase project until database migrations and policies are tracked in-repo.
- Treat the app as private/internal at this stage unless RLS and auth are explicitly configured.

---

# Current Philosophy

## Current Development Focus

Prioritize:
- stable architecture
- modularity
- maintainability
- clean relationships
- operational usefulness

Avoid:
- premature complexity
- overengineering
- unnecessary infrastructure
- premature AI integration

Current focus is building a stable intelligence platform foundation before advanced intelligence workflows.
