# Project workflow usability review

Date: 2026-10-16.
Status: implemented and locally verified; no Milestone 02 merge or deployment.
Branch: docs/project-workflow-ux-2026-10-16.
Reviewed implementation baseline: 0556a3f71c7f8ed8dd55baa36edda2a51d173157.
Earlier production baseline: a42454ea9c7930e56db0bfbfb0779a4729f1a70f.
Implementation and this report are working-tree changes beyond the branch baseline.
Brief: [Milestone 02](../milestones/02-project-workflow.md).

## Delivered workflow

Creating a project requires a name in a focused, keyboard-accessible native
modal. Optional scope is collapsed and explains that topics/keywords do not
activate matching rules. Creation lands on overview with Choose sources and
Capture a link. Account/project controls stay separate from research navigation.

Overview counts this project's enabled, available feeds and their sources,
items awaiting review and kept articles. It derives guidance for no configured
feeds, never-checked sources, collecting, feed failure, outside-scope material,
no new items, archived projects and a populated library. Research/event insights
remain available below a collapsed secondary section. Owner-wide source records
in those insights are explicitly labeled Workspace sources.

Sources now separates Following, Discover, Available sources and collection
details. Legacy sources remain available; a website without a feed is clearly
Manual only. Source-level Follow/Pause changes this project's subscriptions.
Shared availability and address editing name their cross-project effect and
stay inside advanced feed details. Feed checks, last success, plain-language
failure actions, raw history and matching rules are in this workspace.

Add source saves name/website with an optional feed and explicit follow choice.
A successful source ID is retained if feed creation fails; a successful feed ID
is retained if subscription setup fails. Retry updates/reuses those records,
preserves entered values, and reports Following only after the required saves.
Cancel does not delete already-saved records; they remain in Available sources.
A manual source offers Capture a link and its actual source-details destination.

Check now invokes the existing server collector and waits for its response.
Completion uses neutral current-project Inbox wording instead of claiming the
cross-project staged total as this project's new items. Failed/partial checks
stay actionable. Health refresh failures are distinguished from a completed
request, so a successful save/check is not mislabeled as an empty feed.

Inbox exposes Keep/Dismiss, edit-before-review, saved tags, reasons/history,
restore, outside-scope routing and selected-page bulk review. Bulk controls are
collapsed and item selections live in the item list, avoiding a duplicate list
of every visible title. The next selected item is derived only from current
visible filters. Empty guidance distinguishes filters, outside-scope intake,
nothing collected and completed review. Keep links to the actual converted
article through a supported Library highlight.

Library retains search/tag/source filters, edits, deletion and event support.
Capture-to-Inbox and direct manual article creation are separate secondary
paths. Metadata, publisher excerpts and saved summaries/analyst notes are labeled;
no full-text or automatic approval is implied. Project settings has comfortably
sized fields, Save/Cancel and collapsed advanced rules with rule-edit cancellation.

## Routes and compatibility

| Route | Result |
|---|---|
| / | Project overview, then optional research/event insights |
| /sources | Following by default; view query selects Discover, Available or collection details |
| /sources/:id | Same source workspace with source context, configuration, feeds and rules |
| /rss | Compatible redirect to /sources?view=collection, replacing the obsolete stage |
| /ingestion | Inbox; existing query/filter/session persistence remains |
| /articles | Library; capture=1 opens link capture and article=<id> highlights a saved record |
| /project | Project settings with optional advanced matching rules |
| Existing event/tag/entity routes | Preserved; Events/Tags remain secondary and Entities is absent from primary navigation |

Project switches return to overview and remount the selected-project subtree.
This deliberately clears stale view/filter/form state instead of carrying the
previous project's search into another project. Direct source links, /rss,
refresh and browser back are covered in the local browser journey.

## Backend and implementation boundaries

No SQL, migration, privilege, RLS, Edge Function, scheduler or hosted configuration
change was required. Existing services own all persistence and server collection.
The optional RssFeed failure_count type reflects an already-existing column;
health uses it when an older failed run is outside the bounded recent history.

The shared Button/Input/Textarea/EmptyState implementations, native dialog and
small base control styles extend the current dark theme. No new dependency,
component framework, AI, paid integration, scraper or invented feed was added.
The starter catalog explicitly describes its limited US economics/UK defence
coverage and reports a zero-match result for unrelated topics.

Source/feed/subscription saves are existing separate operations, not a new
cross-request database transaction. Retry guarantees apply to IDs returned to
the form. If a server commit succeeds but the connection loses its response,
reconcile Available sources before creating another record. This milestone does
not claim new backend idempotency or a distributed transaction.

## Verification evidence

| Command | Result |
|---|---|
| npm.cmd ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000 | Pass, 275 locked packages installed |
| npm.cmd run lint | Pass, zero errors/warnings |
| npm.cmd run build | Pass, TypeScript and production bundle; largest chunk about 229 kB, no bundle warning |
| npm.cmd test | Pass, 42 tests across eight files |
| npm.cmd run test:e2e | Pass, five browser journeys in headless Edge |
| npm.cmd run check:functions | Pass, frozen Deno checks for all three existing functions |
| npm.cmd run test:postgres | Pass, six separate-connection concurrency scenarios in a disposable local PostgreSQL cluster |
| git diff --check | Pass |

Browser coverage preserves the prior sign-in/isolation/server-search/partial-bulk/
restore checks and adds: new-project setup through Keep-to-Library; catalog
zero-match/following state; filtered-empty/completed-review guidance; switching;
manual-only source/capture/dismiss/restore; feed-save and subscription failures
with one source insert and one feed insert after retries; failed collection and
retry/pause; keyboard open/Escape/focus return; descriptive scope without rules;
and advanced rule-edit cancellation. The fixture deliberately returns a staged
count of 999 across projects; basic completion messaging does not claim it as a
current-project count. Tests use only foundation-test.invalid and fictional data.

Pure workflow tests cover no enabled sources, never-checked, collecting, empty,
outside-scope, error, kept and archive guidance; available workspace feeds do
not count without active project subscriptions. The existing database/function
suites remain intact. Mocks do not prove live Supabase browser authentication,
real collection responses, Render deployment or actual publisher availability.
No real account session or credentials were requested or used.

Keyboard testing found and fixed initial focus and focus restoration on native
modal closure. Visual inspection led to collapsing bulk review and integrating
item checkboxes, larger labeled fields, wrapping actions and readable rule rows.

## Desktop/mobile visual inspection

The browser journey renders 1440px desktop and 390px mobile screenshots for nine
states (18 PNGs): new-project, overview, sources, inbox, library, partial-save,
failed-feed, settings and advanced-rules. These are generated locally at
artifacts.local/workflow/<state>-<desktop|mobile>.png, intentionally ignored rather
than mixed with source or private production artifacts. Run npm run test:e2e to
regenerate them. Screenshots were opened and visually inspected, not merely saved.

All captured states assert document width does not exceed viewport width.
Controls/actions remain inside the viewport, long labels wrap, fields are
readable, descriptions/rules show at least four lines, primary/secondary actions
are distinguishable, partial-save guidance remains adjacent to preserved fields,
and modal focus is visible. Native modal contents scroll on narrow/short screens.
Long project names remain accessible through their select option; URLs wrap.

## Short demo

1. Sign in locally with the test fixture; choose New project and enter a name.
   Verify overview starts at zero enabled feeds despite existing workspace sources.
2. Choose sources. Search Taiwan to see honest no-match guidance, then clear the
   search and follow a starter feed. Following shows the real project state.
3. Open Following and Check now. Wait for completion, then Open inbox. In the
   fixture an incoming research update appears; real collection depends on feed health.
4. Edit its title/tags if desired, Keep, then View in library. The actual kept
   record is highlighted, with saved summary/notes and the original article link.
5. Switch projects. Overview counts and Library do not carry the previous
   project's research. /rss and direct source links still work with back/refresh.
6. Under Available sources, Add source with only a website. Confirm Manual only;
   Capture a link, Prepare link and Save to Inbox. It is not automatically kept.
7. Use the failure browser fixture to observe saved source/feed IDs and preserved
   fields, Retry setup, a publisher refusal, Check now retry and Pause source.
8. Open Project settings: edit optional descriptive scope, Save/Cancel, then
   expand advanced rules. Scope edits alone have not activated keyword filtering.

## Remaining external checks

Implementation is complete locally. This branch has not been pushed/merged or
deployed by this task. Publish the matching frontend within the active owner's
authorization, then validate the signed-in real-account journey, feed health and
project switching on the hosted release. The prior Render SPA rewrite is already
recorded as applied; this milestone does not establish a new hosted refresh pass.
Existing upstream 403/timeout/DNS failures, retention monitoring and the earlier
DNS-rebinding verification gap remain operational limits, not new UI successes.

No unresolved consequential product question remains for this implementation.

<details>
<summary>Original owner feedback and pre-implementation code review</summary>

## Owner feedback

The first attempt to use a new project felt cluttered and unintuitive. Inputs
were too small, buttons were difficult to distinguish from text, and the owner
could not tell how to choose sources or move from RSS to Ingestion to Articles.
The owner approved addressing this workflow before adding AI or expanding scope.
The broader visual rebrand can wait; basic control usability is part of this pass.

## Verified code findings

| Finding | Evidence | Consequence |
|---|---|---|
| Catalog and legacy CRUD are stacked | src/pages/SourcesPage.tsx renders SourceCatalog then SourceForm/SourceList | Source discovery, following and record management are visually conflated |
| Follow action redirects conceptually to a different screen | SourceCatalog message says manage feeds/rules on RSS | Basic setup crosses technical destinations without a clear journey |
| No guided project start | WorkspaceGate has inline create form and renders existing route after creation | New project does not explain or navigate to the next useful step |
| Overview begins with event-oriented metrics | DashboardPage.tsx | A new collection project receives little actionable guidance |
| Technical destinations are peers | Sidebar.tsx lists Articles, Ingestion, RSS, Tags and placeholder Entities | Users must infer workflow from implementation modules |
| Core shared controls are empty | ui/Button.tsx, Input.tsx, Textarea.tsx, EmptyState.tsx | New forms/actions lack a consistent accessible visual baseline |
| Some actions are plain text buttons | WorkspaceGate and SourceCatalog | Click targets and action hierarchy are unclear |
| Source create errors are only logged | SourcesPage.createSource | Users can miss failed saves; a unified form must preserve errors/input |
| Collection summary spans subscriptions | rssFeedService.fetchRssFeed warns created count includes other projects | UI must not call this the active project's new-item count |

These are repository observations plus the owner's live feedback. No signed-in
session, hosted database or production configuration was changed in this review.
Milestone 01 deployment evidence remains in 01-ingestion.md and current status;
it does not establish that this new UX has been built.

## Accepted product decisions for this milestone

- Project overview -> Sources -> Inbox -> Library is the primary research journey.
- RSS remains a supported collection mechanism inside Sources.
- Events and tag management remain available but are secondary to getting started.
- Explain which sources can collect automatically and which are manual-only.
- Keep AI optional; reuse the existing deployed collection and review backend.
- A project is useful without advanced rules, events or AI configured.
- Preserve existing sources, projects, research, security boundaries and links.

Routine implementation choices include layout, component composition, dialogs
versus dedicated edit views, responsive navigation and icon selection. Use the
brief's behavior and accessibility criteria rather than requesting approval for
every screen. Record consequential deviations and explain their effect.

## Required return handoff

Replace this status with the actual implementation state after work. Report:
branch/commit, user-visible workflow, touched routes, backend changes if any,
new-project/demo steps, desktop/mobile visual inspection, exact verification
commands/results, remaining live checks, known limitations and next decisions.
Report failed scenarios and inaccessible checks explicitly. Do not copy old
"not deployed" statements over newer verified rollout facts.


</details>
