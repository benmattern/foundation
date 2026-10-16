-- Additive upgrade: disabled legacy subscriptions stay followed/paused.
alter table public.project_subscriptions add followed boolean not null default true;
alter table public.project_subscriptions add constraint enabled_requires_follow check(not enabled or followed);
create table public.project_sources (
 project_id uuid not null, source_id uuid not null, owner_id uuid not null default auth.uid(),
 state text not null check(state in ('following','paused','unfollowed')), version integer not null default 1,
 primary key(project_id,source_id), foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(source_id,owner_id) references public.sources(id,owner_id)
);
insert into public.project_sources(project_id,source_id,owner_id,state)
 select s.project_id,f.source_id,s.owner_id,case when bool_or(s.enabled) then 'following' else 'paused' end
 from public.project_subscriptions s join public.rss_feeds f on f.id=s.feed_id where f.source_id is not null group by s.project_id,f.source_id,s.owner_id;
create table public.term_groups (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 200),version integer not null default 1,create_token uuid,create_hash text,unique(owner_id,create_token),unique(id,owner_id)
);
create table public.term_group_versions (
 group_id uuid not null,owner_id uuid not null,version integer not null,terms jsonb not null,
 primary key(group_id,version), foreign key(group_id,owner_id) references public.term_groups(id,owner_id)
);
create function public.valid_term_list(p_terms jsonb) returns boolean language plpgsql immutable as $$
begin
 if jsonb_typeof(p_terms) is distinct from 'array' or jsonb_array_length(p_terms) not between 1 and 100 then return false;end if;
 return not exists(select 1 from jsonb_array_elements(p_terms) t where jsonb_typeof(t)<>'string' or length(trim(t#>>'{}')) not between 1 and 200);
end $$;
create function public.save_term_group(p_id uuid,p_name text,p_terms jsonb,p_expected integer default 0,p_request uuid default null) returns public.term_groups
language plpgsql security definer set search_path=public,pg_temp as $$
declare g term_groups;
begin
 if auth.uid() is null or not valid_term_list(p_terms) then raise exception 'A named group needs 1-100 nonblank terms';end if;
 if p_id is null then
  if p_request is not null then
   perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
   select * into g from term_groups where owner_id=auth.uid() and create_token=p_request;
   if found then
    if g.create_hash is distinct from md5(jsonb_build_array(p_name,p_terms)::text) then raise exception 'This create request already saved different content; reload the saved group before editing' using errcode='40001';end if;
    return g;
   end if;
  end if;
  insert into term_groups(owner_id,name,create_token,create_hash) values(auth.uid(),p_name,p_request,md5(jsonb_build_array(p_name,p_terms)::text)) returning * into g;
 else
  select * into g from term_groups where id=p_id and owner_id=auth.uid() for update;
  if g.id is null then raise exception 'Group access denied' using errcode='42501';end if;
  if g.version is distinct from p_expected then raise exception 'Group changed; reload before saving' using errcode='40001';end if;
  update term_groups set name=p_name,version=version+1 where id=g.id returning * into g;
 end if;
 insert into term_group_versions values(g.id,g.owner_id,g.version,p_terms);return g;
end $$;
create function public.validate_criterion(p_owner uuid,c jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare terms jsonb; pinned jsonb;
begin
 terms:=coalesce(c->'terms','[]');
 if c ? 'group' then
  select v.terms into pinned from term_group_versions v where v.group_id=(c->'group'->>'id')::uuid and v.version=(c->'group'->>'version')::integer and v.owner_id=p_owner;
  if pinned is null or pinned is distinct from c->'group'->'terms' then raise exception 'Invalid owner-scoped pinned term group';end if;
  terms:=terms||pinned;
 end if;
 if not valid_term_list(terms) or c->>'mode' not in ('whole','substring') or c->>'mode' is null
 or jsonb_typeof(c->'fields') is distinct from 'array' or jsonb_array_length(c->'fields') not between 1 and 3
 or exists(select 1 from jsonb_array_elements_text(c->'fields') f where f not in ('title','excerpt','categories')) then raise exception 'Invalid condition: choose terms, fields and match mode';end if;
end $$;
create function public.validate_intake_rules(p_owner uuid,r jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare g jsonb;c jsonb;
begin
 if r is null then return;end if;
 if length(r::text)>100000 or coalesce((r->>'version')::integer,0)<1 then raise exception 'Invalid rule version/size';end if;
 if r ? 'format' then
  if r->>'format'<>'2' or r->>'mode' is null or r->>'mode' not in ('all','restricted') then raise exception 'Unsupported intake format/mode';end if;
  if jsonb_typeof(r->'groups') is distinct from 'array' or jsonb_array_length(r->'groups')>8 or (r->>'mode'='restricted' and jsonb_array_length(r->'groups')=0) then raise exception 'Restricted intake needs bounded groups';end if;
  for g in select * from jsonb_array_elements(r->'groups') loop
   if jsonb_typeof(g)<>'array' or jsonb_array_length(g) not between 1 and 8 then raise exception 'Empty/oversized inclusion group';end if;
   for c in select * from jsonb_array_elements(g) loop perform validate_criterion(p_owner,c);end loop;
  end loop;
  if jsonb_typeof(r->'exclusions') is distinct from 'array' or jsonb_array_length(r->'exclusions')>8 then raise exception 'Invalid exclusions';end if;
  for c in select * from jsonb_array_elements(r->'exclusions') loop perform validate_criterion(p_owner,c);end loop;
 end if;
 perform validate_tags(p_owner,array(select jsonb_array_elements_text(coalesce(r->'defaultTags','[]'))::uuid union select (t->>'tag')::uuid from jsonb_array_elements(coalesce(r->'keywordTags','[]')) t));
end $$;
create function public.check_intake_rules() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin perform validate_intake_rules(new.owner_id,new.rules);return new;end $$;
create trigger validate_project_rules before insert or update of rules on public.projects for each row execute function public.check_intake_rules();
create trigger validate_subscription_rules before insert or update of rules on public.project_subscriptions for each row execute function public.check_intake_rules();

-- Serialize source decisions and subscription creation before taking feed locks.
alter function public.set_source_enabled(uuid,uuid,boolean) rename to set_source_enabled_v1;
revoke all on function public.set_source_enabled_v1(uuid,uuid,boolean) from public,anon,authenticated;
create function public.set_source_state(p_project uuid,p_source uuid,p_state text,p_expected integer default null) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;prior integer;
begin
 who:=require_project(p_project);
 if p_state not in ('following','paused','unfollowed') or not exists(select 1 from sources where id=p_source and owner_id=who) then raise exception 'Invalid source/state' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_project::text||p_source::text,0));
 perform 1 from rss_feeds where source_id=p_source and owner_id=who order by id for update;
 select version into prior from project_sources where project_id=p_project and source_id=p_source for update;
 if p_expected is not null and p_expected<>coalesce(prior,0) then raise exception 'Source state changed; refresh' using errcode='40001';end if;
 if p_state='following' then update project_subscriptions s set followed=true from rss_feeds f where s.feed_id=f.id and f.source_id=p_source and s.project_id=p_project;end if;
 perform set_source_enabled_v1(p_project,p_source,p_state='following');
 update project_subscriptions s set followed=p_state<>'unfollowed' from rss_feeds f where s.feed_id=f.id and f.source_id=p_source and s.project_id=p_project;
 insert into project_sources(project_id,source_id,owner_id,state) values(p_project,p_source,who,p_state)
 on conflict(project_id,source_id) do update set state=excluded.state,version=project_sources.version+1;
end $$;
create function public.set_source_enabled(p_project uuid,p_source uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin perform set_source_state(p_project,p_source,case when p_enabled then 'following' else 'paused' end);end $$;
revoke all on function public.set_source_enabled(uuid,uuid,boolean) from public,anon;
grant execute on function public.set_source_enabled(uuid,uuid,boolean) to authenticated;
alter function public.set_subscription(uuid,uuid,boolean,jsonb,jsonb) rename to set_subscription_v1;
create function public.set_subscription(p_project uuid,p_feed uuid,p_enabled boolean,p_rules jsonb default null,p_expected jsonb default null) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare source uuid;source_state text;
begin
 perform require_project(p_project);
 select source_id into source from rss_feeds where id=p_feed and owner_id=auth.uid();
 if source is not null then perform pg_advisory_xact_lock(hashtextextended(p_project::text||source::text,0));end if;
 perform 1 from rss_feeds where id=p_feed for update;
 if source is distinct from (select source_id from rss_feeds where id=p_feed) then raise exception 'Feed source changed; reload' using errcode='40001';end if;
 select state into source_state from project_sources where project_id=p_project and source_id=source;
 if source_state='unfollowed' then raise exception 'Source was unfollowed; explicitly re-follow before editing';end if;
 if source_state='paused' and p_enabled and not exists(select 1 from project_subscriptions where project_id=p_project and feed_id=p_feed) then raise exception 'Source is paused; resume it before enabling a new feed';end if;
 if exists(select 1 from project_subscriptions where project_id=p_project and feed_id=p_feed and not followed) then raise exception 'Source was unfollowed; explicitly re-follow before editing';end if;
 perform set_subscription_v1(p_project,p_feed,p_enabled,p_rules,p_expected);
end $$;
revoke all on function public.set_subscription_v1(uuid,uuid,boolean,jsonb,jsonb) from public,anon,authenticated;

alter table public.ingestion_candidates add deferred boolean not null default false,add matching_preview jsonb,add unique(id,project_id);
create table public.candidate_previews (
 id uuid primary key default gen_random_uuid(),candidate_id uuid not null,project_id uuid not null,owner_id uuid not null,
 origin_url text not null,excerpt text not null check(length(excerpt)<=20000),retrieved_at timestamptz not null default now(),
 foreign key(candidate_id,project_id) references public.ingestion_candidates(id,project_id),foreign key(project_id,owner_id) references public.projects(id,owner_id)
);
create function public.save_candidate_preview(p_id uuid,p_url text,p_excerpt text) returns public.candidate_previews
language plpgsql security definer set search_path=public,pg_temp as $$
declare c ingestion_candidates;result candidate_previews;
begin
 select * into c from ingestion_candidates where id=p_id for update;perform require_project(c.project_id);
 if p_url is distinct from c.url and p_url is distinct from c.canonical_url and p_url is distinct from c.final_url then raise exception 'Preview origin does not match this item';end if;
 insert into candidate_previews(candidate_id,project_id,owner_id,origin_url,excerpt) values(c.id,c.project_id,c.owner_id,p_url,left(regexp_replace(p_excerpt,'<[^>]*>',' ','g'),20000)) returning * into result;return result;
end $$;
alter function public.review_candidate(uuid,text,jsonb) rename to review_candidate_v1;
create function public.review_candidate(p_id uuid,p_action text,p_values jsonb default '{}') returns public.ingestion_candidates
language plpgsql security definer set search_path=public,pg_temp as $$
declare c ingestion_candidates;preview candidate_previews;
begin
 select * into c from ingestion_candidates where id=p_id for update;perform require_project(c.project_id);
 if p_action='later' then
  if c.status<>'pending' then raise exception 'Restore before deferring';end if;
  update ingestion_candidates set deferred=true,updated_at=now() where id=c.id returning * into c;return c;
 elsif p_action='use_preview' then
  select * into preview from candidate_previews where id=(p_values->>'preview_id')::uuid and candidate_id=c.id;
  if preview.id is null then raise exception 'Preview unavailable';end if;
  update ingestion_candidates set matching_preview=to_jsonb(preview),updated_at=now() where id=c.id returning * into c;return c;
 end if;
 if p_action in ('accept','reject','duplicate','restore') then update ingestion_candidates set deferred=false where id=c.id;end if;
 return review_candidate_v1(p_id,p_action,p_values);
end $$;
revoke all on function public.review_candidate_v1(uuid,text,jsonb) from public,anon,authenticated;
create or replace function public.record_candidate_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' or (new.status,new.route,new.tag_ids,new.title,new.description,new.url,new.source_id,new.deferred,new.matching_preview) is distinct from (old.status,old.route,old.tag_ids,old.title,old.description,old.url,old.source_id,old.deferred,old.matching_preview) then
 insert into review_history(candidate_id,owner_id,project_id,before_state,after_state) values(new.id,new.owner_id,new.project_id,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));end if;
 if new.rule_result is not null and (tg_op='INSERT' or new.rule_result is distinct from old.rule_result) then insert into rule_evaluations(candidate_id,owner_id,project_id,result) values(new.id,new.owner_id,new.project_id,new.rule_result);end if;return new;
end $$;
do $$ declare t text;begin
 foreach t in array array['project_sources','term_groups','term_group_versions','candidate_previews'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
revoke all on function public.valid_term_list(jsonb),public.validate_criterion(uuid,jsonb),public.validate_intake_rules(uuid,jsonb),public.check_intake_rules() from public,anon,authenticated;
revoke all on function public.save_term_group(uuid,text,jsonb,integer,uuid),public.set_source_state(uuid,uuid,text,integer),public.set_subscription(uuid,uuid,boolean,jsonb,jsonb),public.review_candidate(uuid,text,jsonb),public.save_candidate_preview(uuid,text,text) from public,anon;
grant execute on function public.save_term_group(uuid,text,jsonb,integer,uuid),public.set_source_state(uuid,uuid,text,integer),public.set_subscription(uuid,uuid,boolean,jsonb,jsonb),public.review_candidate(uuid,text,jsonb),public.save_candidate_preview(uuid,text,text) to authenticated;

-- Catalog creation must enter the same source-before-feed lock order.
create or replace function public.enable_catalog_feed(p_project uuid,p_catalog jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;publisher uuid;feed uuid;
begin
 who:=require_project(p_project);
 perform pg_advisory_xact_lock(hashtextextended(who::text||(p_catalog->>'url'),0));
 select id into publisher from sources where owner_id=who and url=p_catalog->>'url' order by created_at,id limit 1;
 if publisher is null then
  insert into sources(owner_id,name,url,category,topics,region,language) values(who,p_catalog->>'name',p_catalog->>'url','Catalog',array(select jsonb_array_elements_text(p_catalog->'topics')),p_catalog->>'region',p_catalog->>'language') returning id into publisher;
 end if;
 select id into feed from rss_feeds where owner_id=who and feed_url=p_catalog->>'feedUrl' order by created_at,id limit 1;
 if feed is null then insert into rss_feeds(owner_id,source_id,title,feed_url) values(who,publisher,p_catalog->>'name',p_catalog->>'feedUrl') returning id into feed;end if;
 perform set_subscription(p_project,feed,true,(select rules from project_subscriptions where project_id=p_project and feed_id=feed));
end $$;
