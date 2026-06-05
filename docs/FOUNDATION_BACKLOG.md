# FOUNDATION Backlog

# Current Development Philosophy

The current development strategy for FOUNDATION is:
- incremental
- modular
- architecture-first
- schema-conscious
- operationally useful

Current priority is building stable intelligence infrastructure before advanced automation or AI systems.

The project should avoid premature complexity and focus on:
- reliable workflows,
- strong data relationships,
- and maintainable architecture.

---

# Current Development Phase

## Current Phase

Phase 1 - Core Intelligence Platform Foundation

## Current Goal

Build a stable platform capable of:
- storing intelligence records,
- organizing sources and articles,
- tagging records,
- filtering and searching,
- creating analyst-defined events linked to supporting articles,
- and supporting repeatable analyst workflows.

---

# Completed Milestones

# Tags System

## Completed Tasks

### Database
- [x] Create tags table
- [x] Create article_tags join table
- [x] Seed initial tags

### Types
- [x] Finalize tag.ts
- [x] Add ArticleWithTags derived application type

### Services
- [x] Finish tagService.ts
- [x] Add article-tag assignment in articleService.ts
- [x] Fetch/compose article records with related tags in the service layer

### Components
- [x] Create TagForm.tsx
- [x] Create TagList.tsx
- [x] Add tag selection to ArticleForm.tsx
- [x] Display tag badges on article records

### Pages
- [x] Create TagsPage.tsx
- [x] Add Tags route
- [x] Add Tags sidebar navigation
- [x] Load tags into ArticlesPage

### Standalone Tags CRUD
- [x] Create tags
- [x] List tags
- [x] Delete tags

### Article <-> Tag Relationships
- [x] Add article-tag relationship management
- [x] Allow multiple tags per article during article creation
- [x] Insert article_tags records after article creation
- [x] Reload articles after successful creation
- [x] Display tag badges/chips on article records
- [x] Keep Supabase access centralized in services

---

# Filtering & Search v1

## Completed Tasks
- [x] Create ArticleFilters component
- [x] Search article title
- [x] Search article summary
- [x] Filter articles by one tag
- [x] Filter articles by one source
- [x] Clear filters
- [x] Display filtered result count
- [x] Display filtered empty state
- [x] Keep filtering client-side for v1

## Still Open
- [ ] Date filtering
- [ ] Multi-tag filtering
- [ ] Server-side filtering/search
- [ ] URL state
- [ ] Saved filters

---

# Article Management v1

## Completed Tasks
- [x] Edit article title
- [x] Edit article URL
- [x] Edit article summary
- [x] Edit article source
- [x] Edit article published date
- [x] Edit article tags
- [x] Add/remove tags from existing articles
- [x] Retag existing articles
- [x] Delete article
- [x] Reuse ArticleForm for create/edit modes
- [x] Add edit/cancel support
- [x] Add Edit/Delete actions to ArticleList
- [x] Use native `window.confirm` for delete confirmation
- [x] Reload articles after successful edit/delete
- [x] Keep Supabase access centralized in articleService.ts

## Still Open
- [ ] Article detail page
- [ ] Advanced article workflow states
- [ ] Transactional article/tag update behavior

---

# Event v1

## Completed Tasks

### Database
- [x] Create events table
- [x] Create article_events join table

### Types
- [x] Create event.ts
- [x] Add Event TypeScript types

### Services
- [x] Create eventService.ts
- [x] Keep event Supabase access centralized in services
- [x] Replace linked articles through delete-then-insert behavior

### Components
- [x] Create EventForm.tsx
- [x] Create EventList.tsx

### Pages And Routes
- [x] Create EventsPage.tsx
- [x] Create EventDetailPage.tsx
- [x] Add `/events` route
- [x] Add `/events/:id` route
- [x] Add Events sidebar navigation

### Features
- [x] Create events
- [x] Edit events
- [x] Delete events
- [x] Link articles to events
- [x] Unlink articles from events
- [x] View event detail pages

## Still Open
- [ ] Event tags
- [ ] Event entity linking
- [ ] Timeline visualization
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges

---

# Event Refinement v1

## Completed Tasks
- [x] Create EventFilters component
- [x] Search event title
- [x] Search event description
- [x] Filter events by status
- [x] Filter events by event type
- [x] Clear event filters
- [x] Display filtered event result count
- [x] Display filtered event empty state
- [x] Keep event filtering client-side for v1
- [x] Add shared eventStatusOptions and eventTypeOptions constants
- [x] Update EventForm to use shared event status/type constants

## Still Open
- [ ] Event tags
- [ ] Event entity linking
- [ ] Timeline visualization
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges
- [ ] Server-side event search/filtering
- [ ] URL state
- [ ] Saved event filters

---

# Immediate Backlog

# Next Milestone

## Dashboard v1 / Events v1.1 Decision Point
- [ ] Decide whether the next milestone is Dashboard v1
- [ ] Decide whether the next milestone is Events v1.1
- [ ] Define Dashboard v1 metrics and recent intelligence views if chosen
- [ ] Define Events v1.1 scope if chosen

Neither Dashboard v1 nor Events v1.1 has started.

---

# Future Article Management Work

- [ ] Article detail page
- [ ] Improve article-level empty/loading/error states
- [ ] Advanced article review/workflow states

---

# Dashboard Improvements v1
- [ ] Real article count
- [ ] Real tag count
- [ ] Recent articles
- [ ] Recent sources
- [ ] Basic activity overview

---

# Future Filtering & Search Work

## Planned Features
- [ ] Date range filtering
- [ ] Multi-tag filtering
- [ ] Server-side filtering/search
- [ ] URL state for filters
- [ ] Saved filters
- [ ] Combined intelligence queries

## Long-Term Search Goals

Examples:
- "Taiwan + PLA Navy"
- "Semiconductors + Export Controls"
- "TSMC within last 30 days"

---

# Future Events v1.1

## Goal

Refine discrete geopolitical, technological, and operational developments after Event Refinement v1.

## Planned Event Types
- military exercises
- sanctions
- elections
- diplomatic meetings
- product launches
- export controls
- legislation
- cyber incidents

## Planned Refinements
- [ ] Event timelines
- [ ] Event tags
- [ ] Event entity linking
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges

---

# Future RSS Ingestion

## Goal

Automate intelligence collection after manual collection workflows are stable.

## Planned Features
- [ ] RSS source ingestion
- [ ] Automatic article creation
- [ ] Duplicate detection
- [ ] Metadata normalization
- [ ] Feed health monitoring

## Potential Sources
- Reuters
- Nikkei Asia
- CSIS
- CNA
- Taiwan government releases
- Semiconductor industry feeds

---

# Mid-Term Backlog

# Entity System

## Goal

Move beyond tags into structured real-world entities.

## Planned Entity Types
- countries
- organizations
- companies
- technologies
- individuals
- military branches

## Planned Features
- [ ] Entity extraction
- [ ] Entity relationships
- [ ] Entity pages
- [ ] Entity linking
- [ ] Entity timelines

---

# Timeline Intelligence

## Planned Features
- [ ] Chronological event visualization
- [ ] Linked article timelines
- [ ] Regional timelines
- [ ] Company timelines
- [ ] Technology timelines

---

# Notes And Analyst Workspace

## Planned Features
- [ ] Research notes
- [ ] Hypothesis tracking
- [ ] Intelligence reports
- [ ] Evidence linking
- [ ] Exportable briefings

---

# Watchlists

## Planned Features
- [ ] Follow tags
- [ ] Follow entities
- [ ] Follow organizations
- [ ] Follow countries
- [ ] Alert generation
- [ ] Recent activity summaries

---

# Financial Signals

## Planned Features
- [ ] Market signal watchlists
- [ ] Company and sector tracking
- [ ] Cross-linking financial signals to articles, tags, entities, and events

---

# AI-Assisted Workflows

## Planned Features
- [ ] Article summarization
- [ ] Auto-tagging
- [ ] Entity extraction
- [ ] Related article suggestions
- [ ] Topic clustering

## Current Philosophy

AI should assist analysts, not replace analysts.

---

# Long-Term Backlog

# Intelligence Graph

## Goal

Build relationship-based intelligence analysis.

## Planned Features
- [ ] Relationship mapping
- [ ] Graph visualization
- [ ] Connected intelligence exploration
- [ ] Multi-hop relationship discovery

---

# Signal Detection

## Planned Features
- [ ] Activity spikes
- [ ] Trend detection
- [ ] Emerging topic identification
- [ ] Reporting anomalies
- [ ] Escalation indicators

---

# Geographic Intelligence

## Planned Features
- [ ] Map overlays
- [ ] Regional intelligence layers
- [ ] Maritime tracking
- [ ] Trade route analysis
- [ ] Infrastructure mapping

---

# Multi-Tenant Architecture

## Goal

Allow multiple organizations or analysts to operate independent FOUNDATION environments.

## Planned Features
- [ ] User management
- [ ] Organization management
- [ ] Role-based access
- [ ] Workspace isolation
- [ ] Tenant-specific dashboards

---

# Infrastructure Backlog

# Current Infrastructure Goals
- [ ] Improve deployment pipeline
- [ ] Add environment separation
- [ ] Improve error handling
- [ ] Improve logging
- [ ] Add monitoring
- [ ] Add backups
- [ ] Track database migrations and RLS policies in-repo

---

# UI/UX Backlog

## Completed
- [x] Low-risk cleanup pass for dead navigation and stale starter files
- [x] Shared Card component in active use

## Planned Improvements
- [ ] Better mobile responsiveness
- [ ] Consistent spacing system
- [ ] Better typography
- [ ] Better loading states
- [ ] Better empty states
- [ ] Shared Button, Input, Textarea, and EmptyState components
- [ ] Better dashboard polish

---

# Current Architectural Constraints

Avoid introducing:
- microservices
- Kubernetes
- distributed systems
- graph databases
- event streaming systems
- advanced AI orchestration

until:
- core workflows stabilize,
- schema matures,
- and operational patterns become clearer.

---

# Current Success Criteria

Phase 1 will be considered successful when FOUNDATION can reliably:
- store intelligence data,
- organize information,
- classify articles,
- filter/search effectively,
- track events,
- and support repeatable analyst workflows.

At that point, FOUNDATION transitions from prototype to operational platform foundation.
