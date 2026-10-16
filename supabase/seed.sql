-- FICTIONAL DEMO DATA ONLY. Opt-in, disposable databases only.
-- Provision a local test user first, then SET app.demo_owner_id to that user's UUID.
-- This script never creates auth accounts, assigns production ownership, or deletes data.
begin;
do $$
declare who uuid; project uuid:='00000000-0000-4000-8000-000000000001';
 source uuid:='00000000-0000-4000-8000-000000000002'; tag uuid:='00000000-0000-4000-8000-000000000003';
 article uuid:='00000000-0000-4000-8000-000000000004'; event uuid:='00000000-0000-4000-8000-000000000005';
begin
 who:=nullif(current_setting('app.demo_owner_id',true),'')::uuid;
 if who is null or not exists(select 1 from auth.users where id=who) then raise exception 'Choose an existing local demo auth user in app.demo_owner_id'; end if;
 if exists(select 1 from projects where id=project and owner_id<>who) or exists(select 1 from sources where id=source and owner_id<>who)
 or exists(select 1 from tags where id=tag and owner_id<>who) or exists(select 1 from articles where id=article and owner_id<>who)
 or exists(select 1 from events where id=event and owner_id<>who) then raise exception 'Demo UUID belongs to another owner; no changes made'; end if;
 insert into projects(id,owner_id,name,description) values(project,who,'[DEMO] Research','Fictional research workspace') on conflict(id) do nothing;
 insert into sources(id,owner_id,name,url,category) values(source,who,'[DEMO] Example Observatory','https://example.com/foundation-demo/','Fictional demo') on conflict(id) do nothing;
 insert into tags(id,owner_id,name) values(tag,who,'[DEMO] Technology') on conflict(id) do nothing;
 insert into articles(id,owner_id,project_id,source_id,title,url,summary,published_at)
  values(article,who,project,source,'[DEMO] Fictional semiconductor research','https://example.com/foundation-demo/research','Fictional evidence for local workflow verification.','2026-10-16T12:00:00Z') on conflict(id) do nothing;
 insert into article_tags(article_id,tag_id) values(article,tag) on conflict do nothing;
 insert into events(id,owner_id,project_id,title,description,status,occurred_at)
  values(event,who,project,'[DEMO] Fictional research announcement','Fictional analyst event.','active','2026-10-16T12:00:00Z') on conflict(id) do nothing;
 insert into article_events(article_id,event_id,project_id) values(article,event,project) on conflict do nothing;
end $$;
commit;
