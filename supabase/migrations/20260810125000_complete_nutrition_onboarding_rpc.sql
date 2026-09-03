create or replace function public.complete_nutrition_onboarding(
  p_date_of_birth date,
  p_sex_for_calculation text,
  p_height_cm numeric,
  p_current_weight_kg numeric,
  p_preferred_unit_system text,
  p_goal_type text,
  p_target_weight_kg numeric,
  p_activity_level text,
  p_weekly_rate_kg numeric,
  p_daily_calories integer,
  p_protein_g integer,
  p_carbs_g integer,
  p_fat_g integer
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated_profiles integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to complete onboarding.'
      using errcode = '28000';
  end if;

  if p_date_of_birth is null or p_date_of_birth > current_date or p_date_of_birth < date '1900-01-01' then
    raise exception 'Date of birth is invalid.'
      using errcode = '22008';
  end if;

  if p_sex_for_calculation not in ('male', 'female') then
    raise exception 'Sex for calculation is invalid.'
      using errcode = '22023';
  end if;

  if p_preferred_unit_system not in ('imperial', 'metric') then
    raise exception 'Preferred unit system is invalid.'
      using errcode = '22023';
  end if;

  if p_goal_type not in ('lose', 'maintain', 'gain') then
    raise exception 'Goal type is invalid.'
      using errcode = '22023';
  end if;

  if p_activity_level not in (
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extremely_active'
  ) then
    raise exception 'Activity level is invalid.'
      using errcode = '22023';
  end if;

  update public.profiles
  set
    date_of_birth = p_date_of_birth,
    sex_for_calculation = p_sex_for_calculation,
    height_cm = p_height_cm,
    current_weight_kg = p_current_weight_kg,
    preferred_unit_system = p_preferred_unit_system,
    onboarding_completed = true
  where id = v_user_id;

  get diagnostics v_updated_profiles = row_count;

  if v_updated_profiles <> 1 then
    raise exception 'Profile row was not found for the authenticated user.'
      using errcode = 'P0002';
  end if;

  update public.nutrition_goals
  set is_active = false
  where user_id = v_user_id
    and is_active = true;

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
    is_active
  )
  values (
    v_user_id,
    p_goal_type,
    p_target_weight_kg,
    p_activity_level,
    p_weekly_rate_kg,
    p_daily_calories,
    p_protein_g,
    p_carbs_g,
    p_fat_g,
    true
  );

  insert into public.body_metrics (user_id, weight_kg)
  select v_user_id, p_current_weight_kg
  where not exists (
    select 1
    from public.body_metrics
    where user_id = v_user_id
      and weight_kg = p_current_weight_kg
      and recorded_at >= date_trunc('day', now())
      and recorded_at < date_trunc('day', now()) + interval '1 day'
  );
end;
$$;

grant execute on function public.complete_nutrition_onboarding(
  date,
  text,
  numeric,
  numeric,
  text,
  text,
  numeric,
  text,
  numeric,
  integer,
  integer,
  integer,
  integer
) to authenticated;
