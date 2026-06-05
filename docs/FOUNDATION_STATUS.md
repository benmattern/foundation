# FOUNDATION Current Status

## Project Status

FOUNDATION is currently in early Phase 1 development.

The application has moved from initial prototype setup into a functioning modular web application with working foundational CRUD-style flows, Supabase persistence, route-based pages, a service-layer architecture, operational Article <-> Tag relationships, client-side Filtering & Search v1, and Article Management v1 for articles.

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
- Edit/Delete actions in ArticleList
- Delete confirmation with `window.confirm`
- Articles reload after successful edit/delete
- Client-side search by article title
- Client-side search by article summary
- Client-side filter by one tag
- Client-side filter by one source
- Clear filters button
- Filtered result count
- Filtered empty state

## Not Yet Implemented
- Article detail page
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL query params
- Saved filters

## Current Status

Operational for create, list, edit, delete, source association, published date handling, multi-tag assignment, retagging, tag display, and client-side Filtering & Search v1 workflows.

## Current Flow

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
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
- Tags can filter articles in Filtering & Search v1

## Current Status

Standalone Tags CRUD and Article <-> Tag relationship workflows are complete for the current stage.

Article tags can be added, removed, and replaced on existing articles through Article Management v1.

---

# Filtering & Search v1

## Implemented
- ArticleFilters component
- Search article title
- Search article summary
- Filter articles by one tag
- Filter articles by one source
- Clear filters
- Filtered result count
- Filtered empty state
- Client-side filtering over loaded `ArticleWithTags[]`

## Not Yet Implemented
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

## Current Status

Complete for v1.

---

# Article Management v1

## Implemented
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
- Inline/page-level edit panel
- Edit/cancel support
- Edit/Delete actions in ArticleList
- Native `window.confirm` delete confirmation
- Articles reload after successful edit/delete

## Not Yet Implemented
- Article detail page
- Advanced article workflow states
- Transactional article/tag updates

## Current Status

Complete for v1.

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
       -> Filtering/Search v1
       -> Article Management v1
```

## Next Milestone

Events Planning is the next milestone. Events implementation has not started.

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

Next priority:
1. Events Planning
2. Dashboard Improvements v1
3. Article detail page / advanced article workflows

Open Filtering/Search follow-ups:
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

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
- Search/filtering is client-side only
- Data normalization
- UI consistency
- Empty shared UI primitives for Button, Input, Textarea, and EmptyState
- Event/timeline schema design
- Form validation consistency
- Better typing standardization across components
- Frontend-driven article creation and tag assignment are not transactionally coupled
- Article update and tag replacement are not transactionally coupled
- Article retagging uses delete-then-insert tag replacement
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
