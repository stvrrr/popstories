create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

alter table public.follows enable row level security;

drop policy if exists "Users can view their own follows" on public.follows;
drop policy if exists "Users can insert follows" on public.follows;
drop policy if exists "Users can delete follows" on public.follows;

create policy "Users can view their own follows"
on public.follows
for select
to authenticated
using (auth.uid() = follower_id);

create policy "Users can insert follows"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

create policy "Users can delete follows"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);
