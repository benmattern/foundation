-- Read-only live deployment metadata. No article content, credentials or auth identities.
select jsonb_build_object(
 'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'forced_rls',c.relforcerowsecurity)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')),
 'columns',(select jsonb_agg(jsonb_build_object('table',table_name,'name',column_name,'type',data_type,'nullable',is_nullable,'default',column_default)) from information_schema.columns where table_schema='public'),
 'constraints',(select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid))) from pg_constraint where connamespace='public'::regnamespace),
 'policies',(select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public'),
 'grants',(select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public'),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'security_definer',p.prosecdef)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'),
 'triggers',(select jsonb_agg(jsonb_build_object('name',tgname,'table',tgrelid::regclass::text)) from pg_trigger where not tgisinternal and tgrelid in(select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public')),
 'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion)) from pg_extension),
 'auth_user_count',(select count(*) from auth.users),
 'migration_ledger',to_regclass('supabase_migrations.schema_migrations')::text,
 'counts',jsonb_build_object('sources',(select count(*) from public.sources),'articles',(select count(*) from public.articles),'tags',(select count(*) from public.tags),'article_tags',(select count(*) from public.article_tags),'events',(select count(*) from public.events),'article_events',(select count(*) from public.article_events),'candidates',(select count(*) from public.ingestion_candidates),'feeds',(select count(*) from public.rss_feeds))
) as inventory;
