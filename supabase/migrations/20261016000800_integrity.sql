-- Keep rule versions on their checked operation; ordinary project edits cannot replace them.
revoke update on public.projects from authenticated;
grant update(name,description,topics,keywords,archived) on public.projects to authenticated;
create function public.check_candidate_tags() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 perform validate_tags(new.owner_id,new.tag_ids);
 return new;
end $$;
create trigger candidate_tags_owner before insert or update of tag_ids on public.ingestion_candidates for each row execute function public.check_candidate_tags();
-- Preserve acquisitions and every later observation separately from edits.
create table public.item_observations (
 id uuid primary key default gen_random_uuid(), item_id uuid not null, owner_id uuid not null,
 feed_id uuid not null, observed_at timestamptz not null default now(), observation jsonb not null,
 foreign key(item_id,owner_id) references public.collected_items(id,owner_id), foreign key(feed_id,owner_id) references public.rss_feeds(id,owner_id)
);
alter table public.item_observations enable row level security;
create policy owner_access on public.item_observations to authenticated using(owner_id=auth.uid());
grant select on public.item_observations to authenticated;
create function public.record_origin_observation() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' or new.observation is distinct from old.observation then
  insert into item_observations(item_id,owner_id,feed_id,observation) values(new.item_id,new.owner_id,new.feed_id,new.observation);
 end if;
 return new;
end $$;
create trigger origin_observation after insert or update on public.item_origins for each row execute function public.record_origin_observation();
create table public.review_history (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.ingestion_candidates(id),
 owner_id uuid not null references auth.users(id), project_id uuid not null references public.projects(id),
 reviewed_at timestamptz not null default now(), before_state jsonb, after_state jsonb not null
);
alter table public.review_history enable row level security;
create policy owner_access on public.review_history to authenticated using(owner_id=auth.uid());
grant select on public.review_history to authenticated;
create function public.record_candidate_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' or (new.status,new.route,new.tag_ids,new.title,new.description,new.url,new.source_id) is distinct from
 (old.status,old.route,old.tag_ids,old.title,old.description,old.url,old.source_id) then
  insert into review_history(candidate_id,owner_id,project_id,before_state,after_state)
   values(new.id,new.owner_id,new.project_id,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 end if;
 if new.rule_result is not null and (tg_op='INSERT' or new.rule_result is distinct from old.rule_result) then
  insert into rule_evaluations(candidate_id,owner_id,project_id,result) values(new.id,new.owner_id,new.project_id,new.rule_result);
 end if;
 return new;
end $$;
create trigger candidate_history after insert or update on public.ingestion_candidates for each row execute function public.record_candidate_change();
-- Avoid re-recording the same evaluation in the reapply RPC; the trigger owns history.
-- No broad DDL cleanup or policy removal is performed on unrelated tables.
revoke all on function public.check_candidate_tags(),public.record_origin_observation(),public.record_candidate_change() from public,anon,authenticated;
