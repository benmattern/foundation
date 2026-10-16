alter table public.sources add topics text[] not null default '{}', add region text not null default '', add language text not null default '';
create function public.enable_catalog_feed(p_project uuid,p_catalog jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid; publisher uuid; feed uuid;
begin
 who:=require_project(p_project);
 perform pg_advisory_xact_lock(hashtextextended(who::text||(p_catalog->>'url'),0));
 select id into publisher from sources where owner_id=who and url=p_catalog->>'url' order by created_at,id limit 1;
 if publisher is null then
  insert into sources(owner_id,name,url,category,topics,region,language)
   values(who,p_catalog->>'name',p_catalog->>'url','Catalog',array(select jsonb_array_elements_text(p_catalog->'topics')),p_catalog->>'region',p_catalog->>'language') returning id into publisher;
 end if;
 select id into feed from rss_feeds where owner_id=who and feed_url=p_catalog->>'feedUrl' order by created_at,id limit 1;
 if feed is null then insert into rss_feeds(owner_id,source_id,title,feed_url) values(who,publisher,p_catalog->>'name',p_catalog->>'feedUrl') returning id into feed; end if;
 perform 1 from rss_feeds where id=feed for update;
 perform set_subscription(p_project,feed,true,(select rules from project_subscriptions where project_id=p_project and feed_id=feed));
end $$;
create function public.set_source_enabled(p_project uuid,p_source uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare who uuid;
begin
 who:=require_project(p_project);
 if not exists(select 1 from sources where id=p_source and owner_id=who) then raise exception 'Source access denied'; end if;
 insert into project_subscriptions(project_id,feed_id,owner_id,enabled)
  select p_project,id,who,p_enabled from rss_feeds where source_id=p_source and owner_id=who
  on conflict(project_id,feed_id) do update set enabled=excluded.enabled;
end $$;
revoke all on function public.enable_catalog_feed(uuid,jsonb),public.set_source_enabled(uuid,uuid,boolean) from public,anon;
grant execute on function public.enable_catalog_feed(uuid,jsonb),public.set_source_enabled(uuid,uuid,boolean) to authenticated;
