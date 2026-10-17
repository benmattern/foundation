alter table public.sources add column catalog_id text;
create unique index sources_owner_catalog_idx on public.sources(owner_id,catalog_id) where catalog_id is not null;
create table public.project_catalog_sources(
 project_id uuid not null,owner_id uuid not null,catalog_id text not null,source_id uuid not null,
 topics text[] not null,region text not null,primary key(project_id,catalog_id),
 foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(source_id,owner_id) references public.sources(id,owner_id)
);
create table public.tuning_examples(
 project_id uuid not null,owner_id uuid not null,candidate_id uuid not null,
 useful boolean not null,held_out boolean not null default false,version integer not null default 1,updated_at timestamptz not null default now(),
 primary key(project_id,candidate_id),foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(candidate_id,project_id) references public.ingestion_candidates(id,project_id)
);
create function public.select_catalog_source(p_project uuid,p_catalog jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;publisher uuid;feed uuid;key text;state text;
begin
 who:=require_project(p_project);key:=p_catalog->>'id';
 if key is null or key!~'^[a-z0-9-]{1,80}$' or length(p_catalog::text)>20000 or jsonb_typeof(p_catalog->'topics') is distinct from 'array' or p_catalog->>'url'!~'^https://' then raise exception 'Invalid catalog selection';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text||key,16));
 perform pg_advisory_xact_lock(hashtextextended(who::text||(p_catalog->>'url'),0));
 select id into publisher from sources where owner_id=who and catalog_id=key;
 if publisher is null then
  select id into publisher from sources where owner_id=who and url=p_catalog->>'url' order by created_at,id limit 1;
  if publisher is null then
   insert into sources(owner_id,name,url,category,topics,region,language,catalog_id) values(who,p_catalog->>'name',p_catalog->>'url','Catalog',array(select jsonb_array_elements_text(p_catalog->'topics')),p_catalog->>'region',p_catalog->>'language',key) returning id into publisher;
  else update sources set catalog_id=key where id=publisher and catalog_id is null;end if;
 end if;
 insert into project_catalog_sources values(p_project,who,key,publisher,array(select jsonb_array_elements_text(p_catalog->'topics')),p_catalog->>'region') on conflict do nothing;
 -- Pack adoption preserves existing Follow/Pause/Unfollow and all overrides.
 perform pg_advisory_xact_lock(hashtextextended(p_project::text||publisher::text,0));
 select ps.state into state from project_sources ps where ps.project_id=p_project and ps.source_id=publisher;
 if nullif(p_catalog->>'feedUrl','') is not null then
  if p_catalog->>'feedUrl'!~'^https://' then raise exception 'Invalid feed endpoint';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_project::text||publisher::text,0));
  select id into feed from rss_feeds where owner_id=who and feed_url=p_catalog->>'feedUrl' order by created_at,id limit 1;
  if feed is null then insert into rss_feeds(owner_id,source_id,title,feed_url) values(who,publisher,p_catalog->>'name',p_catalog->>'feedUrl') returning id into feed;end if;
  if not exists(select 1 from project_subscriptions where project_id=p_project and feed_id=feed) then
   if state is null or state='following' then perform set_subscription(p_project,feed,true,null);
   else insert into project_subscriptions(project_id,owner_id,feed_id,enabled,followed) values(p_project,who,feed,false,state<>'unfollowed');end if;
  end if;
 elsif state is null then perform set_source_state(p_project,publisher,'following');end if;
 return publisher;
end $$;
create function public.save_tuning_example(p_project uuid,p_candidate uuid,p_useful boolean,p_held_out boolean,p_expected integer default 0) returns public.tuning_examples
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;e tuning_examples;
begin
 who:=require_project(p_project);
 perform 1 from ingestion_candidates where id=p_candidate and project_id=p_project for key share;
 if not found then raise exception 'Example unavailable';end if;
 if p_useful is null or p_held_out is null then raise exception 'Choose a usefulness label';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_project::text||p_candidate::text,16));
 select * into e from tuning_examples where project_id=p_project and candidate_id=p_candidate for update;
 if coalesce(e.version,0) is distinct from p_expected then raise exception 'Example changed; reload' using errcode='40001';end if;
 insert into tuning_examples(project_id,owner_id,candidate_id,useful,held_out) values(p_project,who,p_candidate,p_useful,p_held_out)
 on conflict(project_id,candidate_id) do update set useful=p_useful,held_out=p_held_out,version=tuning_examples.version+1,updated_at=now() returning * into e;return e;
end $$;
create index candidates_calibration_idx on public.ingestion_candidates(project_id,created_at,id);
create index rule_evaluations_candidate_cursor_idx on public.rule_evaluations(candidate_id,evaluated_at,id);
create function public.calibration_window(p_project uuid,p_since timestamptz,p_until timestamptz,p_source uuid default null,p_after uuid default null,p_sample boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 perform require_project(p_project);
 if p_since is null or p_until is null or p_until<=p_since or p_until-p_since>interval '90 days' then raise exception 'Choose a period of at most 90 days';end if;
 if p_source is not null and not exists(select 1 from sources where id=p_source and owner_id=auth.uid()) then raise exception 'Source unavailable';end if;
 with dedup as materialized(
  select distinct on(coalesce(item_id::text,url)) * from ingestion_candidates where project_id=p_project and created_at>=p_since and created_at<p_until order by coalesce(item_id::text,url),created_at,id
 ), population as materialized(select * from dedup where p_source is null or source_id=p_source),
 eligible as materialized(select * from population where not p_sample or route='outside_scope' or rule_score(rule_result)<=1),
 page as(select * from eligible where p_after is null or id>p_after order by id limit case when p_sample then 10 else 25 end)
 select jsonb_build_object('as_of',statement_timestamp(),'since',p_since,'until',p_until,'source_id',p_source,'collected',(select count(*) from population),
 'pending_route',(select count(*) from population where route='pending'),'outside',(select count(*) from population where route='outside_scope'),
 'kept',(select count(*) from population where status='accepted'),'dismissed',(select count(*) from population where status='rejected'),
 'duplicate',(select count(*) from population where status='duplicate'),'deferred',(select count(*) from population where status='pending' and deferred),
 'unreviewed',(select count(*) from population where status='pending'),'sample_population',(select count(*) from eligible),
 'items',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('feedback',(select to_jsonb(e) from tuning_examples e where e.project_id=p_project and e.candidate_id=c.id),
 'first_rule_result',(select r.result from rule_evaluations r where r.candidate_id=c.id and r.project_id=p_project order by r.evaluated_at,r.id limit 1),
 'current_project_rules',(select rules from projects where id=p_project),
 'current_subscription_rules',(select s.rules from project_subscriptions s where s.project_id=p_project and s.feed_id=nullif(c.raw_metadata->>'feed_id','')::uuid)) order by c.id) from page c),'[]'),
 'has_more',exists(select 1 from eligible where id>(select max(id::text)::uuid from page))) into result;
 return result;
end $$;
do $$ declare t text;f regprocedure;begin
 foreach t in array array['project_catalog_sources','tuning_examples'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in ('select_catalog_source','save_tuning_example','calibration_window') loop
 execute format('revoke all on function %s from public,anon,authenticated',f);execute format('grant execute on function %s to authenticated',f);
 end loop;
end $$;
