create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null
    or length(trim(display_name)) between 1 and 80
  ),
  date_of_birth date check (
    date_of_birth is null
    or (
      date_of_birth <= current_date
      and date_of_birth >= date '1900-01-01'
    )
  ),
  sex_for_calculation text check (
    sex_for_calculation is null
    or sex_for_calculation in ('male', 'female')
  ),
  height_cm numeric(5, 2) check (
    height_cm is null
    or (
      height_cm > 0
      and height_cm <= 300
    )
  ),
  current_weight_kg numeric(6, 2) check (
    current_weight_kg is null
    or (
      current_weight_kg > 0
      and current_weight_kg <= 1000
    )
  ),
  preferred_unit_system text not null default 'metric' check (
    preferred_unit_system in ('metric', 'imperial')
  ),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in ('lose', 'maintain', 'gain')),
  target_weight_kg numeric(6, 2) check (
    target_weight_kg is null
    or (
      target_weight_kg > 0
      and target_weight_kg <= 1000
    )
  ),
  activity_level text not null check (
    activity_level in (
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active'
    )
  ),
  weekly_rate_kg numeric(4, 2) check (
    weekly_rate_kg is null
    or weekly_rate_kg between -2.00 and 2.00
  ),
  daily_calories integer not null check (
    daily_calories between 500 and 10000
  ),
  protein_g integer not null check (
    protein_g between 0 and 1000
  ),
  carbs_g integer not null check (
    carbs_g between 0 and 1500
  ),
  fat_g integer not null check (
    fat_g between 0 and 1000
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2) not null check (
    weight_kg > 0
    and weight_kg <= 1000
  ),
  body_fat_percentage numeric(5, 2) check (
    body_fat_percentage is null
    or body_fat_percentage between 0 and 100
  ),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_nutrition_goals_updated_at
before update on public.nutrition_goals
for each row
execute function public.set_updated_at();

create index nutrition_goals_user_id_idx
on public.nutrition_goals (user_id);

create index nutrition_goals_user_active_idx
on public.nutrition_goals (user_id, is_active);

create index nutrition_goals_user_created_at_idx
on public.nutrition_goals (user_id, created_at desc);

create unique index nutrition_goals_one_active_per_user_idx
on public.nutrition_goals (user_id)
where is_active;

create index body_metrics_user_id_idx
on public.body_metrics (user_id);

create index body_metrics_user_recorded_at_idx
on public.body_metrics (user_id, recorded_at desc);

alter table public.profiles enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.body_metrics enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Nutrition goals are viewable by owner"
on public.nutrition_goals
for select
to authenticated
using (auth.uid() = user_id);

create policy "Nutrition goals are insertable by owner"
on public.nutrition_goals
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Nutrition goals are updatable by owner"
on public.nutrition_goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Nutrition goals are deletable by owner"
on public.nutrition_goals
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Body metrics are viewable by owner"
on public.body_metrics
for select
to authenticated
using (auth.uid() = user_id);

create policy "Body metrics are insertable by owner"
on public.body_metrics
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Body metrics are updatable by owner"
on public.body_metrics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Body metrics are deletable by owner"
on public.body_metrics
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_auth_user_insert
after insert on auth.users
for each row
execute function public.create_profile_for_auth_user();
