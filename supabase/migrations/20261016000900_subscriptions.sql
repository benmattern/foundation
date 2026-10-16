create function public.set_subscription(p_project uuid,p_feed uuid,p_enabled boolean,p_rules jsonb default null,p_expected jsonb default null) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; prior_rules jsonb;
begin
 who:=require_project(p_project);
 perform 1 from rss_feeds where id=p_feed and owner_id=who for update;
 if not found then raise exception 'Feed access denied'; end if;
 select rules into prior_rules from project_subscriptions where project_id=p_project and feed_id=p_feed;
 if p_expected is not null and coalesce(prior_rules,'null'::jsonb) is distinct from p_expected->'rules' then
  raise exception 'Subscription rules changed; refresh before saving' using errcode='40001';
 end if;
 insert into project_subscriptions(project_id,feed_id,owner_id,enabled,rules) values(p_project,p_feed,who,p_enabled,p_rules)
  on conflict(project_id,feed_id) do update set enabled=excluded.enabled,rules=excluded.rules;
 update rss_feeds set intake_version=intake_version+1,etag=null,last_modified=null,next_check_at=now() where id=p_feed;
end $$;
create or replace function public.set_source_enabled(p_project uuid,p_source uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; feed record;
begin
 who:=require_project(p_project);
 if not exists(select 1 from sources where id=p_source and owner_id=who) then raise exception 'Source access denied'; end if;
 for feed in select f.id,s.rules from rss_feeds f left join project_subscriptions s on s.feed_id=f.id and s.project_id=p_project
  where f.source_id=p_source and f.owner_id=who order by f.id for update of f loop
  insert into project_subscriptions(project_id,feed_id,owner_id,enabled) values(p_project,feed.id,who,p_enabled)
   on conflict(project_id,feed_id) do update set enabled=excluded.enabled;
  update rss_feeds set intake_version=intake_version+1,etag=null,last_modified=null,next_check_at=now() where id=feed.id;
 end loop;
end $$;
revoke insert,update,delete on public.project_subscriptions from authenticated;
revoke all on function public.set_subscription(uuid,uuid,boolean,jsonb,jsonb) from public,anon;
grant execute on function public.set_subscription(uuid,uuid,boolean,jsonb,jsonb) to authenticated;
create function public.protect_feed_endpoint() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.feed_url<>old.feed_url and exists(select 1 from collection_runs where feed_id=old.id) then
  raise exception 'Create a new feed to change an endpoint that has collection history';
 end if;
 return new;
end $$;
create trigger preserve_feed_endpoint before update of feed_url on public.rss_feeds for each row execute function public.protect_feed_endpoint();
revoke all on function public.protect_feed_endpoint() from public,anon,authenticated;
