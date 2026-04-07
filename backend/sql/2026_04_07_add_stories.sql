create table if not exists public.stories (
    id bigserial primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    media_type text not null check (media_type in ('image', 'video')),
    media_url text not null,
    caption text,
    status text not null default 'active' check (status in ('active', 'deleted')),
    is_highlighted boolean not null default false,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_stories_user_created_at on public.stories(user_id, created_at desc);
create index if not exists idx_stories_status_expires_at on public.stories(status, expires_at desc);

alter table public.stories enable row level security;

drop policy if exists "Public read active stories" on public.stories;
create policy "Public read active stories" on public.stories
    for select using (status = 'active' and expires_at > now());

drop policy if exists "Users read own stories" on public.stories;
create policy "Users read own stories" on public.stories
    for select using (auth.uid() = user_id);

drop policy if exists "Users create own stories" on public.stories;
create policy "Users create own stories" on public.stories
    for insert with check (auth.uid() = user_id);
