create function public.search_candidates(p_project uuid,p_filters jsonb,p_search text default '') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not exists(select 1 from projects where id=p_project and owner_id=auth.uid()) then raise exception 'Project access denied' using errcode='42501'; end if;
 with filtered as (
  select c.* from ingestion_candidates c where c.project_id=p_project
   and c.status=coalesce(p_filters->>'status','pending')
   and (nullif(p_filters->>'route','') is null or c.route=p_filters->>'route')
   and (coalesce(p_filters->>'source','all')='all' or (p_filters->>'source'='unknown' and c.source_id is null) or c.source_id::text=p_filters->>'source')
   and (coalesce(p_filters->>'importSource','all')='all' or c.import_source=p_filters->>'importSource')
   and (nullif(p_filters->>'tag','') is null or (p_filters->>'tag')::uuid=any(c.tag_ids))
   and (nullif(p_filters->>'since','') is null or c.created_at>=(p_filters->>'since')::date)
   and (nullif(p_filters->>'until','') is null or c.created_at<((p_filters->>'until')::date+1))
   and (p_search='' or position(lower(p_search) in lower(concat_ws(' ',c.title,c.description,c.url,c.canonical_url,c.final_url)))>0)
 ), page as (
  select * from filtered order by created_at desc,id limit 50 offset greatest(0,coalesce((p_filters->>'page')::integer,0))*50
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc,p.id) from page p),'[]'),
  'count',(select count(*) from filtered)) into result;
 return result;
end $$;
revoke all on function public.search_candidates(uuid,jsonb,text) from public,anon;
grant execute on function public.search_candidates(uuid,jsonb,text) to authenticated;
