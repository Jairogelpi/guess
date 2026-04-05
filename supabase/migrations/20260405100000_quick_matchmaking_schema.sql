create table if not exists public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id),
  display_name text not null,
  preferred_player_count int not null,
  min_player_count int not null,
  max_player_count int not null,
  status text not null default 'searching',
  search_expanded boolean not null default false,
  matched_room_id uuid null references public.rooms(id),
  matched_room_code text null,
  countdown_starts_at timestamptz null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz null,
  constraint matchmaking_queue_preferred_player_count_range_check
    check (preferred_player_count between 3 and 6),
  constraint matchmaking_queue_min_player_count_range_check
    check (min_player_count between 3 and 6),
  constraint matchmaking_queue_max_player_count_range_check
    check (max_player_count between 3 and 6),
  constraint matchmaking_queue_status_check
    check (status in ('searching', 'matched', 'cancelled', 'expired')),
  constraint matchmaking_queue_min_preferred_order_check
    check (min_player_count <= preferred_player_count),
  constraint matchmaking_queue_preferred_max_order_check
    check (preferred_player_count <= max_player_count),
  constraint matchmaking_queue_searching_lifecycle_check
    check (
      status <> 'searching'
      or (
        matched_room_id is null
        and matched_room_code is null
        and countdown_starts_at is null
        and cancelled_at is null
      )
    ),
  constraint matchmaking_queue_matched_lifecycle_check
    check (
      status <> 'matched'
      or (
        matched_room_id is not null
        and matched_room_code is not null
        and countdown_starts_at is not null
        and cancelled_at is null
      )
    ),
  constraint matchmaking_queue_cancelled_lifecycle_check
    check (
      status <> 'cancelled'
      or (
        cancelled_at is not null
        and countdown_starts_at is null
        and matched_room_id is null
        and matched_room_code is null
      )
    ),
  constraint matchmaking_queue_expired_lifecycle_check
    check (
      status <> 'expired'
      or (
        countdown_starts_at is null
        and matched_room_id is null
        and matched_room_code is null
        and cancelled_at is null
      )
    )
);

create index if not exists matchmaking_queue_search_idx
  on public.matchmaking_queue (status, search_expanded, preferred_player_count, created_at)
  where status = 'searching';

create index if not exists matchmaking_queue_range_idx
  on public.matchmaking_queue (status, min_player_count, max_player_count, preferred_player_count, created_at desc)
  where status in ('searching', 'matched');

create index if not exists matchmaking_queue_expires_idx
  on public.matchmaking_queue (status, expires_at, created_at)
  where status in ('searching', 'matched', 'expired');

create unique index if not exists matchmaking_queue_one_active_ticket_per_player
  on public.matchmaking_queue (player_id)
  where status in ('searching', 'matched');

create or replace function public.matchmaking_queue_sync_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := now();

  if new.matched_room_id is null then
    new.matched_room_code := null;
    return new;
  end if;

  select r.code
    into new.matched_room_code
  from public.rooms r
  where r.id = new.matched_room_id;

  if not found then
    raise exception using
      errcode = '23503',
      message = 'MATCHED_ROOM_NOT_FOUND';
  end if;

  return new;
end;
$$;

drop trigger if exists matchmaking_queue_sync_fields on public.matchmaking_queue;
create trigger matchmaking_queue_sync_fields
before insert or update on public.matchmaking_queue
for each row execute function public.matchmaking_queue_sync_fields();

alter table public.matchmaking_queue enable row level security;

drop policy if exists matchmaking_queue_select_own on public.matchmaking_queue;
drop policy if exists matchmaking_queue_manage_service_role on public.matchmaking_queue;

create policy matchmaking_queue_select_own on public.matchmaking_queue
  for select
  using ((select auth.uid()) = player_id);

create policy matchmaking_queue_manage_service_role on public.matchmaking_queue
  for all
  to service_role
  using (true)
  with check (true);
