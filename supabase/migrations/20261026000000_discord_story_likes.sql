create table if not exists public.discord_story_likes (
  story_id uuid not null references public.stories(id) on delete cascade,
  discord_user_id text not null check (discord_user_id ~ '^[1-9][0-9]{0,19}$'),
  created_at timestamptz not null default now(),
  primary key (story_id, discord_user_id)
);

alter table public.discord_story_likes enable row level security;
revoke all on public.discord_story_likes from public, anon, authenticated;
grant all on public.discord_story_likes to service_role;

create or replace function public.get_public_story_like_counts(p_story_ids uuid[])
returns table (story_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    coalesce(account_likes.like_count, 0) + coalesce(discord_likes.like_count, 0) as like_count
  from public.stories as s
  left join (
    select l.story_id, count(*) as like_count
    from public.likes as l
    where l.story_id = any(coalesce(p_story_ids, array[]::uuid[]))
    group by l.story_id
  ) as account_likes on account_likes.story_id = s.id
  left join (
    select dl.story_id, count(*) as like_count
    from public.discord_story_likes as dl
    where dl.story_id = any(coalesce(p_story_ids, array[]::uuid[]))
    group by dl.story_id
  ) as discord_likes on discord_likes.story_id = s.id
  where s.id = any(coalesce(p_story_ids, array[]::uuid[]))
    and s.status = 'published'
    and s.visibility = 'public';
$$;

revoke all on function public.get_public_story_like_counts(uuid[]) from public, anon, authenticated;
grant execute on function public.get_public_story_like_counts(uuid[]) to anon, authenticated, service_role;

create or replace function public.toggle_discord_story_like(
  p_story_id uuid,
  p_discord_user_id text
)
returns table (liked boolean, like_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liked boolean;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_story_id::text || ':' || p_discord_user_id, 0)
  );

  if not exists (
    select 1
    from public.stories as s
    where s.id = p_story_id
      and s.status = 'published'
      and s.visibility = 'public'
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.discord_story_likes as dl
    where dl.story_id = p_story_id
      and dl.discord_user_id = p_discord_user_id
  ) then
    delete from public.discord_story_likes as dl
    where dl.story_id = p_story_id
      and dl.discord_user_id = p_discord_user_id;
    v_liked := false;
  else
    insert into public.discord_story_likes (story_id, discord_user_id)
    values (p_story_id, p_discord_user_id);
    v_liked := true;
  end if;

  return query
  select
    v_liked,
    coalesce((
      select count(*)
      from public.likes as l
      where l.story_id = p_story_id
    ), 0) + coalesce((
      select count(*)
      from public.discord_story_likes as dl
      where dl.story_id = p_story_id
    ), 0);
end;
$$;

revoke all on function public.toggle_discord_story_like(uuid, text) from public, anon, authenticated;
grant execute on function public.toggle_discord_story_like(uuid, text) to service_role;
