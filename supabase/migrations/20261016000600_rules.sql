create table public.rule_evaluations (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.ingestion_candidates(id),
 owner_id uuid not null references auth.users(id), project_id uuid not null references public.projects(id),
 evaluated_at timestamptz not null default now(), result jsonb not null
);
alter table public.rule_evaluations enable row level security;
create policy owner_access on public.rule_evaluations to authenticated using(owner_id=auth.uid());
grant select on public.rule_evaluations to authenticated;
create function public.save_project_rules(p_project uuid,p_rules jsonb,p_expected jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform require_project(p_project);
 perform 1 from projects where id=p_project and rules=p_expected for update;
 if not found then raise exception 'Project rules changed; refresh before saving' using errcode='40001'; end if;
 if (p_rules->>'version')::integer<>(p_expected->>'version')::integer+1 then raise exception 'Rule version must increase'; end if;
 perform validate_tags(auth.uid(),array(select jsonb_array_elements_text(p_rules->'defaultTags')::uuid union select (r->>'tag')::uuid from jsonb_array_elements(p_rules->'keywordTags') r));
 update projects set rules=p_rules where id=p_project;
end $$;
create function public.apply_candidate_rules(p_id uuid,p_result jsonb,p_project_rules jsonb,p_subscription_rules jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate ingestion_candidates; live_rules jsonb; overrides jsonb; suggested uuid[];
begin
 select * into candidate from ingestion_candidates where id=p_id for update;
 perform require_project(candidate.project_id);
 if candidate.status<>'pending' then raise exception 'Analyst decision changed; candidate was not reclassified'; end if;
 select rules into live_rules from projects where id=candidate.project_id for share;
 select rules into overrides from project_subscriptions where project_id=candidate.project_id and feed_id=nullif(candidate.raw_metadata->>'feed_id','')::uuid for share;
 if live_rules is distinct from p_project_rules or overrides is distinct from p_subscription_rules then raise exception 'Rules changed; refresh before reapplying'; end if;
 suggested:=array(select jsonb_array_elements_text(p_result->'suggestedTags')::uuid);
 perform validate_tags(auth.uid(),suggested);
 update ingestion_candidates set rule_result=p_result,route=coalesce(route_override,p_result->>'route'),updated_at=now(),
  tag_ids=array(select unnest(suggested) except select unnest(candidate.analyst_removed_tags) union select unnest(candidate.analyst_added_tags)) where id=p_id;
end $$;
create function public.due_feeds() returns setof public.rss_feeds language sql security definer set search_path=public,pg_temp as $$
 select f.* from rss_feeds f where f.is_active and f.next_check_at<=now()
 and exists(select 1 from project_subscriptions s join projects p on p.id=s.project_id where s.feed_id=f.id and s.enabled and not p.archived)
 order by f.next_check_at,f.id limit 5
$$;
revoke all on function public.save_project_rules(uuid,jsonb,jsonb),public.apply_candidate_rules(uuid,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_project_rules(uuid,jsonb,jsonb),public.apply_candidate_rules(uuid,jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.due_feeds() from public,anon,authenticated;
grant execute on function public.due_feeds() to service_role;
