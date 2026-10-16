-- Read-only: run as database administrator and sanitize before sharing.
select n.nspname as schema_name,c.relname,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p') order by c.relname;
select * from pg_policies where schemaname='public' order by tablename,policyname;
select * from information_schema.role_table_grants where table_schema='public' order by table_name,grantee,privilege_type;
select * from information_schema.role_routine_grants where routine_schema='public' order by routine_name,grantee;
select p.proname,p.prosecdef,pg_get_function_identity_arguments(p.oid) as arguments,pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.proname;
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) from pg_constraint
where connamespace='public'::regnamespace order by conrelid::regclass::text,conname;
select * from pg_indexes where schemaname='public' order by tablename,indexname;
select evtname,evtevent,evtenabled from pg_event_trigger order by evtname;
select extname,extversion from pg_extension order by extname;
select schemaname,tablename,policyname,roles,qual,with_check from pg_policies where schemaname in ('storage','auth');
