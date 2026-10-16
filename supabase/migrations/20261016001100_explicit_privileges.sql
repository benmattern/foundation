-- Hosted defaults can grant ALL to API roles. RLS does not protect TRUNCATE.
do $$ declare table_name text; column_name text; begin
 foreach table_name in array array['projects','sources','tags','rss_feeds','articles','events','ingestion_candidates',
  'article_tags','article_events','project_subscriptions','collection_runs','collected_items','item_origins',
  'item_observations','rule_evaluations','review_history','bulk_review_runs'] loop
  execute format('revoke all on table public.%I from public,anon,authenticated',table_name);
  for column_name in select a.attname from pg_attribute a where a.attrelid=format('public.%I',table_name)::regclass and a.attnum>0 and not a.attisdropped and a.attacl is not null loop
   execute format('revoke all (%I) on table public.%I from public,anon,authenticated',column_name,table_name);
  end loop;
  execute format('grant select on table public.%I to authenticated',table_name);
  execute format('grant all on table public.%I to service_role',table_name);
 end loop;
end $$;
grant insert on public.projects to authenticated;
grant update(name,description,topics,keywords,archived) on public.projects to authenticated;
grant insert,update,delete on public.sources,public.tags,public.rss_feeds to authenticated;
