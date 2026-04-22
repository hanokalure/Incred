-- Add push_token to users
alter table public.users add column if not exists push_token text;

-- Create notifications table
create table if not exists public.notifications (
    id bigserial primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    body text not null,
    type text not null,
    related_id bigint,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- Index for performance
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can read own notifications" on public.notifications
    for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
    for update using (auth.uid() = user_id);
