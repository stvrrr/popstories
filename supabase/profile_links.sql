alter table public.profiles
  add column if not exists profile_links text[] not null default '{}';

create index if not exists profiles_profile_links_idx
on public.profiles using gin (profile_links);
