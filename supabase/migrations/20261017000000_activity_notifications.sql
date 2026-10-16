create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('like', 'favorite', 'comment', 'follow')),
  source_id uuid not null,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  detail text,
  created_at timestamptz not null default now(),
  unique (event_type, source_id)
);

create index if not exists activity_events_recipient_created_idx
on public.activity_events (recipient_id, created_at desc);

alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon, authenticated;
grant select on public.activity_events to authenticated;

drop policy if exists "Users can read received activity" on public.activity_events;
create policy "Users can read received activity"
on public.activity_events
for select
to authenticated
using (recipient_id = (select auth.uid()));

create or replace function public.capture_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := to_jsonb(new);
  action_type text;
  source_id uuid;
  actor_id uuid;
  recipient_id uuid;
  story_id uuid;
  detail text;
  occurred_at timestamptz;
begin
  source_id := nullif(row_data ->> 'id', '')::uuid;
  occurred_at := coalesce((row_data ->> 'created_at')::timestamptz, now());

  if tg_table_name = 'follows' then
    action_type := 'follow';
    actor_id := (row_data ->> 'follower_id')::uuid;
    recipient_id := (row_data ->> 'following_id')::uuid;
  else
    action_type := case tg_table_name
      when 'likes' then 'like'
      when 'favorites' then 'favorite'
      when 'story_comments' then 'comment'
    end;
    actor_id := (row_data ->> 'user_id')::uuid;
    story_id := (row_data ->> 'story_id')::uuid;
    detail := case when action_type = 'comment' then row_data ->> 'content' else null end;

    select stories.author_id
    into recipient_id
    from public.stories
    where stories.id = story_id;
  end if;

  if action_type is null or actor_id is null or recipient_id is null or actor_id = recipient_id then
    return new;
  end if;

  source_id := coalesce(
    source_id,
    md5(jsonb_build_array(action_type, actor_id, recipient_id, story_id, detail, occurred_at)::text)::uuid
  );

  insert into public.activity_events (
    event_type, source_id, actor_id, recipient_id, story_id, detail, created_at
  )
  values (
    action_type, source_id, actor_id, recipient_id, story_id, detail, occurred_at
  )
  on conflict (event_type, source_id) do nothing;

  return new;
end;
$$;

drop trigger if exists likes_capture_activity on public.likes;
create trigger likes_capture_activity
after insert on public.likes
for each row execute function public.capture_activity_event();

drop trigger if exists favorites_capture_activity on public.favorites;
create trigger favorites_capture_activity
after insert on public.favorites
for each row execute function public.capture_activity_event();

drop trigger if exists story_comments_capture_activity on public.story_comments;
create trigger story_comments_capture_activity
after insert on public.story_comments
for each row execute function public.capture_activity_event();

drop trigger if exists follows_capture_activity on public.follows;
create trigger follows_capture_activity
after insert on public.follows
for each row execute function public.capture_activity_event();

insert into public.activity_events (event_type, source_id, actor_id, recipient_id, story_id, created_at)
select
  'like',
  md5(jsonb_build_array('like', likes.user_id, stories.author_id, likes.story_id, null, likes.created_at)::text)::uuid,
  likes.user_id,
  stories.author_id,
  likes.story_id,
  likes.created_at
from public.likes
join public.stories on stories.id = likes.story_id
where likes.user_id <> stories.author_id
on conflict (event_type, source_id) do nothing;

insert into public.activity_events (event_type, source_id, actor_id, recipient_id, story_id, created_at)
select
  'favorite',
  md5(jsonb_build_array('favorite', favorites.user_id, stories.author_id, favorites.story_id, null, favorites.created_at)::text)::uuid,
  favorites.user_id,
  stories.author_id,
  favorites.story_id,
  favorites.created_at
from public.favorites
join public.stories on stories.id = favorites.story_id
where favorites.user_id <> stories.author_id
on conflict (event_type, source_id) do nothing;

insert into public.activity_events (event_type, source_id, actor_id, recipient_id, story_id, detail, created_at)
select 'comment', comments.id, comments.user_id, stories.author_id, comments.story_id, comments.content, comments.created_at
from public.story_comments as comments
join public.stories on stories.id = comments.story_id
where comments.user_id <> stories.author_id
on conflict (event_type, source_id) do nothing;

insert into public.activity_events (event_type, source_id, actor_id, recipient_id, created_at)
select 'follow', follows.id, follows.follower_id, follows.following_id, follows.created_at
from public.follows
where follows.follower_id <> follows.following_id
on conflict (event_type, source_id) do nothing;
