create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players rp
    where rp.room_id = target_room_id
      and rp.player_id = auth.uid()
      and rp.is_active = true
  );
$$;

revoke all on function public.is_room_member(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;

drop policy if exists "Anyone can read rooms" on public.rooms;
drop policy if exists "Players read rooms in their room" on public.rooms;
drop policy if exists "rooms_select_member" on public.rooms;
create policy "rooms_select_member" on public.rooms
  for select
  using (public.is_room_member(id));

drop policy if exists "Players read room_players in their room" on public.room_players;
drop policy if exists "room_players_select_member" on public.room_players;
create policy "room_players_select_member" on public.room_players
  for select
  using (public.is_room_member(room_id));

drop policy if exists "Players update own is_active" on public.room_players;
drop policy if exists "room_players_update_own_active" on public.room_players;
create policy "room_players_update_own_active" on public.room_players
  for update
  using (player_id = auth.uid())
  with check (player_id = auth.uid());

drop policy if exists "Players read rounds in their room" on public.rounds;
drop policy if exists "rounds_select_member" on public.rounds;
create policy "rounds_select_member" on public.rounds
  for select
  using (public.is_room_member(room_id));

drop policy if exists "Players insert own cards" on public.cards;
drop policy if exists "cards_insert_own_member" on public.cards;
create policy "cards_insert_own_member" on public.cards
  for insert
  with check (
    player_id = auth.uid()
    and exists (
      select 1
      from public.rounds r
      where r.id = cards.round_id
        and public.is_room_member(r.room_id)
    )
  );

drop policy if exists "Players read played cards in their room rounds" on public.cards;
drop policy if exists "cards_select_member" on public.cards;
create policy "cards_select_member" on public.cards
  for select
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = cards.round_id
        and public.is_room_member(r.room_id)
    )
  );

drop policy if exists "Players read votes in their room" on public.votes;
drop policy if exists "votes_select_member" on public.votes;
create policy "votes_select_member" on public.votes
  for select
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = votes.round_id
        and public.is_room_member(r.room_id)
    )
  );

drop policy if exists "Players read round_scores in their room" on public.round_scores;
drop policy if exists "round_scores_select_member" on public.round_scores;
create policy "round_scores_select_member" on public.round_scores
  for select
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = round_scores.round_id
        and public.is_room_member(r.room_id)
    )
  );

drop policy if exists "lobby_messages_select_member" on public.lobby_messages;
create policy "lobby_messages_select_member" on public.lobby_messages
  for select
  using (public.is_room_member(room_id));

drop policy if exists "lobby_messages_insert_member" on public.lobby_messages;
create policy "lobby_messages_insert_member" on public.lobby_messages
  for insert
  with check (
    player_id = auth.uid()
    and public.is_room_member(room_id)
  );
