drop policy if exists "room_players_select_in_room" on public.room_players;

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  return exists (
    select 1
    from public.room_players rp
    where rp.room_id = target_room_id
      and rp.player_id = auth.uid()
      and rp.is_active = true
  );
end;
$$;

revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;
