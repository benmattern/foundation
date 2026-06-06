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
- [ ] Event-owned tags
- [ ] Event entity linking
- [ ] Global timeline module
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
- [ ] Event-owned tags
- [ ] Event entity linking
- [ ] Global timeline module
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges
- [ ] Server-side event search/filtering
- [ ] URL state
- [ ] Saved event filters

---

# Events v1.1 Intelligence Summary

## Completed Tasks
- [x] Add FoundationEventWithArticleTags derived type
- [x] Add getEventWithArticleTagsById(id)
- [x] Enrich event detail pages with linked articles that include tags
- [x] Create EventIntelligenceSummary component
- [x] Create EventArticleTimeline component
- [x] Display supporting article count
- [x] Display newest supporting article
- [x] Display oldest supporting article
- [x] Display event age
- [x] Display last activity date
- [x] Aggregate related tags from supporting articles
- [x] Add chronological supporting article timeline
- [x] Replace old linked articles card with supporting article timeline

## Still Open
- [ ] Event-owned tags
- [ ] Event entity linking
- [ ] Global timeline module
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges
- [ ] Future dashboard expansion

---

# Events v1.2 Activity & Analyst Workflow

## Completed Tasks
- [x] Add shared event/date/activity helpers in src/lib/eventMetrics.ts
- [x] Add EventSortOption type
- [x] Add EventListItem type
- [x] Create EventStatusOverview component
- [x] Add status overview cards for Draft, Active, Resolved, and Archived
- [x] Add event activity indicators to event list cards
- [x] Display supporting article count on event list cards
- [x] Display last activity on event list cards
- [x] Display occurred date on event list cards
- [x] Display status, event type, and location metadata on event list cards
- [x] Add sort control to EventFilters
- [x] Sort events by newest activity
- [x] Sort events by newest event
- [x] Sort events by oldest event
- [x] Sort events by most supporting articles
- [x] Compute event activity/count/sort client-side in EventsPage
- [x] Reuse shared event metric helpers in EventDetailPage

## Still Open
- [ ] Event-owned tags
- [ ] Event entity linking
- [ ] Global timeline module
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges
- [ ] Server-side event sorting/filtering

---

# Seed Data Script v1

## Completed Tasks
- [x] Create `supabase/seed.sql`
- [x] Seed sources
- [x] Seed articles
- [x] Seed tags
- [x] Seed `article_tags` relationships
- [x] Seed events
- [x] Seed `article_events` relationships
- [x] Use fixed UUIDs for seeded base records
- [x] Use seed-only cleanup targeting known demo UUIDs
- [x] Keep seeded data clearly marked as fictional prototype/demo data
- [x] Use fictional article URLs under `https://example.com/foundation-demo/`
- [x] Validate seeded dataset in the application

## Current Status

Complete for v1.

---

# Dashboard v1

## Completed Tasks
- [x] Build analyst workflow overview dashboard
- [x] Load sources, articles with tags, tags, and events with articles using `Promise.all`
- [x] Add real metric cards for Active Events, Total Events, Articles, and Sources
- [x] Add Events by status overview
- [x] Add Most Active Events by supporting article count
- [x] Add Recently Updated Events by last activity
- [x] Add Top Tags by article tag occurrence
- [x] Add Recent Articles by effective article date
- [x] Add friendly loading states
- [x] Add friendly error states
- [x] Add friendly empty states
- [x] Reuse EventStatusOverview
- [x] Add `dashboardMetrics` helper for client-side derived metrics

## Current Status

Complete for v1.

## Future Dashboard Work
- [ ] Entity metrics
- [ ] Timeline widgets
- [ ] Ingestion health widgets
- [ ] Financial widgets
- [ ] AI summaries/alerts
- [ ] Server-side dashboard aggregation

---

# URL Import v1

## Completed Tasks
- [x] Add Import from URL workflow on Articles page
- [x] Validate URL input
- [x] Normalize obvious URL formatting
- [x] Remove common UTM tracking parameters
- [x] Detect duplicate existing article by normalized URL
- [x] Match existing source by hostname
- [x] Prefill ArticleForm draft with normalized URL and matched source
- [x] Preserve analyst review before save
- [x] Avoid auto-save
- [x] Avoid source auto-creation

## Current Status

Complete for v1.

---

# URL Metadata Fetch v1.1

## Completed Tasks
- [x] Add Supabase Edge Function `fetch-url-metadata`
- [x] Deploy and validate Edge Function
- [x] Add frontend metadata response type
- [x] Add frontend metadata service wrapper
- [x] Fetch lightweight metadata from URL
- [x] Extract title, description, site name, published date, canonical URL, final URL, and source hints
- [x] Add metadata loading, error, warning, preview, and apply states
- [x] Preserve URL-only fallback
- [x] Keep metadata transient as draft data
- [x] Require analyst review before article save
- [x] Avoid full article scraping, paywall bypass, auto-summary, auto-tagging, source auto-creation, and auto-save

## Current Status

Complete for v1.1.

---

# Immediate Backlog

# Next Milestone

## Next Milestone Decision Point
- [ ] Decide whether the next milestone is Ingestion Review Queue / `ingestion_candidates`
- [ ] Decide whether the next milestone is Article Detail Pages
- [ ] Decide whether the next milestone is Source Management cleanup
- [ ] Decide whether the next milestone is Events v1.3

Seed Data Script v1, Dashboard v1, URL Import v1, and URL Metadata Fetch v1.1 are complete. The next milestone has not started.

---

# Seed Data Script

## Goal

Create repeatable prototype data for testing and demonstration.

## Completed Scope
- [x] Seed sources
- [x] Seed articles
- [x] Seed tags
- [x] Seed article_tags relationships
- [x] Seed events
- [x] Seed article_events relationships
- [x] Keep seed data clearly marked as prototype/test-only

Current status: complete for v1.

---

# Future Article Management Work

- [ ] Article detail page
- [ ] Improve article-level empty/loading/error states
- [ ] Advanced article review/workflow states

---

# Future Dashboard Improvements
- [ ] Entity metrics
- [ ] Timeline widgets
- [ ] Ingestion health widgets
- [ ] Financial widgets
- [ ] AI summaries/alerts
- [ ] Server-side dashboard aggregation

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

# Ingestion Roadmap

## Goal

Improve how intelligence enters FOUNDATION after manual workflows and schema foundations stabilize.

## Current State
- [x] Manual source/article/event entry

## Near-Term Support
- [x] Seed Data Script v1
- [x] URL Import v1
- [x] URL Metadata Fetch v1.1

## Planned Ingestion Layers
- [ ] Review queue
- [ ] `ingestion_candidates` schema
- [ ] RSS ingestion into Review Queue candidates
- [ ] Browser extension capture into Review Queue candidates
- [ ] Custom connectors

Current status: URL Import v1 and URL Metadata Fetch v1.1 are implemented as analyst-reviewed draft workflows. Review Queue is planned, not implemented, and should become the staging layer for future URL, RSS, browser extension, and connector intake before approved article creation.

## Planned Review Queue v1
- [ ] Create `ingestion_candidates` table
- [ ] Store candidates separately from approved articles
- [ ] Track candidate status: pending, accepted, rejected, duplicate
- [ ] Consider stale as later/optional status
- [ ] Store original URL, canonical URL, final URL, source match, title, description, published date, import source, raw metadata, and warnings
- [ ] Convert accepted candidates into articles through analyst action
- [ ] Keep rejected, duplicate, and stale candidates out of `articles`
- [ ] Detect duplicate candidates and duplicate articles
- [ ] Preserve analyst review before article creation

---

# Future Events Refinement

## Goal

Refine discrete geopolitical, technological, and operational developments after Events v1.2 Activity & Analyst Workflow.

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
- [ ] Global timeline module
- [ ] Event-owned tags
- [ ] Event entity linking
- [ ] Event AI suggestions
- [ ] Event severity/confidence scoring
- [ ] Event date ranges

---

# Future RSS Ingestion

## Goal

Automate intelligence collection after manual collection workflows are stable.

## Planned Features
- [ ] RSS source ingestion into Review Queue candidates
- [ ] Duplicate detection
- [ ] Metadata normalization
- [ ] Feed health monitoring
- [ ] Analyst approval before article creation

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
