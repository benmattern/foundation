# FOUNDATION Architecture

## Vision

FOUNDATION is an OSINT-focused intelligence and monitoring platform designed to collect, organize, structure, filter, and analyze open-source information.

The long-term goal is to build a modular intelligence operating system capable of supporting:
- geopolitical monitoring,
- technology and semiconductor analysis,
- event and timeline tracking,
- entity relationships,
- AI-assisted analysis,
- and operational awareness workflows.

Initial focus areas include:
- Taiwan
- China
- Indo-Pacific geopolitics
- Semiconductors
- AI infrastructure
- Maritime security
- Supply chain analysis

The platform is intended to evolve from a simple intelligence repository into a structured intelligence and analysis environment.

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

# Current Architecture

## Frontend Structure

Current frontend architecture uses:
- route-based pages
- shared layouts
- reusable UI components
- service-layer abstraction for Supabase access
- client-side page state for early filtering/search workflows
- inline/page-level article management for early edit/delete workflows

### Current Folder Structure

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

# Current UI Direction

The current UI direction is:
- dark themed
- operational/intelligence focused
- dashboard-oriented
- clean and modern
- modular and scalable

Design themes:
- observatory
- monitoring station
- strategic operations dashboard
- intelligence workstation

---

# Current Features

## Dashboard
- Shared dashboard layout
- Sidebar navigation
- Reusable Card component
- Reusable PageHeader component
- Route-based navigation
- Basic source count metric

## Sources

Current functionality:
- Create source
- Edit source
- Source listing
- Source detail pages
- Supabase persistence

Not implemented:
- Source delete
- Source filtering/search

Current source fields:
- id
- name
- url
- category
- notes
- created_at

## Articles

Current functionality:
- Create article
- Associate article with source
- Store article metadata
- Article listing
- Assign multiple tags during article creation
- Display tag badges on articles
- Client-side search by title and summary
- Client-side filter by one tag
- Client-side filter by one source
- Clear filters
- Filtered result count
- Filtered empty state
- Edit article metadata
- Edit article source
- Edit article published date
- Edit article tags
- Add/remove tags from existing articles
- Retag existing articles
- Delete articles

Not implemented:
- Article detail page
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

## Tags

Current functionality:
- Create tag
- List tags
- Delete tag
- Assign tags to new articles
- Display tags on article records
- Filter articles by one tag

---

# Current Data And Workflow Model

Current implemented flow:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
```

Long-term relational direction:

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

# Current Milestone Status

Completed:
1. Sources foundation
2. Articles foundation
3. Standalone Tags CRUD
4. Article <-> Tag relationships
5. Filtering & Search v1
6. Article Management v1

Next milestone:
- Events Planning

Events implementation has not started.

---

# Current Services

## Existing Service Layer

Current services include:
- sourceService.ts
- articleService.ts
- tagService.ts

Service layer is intended to:
- isolate Supabase logic
- simplify component structure
- improve maintainability
- support future backend flexibility

Article service currently composes `ArticleWithTags` from articles, article_tags, and tags rather than relying on nested Supabase relationship selects.

---

# Current Deployment Workflow

Current deployment flow:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

Environment variables currently required:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

# Planned Core Data Models

## Sources

Represents external information sources.

Examples:
- news organizations
- think tanks
- government agencies
- research institutions
- RSS feeds

## Articles

Represents individual intelligence items or reports.

Examples:
- news articles
- press releases
- analysis pieces
- official statements

## Tags

Represents topics or classifications.

Examples:
- Taiwan
- China
- Semiconductors
- Export Controls
- PLA Navy

## Events

Represents discrete incidents or developments.

Examples:
- military exercises
- sanctions
- elections
- product launches
- diplomatic meetings

## Entities

Represents structured real-world objects.

Examples:
- countries
- organizations
- companies
- technologies
- individuals

---

# Known Technical Debt

## Current Areas To Improve
- Filtering/search is client-side only
- Data normalization
- More consistent type organization
- Better form validation
- Improved UI consistency
- Event/timeline schema design
- Article creation and tag assignment are frontend-driven separate operations
- Article update and tag replacement are frontend-driven separate operations
- Article retagging uses delete-then-insert tag replacement

---

# Architectural Principles

## Current Philosophy

Prioritize:
- modularity
- clarity
- extensibility
- stable schema design
- operational usefulness

Avoid premature:
- microservices
- overengineering
- complex infrastructure
- excessive automation

Current focus is:
- building a stable foundation
- establishing reliable workflows
- structuring intelligence data correctly

---

# Long-Term Vision

FOUNDATION is intended to evolve into a modular civilian intelligence platform capable of:
- structured research,
- operational monitoring,
- intelligence analysis,
- trend discovery,
- and strategic awareness.

Potential future capabilities:
- AI-assisted analysis
- relationship graphing
- map overlays
- timeline intelligence
- watchlists
- alerting systems
- collaborative analysis
- Financial Signals
- hardware/sensor integrations

The project direction is heavily inspired by:
- observatories
- intelligence systems
- geopolitical analysis platforms
- long-horizon systems analysis
- Foundation-series concepts
- strategic warning systems
