create table public.bulk_review_runs (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
 owner_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
 action text not null, results jsonb not null
);
alter table public.bulk_review_runs enable row level security;
create policy owner_access on public.bulk_review_runs to authenticated using(owner_id=auth.uid());
grant select on public.bulk_review_runs to authenticated;
create function public.bulk_review(p_project uuid,p_ids uuid[],p_action text,p_tag uuid default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; candidate_id uuid; candidate ingestion_candidates; results jsonb:='[]'; values_json jsonb;
begin
 who:=require_project(p_project);
 if cardinality(p_ids)>50 or cardinality(p_ids)=0 then raise exception 'Select 1 to 50 visible items'; end if;
 if p_action not in ('accept','reject','duplicate','restore','outside_scope','pending','tags') then raise exception 'Invalid bulk action'; end if;
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
