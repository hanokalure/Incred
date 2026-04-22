-- Enable extensions
create extension if not exists "uuid-ossp";

-- Roles enum
do $$ begin
    create type place_category as enum (
        'restaurant',
        'generational_shop',
        'tourist_place',
        'hidden_gem',
        'stay'
    );
exception
    when duplicate_object then null;
end $$;
    description text,
    created_at timestamptz not null default now()
);

-- Places
create table if not exists public.places (
    id bigserial primary key,
    name text not null,
    district_id bigint not null references public.districts(id) on delete cascade,
    category place_category not null,
    description text,
    address text,
    latitude double precision,
    longitude double precision,
    image_urls text[],
    video_urls text[],
    approval_status text not null default 'approved' check (approval_status in ('pending', 'approved', 'rejected')),
    submitted_by uuid references public.users(id) on delete set null,
    approved_by uuid references public.users(id) on delete set null,
    approved_at timestamptz,
    rejection_reason text,
    avg_rating numeric(3,2) default 0,
    created_at timestamptz not null default now()
);

-- Restaurant details
create table if not exists public.restaurant_details (
    place_id bigint primary key references public.places(id) on delete cascade,
    cuisine text,
    price_range text,
    must_try text
);

-- Stay details
create table if not exists public.stay_details (
    place_id bigint primary key references public.places(id) on delete cascade,
    stay_type text,
    price_per_night numeric(10,2),
    amenities text[]
);

-- Reviews
create table if not exists public.reviews (
    id bigserial primary key,
    place_id bigint not null references public.places(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    rating int not null check (rating between 1 and 5),
    comment text,
    image_url text,
    created_at timestamptz not null default now()
);

alter table if exists public.reviews
    add column if not exists image_url text;

-- Favorites
create table if not exists public.favorites (
    id bigserial primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    place_id bigint not null references public.places(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, place_id)
);

-- Itineraries
create table if not exists public.itineraries (
    id bigserial primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    district_id bigint not null references public.districts(id) on delete cascade,
    days int not null,
    plan jsonb not null,
    created_at timestamptz not null default now()
);

create table if not exists public.place_photo_submissions (
    id bigserial primary key,
    place_id bigint not null references public.places(id) on delete cascade,
    image_url text not null,
    submitted_by uuid not null references public.users(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    reviewed_by uuid references public.users(id) on delete set null,
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz not null default now()
);

create table if not exists public.stories (
    id bigserial primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    media_type text not null check (media_type in ('image', 'video')),
    media_url text not null,
    caption text,
    status text not null default 'active' check (status in ('active', 'hidden', 'deleted')),
    is_highlighted boolean not null default false,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

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

-- Helpful indexes
create index if not exists idx_places_district on public.places(district_id);
create index if not exists idx_places_category on public.places(category);
create index if not exists idx_reviews_place on public.reviews(place_id);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_place_photo_submissions_place on public.place_photo_submissions(place_id);
create index if not exists idx_place_photo_submissions_status on public.place_photo_submissions(status);
create index if not exists idx_stories_user_created_at on public.stories(user_id, created_at desc);
create index if not exists idx_stories_status_expires_at on public.stories(status, expires_at desc);
create index if not exists idx_story_views_story on public.story_views(story_id);
create index if not exists idx_story_views_viewer on public.story_views(viewer_id);
create index if not exists idx_story_reports_story on public.story_reports(story_id);
create index if not exists idx_story_reports_status on public.story_reports(status);

-- Notifications
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

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

-- Row Level Security (optional but recommended)
alter table public.users enable row level security;
alter table public.districts enable row level security;
alter table public.places enable row level security;
alter table public.restaurant_details enable row level security;
alter table public.stay_details enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.itineraries enable row level security;
alter table public.place_photo_submissions enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.story_reports enable row level security;
alter table public.notifications enable row level security;

-- Example policies (adjust to your needs)
create policy if not exists "Public read districts" on public.districts
    for select using (true);

create policy if not exists "Public read approved places" on public.places
    for select using (approval_status = 'approved');

create policy if not exists "Public read reviews" on public.reviews
    for select using (true);

create policy if not exists "Users manage own favorites" on public.favorites
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users manage own itineraries" on public.itineraries
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users manage own profile" on public.users
    for all using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "Users create photo submissions" on public.place_photo_submissions
    for insert with check (auth.uid() = submitted_by);

create policy if not exists "Users read own photo submissions" on public.place_photo_submissions
    for select using (auth.uid() = submitted_by);

drop policy if exists "Public read active stories" on public.stories;
create policy "Public read active stories" on public.stories
    for select using (status = 'active' and expires_at > now());

drop policy if exists "Users read own stories" on public.stories;
create policy "Users read own stories" on public.stories
    for select using (auth.uid() = user_id);

drop policy if exists "Users create own stories" on public.stories;
create policy "Users create own stories" on public.stories
    for insert with check (auth.uid() = user_id);

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

create policy if not exists "Users can read own notifications" on public.notifications
    for select using (auth.uid() = user_id);

create policy if not exists "Users can update own notifications" on public.notifications
    for update using (auth.uid() = user_id);
