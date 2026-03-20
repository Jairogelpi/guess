insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update
set public = excluded.public;

alter table if exists public.profiles enable row level security;
alter table if exists public.gallery_cards enable row level security;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    insert into public.profiles (id, display_name, updated_at)
    select
      u.id,
      coalesce(
        nullif(u.raw_user_meta_data ->> 'display_name', ''),
        nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
        'Player'
      ),
      now()
    from auth.users u
    on conflict (id) do nothing;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, updated_at)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Player'
    ),
    now()
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    create policy profiles_select_own
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_own'
  ) then
    create policy profiles_insert_own
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gallery_cards'
      and policyname = 'gallery_cards_select_own'
  ) then
    create policy gallery_cards_select_own
      on public.gallery_cards
      for select
      to authenticated
      using (auth.uid() = player_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gallery_cards'
      and policyname = 'gallery_cards_insert_own'
  ) then
    create policy gallery_cards_insert_own
      on public.gallery_cards
      for insert
      to authenticated
      with check (auth.uid() = player_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gallery_cards'
      and policyname = 'gallery_cards_update_own'
  ) then
    create policy gallery_cards_update_own
      on public.gallery_cards
      for update
      to authenticated
      using (auth.uid() = player_id)
      with check (auth.uid() = player_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gallery_cards'
      and policyname = 'gallery_cards_delete_own'
  ) then
    create policy gallery_cards_delete_own
      on public.gallery_cards
      for delete
      to authenticated
      using (auth.uid() = player_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'gallery_objects_insert_own'
  ) then
    create policy gallery_objects_insert_own
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'gallery'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'gallery_objects_select_own'
  ) then
    create policy gallery_objects_select_own
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'gallery'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'gallery_objects_delete_own'
  ) then
    create policy gallery_objects_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'gallery'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
