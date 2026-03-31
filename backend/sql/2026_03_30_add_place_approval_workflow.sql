alter table if exists public.places
add column if not exists approval_status text not null default 'approved';

alter table if exists public.places
add column if not exists submitted_by uuid references public.users(id) on delete set null;

alter table if exists public.places
add column if not exists approved_by uuid references public.users(id) on delete set null;

alter table if exists public.places
add column if not exists approved_at timestamptz;

alter table if exists public.places
add column if not exists rejection_reason text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'places_approval_status_check'
    ) then
        alter table public.places
        add constraint places_approval_status_check
        check (approval_status in ('pending', 'approved', 'rejected'));
    end if;
end $$;

update public.places
set approval_status = 'approved'
where approval_status is null;

drop policy if exists "Public read places" on public.places;
drop policy if exists "Public read approved places" on public.places;

create policy "Public read approved places" on public.places
for select using (approval_status = 'approved');
