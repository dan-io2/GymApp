alter table public.nutrition_goals
add column target_source text not null default 'recommended' check (
  target_source in ('recommended', 'custom')
);

create or replace function public.replace_active_nutrition_goal(
  p_daily_calories integer,
  p_protein_g integer,
  p_carbs_g integer,
  p_fat_g integer,
  p_target_source text
)
returns table (
  id uuid,
  user_id uuid,
  goal_type text,
  target_weight_kg numeric,
  activity_level text,
  weekly_rate_kg numeric,
  daily_calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  target_source text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous_goal public.nutrition_goals%rowtype;
  v_new_goal public.nutrition_goals%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to update nutrition goals.'
      using errcode = '28000';
  end if;

  if p_daily_calories is null or p_daily_calories < 0 then
    raise exception 'Daily calories must be zero or greater.'
      using errcode = '22023';
  end if;

  if p_protein_g is null or p_protein_g < 0 then
    raise exception 'Protein must be zero or greater.'
      using errcode = '22023';
  end if;

  if p_carbs_g is null or p_carbs_g < 0 then
    raise exception 'Carbohydrates must be zero or greater.'
      using errcode = '22023';
  end if;

  if p_fat_g is null or p_fat_g < 0 then
    raise exception 'Fat must be zero or greater.'
      using errcode = '22023';
  end if;

  if p_target_source not in ('recommended', 'custom') then
    raise exception 'Target source is invalid.'
      using errcode = '22023';
  end if;

  select *
  into v_previous_goal
  from public.nutrition_goals
  where user_id = v_user_id
    and is_active = true
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active nutrition goal was found for the authenticated user.'
      using errcode = 'P0002';
  end if;

  update public.nutrition_goals
  set is_active = false
  where id = v_previous_goal.id;

  insert into public.nutrition_goals (
    user_id,
    goal_type,
    target_weight_kg,
    activity_level,
    weekly_rate_kg,
    daily_calories,
    protein_g,
    carbs_g,
    fat_g,
    target_source,
    is_active
  )
  values (
    v_user_id,
    v_previous_goal.goal_type,
    v_previous_goal.target_weight_kg,
    v_previous_goal.activity_level,
    v_previous_goal.weekly_rate_kg,
    p_daily_calories,
    p_protein_g,
    p_carbs_g,
    p_fat_g,
    p_target_source,
    true
  )
  returning *
  into v_new_goal;

  return query
  select
    v_new_goal.id,
    v_new_goal.user_id,
    v_new_goal.goal_type,
    v_new_goal.target_weight_kg,
    v_new_goal.activity_level,
    v_new_goal.weekly_rate_kg,
    v_new_goal.daily_calories,
    v_new_goal.protein_g,
    v_new_goal.carbs_g,
    v_new_goal.fat_g,
    v_new_goal.target_source,
    v_new_goal.is_active,
    v_new_goal.created_at,
    v_new_goal.updated_at;
end;
$$;

grant execute on function public.replace_active_nutrition_goal(
  integer,
  integer,
  integer,
  integer,
  text
) to authenticated;

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null check (
    source in ('usda', 'open_food_facts', 'user', 'internal')
  ),
  barcode text,
  name text not null check (length(trim(name)) > 0),
  brand text,
  serving_size numeric check (
    serving_size is null
    or serving_size > 0
  ),
  serving_unit text,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null check (protein_g >= 0),
  carbs_g numeric not null check (carbs_g >= 0),
  fat_g numeric not null check (fat_g >= 0),
  fiber_g numeric check (
    fiber_g is null
    or fiber_g >= 0
  ),
  sugar_g numeric check (
    sugar_g is null
    or sugar_g >= 0
  ),
  sodium_mg numeric check (
    sodium_mg is null
    or sodium_mg >= 0
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_foods_created_by_required check (
    source <> 'user'
    or created_by is not null
  )
);

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  meal_type text not null check (
    meal_type in ('breakfast', 'lunch', 'dinner', 'snack')
  ),
  food_name text not null check (length(trim(food_name)) > 0),
  brand text,
  quantity numeric not null check (quantity > 0),
  serving_size numeric check (
    serving_size is null
    or serving_size > 0
  ),
  serving_unit text,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null check (protein_g >= 0),
  carbs_g numeric not null check (carbs_g >= 0),
  fat_g numeric not null check (fat_g >= 0),
  fiber_g numeric check (
    fiber_g is null
    or fiber_g >= 0
  ),
  sugar_g numeric check (
    sugar_g is null
    or sugar_g >= 0
  ),
  sodium_mg numeric check (
    sodium_mg is null
    or sodium_mg >= 0
  ),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger set_foods_updated_at
before update on public.foods
for each row
execute function public.set_updated_at();

create unique index foods_source_external_id_unique_idx
on public.foods (source, external_id)
where external_id is not null;

create index foods_barcode_idx
on public.foods (barcode)
where barcode is not null;

create index foods_name_idx
on public.foods using gin (to_tsvector('simple', name));

create index foods_created_by_idx
on public.foods (created_by)
where created_by is not null;

create index food_logs_user_id_idx
on public.food_logs (user_id);

create index food_logs_user_logged_at_idx
on public.food_logs (user_id, logged_at desc);

create index food_logs_user_meal_logged_at_idx
on public.food_logs (user_id, meal_type, logged_at desc);

alter table public.foods enable row level security;
alter table public.food_logs enable row level security;

create policy "Shared foods are viewable by authenticated users"
on public.foods
for select
to authenticated
using (
  source in ('usda', 'open_food_facts', 'internal')
  or created_by = auth.uid()
);

create policy "Users can insert their own custom foods"
on public.foods
for insert
to authenticated
with check (
  source = 'user'
  and created_by = auth.uid()
);

create policy "Users can update their own custom foods"
on public.foods
for update
to authenticated
using (
  source = 'user'
  and created_by = auth.uid()
)
with check (
  source = 'user'
  and created_by = auth.uid()
);

create policy "Users can delete their own custom foods"
on public.foods
for delete
to authenticated
using (
  source = 'user'
  and created_by = auth.uid()
);

create policy "Food logs are viewable by owner"
on public.food_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Food logs are insertable by owner"
on public.food_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Food logs are updatable by owner"
on public.food_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Food logs are deletable by owner"
on public.food_logs
for delete
to authenticated
using (auth.uid() = user_id);
