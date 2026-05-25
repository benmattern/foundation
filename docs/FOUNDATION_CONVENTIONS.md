# FOUNDATION Conventions

# Purpose Of This Document

This document defines coding, architecture, naming, and organizational conventions for FOUNDATION.

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

The project should favor:
- predictable structure
over:
- cleverness or unnecessary abstraction.

---

# Frontend Architecture Conventions

# Folder Structure

Current frontend structure:

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

Components should:
- be reusable,
- focused,
- and presentation-oriented.

---

## layouts/
Shared application layouts.

Examples:
- DashboardLayout

Layouts should:
- manage page structure,
- navigation,
- and persistent UI sections.

---

## pages/
Route-level pages.

Examples:
- SourcesPage
- ArticlesPage
- TagsPage

Pages should:
- coordinate data,
- manage page state,
- and compose components.

Pages should avoid:
- direct Supabase logic.

---

## services/
Backend/data-access layer.

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

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

---

## lib/
Low-level utilities and configuration.

Examples:
- supabaseClient.ts

---

# Naming Conventions

# File Naming

## Types
Use:
- lowercase
- singular

Examples:
- source.ts
- article.ts
- tag.ts

---

## Components
Use:
- PascalCase
- descriptive names

Examples:
- SourceForm.tsx
- ArticleList.tsx
- TagCard.tsx

---

## Pages
Use:
- PascalCase
- Page suffix

Examples:
- SourcesPage.tsx
- ArticlesPage.tsx
- TagsPage.tsx

---

## Services
Use:
- camelCase
- Service suffix

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

---

# Component Conventions

# Preferred Component Types

Prefer:
- focused,
- reusable,
- composable components.

Avoid:
- oversized “god components”.

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

Responsible for:
- visual presentation of individual records

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

until:
- complexity clearly requires them.

---

# Service Layer Conventions

# Database Access

All Supabase access should occur inside:
- service files.

Pages/components should:
- call services,
not:
- directly query Supabase.

---

# Service Naming

Pattern:

```txt
<domain>Service.ts
```

Examples:
- sourceService.ts
- articleService.ts

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

Use:
- lowercase
- plural table names

Examples:
- sources
- articles
- tags
- article_tags

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

Use:
- UUID primary keys

---

# Relationship Philosophy

FOUNDATION is intentionally relational.

Current direction:

```txt
Sources
  -> Articles
    -> Tags
    -> Entities
      -> Events
        -> Timelines
```

Relationships should remain:
- explicit,
- understandable,
- and maintainable.

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

Prefer:
- small iterative improvements
over:
- massive rewrites.

---

# Anti-Overengineering Policy

Avoid introducing:
- microservices
- Kubernetes
- distributed systems
- graph databases
- complex orchestration

until:
- real operational needs emerge.

---

# AI Philosophy

FOUNDATION should prioritize:
- analyst augmentation
over:
- analyst replacement.

AI features should:
- assist,
- summarize,
- classify,
- and organize.

Human analysis remains central.

---

# Documentation Conventions

Core project docs live in:

```txt
/docs
```

Current core docs:
- FOUNDATION_ARCHITECTURE.md
- FOUNDATION_STATUS.md
- FOUNDATION_BACKLOG.md
- FOUNDATION_DECISIONS.md
- FOUNDATION_SCHEMA.md
- FOUNDATION_RECOVERY_PROMPT.md
- FOUNDATION_CONVENTIONS.md

These documents should remain:
- lightweight,
- useful,
- and regularly updated.

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