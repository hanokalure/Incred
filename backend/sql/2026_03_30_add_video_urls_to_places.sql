alter table if exists public.places
add column if not exists video_urls text[];
