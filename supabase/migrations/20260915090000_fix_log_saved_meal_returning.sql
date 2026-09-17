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
  order by saved_meal_items.sort_order
  returning food_logs.*;
end;
$$;

grant execute on function public.log_saved_meal(uuid, text, numeric) to authenticated;
