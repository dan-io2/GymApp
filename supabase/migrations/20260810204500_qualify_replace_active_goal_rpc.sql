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

  select ng.*
  into v_previous_goal
  from public.nutrition_goals as ng
  where ng.user_id = v_user_id
    and ng.is_active = true
  order by ng.created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active nutrition goal was found for the authenticated user.'
      using errcode = 'P0002';
  end if;

  update public.nutrition_goals as ng
  set is_active = false
  where ng.id = v_previous_goal.id;

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
