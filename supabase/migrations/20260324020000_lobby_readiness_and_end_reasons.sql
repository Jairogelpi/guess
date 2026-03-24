alter table public.room_players
  add column if not exists is_ready boolean not null default false;

alter table public.rooms
  add column if not exists ended_reason text,
  add column if not exists ended_by uuid references public.profiles(id) on delete set null;
