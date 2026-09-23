alter table public.stories enable row level security;
alter table public.story_pages enable row level security;

drop policy if exists "Authors can view their own stories" on public.stories;
create policy "Authors can view their own stories"
on public.stories
for select
to authenticated
using (auth.uid() = author_id);

drop policy if exists "Authors can view their own story pages" on public.story_pages;
create policy "Authors can view their own story pages"
on public.story_pages
for select
to authenticated
using (
  exists (
    select 1
    from public.stories
    where public.stories.id = story_pages.story_id
      and public.stories.author_id = auth.uid()
  )
);
