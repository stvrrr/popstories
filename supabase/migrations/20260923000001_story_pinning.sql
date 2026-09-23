alter table public.stories
add column if not exists is_pinned boolean not null default false;

alter table public.stories
add column if not exists pin_label text;