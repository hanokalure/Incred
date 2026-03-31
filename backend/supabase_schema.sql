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

-- Users profile table
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    name text,
    role text not null default 'user',
    created_at timestamptz not null default now()
);

-- Districts
create table if not exists public.districts (
    id bigserial primary key,
    name text not null unique,
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

-- Helpful indexes
create index if not exists idx_places_district on public.places(district_id);
create index if not exists idx_places_category on public.places(category);
create index if not exists idx_reviews_place on public.reviews(place_id);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_place_photo_submissions_place on public.place_photo_submissions(place_id);
create index if not exists idx_place_photo_submissions_status on public.place_photo_submissions(status);

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
