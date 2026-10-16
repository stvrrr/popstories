create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null constraint story_comments_story_id_fkey references public.stories(id) on delete cascade,
  user_id uuid not null constraint story_comments_user_id_fkey references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists story_comments_story_created_idx
on public.story_comments (story_id, created_at desc);

alter table public.story_comments enable row level security;

grant select, insert, delete on public.story_comments to anon, authenticated;

drop policy if exists "Comments are readable with their story" on public.story_comments;
create policy "Comments are readable with their story"
on public.story_comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stories s
    where s.id = story_id
      and (
        s.author_id = (select auth.uid())
        or (
          s.status = 'published'
          and (
            s.visibility = 'public'
            or (
              s.visibility = 'followers'
              and exists (
                select 1
                from public.follows f
                where f.follower_id = (select auth.uid())
                  and f.following_id = s.author_id
              )
            )
          )
        )
      )
  )
);

drop policy if exists "Readers can comment on accessible published stories" on public.story_comments;
create policy "Readers can comment on accessible published stories"
on public.story_comments
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.stories s
    where s.id = story_id
      and s.status = 'published'
      and (
        s.visibility = 'public'
        or (
          s.visibility = 'followers'
          and exists (
            select 1
            from public.follows f
            where f.follower_id = (select auth.uid())
              and f.following_id = s.author_id
          )
        )
      )
  )
);

drop policy if exists "Comment authors and story authors can delete comments" on public.story_comments;
create policy "Comment authors and story authors can delete comments"
on public.story_comments
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.stories s
    where s.id = story_id
      and s.author_id = (select auth.uid())
  )
);
