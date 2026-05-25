# FOUNDATION Architecture

## Vision

FOUNDATION is an OSINT-focused intelligence and monitoring platform designed to collect, organize, structure, and analyze open-source information.

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

### Current Folder Structure

```txt
src/
├── components/
├── layouts/
├── pages/
├── services/
├── types/
├── lib/
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
- Reusable card components
- Route-based navigation

## Sources
Current functionality:
- Create source
- Edit source
- Delete source
- Source listing
- Source detail pages
- Supabase persistence

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

Current article direction:
- articles belong to sources
- future entity extraction planned
- future tagging planned

---

# Current Database Direction

Current architecture direction:

```txt
Sources -> Articles -> Entities -> Timeline Events
```

Long-term relational direction:

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

# Current Priorities

## Immediate Priorities
1. Tags / Topics system
2. Article-to-tag relationships
3. Event system
4. Search and filtering
5. RSS ingestion
6. Dashboard improvements

## Mid-Term Priorities
- Entity extraction
- Timeline visualization
- Watchlists
- AI-assisted summaries
- Correlation workflows

## Long-Term Priorities
- Intelligence graph
- Signal detection
- Trend analysis
- Predictive indicators
- Multi-tenant architecture
- Advanced OSINT tooling

---

# Current Services

## Existing Service Layer
Current services include:
- sourceService.ts
- articleService.ts

Service layer is intended to:
- isolate Supabase logic
- simplify component structure
- improve maintainability
- support future backend flexibility

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

## Entities
Represents structured real-world objects.

Examples:
- countries
- organizations
- companies
- technologies
- individuals

## Events
Represents discrete incidents or developments.

Examples:
- military exercises
- sanctions
- elections
- product launches
- diplomatic meetings

---

# Known Technical Debt

## Current Areas To Improve
- Search/filtering architecture
- Data normalization
- More consistent type organization
- Better form validation
- Improved UI consistency
- Event/timeline schema design

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
- hardware/sensor integrations

The project direction is heavily inspired by:
- observatories
- intelligence systems
- geopolitical analysis platforms
- long-horizon systems analysis
- Foundation-series concepts
- strategic warning systems