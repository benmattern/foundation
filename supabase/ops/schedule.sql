-- Authorization required before execution. Confirm pg_cron, pg_net and Vault exist.
-- Provision Vault secrets through the dashboard: foundation_project_url and
-- foundation_scheduler_secret. The latter must match the Edge Function's
-- INGESTION_SCHEDULER_SECRET. Never place the secret value in this file.
select cron.schedule('foundation-ingestion','*/5 * * * *',$job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='foundation_project_url') || '/functions/v1/collect-feeds',
  headers := jsonb_build_object('Content-Type','application/json','x-scheduler-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='foundation_scheduler_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 120000
 );
$job$);
-- Disable: select cron.unschedule('foundation-ingestion');
-- Inspect job status in cron.job_run_details and HTTP results in net._http_response.
