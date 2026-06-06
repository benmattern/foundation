# FOUNDATION Conventions

# Purpose Of This Document

This document defines coding, architecture, naming, documentation, and assistant-workflow conventions for FOUNDATION.

The goal is to:
- maintain consistency,
- reduce architectural drift,
- simplify future development,
- and improve maintainability as the project grows.

These conventions should evolve carefully and intentionally.

---

# Core Philosophy

FOUNDATION prioritizes:
- clarity,
- modularity,
- maintainability,
- consistency,
- and operational usefulness.

The project should favor predictable structure over cleverness or unnecessary abstraction.

---

# Frontend Architecture Conventions

# Folder Structure

Current frontend structure:

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

# Folder Responsibilities

## components/

Reusable UI components.

Examples:
- forms
- lists
- cards
- layout widgets
- buttons
- reusable UI blocks

Components should be reusable, focused, and presentation-oriented.

---

## layouts/

Shared application layouts.

Examples:
- DashboardLayout

Layouts should manage page structure, navigation, and persistent UI sections.

---

## pages/

Route-level pages.

Examples:
- SourcesPage
- ArticlesPage
- TagsPage
- EventsPage

Pages should:
- coordinate data,
- manage page state,
- and compose components.

Pages should avoid direct Supabase logic.

---

## services/

Backend/data-access layer.

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts
- eventService.ts

Services are responsible for:
- Supabase queries,
- data access,
- CRUD operations,
- and backend communication.

All Supabase access should remain isolated to services.

---

## types/

Shared TypeScript types.

Conventions:
- lowercase filenames
- singular naming
- one entity/domain per file

Examples:
- source.ts
- article.ts
- tag.ts
- event.ts

---

## lib/

Low-level utilities and configuration.

Examples:
- supabaseClient.ts
- eventMetrics.ts

Reusable derived metric helpers that span pages/components may live in `src/lib/`.

---

# Naming Conventions

# File Naming

## Types

Use lowercase, singular filenames.

Examples:
- source.ts
- article.ts
- tag.ts

---

## Components

Use PascalCase and descriptive names.

Examples:
- SourceForm.tsx
- ArticleList.tsx
- TagCard.tsx

---

## Pages

Use PascalCase with the Page suffix.

Examples:
- SourcesPage.tsx
- ArticlesPage.tsx
- TagsPage.tsx

---

## Services

Use camelCase with the Service suffix.

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

---

# Component Conventions

# Preferred Component Types

Prefer focused, reusable, composable components.

Avoid oversized "god components".

---

# Component Categories

## Forms

Examples:
- SourceForm
- ArticleForm
- TagForm

Responsible for:
- controlled inputs
- validation
- submit handling

---

## Lists

Examples:
- SourceList
- ArticleList
- TagList

Responsible for:
- rendering collections
- empty states
- list organization

---

## Cards

Examples:
- SourceCard
- ArticleCard

Responsible for visual presentation of individual records.

---

# State Management Conventions

## Current Strategy

Use:
- local component state
- lifted state where necessary

Avoid introducing:
- Redux
- Zustand
- global state systems

until complexity clearly requires them.

---

# Service Layer Conventions

# Database Access

All Supabase access should occur inside service files.

Pages/components should call services, not directly query Supabase.

---

# Service Naming

Pattern:

```txt
<domain>Service.ts
```

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

---

# Service Responsibilities

Services should:
- encapsulate CRUD logic
- handle Supabase communication
- isolate backend details

Services should avoid:
- UI concerns
- presentation logic

---

# Database Conventions

# Table Naming

Use lowercase plural table names.

Examples:
- sources
- articles
- tags
- article_tags
- events
- article_events

---

# Join Tables

Pattern:

```txt
<entity>_<entity>
```

Examples:
- article_tags
- article_events
- article_entities

---

# IDs

Use UUID primary keys.

---

# Relationship Philosophy

FOUNDATION is intentionally relational.

Current implemented relationship model:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
    <-> Events v1
       -> Event Refinement v1
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
```

Long-term direction:

```txt
Sources
  -> Articles
    -> Tags
    -> Entities
      -> Events
        -> Timelines
```

Relationships should remain explicit, understandable, and maintainable.

Avoid premature graph complexity.

---

# UI Conventions

# Current UI Direction

FOUNDATION uses:
- dark themes
- operational dashboard styling
- observatory/intelligence aesthetics

The UI should feel:
- analytical
- focused
- information-dense
- modern
- clean

---

# Dashboard Philosophy

Prioritize:
- clarity
- scannability
- operational awareness
- filtering
- structured information

Avoid:
- excessive visual clutter
- unnecessary animation
- marketing-style design

---

# Development Philosophy

# Incremental Architecture

Prefer small iterative improvements over massive rewrites.

---

# Anti-Overengineering Policy

Avoid introducing:
- microservices
- Kubernetes
- distributed systems
- graph databases
- complex orchestration

until real operational needs emerge.

---

# AI Philosophy

FOUNDATION should prioritize analyst augmentation over analyst replacement.

AI features should:
- assist,
- summarize,
- classify,
- and organize.

Human analysis remains central.

Do not add AI-assisted workflows before core source, article, tag, event, search, and analyst workflows are stable unless the user explicitly changes priority.

---

# Documentation Conventions

Core project docs live in:

```txt
docs/
```

Current core docs:
- FOUNDATION_ARCHITECTURE.md
- FOUNDATION_STATUS.md
- FOUNDATION_BACKLOG.md
- FOUNDATION_DECISIONS.md
- FOUNDATION_SCHEMA.md
- FOUNDATION_RECOVERY_PROMPT.md
- FOUNDATION_CONVENTIONS.md

These documents should remain lightweight, useful, and regularly updated.

When docs and code disagree, inspect the current source code before updating implementation plans.

---

# ChatGPT/Codex Alignment Procedure

Use this procedure when starting or resuming work with ChatGPT, Codex, or another AI coding assistant.

## Before Implementation

1. Read `docs/FOUNDATION_RECOVERY_PROMPT.md`.
2. Read `docs/FOUNDATION_STATUS.md`.
3. Read `docs/FOUNDATION_BACKLOG.md`.
4. Inspect the source files related to the requested change.
5. Confirm whether the request is review-only or implementation work.
6. Treat source code as the final authority for implemented behavior.

## During Implementation

1. Keep Supabase access inside `src/services/`.
2. Keep page components responsible for data orchestration and component composition.
3. Keep reusable presentation logic inside `src/components/`.
4. Do not introduce planned features as if they already exist.
5. Prefer small, focused changes that match existing project patterns.
6. Avoid schema changes unless the user explicitly requests them.

## After Implementation

1. Run `npm.cmd run build` when practical.
2. Update relevant docs if the implementation changes current status, schema, or backlog.
3. Clearly report what changed, what was verified, and what remains incomplete.
4. Note any documentation drift discovered during the work.

## Current Priority Alignment

Standalone Tags CRUD, Article <-> Tag relationships, Filtering & Search v1, Article Management v1, Event v1, Event Refinement v1, Events v1.1 Intelligence Summary, and Events v1.2 Activity & Analyst Workflow are complete for the current stage.

The next milestone is:

```txt
Seed Data Script / Dashboard v1 decision point
```

Neither Seed Data Script nor Dashboard v1 has started. Ingestion is elevated as a roadmap layer, but URL import, RSS ingestion, browser extension capture, review queue, and custom connectors are not implemented. Do not skip ahead to entities, timelines, RSS ingestion, Financial Signals, or AI workflows unless the user explicitly reprioritizes.

---

# Long-Term Direction

FOUNDATION is intended to evolve into:
- a modular intelligence platform,
- supporting structured analysis,
- operational monitoring,
- timeline workflows,
- relationship analysis,
- and strategic awareness systems.

Current focus remains:
- stable architecture,
- clean schema design,
- and scalable operational workflows.
