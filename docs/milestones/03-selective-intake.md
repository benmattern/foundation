# Milestone 03: Selective intake without AI

Status: deployed 2026-10-16; CI, hosted SQL roles and public frontend checks pass.
Real-account signed-in browser acceptance remains unverified.
Release head b50d26d; production merge 849a09d5fffd53c9f4bc6ca812573f0a05dbabfc.
See ../reviews/03-selective-intake.md for evidence, design choices and rollout limits.
Milestone 03 local acceptance preceded Milestone 04 implementation.

## Outcome and scope

An analyst can clearly configure what belongs in the project's Inbox, follow or
unfollow sources easily, and sort borderline items without leaving FOUNDATION
for every decision. Everything functions without AI, embeddings, a local model
or paid services. Reuse the existing collector, evidence, rules and review system.

Included: source-view cleanup, Follow/Pause/Unfollow, guided filtering setup,
grouped conditions, explicit text-match modes, reusable named term groups,
explainable relevance ordering, readable source previews and faster manual triage.
Full gazetteers/ontology databases, unknown-name extraction, broad catalog
expansion, paid/full-text connectors and AI remain outside this milestone.

## Current behavior to preserve and clarify

Project topics/keywords are descriptive metadata. ProjectPage saves them separately
from project.rules. Actual collection classifies title, supplied description and
publisher categories with project defaults plus subscription overrides.
Rules v1 supports includeAny, excludeAny, defaultTags and keywordTags. It uses
NFKC/case/whitespace-normalized literal substrings; exclusion wins; empty inclusion
allows all; missing searchable text stays pending for human review.
Manual capture starts pending. Saved rules affect future intake, with explicit
reapply for pending candidates. Analyst changes/history remain protected.

Do not silently turn existing project metadata into active filters, reinterpret
legacy matches, drop items, or claim supplied excerpts represent complete articles.

## Source workspace and controls

- Keep Following and Discover; rename Available sources to Your saved sources.
  Explain that saved records can be reused by other projects without being followed.
- Remove Collection details as a top-level source view. Put feed configuration,
  health, rules and run history inside the source. Preserve old view/route links
  with a useful compatible destination rather than a dead URL.
- Discover remains a curated, factual catalog with official publishers welcome.
  Do not claim two generic entries are comprehensive regional coverage.
- Follow = appear in Following and enable selected available feeds in this project.
- Pause = remain in Following with collection stopped and an obvious Resume action.
- Unfollow = leave Following and stop this project's intake. Preserve saved source,
  feed definitions, collected evidence, Inbox/Library items, notes and review history.
- Re-follow offers/resumes previous configuration without duplicating sources/feeds.
  Never reactivate a workspace-disabled feed silently.
- Keep workspace-wide availability controls advanced and explicitly scoped.
- A source-level control handles its existing feeds consistently. Manual-only
  sources remain usable, and no homepage-only record is labeled auto-collecting.
- Existing disabled subscriptions migrate as paused, not retroactively unfollowed.
  Use a durable followed/paused distinction or archived subscription state;
  select the smallest data design that preserves rules, history and stale-write
  safeguards. Document it instead of assuming disabled alone expresses all states.
- Enforce pause/unfollow during concurrent staging on the server; no new project
  intake may appear after the state change commits. Other projects stay unaffected.
  Do not delete old history or bypass the existing collector lease/generation logic.

## Clear project setup

Provide a short setup/edit flow:
1. Name and optional descriptive scope.
2. Inbox preference: All incoming items, or Only items matching my rules.
3. Build/edit inclusion groups, exclusions and optional tagging.
4. Choose sources and preview a real sample where available; save/activate.

The flow can revisit sources/rules without restarting or losing drafts.
Topics/keywords can populate an explicit draft only through a clear Use as
matching terms action. Show resulting conditions and require saving them.
No hidden assumption that project names or labels are semantic queries.

Overview/settings should show:
- Current collection mode and plain-language effective filter summary.
- Which sources inherit defaults versus override them.
- Separate descriptions for auto-routing, tagging and sorting.
- A direct Edit relevance rules action and an explanatory no-filter state.
- Existing projects keep working without completing a forced onboarding wizard.

An empty project/sample must say there is insufficient preview data. Do not
invent counts. Rules can be saved before the first collection with clear guidance.

## Grouped relevance conditions

Use a bounded, understandable OR-of-AND-groups representation with terms inside
a criterion matching ANY. No arbitrary expression language or deep AST editor.

A branch may say:
ANY of [Taiwan, South China Sea]
OR
(ANY of [Japan, Philippines, Singapore, Indo-Pacific]
 AND ANY of [semiconductor, shipping, export controls, maritime routes]).

Within a criterion, expose target fields (title, excerpt, publisher categories)
and match mode (whole term/phrase or literal substring). Define Unicode boundaries,
punctuation, apostrophes, hyphens and empty conditions; test them. Reject invalid/
empty restricted groups on save, rather than accidentally making them match all.
Exclusions apply after inclusion and win. Missing text remains reviewable.
No regex supplied by users, stemming or inferred synonyms/geographic expansion.

Named term groups have stable owner-scoped IDs, name, terms/aliases and versions.
Allow manual groups such as My Pacific locations and Supply-chain subjects.
Show included members so "Pacific" is never an undefined magic region.
A referenced group version is pinned until the analyst explicitly adopts an
update; preview impacts before applying. Ad-hoc terms remain supported.
Do not ship a world geography database or claim these are verified entity IDs.
Milestone 04 may associate identities later without changing what rules matched.

Preserve v1 rule behavior exactly through a compatible versioned evaluator or
a demonstrably equivalent migration. New whole-term matching is explicit;
do not silently change historical substring rules. Extend frontend previews,
server collector, SQL validation/persistence and reapplication together.
Retain version, matched terms/fields, routing reason and timestamps.

Per-source overrides remain explicit, including empty override versus inheritance.
Show the full effective rule so users do not mistake an override for additional
project conditions. Reapply remains opt-in and does not reopen accepted/dismissed
items or erase manual edits, tag suppression/additions or route overrides.

## Preview, routing and ranking

Preview a bounded real sample with counts for included/outside scope/missing
text, visible sample size and matched passages. Use consistent inputs across
preview, collection and reapply. Preview counts are sample counts, not total
coverage or accuracy estimates.

Continue preserving outside-scope intake in a recoverable view. Distinguish
Outside scope, Dismissed, Later and active Pending. Label source coverage gaps.
Relevance is not credibility, factual validation, risk or probability.

Add optional deterministic Relevance ordering while retaining newest/oldest.
Use documented small field weights, e.g. title 3, category 2, excerpt 1, per
distinct matched positive term, with bounded contributions and a stable date/ID
tie-break. Finalize constants in code/docs. Repeated term occurrences must not
inflate scores; exclusion/eligibility is separate. Explain the contributing
matches. No rank means no positive signal, not that an article is false.
Apply ordering/counts server-side across pagination, not just the current page.
Preserve rule/score version where needed so reordering is explainable.

## Faster manual review and preview

- Keep a compact list and readable selected-item pane, with source/publisher,
  publication date, full available excerpt, matching highlights and original link.
- Expand long excerpts in the pane instead of filling every card with full text.
  Clearly label Publisher excerpt, Page metadata excerpt or Analyst note.
- Use original acquisition text for matching; analyst edits must not rewrite
  original source evidence. Preserve more supplied feed text within safe limits
  if current parsing unnecessarily truncates it; document limits.
- On demand, Fetch preview may reuse the authenticated metadata-fetcher for an
  item with no useful excerpt. Store as separately attributed preview enrichment,
  including origin URL/retrieval date, without silently changing original evidence,
  rules or notes. Reclassify enriched text only by an explicit documented action.
- Do not auto-fetch every article page, bypass access restrictions, invent missing
  text or promise full article access. Failure/missing previews never block review.
  Sanitize untrusted HTML and use bounded existing URL/network protections.
- Visible Keep, Dismiss, Later and Duplicate actions. Later is durable, recoverable,
  project-specific deferral, not rejection or a scheduled reminder.
- Optional documented keyboard shortcuts plus next/previous. Disable shortcuts
  while typing, in dialogs or with modifiers; avoid inaccessible single-key traps.
- After action, selection moves within current visible results. Preserve drafts
  on errors; show per-item bulk failures and a safe undo/restore path.
- If reversing Keep could destroy subsequent article edits/event/question links,
  do not implement destructive blind undo; provide a safe explicit workflow.
- Source-level actions such as adjust rules or pause are discoverable during review.

## Implementation and verification

Prepare additive migrations for real data-model changes; preserve IDs, research,
source state, RLS, transactional writes and existing links. Inspect current schema,
tests and code before choosing exact columns/tables. No live reset or demo reseed.

- [x] Follow/Pause/Resume/Unfollow/re-follow work and preserve old research/rules.
- [x] Unfollow and collector staging are concurrency-safe and project-isolated.
- [x] New/existing project setup makes descriptive versus active rules unambiguous.
- [x] v1 rules retain behavior; new groups/modes/overrides pass positive/negative,
      Unicode, empty-rule and exclusion-precedence fixtures.
- [x] Group edits do not silently change pinned active filter behavior.
- [x] Preview, server intake and reapply agree and preserve analyst decisions.
- [x] Ranking is deterministic, explained and correct across pages.
- [x] Excerpts and preview enrichment show origin; missing/failed content is honest.
- [x] Later/restore, shortcuts, bulk actions and busy/error states work.
- [x] Anonymous/cross-owner and cross-project mutation tests deny invalid access.
- [x] Fresh/upgrade migrations and independent-connection tests cover new writes.
- [x] npm ci, lint, build, unit/UI/database tests, check:functions, test:postgres,
      and browser journeys pass; preserve existing CI coverage.
- [x] Desktop/mobile views are rendered and visually inspected.
- [x] Write results/demo/limitations in ../reviews/03-selective-intake.md and
      update current docs before continuing to Milestone 04.

Hosted deployment, credentials, live data mutations and merging require the
active owner's corresponding authorization. Complete independently testable
implementation and prepare rollout instructions first; report remaining live
checks separately. These briefs alone do not grant production access.
