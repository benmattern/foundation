# FOUNDATION Architectural Decisions

# Purpose Of This Document

This document records important architectural, structural, and strategic decisions made during development of FOUNDATION.

The purpose is to:
- preserve reasoning,
- prevent architectural drift,
- maintain consistency,
- and provide continuity across future development sessions.

This is not intended to be exhaustive documentation.

It is intended to capture:
- major choices,
- important conventions,
- and key tradeoffs.

---

# Core Project Identity

## Decision
FOUNDATION will be developed as a modular OSINT/intelligence platform rather than:
- a simple news aggregator,
- a pure AI tool,
- or a generalized dashboard application.

## Reasoning
The long-term vision requires:
- structured intelligence workflows,
- scalable relationship modeling,
- operational dashboards,
- and analytical tooling.

The project direction is inspired by:
- intelligence workstations,
- observatories,
- geopolitical monitoring systems,
- and long-horizon strategic analysis concepts.

---

# Technology Stack

# Frontend Stack

## Decision
Use:
- React
- TypeScript
- Vite
- Tailwind CSS

## Reasoning
This stack provides:
- rapid development,
- modular architecture,
- strong ecosystem support,
- modern UI flexibility,
- and scalability without unnecessary complexity.

Vite was chosen for:
- speed,
- simplicity,
- and developer experience.

TypeScript was chosen to improve:
- maintainability,
- consistency,
- and long-term scalability.

Tailwind was chosen to:
- accelerate UI iteration,
- enforce design consistency,
- and simplify component styling.

---

# Backend Stack

## Decision
Use:
- Supabase
- PostgreSQL

## Reasoning
Supabase provides:
- authentication,
- PostgreSQL hosting,
- REST/RPC access,
- row-level security,
- and rapid backend iteration.

This avoids premature backend complexity while still supporting:
- scalable schema design,
- relational modeling,
- and future extensibility.

PostgreSQL was chosen because:
- relational data is central to the project,
- structured intelligence relationships matter,
- and SQL querying aligns with analytical workflows.

---

# Deployment Strategy

## Decision
Deploy frontend using:
- GitHub
- Render Static Site

## Reasoning
This deployment model:
- minimizes operational complexity,
- supports rapid iteration,
- provides automatic deployment,
- and keeps infrastructure lightweight during early development.

Current deployment flow:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

---

# Frontend Architecture

# Route-Based Architecture

## Decision
Use:
- route-based pages
- shared layouts
- reusable components

## Reasoning
This architecture:
- scales cleanly,
- avoids oversized App.tsx files,
- improves maintainability,
- and supports future expansion.

---

# Service Layer Architecture

## Decision
All Supabase/database access should be isolated inside service files.

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

## Reasoning
This:
- separates UI from data access,
- simplifies components,
- improves maintainability,
- and allows future backend flexibility.

Pages and components should not directly query Supabase.

---

# Type Organization

## Decision
Use:
- lowercase filenames
- singular naming
- one file per entity/domain

Examples:
- source.ts
- article.ts
- tag.ts

## Reasoning
This improves:
- consistency,
- readability,
- import predictability,
- and long-term maintainability.

---

# Component Architecture

## Decision
Use reusable:
- forms
- lists
- cards
- layout components

Examples:
- SourceForm
- SourceList
- ArticleForm
- ArticleList

## Reasoning
This:
- reduces duplication,
- improves consistency,
- and supports scalable UI growth.

---

# UI Direction

## Decision
FOUNDATION should use:
- dark themes
- operational dashboard styling
- intelligence/workstation aesthetics
- modular layouts

## Design Inspirations
- observatories
- intelligence workstations
- strategic operations centers
- monitoring systems

## Reasoning
The visual identity should reinforce:
- operational awareness,
- structured analysis,
- and intelligence workflows.

The UI should feel:
- focused,
- modern,
- analytical,
- and information-dense without becoming cluttered.

---

# Data Architecture

# Relational Intelligence Model

## Decision
The core architecture direction is:

```txt
Sources -> Articles -> Tags -> Entities -> Events -> Timelines
```

## Reasoning
This progression allows:
- incremental complexity,
- stable schema growth,
- and increasingly sophisticated analytical capabilities.

The project intentionally begins with:
- articles and tags
before:
- entities and graph relationships.

---

# Tags Before Entities

## Decision
Implement:
- tags/topics
before:
- structured entities.

## Reasoning
Tags:
- are operationally useful immediately,
- simplify classification,
- help establish taxonomy,
- and avoid premature schema complexity.

Entities will require:
- stronger normalization,
- relationship modeling,
- and more mature schema design.

---

# Intelligence Workflow Philosophy

## Decision
FOUNDATION should prioritize:
- analyst augmentation
over:
- analyst replacement.

## Reasoning
The platform should:
- organize,
- surface,
- correlate,
- and structure information.

It should not:
- make autonomous geopolitical conclusions,
- generate unsupported predictions,
- or attempt unsupervised reasoning.

AI should assist:
- filtering,
- summarization,
- and relationship discovery.

Human analysts remain central.

---

# Development Philosophy

# Incremental Architecture

## Decision
Build:
- small,
- modular,
- stable,
- extensible systems.

Avoid:
- large premature systems.

## Reasoning
The project is currently:
- solo-developed,
- evolving rapidly,
- and architecture-sensitive.

Premature complexity would:
- slow development,
- increase maintenance burden,
- and reduce flexibility.

---

# Anti-Overengineering Policy

## Decision
Avoid introducing:
- microservices
- Kubernetes
- distributed systems
- event streaming systems
- graph databases
- complex AI orchestration

until:
- core workflows stabilize,
- schema matures,
- and operational patterns are proven.

## Reasoning
Current priorities are:
- reliable workflows,
- schema stability,
- maintainable architecture,
- and operational usefulness.

---

# Intelligence Domain Focus

## Decision
Initial focus areas include:
- Taiwan
- China
- Indo-Pacific geopolitics
- Semiconductors
- AI infrastructure
- Maritime security
- Supply chains

## Reasoning
These domains:
- are strategically significant,
- contain strong interconnected systems,
- and provide rich opportunities for structured intelligence workflows.

---

# Documentation Strategy

## Decision
Maintain dedicated project documentation including:
- ARCHITECTURE
- STATUS
- BACKLOG
- DECISIONS
- SCHEMA

## Reasoning
As the project grows:
- chat continuity becomes insufficient,
- architectural memory becomes critical,
- and operational clarity becomes necessary.

Documentation serves as:
- onboarding,
- continuity,
- architecture memory,
- and strategic alignment.

---

# Long-Term Direction

## Decision
FOUNDATION should evolve toward:
- structured intelligence analysis,
- relationship-based workflows,
- operational monitoring,
- and strategic awareness systems.

Potential future capabilities include:
- intelligence graphs
- timelines
- watchlists
- AI-assisted analysis
- signal detection
- geographic overlays
- collaborative analyst workflows

## Reasoning
The long-term vision is:
not
- a generic CRUD application,
but
- a modular civilian intelligence platform.