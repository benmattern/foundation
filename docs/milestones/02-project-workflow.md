# Milestone 02: Clear project setup and research workflow

Status: ready for implementation, authorized by the owner on 2026-10-16.
Reviewed baseline: a42454ea9c7930e56db0bfbfb0779a4729f1a70f.
Implementation entry point: read AGENTS.md, then this file and
../reviews/02-project-workflow.md. Implement the complete milestone; do not stop
at another proposal or ask the owner to approve routine layout/component choices.
Publishing this brief does not mean its UI is implemented.

## Problem and outcome

The owner created a project and could not tell what to do next. Sources mixes
a new catalog with legacy record-management cards. RSS, Ingestion and Articles
look like independent destinations rather than a collection/review/library flow.
Inputs are cramped and buttons resemble static text.

A first-time analyst must be able to create a project, enable a collectable
source, receive candidates, keep relevant items and find them in the library
without an explanation outside the app. Automation and all core workflows work
without AI. This is a focused workflow/usability implementation, not a new backend
or a complete visual rebrand.

## Information architecture

| User destination | Responsibility |
|---|---|
| Project overview | Research scope, progress, current collection state and next useful action |
| Sources | Choose/manage sources, enable project collection, see health; feeds and rules live here |
| Inbox | Review incoming material, inspect reasons, tag, Keep or Dismiss |
| Library | Retained articles, search/filter/edit and optional manual capture |
| Events | Existing evidence-linked analysis workflow, secondary to getting started |
| Project settings | Scope and advanced project/default rules |
| Tags | Keep vocabulary management available as a secondary tool |

Remove RSS as a peer-level primary navigation destination. Reuse its functionality
inside Sources. Hide the unimplemented Entities destination from primary navigation.
Use Inbox instead of Ingestion and Library instead of Articles in user-facing
headings/navigation. Technical database names need not change.

Preserve /articles, /ingestion, /rss, /sources/:id and other existing deep links,
using aliases/redirects or compatible routes. /rss should open the relevant Sources
collection view. Retain meaningful source context and browser back/refresh behavior.
Do not strand existing bookmarks or remove existing analyst workflows.

## Project start and overview

- Keep sign-in and private project boundaries.
- Replace the always-visible inline new-project input with a clear New project
  action and a properly sized form/dialog/page. Keep project switch and account
  controls accessible without crowding the research header.
- Require only a useful name; description, topics and keywords are optional and
  editable later. Explain that scope metadata is not automatically an active
  keyword rule unless the app actually saves it as one.
- After creation, land on the project's overview with a primary Choose sources
  action. Also support Capture a link as a secondary manual path.
- Use real state: no subscriptions, sources enabled but never checked, collecting,
  collected items awaiting review, no matches, feed errors, and a populated library.
  Each has a useful action and a concise explanation.
- Show enabled source/feed count, candidates awaiting review and kept articles
  for this project. Owner-wide source records must not make a new project look
  configured. Label source and feed counts accurately.
- A compact guide can show Choose sources -> Review inbox -> Build library.
  It must reflect actual progress and remain available after setup without
  becoming a permanent wall of onboarding text.
- Retain existing event/dashboard insight below the task-oriented overview or in
  a secondary area. Do not make event creation a prerequisite for collecting.
- Switching projects refreshes overview/source/inbox/library state correctly.

## One coherent Sources workspace

Provide clearly separated views such as Following and Discover, plus a prominent
Add source action. Do not stack a catalog, always-open create form and unrelated
legacy list into one long page.

Following:
- List what this project follows, with clear enabled/paused state, source name,
  relevant feed count, last success and an actionable health/error indicator.
- Keep owner-wide source records accessible under Available sources or another
  clearly named view. Distinguish "available in your workspace" from "enabled
  for this project." Existing legacy sources remain discoverable.
- A source-level Follow/Pause control affects this project's subscriptions.
  Expose owner-wide feed availability only in advanced management and label
  its cross-project effect explicitly.
- A source without a feed is Manual only / Automatic collection not configured.
  A homepage is not a working collector. Provide Configure collection or Add feed.
- One primary Check now action requests existing server collection. Do not
  promise immediate results or mark success merely because a request was sent.
  After completion offer Review N new items / Open inbox when appropriate.
- Counts and summaries must describe this project's result. Existing
  rssFeedService summaries include all enabled projects; do not label that number
  as new items in the active project. Query current-project data or use neutral,
  accurate wording if a per-project delta is unavailable.
- Present plain-language errors with next actions: retry, edit feed, pause,
  open original source. Keep detailed run history and raw errors in expandable
  collection details; never imply a broken feed is simply empty.

Discover:
- Reuse the curated catalog and metadata filtering. Show coverage honestly.
- A catalog item already followed must show its true state rather than an
  undifferentiated Enable button. Following should update all relevant views.
- A zero-match state says no curated source matches, with Add source available.
  Do not present the two current generic catalog entries as Taiwan coverage.
- Catalog expansion and automatic feed discovery are not required in this pass.
  No invented feed URLs, fake successful checks or claimed full-text access.

Add/configure:
- One coherent form: source name, website, optional RSS/Atom URL, and explicit
  follow-in-this-project choice when collection is configured.
- Explain near the URL fields: website = origin/reference; feed = automatic
  incoming items. RSS/Atom may be named in helper/advanced text.
- Save a manual-only source successfully when no feed is supplied. Offer the
  manual link-capture path and future collection setup.
- Reuse existing source/feed/subscription operations with visible partial-save
  recovery. If source saves but feed/subscription fails, retain its ID and entered
  values; retry without duplicating records. Never clear failed forms or report
  "Following" before all required operations succeed.
- Feed configuration, collection health/history and per-source rules belong in
  source details or a source drawer, not another top-level research stage.
- Distinguish a source requiring a paid integration from a public feed where
  relevant. Do not implement publisher credentials or scraping.

## Inbox and Library

Inbox:
- One sentence: incoming material awaits your review; keeping adds it to Library.
- Primary action Keep; secondary Dismiss; Duplicate and technical metadata less
  prominent. These map to existing accepted/rejected/duplicate semantics.
- Preserve edit-before-acceptance, persistent tags, bulk operations, project
  isolation, rule reasons/history, restore and outside-scope routing.
- Readable title, source, published date and excerpt precede technical details.
  Original article opens clearly. An excerpt is never labeled full article text.
- After Keep, offer View in library using the actual approved article identity
  or a supported filtered/highlighted library destination. Do not invent an
  article detail route without implementing it.
- After a review action, next selection stays within current visible filters.
  Busy states, partial bulk failures and retry errors remain understandable.
- Empty states distinguish nothing collected, nothing matching rules, nothing
  matching current filters, and all items reviewed.

Library:
- Heading Library with explanation "Articles you've kept for this project."
- Retain searching/filtering, editing, tags, deletion and event relationships.
  Existing direct/manual article creation remains available as a secondary action.
- Clearly separate metadata previews, analyst notes and source content.
- Do not imply scheduled collection automatically approves articles.
- A source's original website can be visited for optional manual research; it is
  not the required collection workflow.

## Minimum visual and accessibility pass

Use the current dark theme and stack. No separate design system framework.

Implement the existing empty shared Button, Input, Textarea and EmptyState
components (or a small coherent equivalent) and use them throughout the touched
setup, Sources, Inbox, Library and settings surfaces. Avoid an unrelated whole-app
rewrite.

- Buttons have consistent solid primary, bordered secondary and distinguishable
  destructive styles; hover, focus, disabled and loading states are visible.
- Inputs have visible labels, boundaries, readable text and useful widths.
  Use full-width stacked fields on narrow screens. Avoid tiny inline rule fields.
- Aim for at least 44px interactive control height; use comfortably sized text
  areas (at least four visible lines) for descriptions, keyword lists and notes.
- Long names/URLs wrap or truncate with an accessible full value. No horizontal
  page scrolling at a 390px viewport.
- Source/project forms use explicit Save/Cancel; advanced settings are collapsed
  until requested. Avoid multiple competing primary actions on one surface.
- Keyboard operation, semantic labels, visible focus and associated field errors.
  Toggles have labels and actual state; color is not the sole status indicator.
- Use concise, contextual helper text instead of dense architecture explanations.
  No user-visible schema, lease, RPC or scheduler-secret jargon in basic flows.

## Implementation approach and limits

Start by reproducing the owner's journey in the current app/local fixtures.
Then implement navigation/overview, unified Sources, Inbox/Library and shared
controls in small internal steps within this single milestone.
Update browser tests when labels/routes change rather than deleting their checks.

Reuse transactional backend, RLS, subscriptions, collector and rules. Use existing
services; add small derived query/service helpers as needed. A large schema or
backend redesign is outside scope. Document any necessary additive backend change
and its rationale, prepare migrations if needed, and keep hosted mutations separate.
No AI, paid integrations, graph work, broad catalog research or autonomous actions.

## Verification and completion

- [ ] New project -> choose enabled feed -> Check now -> Inbox -> Keep -> Library
      is usable end to end without opening /rss or needing external instructions.
- [ ] Existing projects, legacy source records and approved research remain usable.
- [ ] Manual-only source and link capture work and are clearly differentiated.
- [ ] Following state/health is accurate; source/feed/subscription partial failures
      preserve form values and do not cause duplicates on retry.
- [ ] No enabled source, collecting, empty feed, outside-scope, failed feed,
      filtered-empty and completed-review states have distinct useful guidance.
- [ ] Project switching and collection counts never leak/mislabel another project.
- [ ] Existing deep links, back/forward and direct route refresh remain supported.
- [ ] Keep/Dismiss/restore and selected-page bulk review preserve backend semantics.
- [ ] Shared controls are visibly interactive, labeled and usable with keyboard.
- [ ] Desktop (1440px) and mobile (390px) screenshots are rendered and visually
      inspected; layouts have readable fields, no clipped actions or overflow.
- [ ] npm ci, lint, build, tests and browser tests pass. Run existing function/SQL
      checks if corresponding backend behavior changes; preserve full CI coverage.
- [ ] Add meaningful journey coverage for a new project, manual-only source,
      failed collection/save, Keep-to-library, and project switching. Mocks do not
      establish hosted signed-in behavior.
- [ ] Reconcile current docs and AGENTS pointers so deployed Milestone 01 and this
      active Milestone 02 are unambiguous; retain history separately, not as
      contradictory current instructions.
- [ ] Record evidence, deviations, remaining hosted checks and a short demo script
      in ../reviews/02-project-workflow.md. Do not mark implementation complete
      just because this brief or mocked tests exist.

Hosted merge/deploy and use of a real account follow the active owner's task
authorization. Do not request or print passwords/secrets. If live signed-in
validation cannot be completed, clearly separate local evidence from that gap.
