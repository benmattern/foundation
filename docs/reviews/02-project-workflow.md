# Project workflow usability review

Date: 2026-10-16.
Reviewed main: a42454ea9c7930e56db0bfbfb0779a4729f1a70f.
Status: implementation handoff prepared; UI implementation has not started here.
Active brief: ../milestones/02-project-workflow.md.

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
