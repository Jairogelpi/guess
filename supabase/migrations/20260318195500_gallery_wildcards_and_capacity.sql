alter table public.room_players
  add column if not exists wildcards_remaining integer not null default 3
  check (wildcards_remaining between 0 and 3);

create or replace function public.enforce_gallery_card_limit()
returns trigger
language plpgsql
as $$
declare
  player_card_count integer;
begin
  select count(*)
  into player_card_count
  from public.gallery_cards
  where player_id = new.player_id;

  if player_card_count >= 8 then
    raise exception using
      errcode = 'P0001',
      message = 'GALLERY_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

drop trigger if exists gallery_cards_limit_trigger on public.gallery_cards;

create trigger gallery_cards_limit_trigger
before insert on public.gallery_cards
for each row
execute function public.enforce_gallery_card_limit();
