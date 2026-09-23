drop policy if exists "Published public stories are readable" on public.stories;
create policy "Published public stories are readable"
on public.stories
for select
to anon, authenticated
using (status = 'published' and visibility = 'public');

drop policy if exists "Published public story pages are readable" on public.story_pages;
create policy "Published public story pages are readable"
on public.story_pages
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stories
    where public.stories.id = story_pages.story_id
      and public.stories.status = 'published'
      and public.stories.visibility = 'public'
  )
);