-- Fresh-install baseline reconciled with live catalog inspection on 2026-10-16.
-- Do not run against an existing database. Reconcile grants/policies/functions first,
-- then mark this version applied on an existing deployment using Supabase migration repair.
create table public.sources (
 id uuid primary key default gen_random_uuid(), name text not null, url text not null,
 category text, notes text, created_at timestamptz default now()
);
create table public.articles (
 id uuid primary key default gen_random_uuid(), source_id uuid references public.sources(id) on delete set null,
 title text not null, url text not null, summary text, published_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.tags (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 description text, created_at timestamptz not null default now()
);
create table public.article_tags (
 article_id uuid not null references public.articles(id) on delete cascade, tag_id uuid not null references public.tags(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(article_id, tag_id)
);
create table public.events (
 id uuid primary key default gen_random_uuid(), title text not null, description text, event_type text,
 status text not null default 'draft' check (status in ('draft','active','resolved','archived')),
 occurred_at timestamptz, location text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.article_events (
 article_id uuid not null references public.articles(id) on delete cascade, event_id uuid not null references public.events(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(article_id, event_id)
);
create table public.ingestion_candidates (
 id uuid primary key default gen_random_uuid(), url text not null check(length(trim(url)) > 0),
 canonical_url text, final_url text, source_id uuid references public.sources(id) on delete set null, title text, description text,
 published_at timestamptz, import_source text not null default 'manual_url' check(import_source in ('manual_url','rss','browser_extension','connector')),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','duplicate')),
 raw_metadata jsonb not null default '{}' check(jsonb_typeof(raw_metadata) = 'object'),
 warnings jsonb not null default '[]' check(jsonb_typeof(warnings) = 'array'),
 converted_article_id uuid references public.articles(id) on delete set null, rejection_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), reviewed_at timestamptz
);
create table public.rss_feeds (
 id uuid primary key default gen_random_uuid(), feed_url text not null check(length(trim(feed_url)) > 0),
 source_id uuid references public.sources(id) on delete set null, title text, is_active boolean not null default true,
 last_checked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;
create trigger set_events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger set_ingestion_candidates_updated_at before update on public.ingestion_candidates for each row execute function public.set_updated_at();
create trigger set_rss_feeds_updated_at before update on public.rss_feeds for each row execute function public.set_updated_at();
create policy "Allow all tag access" on public.tags for all to public using(true) with check(true);
create policy "Allow all article tag access" on public.article_tags for all to public using(true) with check(true);
