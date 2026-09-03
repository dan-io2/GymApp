alter table public.food_logs
add column serving_calories numeric,
add column serving_protein_g numeric,
add column serving_carbs_g numeric,
add column serving_fat_g numeric,
add column serving_fiber_g numeric,
add column serving_sugar_g numeric,
add column serving_sodium_mg numeric;

update public.food_logs
set
  serving_calories = calories / quantity,
  serving_protein_g = protein_g / quantity,
  serving_carbs_g = carbs_g / quantity,
  serving_fat_g = fat_g / quantity,
  serving_fiber_g = case
    when fiber_g is null then null
    else fiber_g / quantity
  end,
  serving_sugar_g = case
    when sugar_g is null then null
    else sugar_g / quantity
  end,
  serving_sodium_mg = case
    when sodium_mg is null then null
    else sodium_mg / quantity
  end;

alter table public.food_logs
alter column serving_calories set not null,
alter column serving_protein_g set not null,
alter column serving_carbs_g set not null,
alter column serving_fat_g set not null,
add constraint food_logs_serving_calories_non_negative check (serving_calories >= 0),
add constraint food_logs_serving_protein_g_non_negative check (serving_protein_g >= 0),
add constraint food_logs_serving_carbs_g_non_negative check (serving_carbs_g >= 0),
add constraint food_logs_serving_fat_g_non_negative check (serving_fat_g >= 0),
add constraint food_logs_serving_fiber_g_non_negative check (
  serving_fiber_g is null
  or serving_fiber_g >= 0
),
add constraint food_logs_serving_sugar_g_non_negative check (
  serving_sugar_g is null
  or serving_sugar_g >= 0
),
add constraint food_logs_serving_sodium_mg_non_negative check (
  serving_sodium_mg is null
  or serving_sodium_mg >= 0
);
