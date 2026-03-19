create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'round-temp',
  'round-temp',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.temporary_generation_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null unique,
  scope text not null check (scope in ('round', 'gallery')),
  room_code text,
  round_id uuid,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  model text not null,
  refined_brief text not null,
  mime_type text not null default 'image/jpeg',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists temporary_generation_assets_cleanup_idx
  on public.temporary_generation_assets (expires_at)
  where deleted_at is null;

alter table public.temporary_generation_assets enable row level security;
