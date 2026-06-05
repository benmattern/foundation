# FOUNDATION Current Status

## Project Status

FOUNDATION is currently in early Phase 1 development.

The application has moved from initial prototype setup into a functioning modular web application with working foundational CRUD-style flows, Supabase persistence, route-based pages, a service-layer architecture, and operational Article <-> Tag relationships.

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

Operational but minimal. Article and entity metrics are not yet connected to real dashboard data.

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
- Assign multiple tags during article creation
- Insert `article_tags` records after article creation
- Article listing
- Tag badges displayed on article records
- Published date handling
- Supabase persistence
- Service layer integration
- Articles reload after successful creation

## Not Yet Implemented
- Edit article
- Delete article
- Article detail page
- Tag filtering
- Search
- Date filtering

## Current Status

Operational for create, list, source association, multi-tag assignment, and tag display workflows.

## Current Relationship Direction

```txt
Sources -> Articles <-> Tags
```

---

# Tags

## Implemented
- tags table created
- article_tags join table created
- seed tags added
- tag.ts created
- ArticleWithTags derived application type added
- tagService.ts created
- TagForm component created
- TagList component created
- TagsPage created
- Tags route added
- Sidebar navigation added
- Create/list/delete tags working
- Tags can be assigned to new articles
- Tags display on article records

## Current Status

Standalone Tags CRUD and Article <-> Tag relationship workflows are complete for the current stage.

---

# Placeholder Or Planned Areas

## Entities

EntitiesPage exists as a placeholder only. No entity schema, service, or CRUD workflow is implemented yet.

## Events, Timelines, Notes, Settings

No event, timeline, notes, or settings workflows are implemented yet.

## RSS, AI, Financial Signals

RSS ingestion, AI-assisted workflows, and Financial Signals are future-phase concepts only.

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
Sources
  -> Articles
    <-> Tags
```

## Next Milestone

```txt
Filtering & Search
```

## Expanded Long-Term Direction

```txt
Sources
  -> Articles
    -> Tags
    -> Events
    -> Entities
      -> Timelines
        -> Relationships
```

---

# Immediate Priorities

1. Filtering & Search
2. Tag filtering on articles
3. Source and date filtering
4. Dashboard metrics connected to real data
5. Event system
6. RSS ingestion

---

# Mid-Term Priorities

- Entity modeling
- Timeline visualization
- Watchlists
- Correlation workflows
- Financial Signals exploration
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
- Search/filtering architecture
- Data normalization
- UI consistency
- Empty shared UI primitives for Button, Input, Textarea, and EmptyState
- Event/timeline schema design
- Form validation consistency
- Better typing standardization across components
- Frontend-driven article creation and tag assignment are not transactionally coupled
- Documentation drift between implemented and planned features

---

# Current Security/Auth Status

- No application auth flow is implemented yet.
- RLS is currently disabled for this prototype.
- No local migrations or RLS policies are present in the repo.
- Supabase security must be revisited before public or multi-user deployment.
- Treat the app as private/internal at this stage.

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
