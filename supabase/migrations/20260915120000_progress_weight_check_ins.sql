alter table public.body_metrics
add column local_date date,
add column updated_at timestamptz not null default now();

update public.body_metrics
set local_date = recorded_at::date
where local_date is null;

-- Keep the latest historical record when legacy data contains more than one
-- check-in on the same UTC-derived calendar date.
delete from public.body_metrics older
using public.body_metrics newer
where older.user_id = newer.user_id
  and older.local_date = newer.local_date
  and (
    older.recorded_at < newer.recorded_at
    or (older.recorded_at = newer.recorded_at and older.id < newer.id)
  );

alter table public.body_metrics
alter column local_date set default current_date,
alter column local_date set not null;

create unique index body_metrics_user_local_date_unique_idx
on public.body_metrics (user_id, local_date);

create index body_metrics_user_local_date_desc_idx
on public.body_metrics (user_id, local_date desc);

create trigger set_body_metrics_updated_at
before update on public.body_metrics
for each row
execute function public.set_updated_at();

create or replace function public.upsert_weight_check_in(
  p_weight_kg numeric,
  p_local_date date,
  p_recorded_at timestamptz
)
returns public.body_metrics
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_check_in public.body_metrics;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_weight_kg is null or p_weight_kg <= 0 or p_weight_kg > 1000 then
    raise exception 'Weight must be between 0 and 1000 kilograms.' using errcode = '22023';
  end if;

  if p_local_date is null or p_recorded_at is null then
    raise exception 'A local date and recorded timestamp are required.' using errcode = '22023';
  end if;

  insert into public.body_metrics (
    user_id,
    weight_kg,
    local_date,
    recorded_at
  )
  values (
    v_user_id,
    round(p_weight_kg, 2),
    p_local_date,
    p_recorded_at
  )
  on conflict (user_id, local_date)
  do update set
    weight_kg = excluded.weight_kg,
    recorded_at = excluded.recorded_at
  returning * into v_check_in;

  update public.profiles
  set current_weight_kg = v_check_in.weight_kg
  where id = v_user_id;

  return v_check_in;
end;
$$;

grant execute on function public.upsert_weight_check_in(numeric, date, timestamptz)
to authenticated;
