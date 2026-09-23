drop policy if exists "Authors can view their own stories" on public.stories;
drop policy if exists "Published public stories are readable" on public.stories;
drop policy if exists "Authors can view their own story pages" on public.story_pages;
drop policy if exists "Published public story pages are readable" on public.story_pages;

alter table public.stories disable row level security;
alter table public.story_pages disable row level security;