alter table public.cards
  add column if not exists risk_clue_profile text,
  add column if not exists is_corrupted boolean not null default false;

alter table public.votes
  add column if not exists bet_tokens integer not null default 0;

alter table public.room_players
  add column if not exists corrupted_cards_remaining integer not null default 2;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cards_risk_clue_profile_check'
  ) then
    alter table public.cards
      add constraint cards_risk_clue_profile_check
      check (risk_clue_profile in ('normal', 'sniper', 'narrow', 'ambush') or risk_clue_profile is null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_bet_tokens_check'
  ) then
    alter table public.votes
      add constraint votes_bet_tokens_check
      check (bet_tokens between 0 and 2);
  end if;
end $$;
