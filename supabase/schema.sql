create extension if not exists "pgcrypto";

create table if not exists public.physicists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  university_origin text,
  current_city text not null,
  country text not null,
  current_institution text,
  position text,
  research_field text,
  email text,
  show_email boolean default false,
  website text,
  orcid text,
  linkedin text,
  year_left_university int,
  latitude double precision not null,
  longitude double precision not null,
  edit_code_hash text not null,
  is_approved boolean default false,
  is_public boolean default true,
  consent_given boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists physicists_public_idx
  on public.physicists (is_approved, is_public);

create index if not exists physicists_country_idx
  on public.physicists (country);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists physicists_updated_at on public.physicists;
create trigger physicists_updated_at
before update on public.physicists
for each row execute function public.set_updated_at();

alter table public.physicists enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY only in server-side API routes.
-- Do not add public anon policies unless you intentionally move reads to the browser.
