# Milestone 06: Official source coverage and intake calibration

Status: approved implementation assignment, 2026-10-16.
Prepared 2026-10-16. Baseline reviewed: 07ea5e85617d589fba4e3e3a278068cfe25c181d.
Context: [next-enhancement proposals](../planning/next-enhancements.md).
Sequence: implement after Milestone 05 local acceptance.

## Outcome

Discover offers a small credible starting collection for Taiwan/Indo-Pacific,
semiconductors and supply-chain research, and the analyst can see whether followed
sources and rules actually produce useful material. No AI required.

## A. Verified official source packs

Research a bounded initial 8-12 useful publisher records, with overlapping packs
for Taiwan/Indo-Pacific, semiconductor industry/supply chain and economic policy.
Prefer official government releases, central banks, statistics/trade agencies,
regulators and company investor disclosures. Preserve existing entries.
These are selection categories, not a claim that any particular feed exists.

For each candidate, record:
- Official name, publisher website and primary-source feed/API listing.
- Exact collection endpoint only after verification.
- Topic/region/language, content level and access requirements.
- Verification date, method, successful item/date/description parsing and known
  limits. Distinguish endpoint availability from useful subject coverage.
- Broad-versus-specialist coverage and potential source perspective.
- Appropriate connector: reuse RSS/Atom first. Official website with no supported
  endpoint is manual-only; do not invent or guess a working feed.
- Any applicable published use/rate constraints. No payment or new subscription.

Validate links and claims using current primary publisher material during
implementation. Do not copy stale aggregator lists or bypass publisher blocks.
If a verified feed later fails, show that health rather than fake ongoing success.
A pack can include manual-only sources if clearly distinguished from auto intake.

Packs are optional suggestions. Preview included sources/feed counts and select
which to follow before enabling. Use stable IDs so renames or URL edits do not
create duplicates. Do not subscribe users automatically or overwrite their rules.

## B. Honest coverage view

Within a project's existing Sources workspace, show:
- Selected pack members and actual enabled/paused/unfollowed state.
- Last attempt/success, recurring errors and available content fields.
- Topic/region tags the analyst chose, with unknown coverage explicit.
- Gaps such as only one publisher supplying a topic, or no recent success.
  These are configuration/availability observations, not completeness claims.

Do not produce a credibility ranking or imply a list covers all relevant events.
Reuse existing source settings/health and avoid a separate operations dashboard.

## C. Tune rules using reviewed examples

For a selected source or project:
- Show bounded-period counts for collected, routed to pending/outside scope,
  kept, dismissed and deferred. Define each denominator and exclude unreviewed
  items from any reviewed-item rate.
- Allow inspection of the underlying articles and current versus historical
  rule version. Multiple projects and repeated acquisition must not inflate counts.
- Offer a small analyst-requested sample from outside scope/low-ranked intake.
  Show population, sample size and selection method; preserve current decisions.
- Let the analyst mark examples Useful / Not useful for tuning, explicitly
  separate from approving/dismissing evidence where appropriate.
- Compare a proposed rule draft against reviewed examples, highlighting which
  previously useful items it would exclude. Preview only; apply explicitly.
- Preserve held-out examples or label reused samples honestly. Reviewed keep rate
  is a workflow statistic, not measured recall, truth, or investment performance.
- Avoid automatic rule edits, automatic source removal, or silent widening/narrowing.

Version/count queries run server-side with stable pagination and owner/project
authorization. Do not present latest-100 history samples as complete period totals.

## Acceptance criteria

- [ ] Every automatic catalog entry has current primary-source listing evidence,
      verified endpoint and honest content/access limits.
- [ ] Packs support selecting/following a subset without duplicate records or
      overriding existing source decisions/rules.
- [ ] Manual-only, failed and stale-verification entries are visibly distinct.
- [ ] Coverage observations and calibration counts match authorized underlying
      records, including date boundaries, duplicate intake and partial failures.
- [ ] Sampling/review does not mutate original intake decisions; rule preview
      identifies examples lost under a proposed filter without applying it.
- [ ] No inferred credibility/completeness or auto-generated research claims.
- [ ] Existing CI plus catalog fixture/live-check separation, SQL authorization,
      UI/browser and responsive visual checks pass.
- [ ] Document verification dates, coverage limitations and repeatable maintenance.

Keep endpoint tests bounded; use deterministic fixtures in CI and separate
publisher live checks so external downtime does not masquerade as an app regression.
No broad crawling, paid connectors, AI, full geography database or graph system.
Implementation is approved. New costs, hosted changes, merge and deployment need
corresponding authorization in the active task; prepare reviewable work first.
