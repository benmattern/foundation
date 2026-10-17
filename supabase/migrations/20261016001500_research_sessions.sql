-- A transactional per-project counter: committed upper bounds cannot overtake
-- an uncommitted writer. No wall clock or latest-N audit inference is involved.
create table public.research_heads(project_id uuid primary key references public.projects(id), seq bigint not null default 0);
create table public.research_changes(
 project_id uuid not null references public.projects(id),seq bigint not null,kind text not null,
 object_id uuid not null,question_id uuid,title text not null,recorded_at timestamptz not null default clock_timestamp(),
 primary key(project_id,seq)
);
create table public.research_sessions(
 project_id uuid primary key,owner_id uuid not null,reviewed bigint not null default 0,
 current_question uuid,version integer not null default 1,
 foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(current_question,project_id) references public.research_questions(id,project_id)
);
create table public.saved_views(
 id uuid primary key,project_id uuid not null,owner_id uuid not null,name text not null check(length(trim(name)) between 1 and 100),
 surface text not null check(surface in ('articles','ingestion')),filters jsonb not null,version integer not null default 1,
 foreign key(project_id,owner_id) references public.projects(id,owner_id)
);
create function public.append_session_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare p uuid;n bigint;j jsonb;kind text;
begin
 j:=to_jsonb(new);p:=(j->>'project_id')::uuid;
 if p is null then return new;end if;
 if tg_table_name='research_history' then
  kind:=new.object_type;j:=new.after_state;
  if kind='entity_mentions' and j->>'state'<>'confirmed' then return new;end if;
 else kind:='kept_article';end if;
 insert into research_heads(project_id,seq) values(p,1) on conflict(project_id) do update set seq=research_heads.seq+1 returning seq into n;
 insert into research_changes(project_id,seq,kind,object_id,question_id,title)
 values(p,n,kind,case when tg_table_name='research_history' then (to_jsonb(new)->>'object_id')::uuid else (j->>'id')::uuid end,
 case when kind='research_questions' then (j->>'id')::uuid else (j->>'question_id')::uuid end,
 left(coalesce(j->>'title',j->>'observed',j->'article_snapshot'->>'title',kind),300));
 return new;
end $$;
create trigger session_history after insert on public.research_history for each row execute function public.append_session_change();
create trigger session_article after insert on public.articles for each row execute function public.append_session_change();
-- Existing records are baseline context, not newly published research. Backfill
-- all audit rows (not only 100) with deterministic per-project sequence values.
insert into research_changes(project_id,seq,kind,object_id,question_id,title,recorded_at)
select project_id,row_number() over(partition by project_id order by recorded_at,id),object_type,object_id,
case when object_type='research_questions' then object_id else (after_state->>'question_id')::uuid end,
left(coalesce(after_state->>'title',after_state->>'observed',object_type),300),recorded_at
from public.research_history where project_id is not null and (object_type<>'entity_mentions' or after_state->>'state'='confirmed');
insert into research_heads select project_id,max(seq) from research_changes group by project_id;

create function public.session_window(p_project uuid,p_after bigint default null,p_bound bigint default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;s research_sessions;upper_bound bigint;lower_bound bigint;items jsonb;next_cursor bigint;
begin
 who:=require_project(p_project);
 insert into research_heads(project_id) values(p_project) on conflict do nothing;
 select seq into upper_bound from research_heads where project_id=p_project for update;
 select * into s from research_sessions where project_id=p_project;
 lower_bound:=coalesce(p_after,s.reviewed,0);
 if p_bound is not null then
  if p_bound<0 or p_bound>upper_bound then raise exception 'Invalid session boundary';end if;
  upper_bound:=p_bound;
 end if;
 if lower_bound<0 or lower_bound>upper_bound then raise exception 'Invalid change cursor';end if;
 select coalesce(jsonb_agg(to_jsonb(c) order by seq),'[]'),coalesce(max(seq),lower_bound) into items,next_cursor
 from(select * from research_changes where project_id=p_project and seq>lower_bound and seq<=upper_bound order by seq limit 50)c;
 return jsonb_build_object('bound',upper_bound,'reviewed',coalesce(s.reviewed,0),'version',coalesce(s.version,0),
 'current_question',s.current_question,'first_visit',s.project_id is null,'items',items,'cursor',next_cursor,'has_more',next_cursor<upper_bound,
 'count',(select count(*) from research_changes where project_id=p_project and seq>coalesce(s.reviewed,0) and seq<=upper_bound),
 'pending',(select count(*) from ingestion_candidates where project_id=p_project and status='pending' and not deferred and route='pending'),
 'later',(select count(*) from ingestion_candidates where project_id=p_project and status='pending' and deferred));
end $$;
create function public.save_session(p_project uuid,p_expected integer,p_bound bigint default null,p_question uuid default null) returns public.research_sessions
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;s research_sessions;head bigint;
begin
 who:=require_project(p_project);
 insert into research_heads(project_id) values(p_project) on conflict do nothing;
 select seq into head from research_heads where project_id=p_project for update;
 select * into s from research_sessions where project_id=p_project for update;
 if coalesce(s.version,0) is distinct from p_expected then raise exception 'Session changed in another tab; refresh before finishing' using errcode='40001';end if;
 if p_bound is not null and (p_bound<coalesce(s.reviewed,0) or p_bound>head) then raise exception 'Invalid review boundary';end if;
 if p_question is not null and not exists(select 1 from research_questions where id=p_question and project_id=p_project) then raise exception 'Question unavailable';end if;
 insert into research_sessions(project_id,owner_id,reviewed,current_question) values(p_project,who,coalesce(p_bound,0),p_question)
 on conflict(project_id) do update set reviewed=coalesce(p_bound,research_sessions.reviewed),current_question=coalesce(p_question,research_sessions.current_question),version=research_sessions.version+1 returning * into s;
 return s;
end $$;

create function public.save_working_view(p_project uuid,p_id uuid,p_name text,p_surface text,p_filters jsonb,p_expected integer default 0,p_delete boolean default false) returns public.saved_views
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;v saved_views;k text;value text;
begin
 who:=require_project(p_project);
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,15));
 select * into v from saved_views where id=p_id and project_id=p_project for update;
 if v.id is null and exists(select 1 from saved_views where id=p_id) then raise exception 'View unavailable';end if;
 if p_expected=0 and v.id is not null and not p_delete and v.name=p_name and v.surface=p_surface and v.filters=p_filters then return v;end if;
 if coalesce(v.version,0) is distinct from p_expected then raise exception 'View changed; reload' using errcode='40001';end if;
 if p_delete then delete from saved_views where id=v.id;return v;end if;
 if p_id is null or p_surface not in ('articles','ingestion') or jsonb_typeof(p_filters) is distinct from 'object' or length(p_filters::text)>4000 then raise exception 'Invalid view';end if;
 for k,value in select * from jsonb_each_text(p_filters) loop
  if k not in ('q','source','tag','since','until','period','order','status','route','import') or jsonb_typeof(p_filters->k)<>'string' then raise exception 'Unsupported view filter %',k;end if;
  if p_surface='articles' and (k in ('status','route','import') or (k='order' and value='relevance')) then raise exception 'Unsupported Library filter %',k;end if;
  if k='period' and value not in ('7','30') then raise exception 'Invalid relative period';end if;
  if k in ('since','until') and value<>'' then perform value::date;end if;
  if k='source' and value not in ('','all') and not exists(select 1 from sources where id=value::uuid and owner_id=who) then raise exception 'Source unavailable';end if;
  if k='tag' and value<>'' and not exists(select 1 from tags where id=value::uuid and owner_id=who) then raise exception 'Tag unavailable';end if;
  if k='order' and value not in ('newest','oldest','relevance') then raise exception 'Invalid order';end if;
  if k='status' and value not in ('pending','accepted','rejected','duplicate','later') then raise exception 'Invalid status';end if;
  if k='route' and value not in ('pending','outside_scope','all') then raise exception 'Invalid routing';end if;
  if k='import' and value not in ('all','rss','manual_url','connector','browser_extension') then raise exception 'Invalid import';end if;
 end loop;
 insert into saved_views(id,project_id,owner_id,name,surface,filters) values(p_id,p_project,who,p_name,p_surface,p_filters)
 on conflict(id) do update set name=p_name,surface=p_surface,filters=p_filters,version=saved_views.version+1 returning * into v;
 return v;
end $$;

-- One statement snapshot, bounded to selected linked articles and findings. No
-- library/identity/history scan in the comparison/export path.
create function public.question_packet(p_project uuid,p_question uuid,p_articles uuid[] default '{}',p_findings uuid[] default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 perform require_project(p_project);
 if cardinality(p_articles)>6 or cardinality(p_findings)>20 then raise exception 'Select at most 6 articles and 20 findings';end if;
 select jsonb_build_object('as_of',statement_timestamp(),'project',jsonb_build_object('name',p.name,'description',p.description),
 'question',to_jsonb(q),'links',coalesce((select jsonb_agg(to_jsonb(l)||jsonb_build_object(
 'article',(select to_jsonb(a) from articles a where a.id=l.article_id and a.project_id=p_project),
 'article_revision',(select md5(to_jsonb(a)::text) from articles a where a.id=l.article_id and a.project_id=p_project),
 'collected_at',(select min(c.created_at) from ingestion_candidates c where c.project_id=p_project and c.converted_article_id=l.article_id),
 'source',(select s.name from articles a join sources s on s.id=a.source_id where a.id=l.article_id and a.project_id=p_project),
 'entities',(select coalesce(jsonb_agg(distinct e.name),'[]') from entity_mentions m join entities e on e.id=m.entity_id where m.project_id=p_project and m.article_id=l.article_id and m.state='confirmed'),
 'events',(select coalesce(jsonb_agg(e.title),'[]') from article_events ae join events e on e.id=ae.event_id where ae.article_id=l.article_id and e.project_id=p_project)) order by l.id)
 from question_articles l where l.project_id=p_project and l.question_id=q.id and (l.article_id=any(p_articles) or l.id=any(p_articles))),'[]'),
 'citation_availability',coalesce((select jsonb_object_agg(c->>'id',exists(select 1 from articles a join question_articles l on l.article_id=a.id where a.project_id=p_project and l.question_id=q.id and l.linked and a.id=(c->>'id')::uuid)) from research_findings f cross join lateral jsonb_array_elements(f.citations)c where f.project_id=p_project and f.question_id=q.id and f.id=any(p_findings)),'{}'),
 'findings',coalesce((select jsonb_agg(to_jsonb(f) order by f.id) from research_findings f where f.project_id=p_project and f.question_id=q.id and f.id=any(p_findings)),'[]')) into result
 from research_questions q join projects p on p.id=q.project_id where q.id=p_question and q.project_id=p_project;
 if result is null then raise exception 'Question unavailable';end if;
 if jsonb_array_length(result->'links')>6 then raise exception 'Select at most 6 evidence links';end if;
 return result;
end $$;
create function public.question_choices(p_project uuid,p_question uuid,p_after uuid default null,p_fafter uuid default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform require_project(p_project);
 return jsonb_build_object('links',coalesce((select jsonb_agg(to_jsonb(l) order by id) from(select id,article_id,article_snapshot,disposition,linked,version from question_articles where project_id=p_project and question_id=p_question and (p_after is null or id>p_after) order by id limit 50)l),'[]'),
 'findings',coalesce((select jsonb_agg(to_jsonb(f) order by id) from(select id,left(observed,200) observed,version from research_findings where project_id=p_project and question_id=p_question and (p_fafter is null or id>p_fafter) order by id limit 20)f),'[]'));
end $$;
do $$ declare t text;f regprocedure;begin
 foreach t in array array['research_heads','research_changes','research_sessions','saved_views'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['research_sessions','saved_views'] loop
  execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in ('append_session_change','session_window','save_session','save_working_view','question_packet','question_choices') loop
  execute format('revoke all on function %s from public,anon,authenticated',f);
  if f::text not like 'append_session_change(%' then execute format('grant execute on function %s to authenticated',f);end if;
 end loop;
end $$;
