-- Connected research is additive. No legacy summary is relabelled as publisher text.
create table public.research_questions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null,owner_id uuid not null,
 title text not null check(length(trim(title)) between 1 and 300),description text not null default '',
 status text not null default 'open' check(status in ('open','monitoring','answered','archived')),
 answer text not null default '',followups text not null default '',version integer not null default 1,
 updated_at timestamptz not null default now(),create_token uuid,create_hash text,unique(owner_id,create_token),unique(id,project_id),
 foreign key(project_id,owner_id) references public.projects(id,owner_id)
);
create table public.question_articles (
 id uuid primary key default gen_random_uuid(),project_id uuid not null,owner_id uuid not null,
 question_id uuid not null,article_id uuid,article_snapshot jsonb not null,
 disposition text not null default 'background' check(disposition in ('supporting','challenging','background')),
 note text not null default '',linked boolean not null default true,version integer not null default 1,
 unique(question_id,article_id),foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(question_id,project_id) references public.research_questions(id,project_id),
 foreign key(article_id,project_id) references public.articles(id,project_id) on delete set null(article_id)
);
create table public.article_notes (
 id uuid primary key default gen_random_uuid(),project_id uuid not null,owner_id uuid not null,article_id uuid unique,
 article_snapshot jsonb not null,body text not null default '',version integer not null default 1,
 foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(article_id,project_id) references public.articles(id,project_id) on delete set null(article_id)
);
create table public.research_findings (
 id uuid primary key default gen_random_uuid(),project_id uuid not null,owner_id uuid not null,question_id uuid not null,
 observed text not null default '',interpretation text not null default '',uncertainties text not null default '',
 citations jsonb not null default '[]',version integer not null default 1,updated_at timestamptz not null default now(),create_token uuid,create_hash text,unique(owner_id,create_token),
 foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(question_id,project_id) references public.research_questions(id,project_id)
);
create table public.entities (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 200),
 entity_type text not null check(entity_type in ('person','organization','place')),
 aliases jsonb not null default '[]' check(jsonb_typeof(aliases)='array'),description text not null default '',
 reference_url text not null default '',version integer not null default 1,create_token uuid,create_hash text,unique(owner_id,create_token),unique(id,owner_id)
);
create table public.entity_mentions (
 id uuid primary key default gen_random_uuid(),project_id uuid not null,owner_id uuid not null,article_id uuid,
 article_snapshot jsonb not null,entity_id uuid not null,matched_alias text not null,
 source_field text not null,snapshot text not null,span jsonb,matcher_version integer not null default 1,
 fingerprint text not null,state text not null check(state in ('suggested','confirmed','dismissed')),
 manual boolean not null default false,version integer not null default 1,updated_at timestamptz not null default now(),
 unique(article_id,entity_id,fingerprint),foreign key(project_id,owner_id) references public.projects(id,owner_id),
 foreign key(entity_id,owner_id) references public.entities(id,owner_id),
 foreign key(article_id,project_id) references public.articles(id,project_id) on delete set null(article_id)
);
create index question_articles_project_idx on public.question_articles(project_id,question_id);
create index mentions_project_entity_idx on public.entity_mentions(project_id,entity_id,state);
create table public.research_history (
 id uuid primary key default gen_random_uuid(),project_id uuid,owner_id uuid not null,object_id uuid not null,
 object_type text not null,before_state jsonb,after_state jsonb not null,recorded_at timestamptz not null default now(),
 foreign key(project_id,owner_id) references public.projects(id,owner_id)
);
create function public.record_research_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into research_history(project_id,owner_id,object_id,object_type,before_state,after_state)
 values((to_jsonb(new)->>'project_id')::uuid,new.owner_id,new.id,tg_table_name,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));return new;
end $$;
-- Browser access is read-only; all mutations are validated and compare-and-swap.
do $$ declare t text;begin
 foreach t in array array['research_questions','question_articles','article_notes','research_findings','entities','entity_mentions','research_history'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=auth.uid())',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  if t<>'research_history' then execute format('create trigger research_audit after insert or update on public.%I for each row execute function public.record_research_change()',t);end if;
 end loop;
end $$;
create function public.research_evidence(p_project uuid,p_article uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare a articles;c ingestion_candidates;result jsonb;
begin
 perform require_project(p_project);
 select * into a from articles where id=p_article and project_id=p_project;
 if a.id is null then raise exception 'Article unavailable in this project' using errcode='42501';end if;
 select * into c from ingestion_candidates where converted_article_id=a.id and project_id=p_project order by created_at limit 1;
 result:=jsonb_build_array(jsonb_build_object('field',case when c.original_acquisition->>'title' is null then 'record_title' else 'acquisition_title' end,'text',left(coalesce(c.original_acquisition->>'title',a.title),20000),'origin',case when c.original_acquisition->>'title' is null then 'Saved article title (may be analyst edited)' else 'Original acquisition title' end));
 if c.id is not null then
  result:=result||jsonb_build_array(jsonb_build_object('field','acquisition_excerpt','text',left(coalesce(c.original_acquisition->>'description',''),20000),'origin','Original acquisition excerpt; not full article'));
  result:=result||coalesce((select jsonb_agg(jsonb_build_object('field','preview:'||p.id,'text',p.excerpt,'origin','Page metadata: '||p.origin_url||' retrieved '||p.retrieved_at)) from (select * from candidate_previews where candidate_id=c.id order by retrieved_at desc limit 20) p),'[]'::jsonb);
 end if;
 return result;
end $$;
create function public.save_question(p_project uuid,p_values jsonb,p_id uuid default null,p_expected integer default 0) returns public.research_questions
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;q research_questions;request uuid;
begin
 who:=require_project(p_project);
 if jsonb_typeof(p_values) is distinct from 'object' or length(p_values::text)>100000 then raise exception 'Question is too large';end if;
 if p_id is null then
  request:=(p_values->>'request_id')::uuid;
  if request is not null then
   perform pg_advisory_xact_lock(hashtextextended(who::text||request::text,0));
   select * into q from research_questions where owner_id=who and project_id=p_project and create_token=request;
   if found then
    if q.create_hash is distinct from md5(p_values::text) then raise exception 'This create request already saved different content; reload the saved question before editing' using errcode='40001';end if;
    return q;
   end if;
  end if;
  insert into research_questions(project_id,owner_id,title,create_token,create_hash) values(p_project,who,p_values->>'title',request,md5(p_values::text)) returning * into q;
 else select * into q from research_questions where id=p_id and project_id=p_project for update;
  if q.id is null then raise exception 'Question unavailable' using errcode='42501';end if;
  if q.version is distinct from p_expected then raise exception 'Question changed; reload before saving' using errcode='40001';end if;
 end if;
 update research_questions set title=coalesce(p_values->>'title',q.title),description=coalesce(p_values->>'description',q.description),status=coalesce(p_values->>'status',q.status),answer=coalesce(p_values->>'answer',q.answer),followups=coalesce(p_values->>'followups',q.followups),version=case when p_id is null then 1 else q.version+1 end,updated_at=now() where id=q.id returning * into q;
 return q;
end $$;
create function public.link_question_article(p_project uuid,p_question uuid,p_article uuid,p_values jsonb default '{}',p_expected integer default 0) returns public.question_articles
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;a articles;l question_articles;
begin
 who:=require_project(p_project);
 perform 1 from research_questions where id=p_question and project_id=p_project for key share;
 if not found then raise exception 'Question unavailable in this project' using errcode='42501';end if;
 select * into a from articles where id=p_article and project_id=p_project for key share;
 if a.id is null then raise exception 'Article unavailable in this project' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_question::text||p_article::text,0));
 select * into l from question_articles where question_id=p_question and article_id=p_article for update;
 if coalesce(l.version,0) is distinct from p_expected then raise exception 'Evidence link changed; reload' using errcode='40001';end if;
 if jsonb_typeof(p_values) is distinct from 'object' or length(p_values::text)>30000 then raise exception 'Link note is too large';end if;
 if l.id is null then
 insert into question_articles(project_id,owner_id,question_id,article_id,article_snapshot) values(p_project,who,p_question,p_article,jsonb_build_object('id',a.id,'title',a.title,'url',a.url,'published_at',a.published_at,'captured_at',now())) returning * into l;
 end if;
 update question_articles set disposition=coalesce(p_values->>'disposition',l.disposition),note=coalesce(p_values->>'note',l.note),linked=coalesce((p_values->>'linked')::boolean,true),version=case when p_expected=0 then 1 else l.version+1 end where id=l.id returning * into l;return l;
end $$;
create function public.save_article_note(p_project uuid,p_article uuid,p_body text,p_expected integer default 0) returns public.article_notes
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;a articles;n article_notes;
begin
 who:=require_project(p_project);select * into a from articles where id=p_article and project_id=p_project for key share;
 if a.id is null then raise exception 'Article unavailable' using errcode='42501';end if;
 if p_body is null or length(p_body)>50000 then raise exception 'Note must be at most 50000 characters';end if;
 perform pg_advisory_xact_lock(hashtextextended('note'||p_article::text,0));
 select * into n from article_notes where article_id=p_article for update;
 if coalesce(n.version,0) is distinct from p_expected then raise exception 'Note changed; reload' using errcode='40001';end if;
 if n.id is null then insert into article_notes(project_id,owner_id,article_id,article_snapshot,body) values(p_project,who,p_article,jsonb_build_object('id',a.id,'title',a.title),p_body) returning * into n;
 else update article_notes set body=p_body,version=version+1 where id=n.id returning * into n;end if;return n;
end $$;
create function public.save_finding(p_project uuid,p_question uuid,p_values jsonb,p_id uuid default null,p_expected integer default 0) returns public.research_findings
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;f research_findings;c jsonb;a articles;v_citations jsonb:='[]';prior jsonb;passage text;passage_origin jsonb;request uuid;
begin
 who:=require_project(p_project);
 perform 1 from research_questions where id=p_question and project_id=p_project for key share;
 if not found then raise exception 'Question unavailable' using errcode='42501';end if;
 if jsonb_typeof(p_values) is distinct from 'object' or length(p_values::text)>200000 or jsonb_typeof(coalesce(p_values->'citations','[]'))<>'array' or jsonb_array_length(coalesce(p_values->'citations','[]'))>50 then raise exception 'Finding is too large';end if;
 if p_id is null then
  request:=(p_values->>'request_id')::uuid;
  if request is not null then
   perform pg_advisory_xact_lock(hashtextextended(who::text||request::text,0));
   select * into f from research_findings where owner_id=who and project_id=p_project and question_id=p_question and create_token=request;
   if found then
    if f.create_hash is distinct from md5(p_values::text) then raise exception 'This create request already saved different content; reload the saved finding before editing' using errcode='40001';end if;
    return f;
   end if;
  end if;
 end if;
 if p_id is not null then
 select * into f from research_findings where id=p_id and question_id=p_question and project_id=p_project for update;
 if f.id is null then raise exception 'Finding unavailable' using errcode='42501';end if;
 if f.version is distinct from p_expected then raise exception 'Finding changed; reload' using errcode='40001';end if;
 end if;
 for c in select * from jsonb_array_elements(coalesce(p_values->'citations',f.citations,'[]')) loop
  select value into prior from jsonb_array_elements(coalesce(f.citations,'[]')) where value->>'id'=c->>'id';
  select a1.* into a from articles a1 join question_articles l on l.article_id=a1.id and l.question_id=p_question and l.linked where a1.id=(c->>'id')::uuid and a1.project_id=p_project for key share of a1,l;
  if a.id is null then
   if prior is null then raise exception 'Cite an available linked article';end if;
   v_citations:=v_citations||jsonb_build_array(prior); -- Preserve provenance/prose after unlink/delete.
  else
   passage:=coalesce(c->>'passage','');
   if length(passage)>2000 or (passage<>'' and not exists(select 1 from jsonb_array_elements(research_evidence(p_project,a.id)) e where position(passage in e->>'text')>0)) then raise exception 'Passage is not present in available evidence';end if;
   passage_origin:=null;
   if passage<>'' then select jsonb_build_object('field',e->>'field','origin',e->>'origin') into passage_origin from jsonb_array_elements(research_evidence(p_project,a.id)) e where position(passage in e->>'text')>0 limit 1;end if;
   v_citations:=v_citations||jsonb_build_array(jsonb_build_object('id',a.id,'title',a.title,'url',a.url,'published_at',a.published_at,'captured_at',coalesce(prior->>'captured_at',now()::text),'passage',passage,'passage_origin',passage_origin));
  end if;
 end loop;
 if f.id is null then insert into research_findings(project_id,owner_id,question_id,create_token,create_hash) values(p_project,who,p_question,request,md5(p_values::text)) returning * into f;end if;
 update research_findings set observed=coalesce(p_values->>'observed',f.observed),interpretation=coalesce(p_values->>'interpretation',f.interpretation),uncertainties=coalesce(p_values->>'uncertainties',f.uncertainties),citations=v_citations,version=case when p_id is null then 1 else f.version+1 end,updated_at=now() where id=f.id returning * into f;return f;
end $$;
create function public.save_entity(p_values jsonb,p_id uuid default null,p_expected integer default 0) returns public.entities
language plpgsql security definer set search_path=public,pg_temp as $$
declare e entities;request uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if jsonb_typeof(p_values) is distinct from 'object' or length(p_values::text)>30000 or jsonb_typeof(coalesce(p_values->'aliases','[]'))<>'array' or jsonb_array_length(coalesce(p_values->'aliases','[]'))>100 or exists(select 1 from jsonb_array_elements(coalesce(p_values->'aliases','[]')) t where jsonb_typeof(t)<>'string' or length(trim(t#>>'{}')) not between 1 and 200) then raise exception 'Use at most 100 aliases of 1-200 characters';end if;
 if p_id is null then
  request:=(p_values->>'request_id')::uuid;
  if request is not null then
   perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||request::text,0));
   select * into e from entities where owner_id=auth.uid() and create_token=request;
   if found then
    if e.create_hash is distinct from md5(p_values::text) then raise exception 'This create request already saved different content; reload the saved entity before editing' using errcode='40001';end if;
    return e;
   end if;
  end if;
  insert into entities(owner_id,name,entity_type,create_token,create_hash) values(auth.uid(),p_values->>'name',p_values->>'entity_type',request,md5(p_values::text)) returning * into e;
 else select * into e from entities where id=p_id and owner_id=auth.uid() for update;
 if e.id is null then raise exception 'Entity access denied' using errcode='42501';end if;
 if e.version is distinct from p_expected then raise exception 'Entity changed; reload' using errcode='40001';end if;end if;
 update entities set name=coalesce(p_values->>'name',e.name),entity_type=coalesce(p_values->>'entity_type',e.entity_type),aliases=coalesce(p_values->'aliases',e.aliases),description=coalesce(p_values->>'description',e.description),reference_url=coalesce(p_values->>'reference_url',e.reference_url),version=case when p_id is null then 1 else e.version+1 end where id=e.id returning * into e;return e;
end $$;
create function public.save_mentions(p_project uuid,p_article uuid,p_suggestions jsonb,p_manual boolean default false) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;a articles;s jsonb;e entities;added integer:=0;n integer;fields jsonb;v_fingerprint text;
begin
 who:=require_project(p_project);p_manual:=coalesce(p_manual,false);select * into a from articles where id=p_article and project_id=p_project for key share;
 if a.id is null then raise exception 'Article unavailable' using errcode='42501';end if;
 if jsonb_typeof(p_suggestions) is distinct from 'array' or jsonb_array_length(p_suggestions) not between 1 and 200 or length(p_suggestions::text)>2000000 then raise exception 'Select 1-200 bounded mentions';end if;
 fields:=research_evidence(p_project,p_article);
 for s in select * from jsonb_array_elements(p_suggestions) loop
  select * into e from entities where id=(s->>'entity_id')::uuid and owner_id=who for key share;
  if e.id is null then raise exception 'Entity access denied' using errcode='42501';end if;
  if length(coalesce(s->>'snapshot',''))>20000 or length(coalesce(s->>'alias',''))>200 then raise exception 'Mention evidence too large';end if;
  if not p_manual then
   if s->>'alias' is distinct from e.name and not (e.aliases ? (s->>'alias')) then raise exception 'Alias changed; preview a fresh rescan';end if;
   if not exists(select 1 from jsonb_array_elements(fields) f where f->>'field'=s->>'field' and f->>'text'=s->>'snapshot') then raise exception 'Evidence changed; preview a fresh rescan';end if;
   if position(lower(regexp_replace(trim(normalize(s->>'alias',NFKC)),'\s+',' ','g')) in lower(regexp_replace(trim(normalize(s->>'snapshot',NFKC)),'\s+',' ','g')))=0 then raise exception 'Alias absent from evidence';end if;
  end if;
  v_fingerprint:=case when p_manual then 'manual' else md5(coalesce(s->>'field','')||chr(31)||lower(regexp_replace(trim(normalize(s->>'alias',NFKC)),'\s+',' ','g'))||chr(31)||coalesce(s->>'snapshot','')) end;
  insert into entity_mentions(project_id,owner_id,article_id,article_snapshot,entity_id,matched_alias,source_field,snapshot,span,fingerprint,state,manual)
  values(p_project,who,a.id,jsonb_build_object('id',a.id,'title',a.title,'url',a.url,'published_at',a.published_at),e.id,coalesce(s->>'alias',e.name),case when p_manual then 'manual analyst association' else s->>'field' end,coalesce(s->>'snapshot',''),case when p_manual then null else s->'span' end,v_fingerprint,case when p_manual then 'confirmed' else 'suggested' end,p_manual)
  on conflict(article_id,entity_id,fingerprint) do nothing;
  get diagnostics n=row_count;added:=added+n;
 end loop;return added;
end $$;
create function public.review_mention(p_project uuid,p_id uuid,p_state text,p_expected integer) returns public.entity_mentions
language plpgsql security definer set search_path=public,pg_temp as $$
declare m entity_mentions;
begin
 perform require_project(p_project);select * into m from entity_mentions where id=p_id and project_id=p_project for update;
 if m.id is null then raise exception 'Mention unavailable' using errcode='42501';end if;
 if m.version is distinct from p_expected then raise exception 'Mention changed; reload' using errcode='40001';end if;
 if p_state not in ('suggested','confirmed','dismissed') then raise exception 'Choose a valid mention state';end if;
 update entity_mentions set state=p_state,version=version+1,updated_at=now() where id=m.id returning * into m;return m;
end $$;
revoke all on function public.record_research_change() from public,anon,authenticated;
revoke all on function public.research_evidence(uuid,uuid),public.save_question(uuid,jsonb,uuid,integer),public.link_question_article(uuid,uuid,uuid,jsonb,integer),public.save_article_note(uuid,uuid,text,integer),public.save_finding(uuid,uuid,jsonb,uuid,integer),public.save_entity(jsonb,uuid,integer),public.save_mentions(uuid,uuid,jsonb,boolean),public.review_mention(uuid,uuid,text,integer) from public,anon;
grant execute on function public.research_evidence(uuid,uuid),public.save_question(uuid,jsonb,uuid,integer),public.link_question_article(uuid,uuid,uuid,jsonb,integer),public.save_article_note(uuid,uuid,text,integer),public.save_finding(uuid,uuid,jsonb,uuid,integer),public.save_entity(jsonb,uuid,integer),public.save_mentions(uuid,uuid,jsonb,boolean),public.review_mention(uuid,uuid,text,integer) to authenticated;
