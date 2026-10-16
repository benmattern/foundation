create or replace function public.bulk_review(p_project uuid,p_ids uuid[],p_action text,p_tag uuid default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; candidate_id uuid; candidate ingestion_candidates; results jsonb:='[]'; values_json jsonb;
begin
 who:=require_project(p_project);
 if cardinality(p_ids)>50 or cardinality(p_ids)=0 then raise exception 'Select 1 to 50 visible items'; end if;
 if p_action not in ('accept','reject','duplicate','restore','outside_scope','pending','tags','later') then raise exception 'Invalid bulk action'; end if;
 if p_action='tags' then
  if p_tag is null then raise exception 'Choose a tag'; end if;
  perform validate_tags(who,array[p_tag]);
 end if;
 foreach candidate_id in array p_ids loop
  begin
   select * into candidate from ingestion_candidates where id=candidate_id and project_id=p_project for update;
   if candidate.id is null then raise exception 'Candidate unavailable in this project'; end if;
   values_json:=case when p_action='tags' then jsonb_build_object('tag_ids',to_jsonb(array(select distinct unnest(candidate.tag_ids||array[p_tag])))) else '{}' end;
   perform review_candidate(candidate_id,p_action,values_json);
   results:=results||jsonb_build_array(jsonb_build_object('id',candidate_id,'ok',true));
  exception when others then
   results:=results||jsonb_build_array(jsonb_build_object('id',candidate_id,'ok',false,'error',sqlerrm));
  end;
 end loop;
 insert into bulk_review_runs(project_id,owner_id,action,results) values(p_project,who,p_action,results);
 return results;
end $$;
revoke all on function public.bulk_review(uuid,uuid[],text,uuid) from public,anon;
grant execute on function public.bulk_review(uuid,uuid[],text,uuid) to authenticated;

create function public.rule_score(r jsonb) returns integer language sql immutable set search_path=public,pg_temp as $$
 select case when r->>'scoreVersion'='1' and coalesce(r->>'score','') ~ '^(0|[1-9][0-9]{0,2})$' then least(150,(r->>'score')::integer)
 else (select least(150,coalesce(sum(weight),0))::integer from (select max(case m->>'field' when 'title' then 3 when 'categories' then 2 else 1 end) as weight from jsonb_array_elements(coalesce(r->'matches','[]')) m where m->>'kind'='include' group by lower(regexp_replace(trim(normalize(m->>'term',NFKC)),'\s+',' ','g'))) terms) end
$$;
revoke all on function public.rule_score(jsonb) from public,anon;grant execute on function public.rule_score(jsonb) to authenticated,service_role;
create or replace function public.search_candidates(p_project uuid,p_filters jsonb,p_search text default '') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not exists(select 1 from projects where id=p_project and owner_id=auth.uid()) then raise exception 'Project access denied' using errcode='42501'; end if;
 with filtered as (
  select c.*,public.rule_score(c.rule_result) as relevance_score from ingestion_candidates c where c.project_id=p_project
   and c.status=case when p_filters->>'status'='later' then 'pending' else coalesce(p_filters->>'status','pending') end and (c.status<>'pending' or c.deferred=coalesce(p_filters->>'status'='later',false))
   and (nullif(p_filters->>'route','') is null or c.route=p_filters->>'route')
   and (coalesce(p_filters->>'source','all')='all' or (p_filters->>'source'='unknown' and c.source_id is null) or c.source_id::text=p_filters->>'source')
   and (coalesce(p_filters->>'importSource','all')='all' or c.import_source=p_filters->>'importSource')
   and (nullif(p_filters->>'tag','') is null or (p_filters->>'tag')::uuid=any(c.tag_ids))
   and (nullif(p_filters->>'since','') is null or c.created_at>=(p_filters->>'since')::date)
   and (nullif(p_filters->>'until','') is null or c.created_at<((p_filters->>'until')::date+1))
   and (p_search='' or position(lower(p_search) in lower(concat_ws(' ',c.title,c.description,c.url,c.canonical_url,c.final_url)))>0)
 ), page as (
  select * from filtered order by case when p_filters->>'order'='relevance' then public.rule_score(rule_result) end desc nulls last,case when p_filters->>'order'='oldest' then created_at end asc,created_at desc,id limit 50 offset greatest(0,coalesce((p_filters->>'page')::integer,0))*50
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by case when p_filters->>'order'='relevance' then public.rule_score(p.rule_result) end desc nulls last,case when p_filters->>'order'='oldest' then p.created_at end asc,p.created_at desc,p.id) from page p),'[]'),
  'count',(select count(*) from filtered)) into result;
 return result;
end $$;
revoke all on function public.search_candidates(uuid,jsonb,text) from public,anon;
grant execute on function public.search_candidates(uuid,jsonb,text) to authenticated;
