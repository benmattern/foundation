# Research sessions and briefs: implementation review

Implemented locally on `docs/next-enhancements-draft`, 2026-10-16 (checks continued
into October 17 UTC). Baseline `07ea5e8`; implementation commit is `2c8f2b0`, the dedicated Milestone
05 commit in this branch. No hosted migration, merge or deployment.

## Delivered and verified

- [x] Continue research reports kept items and research edits, explicit first-visit
  baseline, current question, Inbox/Later work, collection-health link and saved views.
  Opening does not advance the checkpoint. Finish uses the captured server bound.
- [x] Transactional per-project counters serialize writers and checkpoint reads.
  Cursor pagination covers all changes, 50 per request, independent of the old
  latest-100 audit display. A 130-row test crosses multiple pages. PostgreSQL
  independent connections prove in-flight commit waiting, later-change retention
  and stale multiple-tab rejection. Failed/retried stale finishes request refresh.
- [x] Owner/project authorization and read-only browser tables; current question
  cannot reference another project. Checkpoint updates use mandatory revisions.
- [x] Named Library/Inbox views persist stable IDs, validated schemas and revisions;
  replace/delete affects only definitions. URL/back navigation remains native.
  Relative periods start at UTC midnight seven/thirty days earlier and are saved
  distinctly from fixed dates. Library dates use publication, otherwise kept date;
  its sort uses kept time. Missing references retain restrictive filters and guidance.
- [x] Existing questions open a bounded comparison/brief path: at most six selected
  links and twenty findings. Link choices use 50-row ID cursors, finding choices
  twenty-row ID cursors. No new full Library/entity/history loading in this path.
  Notes remain question-specific with revision protection; shared confirmed names,
  manual event titles, unknown origin, known repeated acquisition and distinct date
  types are labelled. Only actual selected finding passages are shown.
- [x] One-statement question packet freezes versions, analyst prose and citation
  snapshots. Editable draft includes numbered deduplicated references, missing
  sections, attribution, unknown dates, unavailable/unlinked labels and a manifest.
  Download checks the packet again and requires regeneration if research changed.
- [x] Markdown and standalone print-friendly HTML download locally. HTML previews
  the exact draft as escaped preformatted text, with UTF-8, no scripts, external
  assets or account credentials, restrictive CSP and inert React text preview. Open HTML
  and use browser Print / Save as PDF. Markdown syntax remains visibly literal;
  no Markdown renderer dependency was added.
- [x] Existing regression checks, new SQL/export tests and browser journey pass.

## Evidence

Clean npm ci: 275 packages, zero vulnerabilities. Lint and production build pass.
Vitest: **64 tests / 14 files passed**. Browser: **9 journeys passed**, including
checkpoint, saved-filter reopening, comparison-note change, stale export detection,
keyboard regeneration, HTML download/content and inline draft verification.
Native PostgreSQL: **12 scenario groups passed**, including the checkpoint race.
Snapshots under ignored artifacts.local/sessions inspected at 1440 and 390px;
no horizontal overflow. The final inline preview renders inert document text,
matching the standalone HTML text, without an iframe or remote assets.
All three Edge Function type checks pass. Final refinement results are recorded below.

Migration **015** is additive: research heads/change journal, sessions and saved
views; guarded RPCs, explicit privileges and RLS. Existing audit rows are backfilled
deterministically as baseline; pre-migration Library items are not invented as new
approvals. Subsequent kept articles and research changes record transactionally.
These are change records, not counts of unique questions or publications; question
creation may record initialization and population separately.

## Demo

1. Overview → Finish session. Keep an item or edit a question, return and refresh;
   inspect new changes. Choose a question and Use as current question.
2. Library → filter → Saved working views → name/save; change filters and reopen it.
3. Question → Compare evidence / Create brief. Select links and findings, assemble,
   edit a comparison note and try downloading the old draft.
4. Regenerate, inspect references and edit omissions. Download Markdown/HTML;
   open HTML and print. Finish the session explicitly when ready.

## Limits and rollout

No AI, sending, public hosting, native PDF/Word or full article republication.
The legacy broad research editor remains; the new comparison/brief path avoids its
full workspace loader. No custom dashboard/timeline was introduced.
The browser fixture is fictional at an invalid host. SQL role tests and Auth mocks
do not establish real-account Supabase browser acceptance. That preexisting hosted
gap remains. Before rollout, back up/rehearse migration 015 and exercise the real
signed-in journey within deployment authorization. No production credentials or
deployment artifacts were used for regression fixtures.
