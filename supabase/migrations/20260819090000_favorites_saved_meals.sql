create table public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_foods_user_food_unique unique (user_id, food_id)
);

create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (
    length(trim(name)) between 1 and 80
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_meal_items (
  id uuid primary key default gen_random_uuid(),
  saved_meal_id uuid not null references public.saved_meals(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null check (length(trim(food_name)) > 0),
  brand text,
  quantity numeric not null check (quantity > 0),
  item_quantity numeric not null default 1 check (item_quantity > 0),
  portion_amount numeric not null check (portion_amount > 0),
  portion_unit text not null check (length(trim(portion_unit)) > 0),
  serving_equivalent numeric not null check (serving_equivalent > 0),
  serving_size numeric check (
    serving_size is null
    or serving_size > 0
  ),
  serving_unit text,
  serving_calories numeric not null check (serving_calories >= 0),
  serving_protein_g numeric not null check (serving_protein_g >= 0),
  serving_carbs_g numeric not null check (serving_carbs_g >= 0),
  serving_fat_g numeric not null check (serving_fat_g >= 0),
  serving_fiber_g numeric check (
    serving_fiber_g is null
    or serving_fiber_g >= 0
  ),
  serving_sugar_g numeric check (
    serving_sugar_g is null
    or serving_sugar_g >= 0
  ),
  serving_sodium_mg numeric check (
    serving_sodium_mg is null
    or serving_sodium_mg >= 0
  ),
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
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create trigger set_saved_meals_updated_at
before update on public.saved_meals
for each row
execute function public.set_updated_at();

create index favorite_foods_user_id_idx
on public.favorite_foods (user_id);

create index favorite_foods_food_id_idx
on public.favorite_foods (food_id);

create index saved_meals_user_id_idx
on public.saved_meals (user_id);

create index saved_meal_items_saved_meal_id_idx
on public.saved_meal_items (saved_meal_id, sort_order);

alter table public.favorite_foods enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_meal_items enable row level security;

create policy "Favorite foods are viewable by owner"
on public.favorite_foods
for select
to authenticated
using (auth.uid() = user_id);

create policy "Favorite foods are insertable by owner"
on public.favorite_foods
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Favorite foods are deletable by owner"
on public.favorite_foods
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Saved meals are viewable by owner"
on public.saved_meals
for select
to authenticated
using (auth.uid() = user_id);

create policy "Saved meals are insertable by owner"
on public.saved_meals
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Saved meals are updatable by owner"
on public.saved_meals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Saved meals are deletable by owner"
on public.saved_meals
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Saved meal items are viewable through owned meal"
on public.saved_meal_items
for select
to authenticated
using (
  exists (
    select 1
    from public.saved_meals
    where saved_meals.id = saved_meal_items.saved_meal_id
      and saved_meals.user_id = auth.uid()
  )
);

create policy "Saved meal items are insertable through owned meal"
on public.saved_meal_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.saved_meals
    where saved_meals.id = saved_meal_items.saved_meal_id
      and saved_meals.user_id = auth.uid()
  )
);

create policy "Saved meal items are updatable through owned meal"
on public.saved_meal_items
for update
to authenticated
using (
  exists (
    select 1
    from public.saved_meals
    where saved_meals.id = saved_meal_items.saved_meal_id
      and saved_meals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.saved_meals
    where saved_meals.id = saved_meal_items.saved_meal_id
      and saved_meals.user_id = auth.uid()
  )
);

create policy "Saved meal items are deletable through owned meal"
on public.saved_meal_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.saved_meals
    where saved_meals.id = saved_meal_items.saved_meal_id
      and saved_meals.user_id = auth.uid()
  )
);

create or replace function public.log_saved_meal(
  p_saved_meal_id uuid,
  p_meal_type text,
  p_multiplier numeric default 1
)
returns setof public.food_logs
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_meal_type not in ('breakfast', 'lunch', 'dinner', 'snack') then
    raise exception 'Invalid meal type';
  end if;

  if p_multiplier not in (0.5, 1, 2) then
    raise exception 'Invalid meal multiplier';
  end if;

  if not exists (
    select 1
    from public.saved_meals
    where id = p_saved_meal_id
      and user_id = auth.uid()
  ) then
    raise exception 'Saved meal not found';
  end if;

  return query
  insert into public.food_logs (
    user_id,
    food_id,
    meal_type,
    food_name,
    brand,
    quantity,
    item_quantity,
    portion_amount,
    portion_unit,
    serving_equivalent,
    serving_size,
    serving_unit,
    serving_calories,
    serving_protein_g,
    serving_carbs_g,
    serving_fat_g,
    serving_fiber_g,
    serving_sugar_g,
    serving_sodium_mg,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g,
    sugar_g,
    sodium_mg
  )
  select
    saved_meals.user_id,
    saved_meal_items.food_id,
    p_meal_type,
    saved_meal_items.food_name,
    saved_meal_items.brand,
    saved_meal_items.quantity * p_multiplier,
    saved_meal_items.item_quantity * p_multiplier,
    saved_meal_items.portion_amount,
    saved_meal_items.portion_unit,
    saved_meal_items.serving_equivalent * p_multiplier,
    saved_meal_items.serving_size,
    saved_meal_items.serving_unit,
    saved_meal_items.serving_calories,
    saved_meal_items.serving_protein_g,
    saved_meal_items.serving_carbs_g,
    saved_meal_items.serving_fat_g,
    saved_meal_items.serving_fiber_g,
    saved_meal_items.serving_sugar_g,
    saved_meal_items.serving_sodium_mg,
    saved_meal_items.calories * p_multiplier,
    saved_meal_items.protein_g * p_multiplier,
    saved_meal_items.carbs_g * p_multiplier,
    saved_meal_items.fat_g * p_multiplier,
    saved_meal_items.fiber_g * p_multiplier,
    saved_meal_items.sugar_g * p_multiplier,
    saved_meal_items.sodium_mg * p_multiplier
  from public.saved_meals
  join public.saved_meal_items
    on saved_meal_items.saved_meal_id = saved_meals.id
  where saved_meals.id = p_saved_meal_id
    and saved_meals.user_id = auth.uid()
  order by saved_meal_items.sort_order;
end;
$$;

grant execute on function public.log_saved_meal(uuid, text, numeric) to authenticated;
