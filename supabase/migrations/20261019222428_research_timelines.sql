-- Milestone 08 / additive migration 017. Baseline catalog inspected read-only on
-- 2026-10-19: migrations 001-016, events/article_events FKs, grants and RPCs match.
-- Do not run in production without separate rollout authorization and rehearsal.
create function public.timeline_date(p_value text,p_end boolean default false) returns date
language plpgsql immutable set search_path=public,pg_temp as $$
declare y integer;m integer;d integer;result date;
begin
 if p_value is null or p_value='' then return null;end if;
 if p_value !~ '^[0-9]{4}(-[0-9]{2})?(-[0-9]{2})?$' then raise exception 'Use YYYY, YYYY-MM or YYYY-MM-DD';end if;
 y:=left(p_value,4)::integer;m:=case when length(p_value)>=7 then substring(p_value,6,2)::integer else 1 end;
 d:=case when length(p_value)=10 then substring(p_value,9,2)::integer else 1 end;
 if y<1 then raise exception 'Invalid calendar year';end if;
 result:=make_date(y,m,d);
 if p_end and length(p_value)=4 then result:=make_date(y,12,31);
 elsif p_end and length(p_value)=7 then result:=(result+interval '1 month'-interval '1 day')::date;end if;
 return result;
end $$;
alter table public.events
 add column version integer not null default 1,
 add column date_start text,add column date_end text,
 add column date_approximate boolean not null default false,
 add column date_note text not null default '',
 add column date_origin text not null default 'explicit' check(date_origin in ('explicit','legacy_timestamp')),
 add column claim_kind text not null default 'unverified' check(claim_kind in ('unverified','source_reported','analyst_observation','disputed')),
 add column analyst_notes text not null default '';
-- Preserve original timestamps and updated_at exactly: the old timestamp trigger
-- would otherwise make migration time appear to be an analyst edit.
alter table public.events disable trigger set_events_updated_at;
update public.events set date_start=(occurred_at at time zone 'UTC')::date::text,date_origin='legacy_timestamp' where occurred_at is not null;
alter table public.events enable trigger set_events_updated_at;
alter table public.events
 add column timeline_start date generated always as (public.timeline_date(date_start,false)) stored,
 add column timeline_end date generated always as (public.timeline_date(coalesce(date_end,date_start),true)) stored,
 add constraint event_date_range check(date_end is null or (date_start is not null and timeline_end>=timeline_start));
create index events_timeline_order on public.events(project_id,timeline_start,id);

-- Explicit, bounded event associations, not a generic evidence framework.
-- target_id retains identity after FK SET NULL; snapshots never take client prose.
create table public.event_references(
 id uuid primary key default gen_random_uuid(),event_id uuid not null,project_id uuid not null,owner_id uuid not null,
 kind text not null check(kind in ('article','entity','question')),target_id uuid not null,
 article_id uuid,entity_id uuid,question_id uuid,snapshot jsonb not null,
 disposition text not null default 'context' check(disposition in ('context','supports','challenges')),
 note text not null default '' check(length(note)<=4000),linked boolean not null default true,
 unique(event_id,kind,target_id),
 foreign key(event_id,project_id) references public.events(id,project_id) on delete cascade,
 foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(article_id,project_id) references public.articles(id,project_id) on delete set null(article_id),
 foreign key(entity_id,owner_id) references public.entities(id,owner_id) on delete set null(entity_id),
 foreign key(question_id,project_id) references public.research_questions(id,project_id) on delete set null(question_id),
 check((article_id is null or (kind='article' and article_id=target_id)) and
       (entity_id is null or (kind='entity' and entity_id=target_id)) and
       (question_id is null or (kind='question' and question_id=target_id)))
);
create index event_references_filter on public.event_references(project_id,kind,target_id,event_id) where linked;
create index event_references_source on public.event_references(project_id,(snapshot->>'source_id'),event_id) where linked and kind='article';
create table public.event_requests(
 owner_id uuid not null,project_id uuid not null,request_id uuid not null,event_id uuid not null,
 operation text not null,payload_hash text not null,response jsonb not null,created_at timestamptz not null default now(),
 primary key(owner_id,request_id),foreign key(project_id,owner_id) references public.projects(id,owner_id)
);
do $$ declare t text;begin
 foreach t in array array['event_references','event_requests'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create function public.timeline_snapshot(p_project uuid,p_kind text,p_target uuid) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_kind='article' then
  select jsonb_build_object('id',a.id,'title',a.title,'url',a.url,'source_id',a.source_id,'source_name',s.name,
   'published_at',a.published_at,'collected_at',i.created_at,'approved_at',a.created_at,'item_id',a.item_id)
  into result from articles a left join sources s on s.id=a.source_id and s.owner_id=a.owner_id
  left join collected_items i on i.id=a.item_id and i.owner_id=a.owner_id where a.id=p_target and a.project_id=p_project;
 elsif p_kind='entity' then
  select jsonb_build_object('id',e.id,'title',e.name,'entity_type',e.entity_type) into result from entities e
  join projects p on p.owner_id=e.owner_id where e.id=p_target and p.id=p_project;
 elsif p_kind='question' then
  select jsonb_build_object('id',q.id,'title',q.title) into result from research_questions q where q.id=p_target and q.project_id=p_project;
 end if;
 return result;
end $$;
insert into public.event_references(event_id,project_id,owner_id,kind,target_id,article_id,snapshot)
select l.event_id,l.project_id,e.owner_id,'article',l.article_id,l.article_id,public.timeline_snapshot(l.project_id,'article',l.article_id)
from public.article_events l join public.events e on e.id=l.event_id and e.project_id=l.project_id;
create function public.event_state(p_project uuid,p_id uuid) returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select to_jsonb(e)||jsonb_build_object('references',coalesce((select jsonb_agg(to_jsonb(r) order by r.kind,r.target_id)
 from event_references r where r.event_id=e.id and r.project_id=p_project),'[]')) from events e where e.id=p_id and e.project_id=p_project
$$;

-- Same RPC/signature as the deployed Events editor. Old versionless edits now
-- fail safely. Creation without a token remains compatible; the new UI always
-- supplies a stable request UUID. Responses include immutable retry receipts.
create or replace function public.save_event(p_project uuid,p_values jsonb,p_id uuid default null) returns public.events
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;result events;prior event_requests;request uuid;digest text;before_state jsonb;refs jsonb;v jsonb;
 k text;target uuid;snap jsonb;r event_references;legacy_date text;
begin
 who:=require_project(p_project);
 if jsonb_typeof(p_values) is distinct from 'object' or length(p_values::text)>200000 then raise exception 'Event payload must be an object under 200 KB';end if;
 request:=nullif(p_values->>'request_id','')::uuid;digest:=md5(p_values::text||coalesce(p_id::text,''));
 if request is not null then
  perform pg_advisory_xact_lock(hashtextextended(who::text||request::text,0));
  select * into prior from event_requests where owner_id=who and request_id=request;
  if found then
   if prior.project_id<>p_project or prior.operation<>'save' or prior.payload_hash<>digest then raise exception 'Request already used for different content' using errcode='40001';end if;
   select * into result from events where id=prior.event_id and project_id=p_project;
   if result.id is null then raise exception 'Previously saved event was deleted; create a new request deliberately' using errcode='40001';end if;
   return result;
  end if;
 end if;
 if p_id is not null then
  select * into result from events where id=p_id and project_id=p_project for update;
  if result.id is null then raise exception 'Event unavailable' using errcode='42501';end if;
  if result.version is distinct from (p_values->>'version')::integer then raise exception 'Event changed; reload before saving' using errcode='40001';end if;
  before_state:=event_state(p_project,p_id);
 else
  insert into events(owner_id,project_id,title) values(who,p_project,coalesce(p_values->>'title','')) returning * into result;
 end if;
 if length(trim(coalesce(p_values->>'title',result.title))) not between 1 and 300 or
  length(coalesce(p_values->>'description',result.description,''))>10000 or
  length(coalesce(p_values->>'analyst_notes',result.analyst_notes))>10000 or
  length(coalesce(p_values->>'date_note',result.date_note))>2000 or
  length(coalesce(p_values->>'location',result.location,''))>500 or
  length(coalesce(p_values->>'event_type',result.event_type,''))>100 then raise exception 'Check title (1-300), description/notes (10000), date note (2000), location (500) and type (100) limits';end if;
 if p_values ? 'references' then refs:=p_values->'references';
 elsif p_values ? 'article_ids' then
  refs:=coalesce((select jsonb_agg(jsonb_build_object('kind','article','target_id',x,'disposition','context','note','')) from jsonb_array_elements_text(p_values->'article_ids') x),'[]');
  refs:=refs||coalesce((select jsonb_agg(jsonb_build_object('kind',kind,'target_id',target_id,'disposition',disposition,'note',note)) from event_references where event_id=result.id and kind<>'article' and linked),'[]');
 else refs:=coalesce((select jsonb_agg(jsonb_build_object('kind',kind,'target_id',target_id,'disposition',disposition,'note',note)) from event_references where event_id=result.id and linked),'[]');end if;
 if jsonb_typeof(refs) is distinct from 'array' or jsonb_array_length(refs)>200 then raise exception 'Use at most 200 explicit references per event';end if;
 if exists(select 1 from jsonb_array_elements(refs) x group by x->>'kind',x->>'target_id' having count(*)>1) then raise exception 'Duplicate event references';end if;
 update event_references set linked=false where event_id=result.id;
 for v in select value from jsonb_array_elements(refs) loop
  k:=v->>'kind';target:=(v->>'target_id')::uuid;
  if k is null or k not in ('article','entity','question') or target is null then raise exception 'Invalid event reference';end if;
  select * into r from event_references where event_id=result.id and kind=k and target_id=target;
  snap:=timeline_snapshot(p_project,k,target);
  if snap is null and r.id is null then raise exception 'Reference unavailable in this project (access denied)' using errcode='42501';end if;
  -- Lock live targets to serialize reference creation with deletion.
  if snap is not null then
   if k='article' then perform 1 from articles where id=target and project_id=p_project for key share;
   elsif k='entity' then perform 1 from entities where id=target and owner_id=who for key share;
   else perform 1 from research_questions where id=target and project_id=p_project for key share;end if;
   if not found then raise exception 'Reference changed; reload' using errcode='40001';end if;
  end if;
  insert into event_references(event_id,project_id,owner_id,kind,target_id,article_id,entity_id,question_id,snapshot,disposition,note)
  values(result.id,p_project,who,k,target,case when k='article' and snap is not null then target end,
   case when k='entity' and snap is not null then target end,case when k='question' and snap is not null then target end,
   coalesce(r.snapshot,snap),coalesce(v->>'disposition','context'),coalesce(v->>'note',''))
  on conflict(event_id,kind,target_id) do update set disposition=excluded.disposition,note=excluded.note,linked=true;
 end loop;
 delete from article_events where event_id=result.id;
 insert into article_events(article_id,event_id,project_id)
 select article_id,result.id,p_project from event_references where event_id=result.id and linked and article_id is not null;
 -- Legacy clients may still create timestamps. Preserve explicit legacy meaning.
 legacy_date:=nullif(p_values->>'occurred_at','');
 update events set title=coalesce(p_values->>'title',result.title),description=coalesce(p_values->>'description',result.description),
  event_type=coalesce(p_values->>'event_type',result.event_type),status=coalesce(p_values->>'status',result.status),
  location=coalesce(p_values->>'location',result.location),
  date_start=case when p_values ? 'date_start' then nullif(p_values->>'date_start','') when p_values ? 'occurred_at' then (legacy_date::timestamptz at time zone 'UTC')::date::text else result.date_start end,
  date_end=case when p_values ? 'date_end' then nullif(p_values->>'date_end','') else result.date_end end,
  date_approximate=coalesce((p_values->>'date_approximate')::boolean,result.date_approximate),
  date_origin=case when (p_values ? 'date_start' and nullif(p_values->>'date_start','') is distinct from result.date_start)
    or (p_values ? 'date_end' and nullif(p_values->>'date_end','') is distinct from result.date_end)
    or (p_values ? 'date_approximate' and (p_values->>'date_approximate')::boolean is distinct from result.date_approximate)
    then 'explicit' when legacy_date is not null then 'legacy_timestamp' else result.date_origin end,
  occurred_at=case when legacy_date is not null then legacy_date::timestamptz else result.occurred_at end,
  date_note=coalesce(p_values->>'date_note',result.date_note),claim_kind=coalesce(p_values->>'claim_kind',result.claim_kind),analyst_notes=coalesce(p_values->>'analyst_notes',result.analyst_notes),
  version=case when p_id is null then 1 else result.version+1 end where id=result.id returning * into result;
 insert into research_history(project_id,owner_id,object_id,object_type,before_state,after_state)
 values(p_project,who,result.id,'events',before_state,event_state(p_project,result.id));
 if request is not null then insert into event_requests values(who,p_project,request,result.id,'save',digest,to_jsonb(result),now());end if;
 return result;
end $$;
create or replace function public.remove_event(p_project uuid,p_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin perform require_project(p_project);raise exception 'Use revision-guarded event deletion';end $$;
create function public.remove_timeline_event(p_project uuid,p_id uuid,p_expected integer,p_request uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;e events;prior event_requests;before_state jsonb;digest text;
begin
 who:=require_project(p_project);if p_request is null then raise exception 'Deletion request ID required';end if;
 digest:=md5(p_id::text||coalesce(p_expected::text,''));
 perform pg_advisory_xact_lock(hashtextextended(who::text||p_request::text,0));
 select * into prior from event_requests where owner_id=who and request_id=p_request;
 if found then
  if prior.project_id<>p_project or prior.operation<>'delete' or prior.payload_hash<>digest then raise exception 'Request already used for different content' using errcode='40001';end if;
  return;
 end if;
 select * into e from events where id=p_id and project_id=p_project for update;
 if e.id is null then raise exception 'Event unavailable' using errcode='42501';end if;
 if e.version is distinct from p_expected then raise exception 'Event changed; reload before deleting' using errcode='40001';end if;
 before_state:=event_state(p_project,p_id);
 insert into research_history(project_id,owner_id,object_id,object_type,before_state,after_state)
 values(p_project,who,p_id,'events',before_state,before_state||jsonb_build_object('deleted',true));
 delete from article_events where event_id=p_id;
 delete from events where id=p_id;
 insert into event_requests values(who,p_project,p_request,p_id,'delete',digest,'{}',now());
end $$;

-- Read APIs authorize before consulting filters, including absent/foreign IDs.
create function public.timeline_page(p_project uuid,p_filters jsonb default '{}',p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;from_date date;to_date date;
begin
 perform require_project(p_project);
 if jsonb_typeof(p_filters) is distinct from 'object' or length(p_filters::text)>4000 or p_offset<0 or p_offset>1000000 then raise exception 'Invalid timeline filters or page';end if;
 from_date:=nullif(p_filters->>'from','')::date;to_date:=nullif(p_filters->>'to','')::date;
 if from_date>to_date then raise exception 'Filter end precedes start';end if;
 with filtered as(
  select e.*,
   (select count(*) from event_references r where r.event_id=e.id and r.linked and r.kind='article') evidence_count,
   (select count(*) from event_references r where r.event_id=e.id and r.linked and r.kind='entity') entity_count,
   (select count(*) from event_references r where r.event_id=e.id and r.linked and r.kind='question') question_count
  from events e where e.project_id=p_project
  and (coalesce(p_filters->>'search','')='' or position(lower(p_filters->>'search') in lower(e.title||' '||coalesce(e.description,'')))>0)
  and (coalesce(p_filters->>'type','')='' or e.event_type=p_filters->>'type')
  and (from_date is null or e.timeline_end>=from_date) and(to_date is null or e.timeline_start<=to_date)
  and (coalesce(p_filters->>'entity','')='' or exists(select 1 from event_references r where r.event_id=e.id and r.kind='entity' and r.linked and r.target_id=(p_filters->>'entity')::uuid))
  and (coalesce(p_filters->>'question','')='' or exists(select 1 from event_references r where r.event_id=e.id and r.kind='question' and r.linked and r.target_id=(p_filters->>'question')::uuid))
  and (coalesce(p_filters->>'article','')='' or exists(select 1 from event_references r where r.event_id=e.id and r.kind='article' and r.linked and r.target_id=(p_filters->>'article')::uuid))
  and (coalesce(p_filters->>'source','')='' or exists(select 1 from event_references r where r.event_id=e.id and r.kind='article' and r.linked and r.snapshot->>'source_id'=p_filters->>'source'))
 ), page as(select * from filtered order by
  case when coalesce(p_filters->>'order','asc')<>'desc' then timeline_start end asc nulls last,
  case when p_filters->>'order'='desc' then timeline_start end desc nulls last,id asc limit 50 offset p_offset)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by
  case when coalesce(p_filters->>'order','asc')<>'desc' then timeline_start end asc nulls last,
  case when p_filters->>'order'='desc' then timeline_start end desc nulls last,id asc) from page p),'[]'),
  'total',(select count(*) from events where project_id=p_project),'matched',(select count(*) from filtered),
  'has_more',(select count(*) from filtered)>p_offset+50) into result;
 return result;
end $$;
create function public.timeline_event(p_project uuid,p_id uuid) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 perform require_project(p_project);
 result:=event_state(p_project,p_id);
 if result is null then raise exception 'Event unavailable' using errcode='42501';end if;
 return result||jsonb_build_object('references',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('available',
  case r.kind when 'article' then r.article_id is not null when 'entity' then r.entity_id is not null else r.question_id is not null end) order by kind,target_id)
  from event_references r where event_id=p_id and project_id=p_project and linked),'[]'),
 'history',coalesce((select jsonb_agg(to_jsonb(h) order by recorded_at desc,id desc) from
  (select id,recorded_at,before_state,after_state from research_history where project_id=p_project and object_id=p_id and object_type='events' order by recorded_at desc,id desc limit 20)h),'[]'));
end $$;
create function public.timeline_options(p_project uuid,p_kind text,p_search text default '',p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare who uuid;result jsonb;
begin
 who:=require_project(p_project);
 if p_kind not in ('article','entity','question','source') or length(p_search)>200 or p_offset<0 or p_offset>1000000 then raise exception 'Invalid reference search';end if;
 with options as(
  select a.id,a.title label,coalesce(s.name,'Unknown publisher') detail from articles a left join sources s on s.id=a.source_id and s.owner_id=who where p_kind='article' and a.project_id=p_project
  union all select id,name,entity_type from entities where p_kind='entity' and owner_id=who
  union all select id,title,status from research_questions where p_kind='question' and project_id=p_project
  union all select id,name,url from sources where p_kind='source' and owner_id=who
 ), matches as(select * from options where position(lower(p_search) in lower(label))>0),page as(select * from matches order by lower(label),id limit 25 offset p_offset)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by lower(label),id) from page p),'[]'),
 'has_more',(select count(*) from matches)>p_offset+25) into result;
 return result;
end $$;
-- Every internal helper and public endpoint starts with explicit privileges;
-- defaults on hosted Supabase schemas must never grant browser writes/TRUNCATE.
revoke all on function public.timeline_date(text,boolean),public.timeline_snapshot(uuid,text,uuid),public.event_state(uuid,uuid) from public,anon,authenticated;
revoke all on function public.timeline_page(uuid,jsonb,integer),public.timeline_event(uuid,uuid),public.timeline_options(uuid,text,text,integer),public.remove_timeline_event(uuid,uuid,integer,uuid) from public,anon,authenticated;
grant execute on function public.timeline_page(uuid,jsonb,integer),public.timeline_event(uuid,uuid),public.timeline_options(uuid,text,text,integer),public.remove_timeline_event(uuid,uuid,integer,uuid) to authenticated;
revoke all on function public.save_event(uuid,jsonb,uuid),public.remove_event(uuid,uuid) from public,anon;
grant execute on function public.save_event(uuid,jsonb,uuid) to authenticated;
