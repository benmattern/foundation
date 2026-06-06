-- FOUNDATION Seed Data Script v1
-- ---------------------------------------------------------------------------
-- FICTIONAL DEMO DATA ONLY.
--
-- This script creates repeatable prototype data for local/demo use. The source
-- names, article titles, article URLs, summaries, and event descriptions are
-- fictional and should not be treated as real intelligence reporting.
--
-- Safety model:
-- - Uses fixed UUIDs for all seeded base records.
-- - Deletes only rows matching those fixed UUIDs.
-- - Does not truncate tables.
-- - Does not delete manually-created data outside this seed UUID set.
-- - Uses fictional article URLs under https://example.com/foundation-demo/.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- Seed-only cleanup
-- ---------------------------------------------------------------------------

delete from article_events
where article_id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '11111111-1111-4111-8111-111111111103',
  '11111111-1111-4111-8111-111111111104',
  '11111111-1111-4111-8111-111111111105',
  '11111111-1111-4111-8111-111111111106',
  '11111111-1111-4111-8111-111111111107',
  '11111111-1111-4111-8111-111111111108',
  '11111111-1111-4111-8111-111111111109',
  '11111111-1111-4111-8111-111111111110',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111114',
  '11111111-1111-4111-8111-111111111115',
  '11111111-1111-4111-8111-111111111116',
  '11111111-1111-4111-8111-111111111117',
  '11111111-1111-4111-8111-111111111118'
)
or event_id in (
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302',
  '33333333-3333-4333-8333-333333333303',
  '33333333-3333-4333-8333-333333333304',
  '33333333-3333-4333-8333-333333333305',
  '33333333-3333-4333-8333-333333333306'
);

delete from article_tags
where article_id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '11111111-1111-4111-8111-111111111103',
  '11111111-1111-4111-8111-111111111104',
  '11111111-1111-4111-8111-111111111105',
  '11111111-1111-4111-8111-111111111106',
  '11111111-1111-4111-8111-111111111107',
  '11111111-1111-4111-8111-111111111108',
  '11111111-1111-4111-8111-111111111109',
  '11111111-1111-4111-8111-111111111110',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111114',
  '11111111-1111-4111-8111-111111111115',
  '11111111-1111-4111-8111-111111111116',
  '11111111-1111-4111-8111-111111111117',
  '11111111-1111-4111-8111-111111111118'
)
or tag_id in (
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202',
  '22222222-2222-4222-8222-222222222203',
  '22222222-2222-4222-8222-222222222204',
  '22222222-2222-4222-8222-222222222205',
  '22222222-2222-4222-8222-222222222206',
  '22222222-2222-4222-8222-222222222207',
  '22222222-2222-4222-8222-222222222208',
  '22222222-2222-4222-8222-222222222209',
  '22222222-2222-4222-8222-222222222210',
  '22222222-2222-4222-8222-222222222211',
  '22222222-2222-4222-8222-222222222212'
);

delete from events
where id in (
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302',
  '33333333-3333-4333-8333-333333333303',
  '33333333-3333-4333-8333-333333333304',
  '33333333-3333-4333-8333-333333333305',
  '33333333-3333-4333-8333-333333333306'
);

delete from articles
where id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '11111111-1111-4111-8111-111111111103',
  '11111111-1111-4111-8111-111111111104',
  '11111111-1111-4111-8111-111111111105',
  '11111111-1111-4111-8111-111111111106',
  '11111111-1111-4111-8111-111111111107',
  '11111111-1111-4111-8111-111111111108',
  '11111111-1111-4111-8111-111111111109',
  '11111111-1111-4111-8111-111111111110',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111114',
  '11111111-1111-4111-8111-111111111115',
  '11111111-1111-4111-8111-111111111116',
  '11111111-1111-4111-8111-111111111117',
  '11111111-1111-4111-8111-111111111118'
);

delete from tags
where id in (
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202',
  '22222222-2222-4222-8222-222222222203',
  '22222222-2222-4222-8222-222222222204',
  '22222222-2222-4222-8222-222222222205',
  '22222222-2222-4222-8222-222222222206',
  '22222222-2222-4222-8222-222222222207',
  '22222222-2222-4222-8222-222222222208',
  '22222222-2222-4222-8222-222222222209',
  '22222222-2222-4222-8222-222222222210',
  '22222222-2222-4222-8222-222222222211',
  '22222222-2222-4222-8222-222222222212'
);

delete from sources
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006'
);

-- ---------------------------------------------------------------------------
-- 1. Sources
-- ---------------------------------------------------------------------------

insert into sources (id, name, url, category, notes, created_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'FOUNDATION Demo Taiwan Desk',
    'https://example.com/foundation-demo/sources/taiwan-desk',
    'Demo regional monitoring',
    'Fictional prototype source for Taiwan-region demo data.',
    '2026-01-01 09:00:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'FOUNDATION Demo Strait Monitor',
    'https://example.com/foundation-demo/sources/strait-monitor',
    'Demo maritime monitoring',
    'Fictional prototype source for maritime and PLA activity demo data.',
    '2026-01-01 09:05:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'FOUNDATION Demo Semiconductor Monitor',
    'https://example.com/foundation-demo/sources/semiconductor-monitor',
    'Demo technology monitoring',
    'Fictional prototype source for semiconductor and supply-chain demo data.',
    '2026-01-01 09:10:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'FOUNDATION Demo Policy Tracker',
    'https://example.com/foundation-demo/sources/policy-tracker',
    'Demo policy monitoring',
    'Fictional prototype source for export-control and diplomatic demo data.',
    '2026-01-01 09:15:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'FOUNDATION Demo Regional Security Desk',
    'https://example.com/foundation-demo/sources/regional-security',
    'Demo security monitoring',
    'Fictional prototype source for Japan and Indo-Pacific security demo data.',
    '2026-01-01 09:20:00+00'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'FOUNDATION Demo Cyber Watch',
    'https://example.com/foundation-demo/sources/cyber-watch',
    'Demo cyber monitoring',
    'Fictional prototype source for cyber security demo data.',
    '2026-01-01 09:25:00+00'
  )
on conflict (id) do update
set
  name = excluded.name,
  url = excluded.url,
  category = excluded.category,
  notes = excluded.notes,
  created_at = excluded.created_at;

-- ---------------------------------------------------------------------------
-- 2. Tags
-- ---------------------------------------------------------------------------

insert into tags (id, name, description, created_at)
values
  ('22222222-2222-4222-8222-222222222201', 'Taiwan', 'Demo tag for Taiwan-region intelligence items.', '2026-01-01 10:00:00+00'),
  ('22222222-2222-4222-8222-222222222202', 'China', 'Demo tag for China-related intelligence items.', '2026-01-01 10:01:00+00'),
  ('22222222-2222-4222-8222-222222222203', 'Semiconductors', 'Demo tag for semiconductor-sector items.', '2026-01-01 10:02:00+00'),
  ('22222222-2222-4222-8222-222222222204', 'TSMC', 'Demo tag for TSMC-related items.', '2026-01-01 10:03:00+00'),
  ('22222222-2222-4222-8222-222222222205', 'PLA', 'Demo tag for PLA-related activity.', '2026-01-01 10:04:00+00'),
  ('22222222-2222-4222-8222-222222222206', 'Maritime Security', 'Demo tag for maritime security topics.', '2026-01-01 10:05:00+00'),
  ('22222222-2222-4222-8222-222222222207', 'Export Controls', 'Demo tag for export-control policy topics.', '2026-01-01 10:06:00+00'),
  ('22222222-2222-4222-8222-222222222208', 'U.S.-Taiwan Relations', 'Demo tag for U.S.-Taiwan relationship topics.', '2026-01-01 10:07:00+00'),
  ('22222222-2222-4222-8222-222222222209', 'Japan Regional Security', 'Demo tag for Japan and regional security topics.', '2026-01-01 10:08:00+00'),
  ('22222222-2222-4222-8222-222222222210', 'Supply Chain', 'Demo tag for supply-chain resilience topics.', '2026-01-01 10:09:00+00'),
  ('22222222-2222-4222-8222-222222222211', 'Cyber', 'Demo tag for cyber security topics.', '2026-01-01 10:10:00+00'),
  ('22222222-2222-4222-8222-222222222212', 'Diplomacy', 'Demo tag for diplomatic activity topics.', '2026-01-01 10:11:00+00')
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  created_at = excluded.created_at;

-- ---------------------------------------------------------------------------
-- 3. Articles
-- ---------------------------------------------------------------------------

insert into articles (id, source_id, title, url, summary, published_at, created_at)
values
  (
    '11111111-1111-4111-8111-111111111101',
    '00000000-0000-4000-8000-000000000002',
    '[DEMO] PLA Activity Near Taiwan Training Scenario',
    'https://example.com/foundation-demo/articles/pla-activity-near-taiwan-scenario',
    'Fictional demo article describing a training scenario about elevated maritime and air activity near Taiwan for prototype testing only.',
    '2026-02-01 08:00:00+00',
    '2026-02-01 08:30:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    '00000000-0000-4000-8000-000000000002',
    '[DEMO] Strait Monitoring Brief Notes Patrol Pattern',
    'https://example.com/foundation-demo/articles/strait-monitoring-patrol-pattern',
    'Fictional demo article about a notional patrol pattern used to test maritime security tagging and event timelines.',
    '2026-02-02 09:00:00+00',
    '2026-02-02 09:20:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    '00000000-0000-4000-8000-000000000001',
    '[DEMO] Taiwan Readiness Exercise Mentioned In Prototype Brief',
    'https://example.com/foundation-demo/articles/taiwan-readiness-exercise-brief',
    'Fictional demo article summarizing a prototype readiness exercise item for Taiwan-focused workflow testing.',
    '2026-02-03 10:00:00+00',
    '2026-02-03 10:15:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    '00000000-0000-4000-8000-000000000004',
    '[DEMO] U.S.-Taiwan Defense Engagement Planning Note',
    'https://example.com/foundation-demo/articles/us-taiwan-defense-engagement-note',
    'Fictional demo article about a hypothetical defense engagement planning note for relationship and diplomacy workflow testing.',
    '2026-02-05 13:00:00+00',
    '2026-02-05 13:25:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    '00000000-0000-4000-8000-000000000004',
    '[DEMO] Policy Delegation Scenario References Taiwan Coordination',
    'https://example.com/foundation-demo/articles/policy-delegation-taiwan-coordination',
    'Fictional demo article about a hypothetical policy delegation scenario for testing diplomacy and U.S.-Taiwan filtering.',
    '2026-02-06 14:00:00+00',
    '2026-02-06 14:25:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    '00000000-0000-4000-8000-000000000003',
    '[DEMO] Semiconductor Export Control Update Scenario',
    'https://example.com/foundation-demo/articles/semiconductor-export-control-update',
    'Fictional demo article about a prototype export-control update affecting semiconductor supply-chain analysis.',
    '2026-02-08 08:00:00+00',
    '2026-02-08 08:40:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111107',
    '00000000-0000-4000-8000-000000000003',
    '[DEMO] TSMC Supplier Resilience Scenario Brief',
    'https://example.com/foundation-demo/articles/tsmc-supplier-resilience-scenario',
    'Fictional demo article describing a notional supplier resilience scenario related to TSMC and regional supply chains.',
    '2026-02-09 11:00:00+00',
    '2026-02-09 11:20:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111108',
    '00000000-0000-4000-8000-000000000003',
    '[DEMO] Chip Equipment Routing Exercise',
    'https://example.com/foundation-demo/articles/chip-equipment-routing-exercise',
    'Fictional demo article about hypothetical chip equipment routing used to test supply-chain and export-control tags.',
    '2026-02-10 12:00:00+00',
    '2026-02-10 12:30:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111109',
    '00000000-0000-4000-8000-000000000005',
    '[DEMO] Japan Regional Security Posture Scenario',
    'https://example.com/foundation-demo/articles/japan-regional-security-posture',
    'Fictional demo article about a regional security posture scenario involving Japan for prototype event linking.',
    '2026-02-12 07:00:00+00',
    '2026-02-12 07:45:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111110',
    '00000000-0000-4000-8000-000000000005',
    '[DEMO] Regional Maritime Coordination Exercise',
    'https://example.com/foundation-demo/articles/regional-maritime-coordination-exercise',
    'Fictional demo article about a hypothetical maritime coordination exercise for Japan and Taiwan-region workflow testing.',
    '2026-02-13 08:00:00+00',
    '2026-02-13 08:25:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000006',
    '[DEMO] Taiwan Cyber Security Warning Scenario',
    'https://example.com/foundation-demo/articles/taiwan-cyber-security-warning',
    'Fictional demo article about a prototype cyber warning scenario used to test event intelligence summaries.',
    '2026-02-15 15:00:00+00',
    '2026-02-15 15:30:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111112',
    '00000000-0000-4000-8000-000000000006',
    '[DEMO] Port Network Monitoring Exercise',
    'https://example.com/foundation-demo/articles/port-network-monitoring-exercise',
    'Fictional demo article about a hypothetical port-network monitoring exercise for cyber and maritime tag testing.',
    '2026-02-16 16:00:00+00',
    '2026-02-16 16:35:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111113',
    '00000000-0000-4000-8000-000000000001',
    '[DEMO] Taiwan Supply Chain Continuity Drill',
    'https://example.com/foundation-demo/articles/taiwan-supply-chain-continuity-drill',
    'Fictional demo article about a notional continuity drill for Taiwan supply-chain resilience analysis.',
    '2026-02-18 09:00:00+00',
    '2026-02-18 09:25:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111114',
    '00000000-0000-4000-8000-000000000003',
    '[DEMO] Foundry Capacity Resilience Planning Note',
    'https://example.com/foundation-demo/articles/foundry-capacity-resilience-planning',
    'Fictional demo article about prototype foundry-capacity planning related to semiconductor resilience workflows.',
    '2026-02-19 10:00:00+00',
    '2026-02-19 10:30:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111115',
    '00000000-0000-4000-8000-000000000004',
    '[DEMO] Diplomatic Coordination Roundtable Scenario',
    'https://example.com/foundation-demo/articles/diplomatic-coordination-roundtable',
    'Fictional demo article describing a hypothetical diplomatic coordination roundtable for workflow testing.',
    '2026-02-21 13:00:00+00',
    '2026-02-21 13:35:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111116',
    '00000000-0000-4000-8000-000000000002',
    '[DEMO] Maritime Safety Advisory Prototype Item',
    'https://example.com/foundation-demo/articles/maritime-safety-advisory-prototype',
    'Fictional demo article about a prototype maritime safety advisory used for event linking tests.',
    '2026-02-22 06:00:00+00',
    '2026-02-22 06:20:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111117',
    '00000000-0000-4000-8000-000000000005',
    '[DEMO] Japan Supply Route Tabletop Scenario',
    'https://example.com/foundation-demo/articles/japan-supply-route-tabletop',
    'Fictional demo article about a tabletop scenario involving Japan-linked supply routes and regional security planning.',
    '2026-02-24 09:00:00+00',
    '2026-02-24 09:50:00+00'
  ),
  (
    '11111111-1111-4111-8111-111111111118',
    '00000000-0000-4000-8000-000000000006',
    '[DEMO] Cyber Tabletop Follow-Up For Semiconductor Operators',
    'https://example.com/foundation-demo/articles/cyber-tabletop-semiconductor-operators',
    'Fictional demo article about a cyber tabletop follow-up for semiconductor operators in a prototype dataset.',
    '2026-02-25 12:00:00+00',
    '2026-02-25 12:30:00+00'
  )
on conflict (id) do update
set
  source_id = excluded.source_id,
  title = excluded.title,
  url = excluded.url,
  summary = excluded.summary,
  published_at = excluded.published_at,
  created_at = excluded.created_at;

-- ---------------------------------------------------------------------------
-- 4. Events
-- ---------------------------------------------------------------------------

insert into events (id, title, description, event_type, status, occurred_at, location, created_at, updated_at)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '[DEMO] PLA Activity Near Taiwan',
    'Fictional demo event aggregating prototype articles about notional PLA and maritime activity near Taiwan.',
    'military exercise',
    'active',
    '2026-02-02 09:00:00+00',
    'Taiwan Strait demo area',
    '2026-02-02 10:00:00+00',
    '2026-02-22 07:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '[DEMO] U.S.-Taiwan Defense Engagement',
    'Fictional demo event for prototype tracking of U.S.-Taiwan defense and diplomatic engagement items.',
    'diplomatic meeting',
    'active',
    '2026-02-05 13:00:00+00',
    'Demo policy venue',
    '2026-02-05 14:00:00+00',
    '2026-02-21 14:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '[DEMO] Semiconductor Export Control Update',
    'Fictional demo event linking prototype semiconductor, TSMC, and export-control articles.',
    'export control',
    'resolved',
    '2026-02-08 08:00:00+00',
    'Demo technology policy channel',
    '2026-02-08 09:00:00+00',
    '2026-02-10 13:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    '[DEMO] Japan Regional Security Posture',
    'Fictional demo event for regional security articles involving Japan, maritime coordination, and supply routes.',
    'regional security',
    'draft',
    '2026-02-12 07:00:00+00',
    'Japan regional demo area',
    '2026-02-12 08:00:00+00',
    '2026-02-24 10:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    '[DEMO] TSMC Supply Chain Resilience',
    'Fictional demo event grouping prototype TSMC and supply-chain resilience articles.',
    'product launch',
    'resolved',
    '2026-02-18 09:00:00+00',
    'Taiwan semiconductor demo corridor',
    '2026-02-18 10:00:00+00',
    '2026-02-25 13:00:00+00'
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    '[DEMO] Taiwan Cyber Security Warning',
    'Fictional demo event for prototype cyber warning and follow-up articles connected to Taiwan-region workflows.',
    'cyber incident',
    'archived',
    '2026-02-15 15:00:00+00',
    'Taiwan demo cyber environment',
    '2026-02-15 16:00:00+00',
    '2026-02-25 12:45:00+00'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  event_type = excluded.event_type,
  status = excluded.status,
  occurred_at = excluded.occurred_at,
  location = excluded.location,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

-- ---------------------------------------------------------------------------
-- 5. Article <-> Tag relationships
-- ---------------------------------------------------------------------------

insert into article_tags (article_id, tag_id)
values
  ('11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222202'),
  ('11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222205'),
  ('11111111-1111-4111-8111-111111111101', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222205'),
  ('11111111-1111-4111-8111-111111111102', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111103', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111103', '22222222-2222-4222-8222-222222222205'),
  ('11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222208'),
  ('11111111-1111-4111-8111-111111111104', '22222222-2222-4222-8222-222222222212'),
  ('11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222208'),
  ('11111111-1111-4111-8111-111111111105', '22222222-2222-4222-8222-222222222212'),
  ('11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222203'),
  ('11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222207'),
  ('11111111-1111-4111-8111-111111111106', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222203'),
  ('11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222204'),
  ('11111111-1111-4111-8111-111111111107', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222203'),
  ('11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222207'),
  ('11111111-1111-4111-8111-111111111108', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111109', '22222222-2222-4222-8222-222222222209'),
  ('11111111-1111-4111-8111-111111111109', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111109', '22222222-2222-4222-8222-222222222212'),
  ('11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222222209'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222211'),
  ('11111111-1111-4111-8111-111111111112', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111112', '22222222-2222-4222-8222-222222222211'),
  ('11111111-1111-4111-8111-111111111113', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111113', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111114', '22222222-2222-4222-8222-222222222203'),
  ('11111111-1111-4111-8111-111111111114', '22222222-2222-4222-8222-222222222204'),
  ('11111111-1111-4111-8111-111111111114', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111115', '22222222-2222-4222-8222-222222222208'),
  ('11111111-1111-4111-8111-111111111115', '22222222-2222-4222-8222-222222222212'),
  ('11111111-1111-4111-8111-111111111116', '22222222-2222-4222-8222-222222222201'),
  ('11111111-1111-4111-8111-111111111116', '22222222-2222-4222-8222-222222222206'),
  ('11111111-1111-4111-8111-111111111117', '22222222-2222-4222-8222-222222222209'),
  ('11111111-1111-4111-8111-111111111117', '22222222-2222-4222-8222-222222222210'),
  ('11111111-1111-4111-8111-111111111118', '22222222-2222-4222-8222-222222222203'),
  ('11111111-1111-4111-8111-111111111118', '22222222-2222-4222-8222-222222222211')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 6. Article <-> Event relationships
-- ---------------------------------------------------------------------------

insert into article_events (article_id, event_id)
values
  ('11111111-1111-4111-8111-111111111101', '33333333-3333-4333-8333-333333333301'),
  ('11111111-1111-4111-8111-111111111102', '33333333-3333-4333-8333-333333333301'),
  ('11111111-1111-4111-8111-111111111103', '33333333-3333-4333-8333-333333333301'),
  ('11111111-1111-4111-8111-111111111116', '33333333-3333-4333-8333-333333333301'),
  ('11111111-1111-4111-8111-111111111104', '33333333-3333-4333-8333-333333333302'),
  ('11111111-1111-4111-8111-111111111105', '33333333-3333-4333-8333-333333333302'),
  ('11111111-1111-4111-8111-111111111115', '33333333-3333-4333-8333-333333333302'),
  ('11111111-1111-4111-8111-111111111106', '33333333-3333-4333-8333-333333333303'),
  ('11111111-1111-4111-8111-111111111108', '33333333-3333-4333-8333-333333333303'),
  ('11111111-1111-4111-8111-111111111109', '33333333-3333-4333-8333-333333333304'),
  ('11111111-1111-4111-8111-111111111110', '33333333-3333-4333-8333-333333333304'),
  ('11111111-1111-4111-8111-111111111117', '33333333-3333-4333-8333-333333333304'),
  ('11111111-1111-4111-8111-111111111107', '33333333-3333-4333-8333-333333333305'),
  ('11111111-1111-4111-8111-111111111113', '33333333-3333-4333-8333-333333333305'),
  ('11111111-1111-4111-8111-111111111114', '33333333-3333-4333-8333-333333333305'),
  ('11111111-1111-4111-8111-111111111118', '33333333-3333-4333-8333-333333333305'),
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333306'),
  ('11111111-1111-4111-8111-111111111112', '33333333-3333-4333-8333-333333333306'),
  ('11111111-1111-4111-8111-111111111118', '33333333-3333-4333-8333-333333333306')
on conflict do nothing;

commit;
