-- Existing-data upgrades require a verified auth.users UUID in app.legacy_owner_id.
-- No ownership is inferred from a browser key, email, seed or first signup.
do $$ begin
 if exists(select 1 from pg_policies where schemaname='public' and tablename in ('sources','articles','tags','article_tags','events','article_events','ingestion_candidates','rss_feeds') and not (
  cmd='ALL' and permissive='PERMISSIVE' and roles=array['public']::name[] and qual='true' and with_check='true' and
  ((tablename='tags' and policyname='Allow all tag access') or (tablename='article_tags' and policyname='Allow all article tag access'))
 )) then
  raise exception 'Existing legacy policies require reconciliation before this migration';
 end if;
end $$;
-- Exact permissive policies verified against the live project on 2026-10-16.
-- Remove only these reviewed prototype policies; unknown policies still stop rollout.
drop policy if exists "Allow all tag access" on public.tags;
drop policy if exists "Allow all article tag access" on public.article_tags;
create table public.projects (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) default auth.uid(),
 name text not null check(length(trim(name)) > 0), description text not null default '',
 topics text[] not null default '{}', keywords text[] not null default '{}', archived boolean not null default false,
 rules jsonb not null default '{"version":1,"includeAny":[],"excludeAny":[],"defaultTags":[],"keywordTags":[]}',
 created_at timestamptz not null default now(), unique(id,owner_id)
);
alter table public.sources add owner_id uuid references auth.users(id) default auth.uid();
alter table public.tags add owner_id uuid references auth.users(id) default auth.uid();
alter table public.rss_feeds add owner_id uuid references auth.users(id) default auth.uid();
alter table public.articles add owner_id uuid references auth.users(id) default auth.uid(), add project_id uuid references public.projects(id);
alter table public.events add owner_id uuid references auth.users(id) default auth.uid(), add project_id uuid references public.projects(id);
alter table public.ingestion_candidates add owner_id uuid references auth.users(id) default auth.uid(), add project_id uuid references public.projects(id);
do $$
declare legacy_owner uuid; legacy_project uuid;
begin
 if exists(select 1 from public.sources) or exists(select 1 from public.tags) or exists(select 1 from public.rss_feeds)
 or exists(select 1 from public.articles) or exists(select 1 from public.events) or exists(select 1 from public.ingestion_candidates) then
  legacy_owner := nullif(current_setting('app.legacy_owner_id',true),'')::uuid;
  if legacy_owner is null or not exists(select 1 from auth.users where id=legacy_owner) then
   raise exception 'Verified app.legacy_owner_id referencing auth.users is required for legacy data';
  end if;
  insert into public.projects(owner_id,name,description) values(legacy_owner,'Legacy research','Preserved pre-project research') returning id into legacy_project;
  update public.sources set owner_id=legacy_owner;
  update public.tags set owner_id=legacy_owner;
  update public.rss_feeds set owner_id=legacy_owner;
  update public.articles set owner_id=legacy_owner,project_id=legacy_project;
  update public.events set owner_id=legacy_owner,project_id=legacy_project;
  update public.ingestion_candidates set owner_id=legacy_owner,project_id=legacy_project;
 end if;
end $$;
alter table public.sources alter owner_id set not null, add unique(id,owner_id);
alter table public.tags alter owner_id set not null, add unique(id,owner_id);
alter table public.tags drop constraint tags_name_key;
alter table public.tags add unique(owner_id,name);
alter table public.rss_feeds alter owner_id set not null, add unique(id,owner_id),
 add foreign key(source_id,owner_id) references public.sources(id,owner_id);
alter table public.articles alter owner_id set not null, alter project_id set not null,
 add unique(id,project_id), add foreign key(project_id,owner_id) references public.projects(id,owner_id),
 add foreign key(source_id,owner_id) references public.sources(id,owner_id);
alter table public.events alter owner_id set not null, alter project_id set not null,
 add unique(id,project_id), add foreign key(project_id,owner_id) references public.projects(id,owner_id);
alter table public.ingestion_candidates alter owner_id set not null, alter project_id set not null,
 add foreign key(project_id,owner_id) references public.projects(id,owner_id),
 add foreign key(source_id,owner_id) references public.sources(id,owner_id),
 add foreign key(converted_article_id,project_id) references public.articles(id,project_id),
 add column tag_ids uuid[] not null default '{}',
 add column analyst_added_tags uuid[] not null default '{}',
 add column analyst_removed_tags uuid[] not null default '{}',
 add column route text not null default 'pending' check(route in ('pending','outside_scope')),
  add column route_override text check(route_override in ('pending','outside_scope')),
 add column rule_result jsonb, add column original_acquisition jsonb;
update public.ingestion_candidates set original_acquisition=jsonb_build_object('url',url,'title',title,'description',description,'published_at',published_at,'raw_metadata',raw_metadata);
create table public.collected_items (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 identity_url text not null, original_acquisition jsonb not null,
 created_at timestamptz not null default now(), unique(owner_id,identity_url), unique(id,owner_id)
);
alter table public.ingestion_candidates add item_id uuid, add foreign key(item_id,owner_id) references public.collected_items(id,owner_id), add unique(project_id,item_id);
alter table public.articles add item_id uuid, add foreign key(item_id,owner_id) references public.collected_items(id,owner_id), add unique(project_id,item_id);
-- Exact legacy URLs are preserved. URL aliases/normalization conflicts require an explicit reconciliation, never deletion.
insert into public.collected_items(owner_id,identity_url,original_acquisition)
 select distinct on(owner_id,url) owner_id,url,jsonb_build_object('url',url,'title',title,'description',summary,'published_at',published_at)
 from public.articles order by owner_id,url,created_at,id on conflict do nothing;
insert into public.collected_items(owner_id,identity_url,original_acquisition)
 select distinct on(owner_id,url) owner_id,url,original_acquisition from public.ingestion_candidates
 order by owner_id,url,created_at,id on conflict do nothing;
-- Assign one representative per project/URL, preserving any pre-existing duplicates and their IDs.
update public.articles a set item_id=i.id from public.collected_items i where a.owner_id=i.owner_id and a.url=i.identity_url
 and a.id=(select b.id from public.articles b where b.project_id=a.project_id and b.url=a.url order by b.created_at,b.id limit 1);
update public.ingestion_candidates c set item_id=i.id from public.collected_items i where c.owner_id=i.owner_id and c.url=i.identity_url
 and c.id=(select b.id from public.ingestion_candidates b where b.project_id=c.project_id and b.url=c.url order by b.created_at,b.id limit 1);
create table public.project_subscriptions (
 project_id uuid not null, feed_id uuid not null, owner_id uuid not null default auth.uid(),
 enabled boolean not null default true, rules jsonb,
 primary key(project_id,feed_id), foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(feed_id,owner_id) references public.rss_feeds(id,owner_id)
);
create table public.collection_runs (
 id uuid primary key default gen_random_uuid(), feed_id uuid not null, owner_id uuid not null,
 status text not null check(status in ('running','success','partial','error','paused')),
 intake_version integer not null default 0,
 started_at timestamptz not null default now(), finished_at timestamptz, lease_until timestamptz,
 fetched integer not null default 0, staged integer not null default 0, warnings jsonb not null default '[]', error text,
 foreign key(feed_id,owner_id) references public.rss_feeds(id,owner_id)
);
alter table public.rss_feeds add intake_version integer not null default 0, add next_check_at timestamptz not null default now(), add last_success_at timestamptz,
 add failure_count integer not null default 0, add etag text, add last_modified text;
create table public.item_origins (
 item_id uuid not null, feed_id uuid not null, owner_id uuid not null, origin_key text not null,
 observed_at timestamptz not null default now(), observation jsonb not null,
 primary key(feed_id,origin_key), foreign key(item_id,owner_id) references public.collected_items(id,owner_id),
 foreign key(feed_id,owner_id) references public.rss_feeds(id,owner_id)
);
-- Project-scoped event links. Existing IDs/links are retained.
alter table public.article_events add project_id uuid;
update public.article_events ae set project_id=e.project_id from public.events e where e.id=ae.event_id;
alter table public.article_events alter project_id set not null,
 add foreign key(article_id,project_id) references public.articles(id,project_id),
 add foreign key(event_id,project_id) references public.events(id,project_id);
create index candidates_review_idx on public.ingestion_candidates(project_id,status,route,created_at desc,id);
create index candidates_tags_idx on public.ingestion_candidates using gin(tag_ids);
create index articles_project_idx on public.articles(project_id,created_at desc,id);
create index events_project_idx on public.events(project_id,occurred_at desc,id);
create index subscriptions_feed_idx on public.project_subscriptions(feed_id) where enabled;
create index runs_feed_idx on public.collection_runs(feed_id,started_at desc);
create index feeds_due_idx on public.rss_feeds(next_check_at) where is_active;

-- Direct parent policies and composite FKs enforce ownership, including foreign-key writes.
do $$ declare t text; begin
 foreach t in array array['projects','sources','tags','rss_feeds','articles','events','ingestion_candidates','project_subscriptions','collection_runs','collected_items','item_origins'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_access on public.%I to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid())',t);
 end loop;
end $$;
alter table public.article_tags enable row level security;
create policy owner_access on public.article_tags to authenticated using(
 exists(select 1 from public.articles a where a.id=article_id and a.owner_id=auth.uid())
) with check(
 exists(select 1 from public.articles a join public.tags t on t.owner_id=a.owner_id where a.id=article_id and t.id=tag_id and a.owner_id=auth.uid())
);
alter table public.article_events enable row level security;
create policy owner_access on public.article_events to authenticated using(
 exists(select 1 from public.events e where e.id=event_id and e.owner_id=auth.uid())
) with check(
 exists(select 1 from public.events e join public.articles a on a.project_id=e.project_id where e.id=event_id and a.id=article_id and e.owner_id=auth.uid())
);
-- Explicit privilege boundary; hosted unknown policies must be inventoried before applying.
revoke all on public.projects,public.sources,public.tags,public.rss_feeds,public.articles,public.events,
 public.ingestion_candidates,public.project_subscriptions,public.article_tags,public.article_events,public.collection_runs,public.collected_items,public.item_origins from anon;
grant select,insert,update,delete on public.projects,public.sources,public.tags,public.rss_feeds,public.articles,public.events,
 public.ingestion_candidates,public.project_subscriptions,public.article_tags,public.article_events to authenticated;
grant select on public.collection_runs,public.collected_items,public.item_origins to authenticated;
