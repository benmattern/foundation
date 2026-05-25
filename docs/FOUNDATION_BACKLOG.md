# FOUNDATION Backlog

# Current Development Philosophy

The current development strategy for FOUNDATION is:

- incremental
- modular
- architecture-first
- schema-conscious
- operationally useful

Current priority is:
- building stable intelligence infrastructure
before
- advanced automation or AI systems.

The project should avoid premature complexity and focus on:
- reliable workflows,
- strong data relationships,
- and maintainable architecture.

---

# Current Development Phase

## Current Phase
Phase 1 — Core Intelligence Platform Foundation

## Current Goal
Build a stable platform capable of:
- ingesting,
- organizing,
- tagging,
- filtering,
- and displaying intelligence data.

---

# Immediate Backlog

# Priority 1 — Tags System

## Goal
Transform articles into structured intelligence objects.

## Tasks

### Database
- [x] Create tags table
- [x] Create article_tags join table
- [x] Seed initial tags

### Types
- [x] Finalize tag.ts

### Services
- [x] Finish tagService.ts

### Components
- [x] Create TagForm.tsx
- [x] Create TagList.tsx

### Pages
- [x] Create TagsPage.tsx

### Relationships
- [ ] Add article-tag relationship management
- [ ] Allow multiple tags per article

### UI
- [ ] Add tag filtering to articles
- [ ] Add tag badges/chips to article cards
- [ ] Add tag search/filter UI

---

# Priority 2 — Event System

## Goal
Track discrete geopolitical, technological, and operational developments.

## Planned Event Types
- military exercises
- sanctions
- elections
- diplomatic meetings
- product launches
- export controls
- legislation
- cyber incidents

## Planned Tasks

### Database
- [ ] Create events table
- [ ] Create article_events join table

### Types
- [ ] Create event.ts

### Services
- [ ] Create eventService.ts

### Components
- [ ] EventForm.tsx
- [ ] EventList.tsx

### Features
- [ ] Event timelines
- [ ] Event filtering
- [ ] Event/article relationships

---

# Priority 3 — Search & Filtering

## Goal
Enable operational intelligence workflows.

## Planned Features
- [ ] Article search
- [ ] Tag filtering
- [ ] Multi-tag filtering
- [ ] Source filtering
- [ ] Date range filtering
- [ ] Event filtering
- [ ] Combined intelligence queries

## Long-Term Search Goals
Examples:
- “Taiwan + PLA Navy”
- “Semiconductors + Export Controls”
- “TSMC within last 30 days”

---

# Priority 4 — RSS Ingestion

## Goal
Automate intelligence collection.

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

# Priority 5 — Dashboard Improvements

## Planned Features
- [ ] Recent intelligence feed
- [ ] Trending tags
- [ ] Recent events
- [ ] Regional summaries
- [ ] Activity metrics
- [ ] Watchlists
- [ ] Timeline previews

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

# Watchlists

## Planned Features
- [ ] Follow tags
- [ ] Follow entities
- [ ] Follow organizations
- [ ] Follow countries
- [ ] Alert generation
- [ ] Recent activity summaries

---

# AI-Assisted Workflows

## Planned Features
- [ ] Article summarization
- [ ] Auto-tagging
- [ ] Entity extraction
- [ ] Related article suggestions
- [ ] Topic clustering

## Current Philosophy
AI should:
- assist analysts,
not
- replace analysts.

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

# Analyst Workspace

## Planned Features
- [ ] Research notes
- [ ] Hypothesis tracking
- [ ] Intelligence reports
- [ ] Evidence linking
- [ ] Exportable briefings

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

---

# UI/UX Backlog

## Planned Improvements
- [ ] Better mobile responsiveness
- [ ] Consistent spacing system
- [ ] Better typography
- [ ] Better loading states
- [ ] Better empty states
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
- and operational patterns are proven.

---

# Current Success Criteria

Phase 1 will be considered successful when FOUNDATION can reliably:

- store intelligence data,
- organize information,
- classify articles,
- track events,
- filter/search effectively,
- and support repeatable analyst workflows.

At that point, FOUNDATION transitions from:
- prototype
to:
- operational platform foundation.