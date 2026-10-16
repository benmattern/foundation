insert into public.project_subscriptions(project_id,feed_id,owner_id,enabled)
 select p.id,f.id,f.owner_id,f.is_active from public.projects p join public.rss_feeds f on f.owner_id=p.owner_id
 where p.name='Legacy research' on conflict do nothing;
create unique index one_running_feed on public.collection_runs(feed_id) where status='running';
create function public.claim_feed(p_feed uuid,p_owner uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare feed rss_feeds; run_id uuid;
begin
 select * into feed from rss_feeds where id=p_feed and owner_id=p_owner for update;
 if feed.id is null then raise exception 'Feed access denied'; end if;
 if exists(select 1 from collection_runs where feed_id=p_feed and status='running' and lease_until>now()) then return null; end if;
 update collection_runs set status='error',error='Collector lease expired',finished_at=now() where feed_id=p_feed and status='running';
 if not feed.is_active or not exists(select 1 from project_subscriptions s join projects p on p.id=s.project_id where s.feed_id=p_feed and s.enabled and not p.archived) then return null; end if;
 insert into collection_runs(feed_id,owner_id,status,lease_until,intake_version) values(p_feed,p_owner,'running',now()+interval '4 minutes',feed.intake_version) returning id into run_id;
 update rss_feeds set last_checked_at=now(),next_check_at=now()+interval '5 minutes' where id=p_feed;
 return run_id;
end $$;
create function public.stage_feed_item(p_run uuid,p_identity text,p_origin text,p_item jsonb,p_results jsonb) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare run collection_runs; feed rss_feeds; content_id uuid; subscription record; added integer:=0; affected integer; result jsonb;
begin
 select f.* into feed from rss_feeds f join collection_runs r on r.feed_id=f.id where r.id=p_run for share of f;
 select * into run from collection_runs where id=p_run for update;
 if run.status is distinct from 'running' or run.lease_until<=now() then raise exception 'Collector lease unavailable'; end if;
 if not feed.is_active then return 0; end if;
 select item_id into content_id from item_origins where feed_id=feed.id and origin_key=p_origin;
 if content_id is null then
  insert into collected_items(owner_id,identity_url,original_acquisition) values(run.owner_id,p_identity,p_item) on conflict do nothing;
  select id into content_id from collected_items where owner_id=run.owner_id and identity_url=p_identity;
 end if;
 insert into item_origins(item_id,feed_id,owner_id,origin_key,observation) values(content_id,feed.id,run.owner_id,p_origin,p_item)
  on conflict(feed_id,origin_key) do update set observed_at=now(),observation=excluded.observation;
 -- Locks serialize staging with source pauses and project archival. Changes in the
 -- rules snapshot abort staging rather than applying stale classification.
 for subscription in select s.*,p.rules as project_rules from project_subscriptions s join projects p on p.id=s.project_id
  where s.feed_id=feed.id and s.enabled and not p.archived for share of s,p loop
  result:=p_results->subscription.project_id::text;
  if result is null then raise exception 'Subscription snapshot changed; retry collection'; end if;
  if result->'projectRules' is distinct from subscription.project_rules or result->'subscriptionRules' is distinct from coalesce(subscription.rules,'null'::jsonb) then
   raise exception 'Rules changed during collection; retry collection';
  end if;
  insert into ingestion_candidates(owner_id,project_id,item_id,url,source_id,title,description,published_at,import_source,
    raw_metadata,warnings,original_acquisition,rule_result,route,tag_ids,status,converted_article_id)
   select run.owner_id,subscription.project_id,content_id,p_item->>'link',feed.source_id,p_item->>'title',p_item->>'description',
    nullif(p_item->>'publishedAt','')::timestamptz,'rss',jsonb_build_object('feed_id',feed.id,'item',p_item),
    coalesce(p_item->'warnings','[]'),p_item,result->'classification',result->'classification'->>'route',
    array(select jsonb_array_elements_text(result->'classification'->'suggestedTags')::uuid),
    case when a.id is null then 'pending' else 'accepted' end,a.id from (select 1) dummy
    left join articles a on a.project_id=subscription.project_id and a.item_id=content_id
   on conflict(project_id,item_id) do nothing;
  get diagnostics affected=row_count; added:=added+affected;
 end loop;
 update collection_runs set staged=staged+added,fetched=fetched+1 where id=p_run;
 return added;
end $$;
create function public.finish_feed(p_run uuid,p_status text,p_warnings jsonb default '[]',p_error text default null,p_etag text default null,p_modified text default null,p_fetched integer default null) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare run collection_runs; feed rss_feeds;
begin
 select f.* into feed from rss_feeds f join collection_runs r on r.feed_id=f.id where r.id=p_run for update of f;
 select * into run from collection_runs where id=p_run for update;
 if run.status is distinct from 'running' or run.lease_until<=now() then raise exception 'Collector lease unavailable'; end if;
 if p_status not in ('success','partial','error','paused') then raise exception 'Invalid collection result'; end if;
 if feed.intake_version<>run.intake_version then
  p_status:='partial';p_etag:=null;p_modified:=null;p_warnings:=p_warnings||'["Subscriptions changed during collection; current feed window will be checked again"]'::jsonb;
 end if;
 update collection_runs set status=p_status,warnings=p_warnings,error=p_error,fetched=coalesce(p_fetched,fetched),finished_at=now(),lease_until=null where id=p_run;
 update rss_feeds set last_success_at=case when p_status='success' then now() else last_success_at end,
  failure_count=case when p_status='success' then 0 else least(failure_count+1,12) end,
  next_check_at=case when feed.intake_version<>run.intake_version then now() else now()+case when p_status='success' then interval '1 hour' else interval '5 minutes'*power(2,least(failure_count,8)) end end,
  -- Never cache a partially processed feed: a 304 would prevent retrying missed items.
  etag=case when p_status='success' then p_etag else null end,
  last_modified=case when p_status='success' then p_modified else null end,updated_at=now() where id=run.feed_id;
 return p_status;
end $$;
revoke all on function public.claim_feed(uuid,uuid),public.stage_feed_item(uuid,text,text,jsonb,jsonb),public.finish_feed(uuid,text,jsonb,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.claim_feed(uuid,uuid),public.stage_feed_item(uuid,text,text,jsonb,jsonb),public.finish_feed(uuid,text,jsonb,text,text,text,integer) to service_role;
grant all on public.collection_runs,public.collected_items,public.item_origins,public.rss_feeds,public.project_subscriptions,public.projects to service_role;
