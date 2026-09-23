create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  site_image_url text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Site settings are publicly readable" on public.site_settings;
create policy "Site settings are publicly readable"
on public.site_settings
for select
to public
using (true);