alter table public.room_players
  add column if not exists intuition_tokens integer not null default 0,
  add column if not exists challenge_leader_used boolean not null default false;

create table if not exists public.round_resolution_summaries (
  round_id uuid primary key references public.rounds(id) on delete cascade,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cards
  add column if not exists tactical_action text check (tactical_action in ('subtle_bet', 'trap_card')),
  add column if not exists challenge_leader boolean not null default false;

alter table public.votes
  add column if not exists tactical_action text check (tactical_action in ('firm_read')),
  add column if not exists spent_intuition_token boolean not null default false,
  add column if not exists challenge_leader boolean not null default false;
