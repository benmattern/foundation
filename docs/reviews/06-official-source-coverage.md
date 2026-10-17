# Official source coverage and intake calibration: implementation review

## Production deployment — 2026-10-17 UTC

Deployed at [FOUNDATION](https://foundation-ljfo.onrender.com) via
[PR #5](https://github.com/benmattern/foundation/pull/5), merge
`e7991e091965ff82f8e8545cba0c64dde02ae470`; tested release head `dac9c1a`.
Owner explicitly authorized deployment. [CI 39002706427](https://github.com/benmattern/foundation/actions/runs/39002706427)
passed installation, lint, build, 69 tests, thirteen native PostgreSQL scenario
groups, all Edge checks and ten Linux browser journeys.

Fresh consistent public-schema/data/ledger backup restored into disposable local
PostgreSQL. Migrations 015 then 016 preserved every captured row/value: **2,062 rows
in 28 existing tables**. Production application was atomic with ledger entries;
**2,064 original rows** at cutover were preserved exactly (two normal collector runs
arrived between backup and cutover). Original core research remains 21 sources,
59 articles, 12 tags, 54 article-tag links, six events and 19 article-event links.
All public tables retain RLS and API-role TRUNCATE denial. The new tables begin
empty, without automatically following any source pack or marking research reviewed.

Hosted authenticated-role SQL tests passed for captured checkpoint boundaries,
later-change retention, stale edits, stable saved-view retries/schema/project guards,
selected packet/actual citations/article fingerprints, catalog rename/retry/Pause
preservation, calibration counts and held-out labels, untouched review decisions,
deleted-evidence snapshots, foreign-owner isolation and anonymous/direct-write denial.
All fictional test writes rolled back; no test projects or feeds remain.

Render's five entry assets match local tested files by SHA-256, including
`/assets/index-qwjLb3Pn.js` and `/assets/index-DD_4w_R9.css`.
Fourteen direct visit/refresh/auth-gate cases pass, including the question session
and coverage query routes. Desktop 1440px/mobile 390px public sign-in checks and
visual inspection pass; no console/page errors, failed requests or horizontal
overflow. No Edge Function release was needed; anonymous POSTs to all three
unchanged functions return 401. The five-minute collector job remains active.

**Remaining boundary:** the real-account signed-in hosted browser journey is not
verified. SQL role checks and public/mocked browser checks do not close that gap.
No password, user session or login link was requested/generated. Public publisher
availability remains transient; Finance feed size/truncation and missing ECB
excerpts remain documented limits. The feature demos below are unchanged.
Private backups, connection plans and receipts are ignored under
`.deployment.local/release05-06`; do not print/commit or use them as test fixtures.

<details>
<summary>Implementation and local verification record before deployment</summary>


Implemented locally on `docs/next-enhancements-draft` after Milestone 05 commit
`2c8f2b0` passed local acceptance. Review date: 2026-10-17 UTC (October 16 local).
No hosted mutation, merge, deployment, paid service or outbound delivery.

## Acceptance results

- [x] Ten official publisher records, preserving the original two, overlap three
  optional packs: Taiwan/Indo-Pacific, semiconductors/supply chain, economic policy.
  Five advertised RSS/Atom endpoints parsed successfully with the actual application
  parser. Five entries are explicitly manual-only; no guessed endpoint is enabled.
- [x] Preview counts and individual selection precede adoption. Stable catalog IDs
  reuse renamed/URL-edited records. SQL tests and a concurrent retry test prove
  deduplication; pack adoption retains existing Pause/Unfollow and feed overrides.
  Users resume existing decisions explicitly through source controls.
- [x] Manual-only, blocked and verification older than 90 days have distinct labels.
  Listing evidence, date, language, region, topics, fields, perspective and limits
  are visible. Automatic collection still reports actual feed health, never the
  catalog verification date as ongoing success.
- [x] Sources → Coverage and calibration shows chosen pack labels, current project
  state, last attempt/success, persistent consecutive failure count, recent error
  sample and configuration gaps. No credibility ranking or completeness claim.
- [x] Server counts are project/owner scoped over [from, until), at most 90 days.
  Acquisition identity (fallback exact URL) is counted once within that period.
  Current stored routing, current Keep/Dismiss/Duplicate/pending decisions and Later
  are separate dimensions. Reviewed keep rate = Keep / (Keep + Dismiss), excluding
  unreviewed/Later/Duplicate. It is not recall, truth or investment performance.
- [x] Stable candidate-ID cursors page 25 examples, independent of audit/run samples.
  Requested samples page ten outside-scope OR relevance <=1 examples, including
  unscored fallback-zero items. Population, size and deterministic convenience
  selection are disclosed; neither random nor representative sampling is claimed.
- [x] Useful/Not useful and held-out labels are independently revision guarded.
  They never change the original acquisition, review state, routing or evidence.
  First recorded and latest stored rule results are inspectable alongside current
  project/feed versions. A proposed project draft applies feed overrides, warns
  about useful examples it would exclude, and withholds reserved rows. Reused
  examples are explicitly tuning data. Only explicit Save changes future rules;
  no automatic reclassification, source removal or rule edits occur.
- [x] Deterministic SQL, browser and synthetic feed-fixture checks pass; live checks
  are separate from CI. Deep pagination, date boundary, fallback duplicate URL,
  other-project intake, foreign owner, direct write and stale label tests pass.

## Primary publisher verification

All checks below were performed during implementation on **2026-10-17 UTC**.
The catalog is in `src/lib/sourceCatalog.ts`; exact automatic endpoint URLs are
stored there and linked below. Browser search/listing inspection established the
publisher links; bounded Node fetches used the actual application parser. No
publisher article bodies are committed as test fixtures.

| Stable ID | Primary listing / official page | Endpoint result and subject/access limits |
|---|---|---|
| us-fed-press | [Fed feeds](https://www.federalreserve.gov/feeds/feeds.htm) | [RSS](https://www.federalreserve.gov/feeds/press_all.xml): HTTP 200, 20 usable/dated/described items; broad US monetary/regulatory releases. |
| uk-mod | [UK Defence](https://www.gov.uk/government/organisations/ministry-of-defence) | [Atom](https://www.gov.uk/government/organisations/ministry-of-defence.atom): HTTP 200, 20 usable/dated/described items; broad UK institutional defence perspective, regional relevance varies. |
| tw-mofa-news | [MOFA news Open data RSS link](https://en.mofa.gov.tw/News.aspx?n=1eaddcfd4c6ec567&sms=) | [RSS](https://en.mofa.gov.tw/OpenData.aspx?SN=07564A7F01D47BAD): HTTP 200, 50 usable/dated/described items, 150149 bytes; English government statements/responses. |
| tw-mof-news | [Taiwan Finance RSS listing](https://www.mof.gov.tw/eng/Rss) | [RSS](https://www.mof.gov.tw/eng/Rss/f48d641f159a4866b1d31c0916fbcc71): HTTP 200, first 50 of 330 usable/dated/described items, 844257 bytes. Near the 1 MiB cap; broad fiscal/trade coverage, not dedicated chip reporting. Truncation is an expected documented warning. |
| eu-ecb-press | [ECB feeds](https://www.ecb.europa.eu/home/html/rss.en.html) | [RSS](https://www.ecb.europa.eu/rss/press.html): HTTP 200, 15 usable/dated items, **zero descriptions**; 5752 bytes. Macroeconomic context; missing excerpts stay unknown. |
| tw-cbc | [CBC English press releases](https://www.cbc.gov.tw/en/lp-448-2.html) | Official listing inspected; manual-only, no supported endpoint verified. Taiwan monetary authority perspective. |
| tw-tsmc | [TSMC investor results](https://investor.tsmc.com/english/quarterly-results), [press archive](https://pr.tsmc.com/english/news-archives) | Official pages inspected; manual-only, no supported endpoint verified. Company disclosures, not independent industry reporting. |
| tw-umc | [UMC press releases](https://www.umc.com/en/News/press_release) | Official listing inspected; manual-only, no supported endpoint verified. Company corporate/investor perspective. |
| jp-meti | [METI RSS documentation](https://www.meti.go.jp/english/rss/index.html) | Official indexed documentation found; direct listing fetch **403**. Manual-only, no endpoint promoted and no block bypass. Japan industrial/trade policy perspective. |
| us-bis | [BIS releases](https://media.bis.gov/news-updates/all-press-releases), [official semiconductor release](https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military) | Official material inspected; manual-only, no supported endpoint verified. US export-control institutional perspective. |

English is the selected listing language, not a promise of full parallel-language
coverage. No accounts, payments or new subscriptions are required. No numeric
feed-specific polling rate was found in the inspected listings; retain existing
five-minute scheduling, validators/backoff and publisher restrictions. GOV.UK
[reuse guidance](https://www.gov.uk/help/reuse-govuk-content) points to OGL and warns
of rate limiting. ECB [terms](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html)
require accurate attribution and identifying modifications, with separate authored-
paper permissions. Other sites/documents retain their own terms; this catalog is
not a license to redistribute full articles. The export uses analyst prose and
selected attributed passages.

## Verification and maintenance

`npm run check:catalog` passed at **04:17:13–04:17:16 UTC**, five HTTP 200 feeds.
It fetches only the five explicitly configured endpoints, sequentially, with a
15-second timeout and streamed 1 MiB cap, continues independent failures and exits
unsuccessfully if any endpoint fails. It prints metadata, not full feed content.
This opt-in check is separate from deterministic CI; publisher downtime is not
an application regression. Recheck listings and terms before changing endpoints;
retain stable IDs, refresh verification metadata only after actual checks, and
keep blocked/unverified sources manual. Revisit at least every 90 days and when
health shows recurring failure. In particular monitor the large Finance feed.

At local acceptance: **69 tests / 15 files**, **13 independent PostgreSQL scenario
groups**, clean production build; targeted new browser acceptance passed. Final
whole-suite browser/lint and responsive results are recorded in the branch's final
handoff below. Synthetic fixtures test feed shapes and missing descriptions without
external requests; actual catalog checks establish availability only at check time.

Migration **016** adds catalog identity/membership and tuning labels plus authorized
server count/page RPCs. It preserves IDs, research, rules and source decisions.
No historical rule version is fabricated if no evaluation was recorded. Period
counts use current decisions and current routing; they do not reconstruct status
at the period end. Counts do not estimate collector misses or publisher completeness.

## Demo and rollout boundary

Discover → preview Semiconductors pack → select Finance and TSMC → adopt the subset.
Coverage and calibration → inspect manual-only/health gaps → choose dates → request
an outside-scope/low-ranked sample → label Useful → preview a draft that excludes
that example → inspect warning. Reserve another example as held out and confirm
it is not evaluated. Existing Keep/Dismiss decisions remain unchanged.

Deployment is separate. Back up and rehearse additive migrations **015 then 016**
before an authorized rollout. No Edge Function change is required. Existing real-
account signed-in hosted acceptance remains unverified; local mocked browser and
SQL-role evidence do not establish end-user Auth behavior. No owner password or
private deployment files were used.

## Final implementation verification

Branch: `docs/next-enhancements-draft`. Milestone 05 implementation: `2c8f2b0`.
Milestone 06 and final integrity refinements: `1d7cd999c021d8a4fdeed52c46ab3b87685e6796`.
The latter includes retry-safe saved-view creation, surface validation, article
fingerprints/citation-availability drift detection, bounded initial overview access
and a text-only inline preview. Both migrations remain local and unapplied remotely.

Final checks all passed:

- npm ci: 275 packages installed; zero audit vulnerabilities.
- npm run lint: zero errors or warnings.
- npm run build: production TypeScript/Vite build passed.
- npm test: **69 tests, 15 files passed**, including full migration/legacy regression.
- npm run test:e2e: **10 journeys passed**. Windows Edge uses one worker to avoid
  competing native screenshot resources; Linux keeps normal Playwright defaults.
  The standalone workspace fixture now implements the session response and exposes
  PostgREST count headers; project-switch checks wait for the destination overview.
- npm run test:postgres: **13 independent-connection scenario groups passed** in a
  disposable PostgreSQL cluster; all existing races plus session boundaries,
  catalog/Pause serialization, duplicate adoption and stale tuning writes.
- npm run check:functions: all three existing Edge Functions type-check successfully.
- npm run check:catalog: all five configured automatic feeds returned HTTP 200 and
  usable parsed items. Finance truncation and ECB missing descriptions remain
  expected publisher-content limitations, recorded above/in the source review.
- git diff --check: passed. Desktop 1440px/mobile 390px screenshots inspected for
  comparison/brief and coverage/calibration; no horizontal overflow. Downloaded
  HTML contents preserve Unicode/prose and contain no application credentials or
  scripts. The inline preview renders draft text directly, without a live iframe.

No hosted CI run, merge, production migration, deployment or real-account signed-in
acceptance is claimed. Local fixtures use only an invalid API hostname and fictional
SQL data. A future authorized rollout must back up/rehearse the actual database,
apply additive 015 then 016 and exercise the real signed-in workflow. See the other
milestone review for its demo, boundaries and supporting evidence.
</details>
