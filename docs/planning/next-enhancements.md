# Next enhancement sequence

Status: Milestones 05 and 06 approved for implementation on 2026-10-16.
Order: complete and locally verify 05, then continue to 06.
This approval does not by itself authorize hosted mutation, merge or deployment.
Prepared 2026-10-16 (America/Chicago).
Reviewed main: 07ea5e85617d589fba4e3e3a278068cfe25c181d.
Original request: draft high-value enhancements. The owner subsequently approved
both packages. Treat this as the implementation sequence, not an open proposal.

## Recommendation

Make the next round help the analyst return to research and produce a tangible
output, then improve the relevance and coverage of source inputs. Do not add
another major destination or AI dependency before exercising the current workflow.

| Priority | Package | User value | Boundary |
|---|---|---|---|
| First | Complete the existing signed-in acceptance/demo and fix defects found | Know the deployed journey works for the real analyst | Not another backend rebuild; avoid claiming mocked tests establish hosted login |
| Next: 05 | Research sessions and evidence-backed briefs | Return, see changes, resume a question, compare evidence and export an assessment | No automatic writing or external publishing |
| Then: 06 | Official source coverage and intake calibration | Find relevant official sources and understand why useful items are missed or buried | Small verified packs; no invented feeds or credibility scores |
| Later | Optional AI pilot | Compare model-assisted work against the working manual baseline | Separate design decision; no current model/provider/budget commitment |

The owner approved both packages. Implement routine details independently and
record consequential deviations. Do not stop at another generic plan or ask for
field-by-field layout approval. Complete local acceptance for 05 before 06.

## Baseline evidence and gaps

The deployed 03/04 review reports grouped rules, pinned vocabulary, deterministic
ranking, Later, longer excerpts, attributed metadata previews, research questions,
question-specific article links/notes, findings, citations and reviewed entities.
These must be reused, not proposed as absent or reimplemented.

Code inspected in this planning pass:
- ProjectOverview: collection counts/state and current intake mode; useful startup
  guidance, but no explicit per-user research-session checkpoint/change digest.
- ResearchPage/researchService: existing question/evidence/findings workflow;
  research_history query returns the latest 100 rows.
- useResearchData: loads all project research domains together, including entities,
  articles and history; new work must avoid adding more unbounded loading.
- research types: evidence dispositions, snapshot citations and versioned records
  already exist. Comparison and export should compose them.
- sourceCatalog: two entries, Federal Reserve and UK Ministry of Defence. There
  is no researched Taiwan/semiconductor starter pack in this file.

These are targeted code observations, not a full security/performance audit.
No application tests or hosted signed-in operations were performed for this
drafting task. Source/operating facts in older reviews are reported evidence.

## Why 05 first

The owner has already found the collection journey useful and has limited time.
The next useful loop is: return -> notice relevant changes -> examine a question
-> update an answer -> save/export a short brief. The present data model supports
much of this; the enhancement should connect it without more onboarding.

A draft export is an analyst-selected assembly of existing text and references.
It is not an AI summary or evidence that a statement has been verified.
Question comparisons should surface supporting/challenging/background notes,
not infer a causal relationship from shared names or repeated coverage.

## Why 06 next

Official publisher discovery matches the owner's explicitly stated interest.
Two examples demonstrate the system, but cannot provide meaningful regional
coverage. Curated packs can improve utility more than a new connector framework.
Feed availability and field completeness need current primary-source verification.

Keep source selection intentional: users preview and select additions, follow
only chosen feeds, and retain broad sources if their relevance rules are useful.
More sources are not automatically better. Include source-level review outcomes
and a recoverable sample of outside-scope items to tune rules.

## Acceptance before further expansion

Retain the existing signed-in validation gap explicitly. On an authorized real
session, exercise one question through collection, Keep, citation/note, entity
confirmation and question update. Record outcomes; fix discovered regressions
before claiming the next release ready. Do not request passwords in chat or
reuse private deployment files as test fixtures.

The enhancements should have local mock/SQL tests and a short eventual user
walkthrough, not a burdensome approval exercise.

## Deliberate deferrals

- AI execution/provider selection, trading or forecasting automation.
- Full-text/paywall acquisition, social-network ingestion and hundreds of connectors.
- Global geography ontology, inferred relationships and automatic event extraction.
- Large graph visualization, team roles and automatic outbound brief delivery.
- An accuracy/credibility/confidence score inferred from keyword or publisher counts.

## Implementation handoff

Read [05](../milestones/05-research-sessions-and-briefs.md) and
[06](../milestones/06-official-source-coverage.md) for scope and acceptance criteria.
Update docs/reviews/05-research-sessions-and-briefs.md and
 docs/reviews/06-official-source-coverage.md with implementation evidence.
Deployment, hosted migrations, new costs or sending material to others are not
authorized merely by this implementation handoff.
