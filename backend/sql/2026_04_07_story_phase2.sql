alter table public.stories
    drop constraint if exists stories_status_check;

alter table public.stories
    add constraint stories_status_check
    check (status in ('active', 'hidden', 'deleted'));

create table if not exists public.story_views (
    id bigserial primary key,
    story_id bigint not null references public.stories(id) on delete cascade,
    viewer_id uuid not null references public.users(id) on delete cascade,
    viewed_at timestamptz not null default now(),
    unique (story_id, viewer_id)
);

create table if not exists public.story_reports (
    id bigserial primary key,
    story_id bigint not null references public.stories(id) on delete cascade,
    reported_by uuid not null references public.users(id) on delete cascade,
    reason text not null,
    status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
    reviewed_at timestamptz,
    reviewed_by uuid references public.users(id) on delete set null,
    admin_note text,
    created_at timestamptz not null default now(),
    unique (story_id, reported_by)
);

create index if not exists idx_story_views_story on public.story_views(story_id);
create index if not exists idx_story_views_viewer on public.story_views(viewer_id);
create index if not exists idx_story_reports_story on public.story_reports(story_id);
create index if not exists idx_story_reports_status on public.story_reports(status);

alter table public.story_views enable row level security;
alter table public.story_reports enable row level security;

drop policy if exists "Users create story views" on public.story_views;
create policy "Users create story views" on public.story_views
    for insert with check (auth.uid() = viewer_id);

drop policy if exists "Users read own story views" on public.story_views;
create policy "Users read own story views" on public.story_views
    for select using (auth.uid() = viewer_id);

drop policy if exists "Users create story reports" on public.story_reports;
create policy "Users create story reports" on public.story_reports
    for insert with check (auth.uid() = reported_by);

drop policy if exists "Users read own story reports" on public.story_reports;
create policy "Users read own story reports" on public.story_reports
    for select using (auth.uid() = reported_by);
