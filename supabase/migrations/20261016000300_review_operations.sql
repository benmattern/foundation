-- Security-definer entry points always authorize the project and related IDs.
create function public.require_project(p_project uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result uuid;
begin
 select owner_id into result from projects where id=p_project and owner_id=auth.uid();
 if result is null then raise exception 'Project access denied' using errcode='42501'; end if;
 return result;
end $$;
create function public.validate_tags(p_owner uuid,p_tags uuid[]) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from unnest(p_tags) t(id) where not exists(select 1 from tags where tags.id=t.id and owner_id=p_owner)) then
  raise exception 'Tag access denied' using errcode='42501';
 end if;
end $$;
create function public.save_article(p_project uuid,p_values jsonb,p_id uuid default null) returns public.articles
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; result articles; requested_tags uuid[]; content_id uuid;
begin
 who:=require_project(p_project);
 requested_tags:=array(select jsonb_array_elements_text(coalesce(p_values->'tag_ids','[]'))::uuid);
 perform validate_tags(who,requested_tags);
 if p_id is null then
  insert into collected_items(owner_id,identity_url,original_acquisition) values(who,p_values->>'url',p_values)
   on conflict(owner_id,identity_url) do nothing;
  select id into content_id from collected_items where owner_id=who and identity_url=p_values->>'url';
  insert into articles(owner_id,project_id,item_id,source_id,title,url,summary,published_at)
   values(who,p_project,content_id,nullif(p_values->>'source_id','')::uuid,p_values->>'title',p_values->>'url',p_values->>'summary',nullif(p_values->>'published_at','')::timestamptz)
   returning * into result;
 else
  select * into result from articles where id=p_id and project_id=p_project for update;
  if result.id is null then raise exception 'Article access denied' using errcode='42501'; end if;
  update articles set source_id=nullif(p_values->>'source_id','')::uuid,title=p_values->>'title',url=p_values->>'url',
   summary=p_values->>'summary',published_at=nullif(p_values->>'published_at','')::timestamptz where id=p_id returning * into result;
 end if;
 delete from article_tags where article_id=result.id;
 insert into article_tags(article_id,tag_id) select result.id,t from (select distinct unnest(requested_tags) t) q;
 return result;
end $$;
create function public.capture_candidate(p_project uuid,p_values jsonb) returns public.ingestion_candidates
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; content_id uuid; result ingestion_candidates;
begin
 who:=require_project(p_project);
 insert into collected_items(owner_id,identity_url,original_acquisition) values(who,coalesce(nullif(p_values->>'canonical_url',''),nullif(p_values->>'final_url',''),p_values->>'url'),p_values)
  on conflict(owner_id,identity_url) do nothing;
 select id into content_id from collected_items where owner_id=who and identity_url=coalesce(nullif(p_values->>'canonical_url',''),nullif(p_values->>'final_url',''),p_values->>'url');
 insert into ingestion_candidates(owner_id,project_id,item_id,url,canonical_url,final_url,source_id,title,description,published_at,import_source,raw_metadata,warnings,original_acquisition,status,converted_article_id)
  select who,p_project,content_id,p_values->>'url',p_values->>'canonical_url',p_values->>'final_url',nullif(p_values->>'source_id','')::uuid,p_values->>'title',p_values->>'description',
  nullif(p_values->>'published_at','')::timestamptz,coalesce(p_values->>'import_source','manual_url'),coalesce(p_values->'raw_metadata','{}'),coalesce(p_values->'warnings','[]'),p_values,
  case when a.id is null then 'pending' else 'accepted' end,a.id from (select 1) dummy
  left join articles a on a.project_id=p_project and a.item_id=content_id
  on conflict(project_id,item_id) do nothing;
 select * into result from ingestion_candidates where project_id=p_project and item_id=content_id;
 return result;
end $$;
create function public.review_candidate(p_id uuid,p_action text,p_values jsonb default '{}') returns public.ingestion_candidates
language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate ingestion_candidates; approved articles; requested_tags uuid[]; who uuid;
begin
 select * into candidate from ingestion_candidates where id=p_id for update;
 if candidate.id is null then raise exception 'Candidate unavailable' using errcode='42501'; end if;
 who:=require_project(candidate.project_id);
 if p_action='accept' and candidate.status='accepted' then return candidate; end if;
 if p_action in ('accept','reject','duplicate') and candidate.status<>'pending' then
  if candidate.status=(case p_action when 'reject' then 'rejected' when 'duplicate' then 'duplicate' else 'accepted' end) then return candidate; end if;
  raise exception 'Candidate was already reviewed; refresh before continuing' using errcode='40001';
 end if;
 if p_action in ('save','accept','tags') then
  requested_tags:=case when p_values ? 'tag_ids' then array(select jsonb_array_elements_text(p_values->'tag_ids')::uuid) else candidate.tag_ids end;
  perform validate_tags(who,requested_tags);
  if p_action='tags' then
   update ingestion_candidates set tag_ids=requested_tags,
    analyst_added_tags=array(select unnest(requested_tags) except select jsonb_array_elements_text(coalesce(rule_result->'suggestedTags','[]'))::uuid),
    analyst_removed_tags=array(select jsonb_array_elements_text(coalesce(rule_result->'suggestedTags','[]'))::uuid except select unnest(requested_tags)),
    updated_at=now() where id=p_id returning * into candidate;
   return candidate;
  end if;
  if candidate.status<>'pending' then raise exception 'Restore candidate before editing'; end if;
  update ingestion_candidates set url=coalesce(p_values->>'url',url),
   canonical_url=case when p_values ? 'canonical_url' then nullif(p_values->>'canonical_url','') else canonical_url end,
   final_url=case when p_values ? 'final_url' then nullif(p_values->>'final_url','') else final_url end,
   source_id=case when p_values ? 'source_id' then nullif(p_values->>'source_id','')::uuid else source_id end,
   title=coalesce(p_values->>'title',title),description=coalesce(p_values->>'description',description),
   published_at=case when p_values ? 'published_at' then nullif(p_values->>'published_at','')::timestamptz else published_at end,
   tag_ids=requested_tags,analyst_added_tags=array(select unnest(requested_tags) except select jsonb_array_elements_text(coalesce(rule_result->'suggestedTags','[]'))::uuid),
   analyst_removed_tags=array(select jsonb_array_elements_text(coalesce(rule_result->'suggestedTags','[]'))::uuid except select unnest(requested_tags)),updated_at=now()
   where id=p_id returning * into candidate;
 end if;
 if p_action='accept' then
  if candidate.title is null or length(trim(candidate.title))=0 then raise exception 'A title is required for acceptance'; end if;
  -- Serialize approved identity across independent manual capture and review paths.
  perform pg_advisory_xact_lock(hashtextextended(candidate.project_id::text||coalesce(candidate.item_id::text,candidate.id::text),0));
  select * into approved from articles where project_id=candidate.project_id and item_id=candidate.item_id;
  if approved.id is null then
   insert into articles(owner_id,project_id,item_id,source_id,title,url,summary,published_at)
    values(who,candidate.project_id,candidate.item_id,candidate.source_id,candidate.title,coalesce(candidate.canonical_url,candidate.final_url,candidate.url),candidate.description,candidate.published_at)
    returning * into approved;
   insert into article_tags(article_id,tag_id) select approved.id,t from (select distinct unnest(candidate.tag_ids) t) q;
  end if;
  update ingestion_candidates set status='accepted',converted_article_id=approved.id,reviewed_at=now(),updated_at=now() where id=p_id returning * into candidate;
 elsif p_action in ('reject','duplicate') then
  update ingestion_candidates set status=case p_action when 'reject' then 'rejected' else 'duplicate' end,
   rejection_reason=p_values->>'rejection_reason',reviewed_at=now(),updated_at=now() where id=p_id returning * into candidate;
 elsif p_action='restore' then
  if candidate.status='accepted' then raise exception 'Accepted article must be managed through Articles'; end if;
  update ingestion_candidates set status='pending',route='pending',route_override='pending',rejection_reason=null,reviewed_at=null,updated_at=now() where id=p_id returning * into candidate;
 elsif p_action in ('pending','outside_scope') then
  if candidate.status<>'pending' then raise exception 'Restore candidate before routing'; end if;
  update ingestion_candidates set route=p_action,route_override=p_action,updated_at=now() where id=p_id returning * into candidate;
 elsif p_action<>'save' then raise exception 'Unknown review action';
 end if;
 return candidate;
end $$;
create function public.remove_article(p_project uuid,p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform require_project(p_project);
 if not exists(select 1 from articles where id=p_id and project_id=p_project) then raise exception 'Article unavailable'; end if;
 update ingestion_candidates set converted_article_id=null,status='rejected',rejection_reason='Approved article removed from this project',updated_at=now() where converted_article_id=p_id and project_id=p_project;
 delete from article_tags where article_id=p_id;
 delete from article_events where article_id=p_id and project_id=p_project;
 delete from articles where id=p_id and project_id=p_project;
end $$;
create function public.save_event(p_project uuid,p_values jsonb,p_id uuid default null) returns public.events
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; result events; ids uuid[];
begin
 who:=require_project(p_project);
 ids:=array(select jsonb_array_elements_text(coalesce(p_values->'article_ids','[]'))::uuid);
 if exists(select 1 from unnest(ids) t(id) where not exists(select 1 from articles a where a.id=t.id and a.project_id=p_project)) then raise exception 'Article access denied' using errcode='42501'; end if;
 if p_id is null then
  insert into events(owner_id,project_id,title,description,event_type,status,occurred_at,location)
   values(who,p_project,p_values->>'title',p_values->>'description',p_values->>'event_type',p_values->>'status',nullif(p_values->>'occurred_at','')::timestamptz,p_values->>'location') returning * into result;
 else
  update events set title=p_values->>'title',description=p_values->>'description',event_type=p_values->>'event_type',status=p_values->>'status',
   occurred_at=nullif(p_values->>'occurred_at','')::timestamptz,location=p_values->>'location',updated_at=now() where id=p_id and project_id=p_project returning * into result;
  if result.id is null then raise exception 'Event unavailable'; end if;
 end if;
 delete from article_events where event_id=result.id;
 insert into article_events(article_id,event_id,project_id) select t,result.id,p_project from (select distinct unnest(ids) t) q;
 return result;
end $$;
create function public.remove_event(p_project uuid,p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform require_project(p_project);
 delete from article_events where event_id=p_id and project_id=p_project;
 delete from events where id=p_id and project_id=p_project;
end $$;
revoke insert,update,delete on public.ingestion_candidates,public.articles,public.events,public.article_tags,public.article_events from authenticated;
revoke all on function public.require_project(uuid),public.validate_tags(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.save_article(uuid,jsonb,uuid),public.capture_candidate(uuid,jsonb),public.review_candidate(uuid,text,jsonb),public.remove_article(uuid,uuid),public.save_event(uuid,jsonb,uuid),public.remove_event(uuid,uuid) from public,anon;
grant execute on function public.save_article(uuid,jsonb,uuid),public.capture_candidate(uuid,jsonb),public.review_candidate(uuid,text,jsonb),public.remove_article(uuid,uuid),public.save_event(uuid,jsonb,uuid),public.remove_event(uuid,uuid) to authenticated;
