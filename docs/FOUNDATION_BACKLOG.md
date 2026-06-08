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

# Review Queue v1

## Completed Tasks
- [x] Create `ingestion_candidates` table
- [x] Add Review Queue route at `/ingestion`
- [x] Add Ingestion sidebar navigation
- [x] Add ingestion candidate TypeScript types
- [x] Add ingestionCandidateService
- [x] Add candidate list/review UI
- [x] Add Save to Review Queue action from URL Import
- [x] Save normalized URL, metadata, warnings, and matched source when available
- [x] Preserve direct ArticleForm creation workflow
- [x] Accept candidate as article
- [x] Reject candidate
- [x] Mark candidate duplicate
- [x] Convert accepted candidates into approved article records
- [x] Record converted_article_id on accepted candidates
- [x] Accept/Reject/Duplicate workflow tested successfully

## Still Open
- [ ] Browser extension capture
- [ ] Custom connectors
- [ ] Batch import
- [ ] Review analytics
- [ ] Event linking during candidate acceptance
- [ ] Transactional candidate conversion

## Current Status

Complete for v1. Review Queue now provides a staging layer between URL intake and approved article creation.

---

# RSS Ingestion v1

## Completed Tasks
- [x] Create `rss_feeds` table
- [x] Add RSS feed TypeScript types
- [x] Add rssFeedService
- [x] Add RSS feed management UI
- [x] Add `/rss` route
- [x] Add RSS sidebar navigation
- [x] Add manual RSS ingestion through Fetch Feed Now
- [x] Add Supabase Edge Function `fetch-rss-feed`
- [x] Parse RSS 2.0 feeds
- [x] Parse Atom feeds
- [x] Create Review Queue candidates from feed items
- [x] Use `import_source = rss` for RSS-created candidates
- [x] Skip duplicates against existing ingestion candidates
- [x] Skip duplicates against existing articles
- [x] Display RSS fetch summary UI
- [x] Validate RSS ingestion end-to-end

## Still Open
- [ ] RSS scheduling
- [ ] Feed discovery
- [ ] OPML import/export
- [ ] Feed health monitoring beyond last checked timestamp

## Current Status

Complete for v1. Manual RSS ingestion now feeds Review Queue candidates rather than creating articles directly.

---

# Review Queue UX v1.1

## Completed Tasks
- [x] Add Review Queue status tabs
- [x] Add Pending tab
- [x] Add Accepted tab
- [x] Add Rejected tab
- [x] Add Duplicate tab
- [x] Add counts by status
- [x] Make Pending the default view
- [x] Remove reviewed items from Pending after action
- [x] Add Pending workflow behavior that advances the queue after review

## Still Open
- [ ] Bulk actions
- [ ] Keyboard shortcuts
- [ ] AI relevance scoring
- [ ] Priority queues
- [ ] Auto-tagging
- [ ] Review analytics

## Current Status

Complete for v1.1. Pending work is separated from accepted, rejected, and duplicate history.

---

# Review Queue UX v1.2

## Completed Tasks
- [x] Add sticky review panel on larger screens
- [x] Add narrower queue list
- [x] Add wider review panel
- [x] Add independently scrolling queue list
- [x] Preserve mobile layout
- [x] Improve review layout efficiency

## Still Open
- [ ] Bulk actions
- [ ] Keyboard shortcuts
- [ ] AI relevance scoring
- [ ] Priority queues
- [ ] Auto-tagging
- [ ] Review analytics

## Current Status

Complete for v1.2. The review surface now reduces scrolling during candidate review.

---

# Review Queue Preview Enhancement v1

## Completed Tasks
- [x] Add candidate preview text to queue cards
- [x] Add Review panel Preview section
- [x] Add shared preview helper
- [x] Use `candidate.description` as first preview source
- [x] Use `raw_metadata.description` as second preview source
- [x] Use `raw_metadata.summary` as third preview source
- [x] Show fallback when no preview is available

## Still Open
- [ ] First paragraph extraction
- [ ] AI summaries
- [ ] Relevance scoring
- [ ] Priority queues

## Current Status

Complete for v1. Preview uses existing candidate fields and metadata only.

---

# Review Queue UX v1.3

## Completed Tasks
- [x] Add queue search
- [x] Search candidate title
- [x] Search candidate URL fields
- [x] Search candidate description and preview text
- [x] Add source filter
- [x] Add import-source filter
- [x] Add clear filters
- [x] Add filtered empty state
- [x] Keep status tab counts status-wide rather than filtered
- [x] Keep filtering client-side for v1.3

## Still Open
- [ ] Bulk actions
- [ ] Keyboard shortcuts
- [ ] Server-side queue filtering/search
- [ ] URL state
- [ ] Saved queue filters
- [ ] Relevance scoring
- [ ] Priority queues

## Current Status

Complete for v1.3. Search and filters narrow candidates within the selected status tab.

---

# Review Queue UX v1.4

## Completed Tasks
- [x] Add analyst-centered review layout
- [x] Move primary actions to the top
- [x] Move title higher and make it prominent
- [x] Move Preview higher
- [x] Add compact metadata section
- [x] Move tags above technical details
- [x] Group URLs under Technical Details
- [x] Move Description/Summary below tags
- [x] Add top/bottom action rows

## Still Open
- [ ] Collapsible technical details
- [ ] More explicit metadata edit labels
- [ ] Bulk actions
- [ ] Keyboard shortcuts

## Current Status

Complete for v1.4. Review panel order now follows analyst triage decisions rather than schema order.

---

# Review Queue Article Links

## Completed Tasks
- [x] Make candidate title open article in a new tab
- [x] Add Open Article link in review panel
- [x] Add Open links for URL, Canonical URL, and Final URL
- [x] Preserve queue card selection behavior
- [x] Use safe new-tab link attributes

## Still Open
- [ ] Article detail pages
- [ ] Browser extension capture
- [ ] Custom connectors

## Current Status

Complete. Analysts can open source articles directly from queue and review surfaces.

---

# Immediate Backlog

# Next Milestone

## Next Milestone Decision Point
- [ ] Decide whether the next milestone is Bulk actions
- [ ] Decide whether the next milestone is Keyboard shortcuts
- [ ] Decide whether the next milestone is RSS Automation Planning
- [ ] Decide whether the next milestone is Article Detail Pages
- [ ] Decide whether the next milestone is Source Management Cleanup
- [ ] Decide whether the next milestone is Auth/RLS Planning

Seed Data Script v1, Dashboard v1, URL Import v1, URL Metadata Fetch v1.1, Review Queue v1, RSS Ingestion v1, Review Queue UX v1.1-v1.4, Review Queue Preview Enhancement v1, and Review Queue Article Links are complete. The next milestone has not started.

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
- [x] Review Queue v1
- [x] `ingestion_candidates` schema
- [x] Accept/reject/duplicate workflow
- [x] Candidate-to-article conversion
- [x] `rss_feeds` schema
- [x] RSS feed management
- [x] Manual RSS ingestion
- [x] fetch-rss-feed Edge Function
- [x] Feed-to-candidate workflow
- [x] Review Queue status tabs
- [x] Pending workflow behavior
- [x] Sticky review panel
- [x] Review layout improvements
- [x] Candidate preview text
- [x] Review panel preview section
- [x] Queue search
- [x] Source filter
- [x] Import-source filter
- [x] Clear filters
- [x] Analyst-centered review layout
- [x] Top/bottom action rows
- [x] Clickable article links

## Planned Ingestion Layers
- [ ] RSS scheduling
- [ ] Feed discovery
- [ ] OPML import/export
- [ ] Browser extension capture into Review Queue candidates
- [ ] Custom connectors
- [ ] Batch import
- [ ] Review analytics
- [ ] Event linking during candidate acceptance
- [ ] Transactional candidate conversion

Current status: URL Import v1, URL Metadata Fetch v1.1, Review Queue v1, RSS Ingestion v1, Review Queue UX v1.1-v1.4, Review Queue Preview Enhancement v1, and Review Queue Article Links are implemented as analyst-reviewed ingestion workflows. RSS scheduling, feed discovery, OPML import/export, browser extension capture, and custom connectors remain planned and should feed Review Queue candidates rather than approved articles directly.

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

# Future RSS Automation

## Goal

Automate and broaden RSS collection after manual RSS ingestion is validated.

## Planned Features
- [x] RSS source ingestion into Review Queue candidates
- [x] Duplicate detection against candidates and articles
- [x] Basic metadata normalization into candidate fields
- [ ] RSS scheduling
- [ ] Feed discovery
- [ ] OPML import/export
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
