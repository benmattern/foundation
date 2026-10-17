# Milestone 05: Research sessions and evidence-backed briefs

Status: deployed via PR #5; see [review results](../reviews/05-research-sessions-and-briefs.md) for local and hosted verification boundaries.
Prepared 2026-10-16. Baseline reviewed: 07ea5e85617d589fba4e3e3a278068cfe25c181d.
Context: [next-enhancement proposals](../planning/next-enhancements.md).
Prerequisite: preserve deployed 01-04; inspect actual code before implementation.

## Outcome

An analyst can return after a few days, identify relevant changes, resume one
question, compare its evidence and produce a concise cited brief without AI.
Build on questions, notes, findings, dispositions, entities and citations already
implemented. Avoid a new disconnected Reports module or another large setup flow.

## A. Return to the project

Add a compact Continue research section on overview:
- Explicitly chosen current question or last deliberately opened question.
- New kept evidence, changes to linked questions/findings and relevant confirmed
  entity mentions since an explicit project checkpoint.
- Pending Inbox/Later work and important collection failures, with direct actions.
- Action to resume a question; recent saved views where configured.
- No new material is an honest, useful state; background poll timestamps alone
  must not look like new research.

Keep checkpoints per authenticated owner/project and optionally question. Opening
the project does not silently mark everything reviewed. Advance the checkpoint by
an explicit Mark reviewed / Finish session action with a captured upper bound.
Changes committed after that bound remain new. Handle multiple tabs/devices and
first visit, clock/timezone differences, retries and empty history.

Distinguish publication time, collection time, project approval time and research
edit time. Do not claim a newly captured old article is newly published.

Do not derive complete change counts by filtering only the latest 100 audit rows.
Use authorized paginated/incremental server queries with deterministic cursors and
explicit coverage boundaries. Preserve immutable history and project isolation.

## B. Saved working views

Let users save useful Library/Inbox filters with a name and reopen them:
- Selected sources, tags, dates, status/routing and sort; optionally question or
  confirmed entity filters when supported.
- Project-scoped definitions with stable object IDs and validated filter schema.
- Editing/deleting a view never changes research records.
- Missing source/tag/question references produce clear guidance, not a silently
  broader query. Save relative periods explicitly, distinct from fixed dates.
- Source matching rules and saved browsing filters stay visibly different.
  A view is not an intake rule.
- Keep URL/back navigation usable and no default view that hides all new work.

A simple saved-filter list/dropdown is enough; no dashboard builder.

## C. Evidence comparison inside an existing question

Add a readable comparison view for the question's linked articles:
- Title, origin/source record, publication/capture date.
- Supporting/challenging/background disposition and why-it-matters note.
- Available cited passage with attribution and original link.
- Confirmed shared entities and relevant existing event links where present.
- A way to spot an empty/missing link note and add one inline.

Support selecting a small set for side-by-side desktop comparison and stacked
mobile comparison. Do not require comparison of the entire Library at once.
Preserve question-specific notes when an article is linked to multiple questions.

Distinguish source reporting from analyst interpretation. Two articles sharing
an entity do not establish a relationship or independent confirmation. Flag an
exact same acquisition as repeated evidence where known, but no semantic
syndication detection claim. Unknown origin remains unknown.

An optional chronology uses actual existing dates and labels date type/missing
dates; do not infer an event occurred on an article's publication date.
A full general timeline module is not required.

## D. Compose and export a short brief

From a question, offer Create brief with an editable preview containing selected
existing content:
- Question, project scope, as-of/generated date.
- Current analyst answer.
- Selected findings: observed claim, interpretation, uncertainties.
- Selected supporting/challenging/background evidence notes.
- Unresolved questions and next research actions.
- Numbered source references with title, original URL and available dates.

No generated prose or automatic conclusions. Start with the analyst's existing
text and label empty sections; allow omissions and draft status. A blank answer
is not replaced by a fabricated summary.

Freeze the export preview to a consistent set of object versions. If research
changes during assembly, notify the analyst before regenerating; do not mix
versions silently. Record export as-of and selected source versions in a small
manifest/version record if needed. No duplicate full research database per export.

Export Markdown and print-friendly HTML with optional browser Print/Save as PDF.
No required native PDF/Word library or email integration in this first pass.
Escape/sanitize untrusted text, preserve line breaks and source URLs, and ensure
a downloaded HTML export works without account tokens, scripts or remote assets.

Citation numbering must be stable for the selected brief, deduplicate repeated
references and preserve unavailable-evidence labels/snapshots. Never present a
missing source as an accessible validated citation. Avoid bulk full-article text
republication; use selected notes/available attributed passages.
Preview exactly what will be exported. An export is an explicit local download,
not public hosting or sending material to someone else.

## Data and implementation boundaries

Prefer small additions to existing query/service/UI patterns. Add only the
checkpoint/view/export-state data actually needed; use additive migrations,
ownership constraints, explicit RLS/privileges and existing revision guards.
Do not introduce microservices, embeddings, a document system or a job queue.

Refactor useResearchData access where required so overview/changes/comparison do
not each fetch every article/entity/history record. Server pagination and bounded
query shape are part of this feature, not a new general search platform.
Existing functionality and IDs remain intact; keep original evidence immutable.

## Acceptance criteria

- [ ] Finish a session, make controlled research changes, return and see exactly
      those changes. Newly arriving changes are not swallowed by checkpoints.
- [ ] Cross-project/owner and stale/multiple-tab checkpoint tests pass.
- [ ] Saved views round-trip filters, date semantics, missing IDs and project state.
- [ ] Compare supporting/challenging evidence and independently edit question notes.
- [ ] Compose a brief using actual question/findings data and inspect every citation.
- [ ] Markdown/HTML exports preserve prose, attribution, dates, unavailable evidence
      and Unicode; malicious content is inert and no credentials enter downloads.
- [ ] Empty/partial/error states and direct navigation are usable.
- [ ] Meaningful frontend/SQL/concurrency/browser checks, existing CI and responsive
      visual inspection pass. Test deep pagination beyond bounded history samples.
- [ ] Provide one short demo and update docs with implementation/verification limits.

Implementation is approved. Complete and verify this milestone, update its review
report, then continue to Milestone 06 without another routine approval round.
Rollout remains separate; do not mark criteria complete merely because this brief
exists. Report local versus hosted verification accurately.
