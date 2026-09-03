alter table public.food_logs
add column portion_amount numeric,
add column portion_unit text,
add column serving_equivalent numeric;

update public.food_logs
set
  portion_amount = quantity,
  portion_unit = 'serving',
  serving_equivalent = quantity;

alter table public.food_logs
alter column portion_amount set not null,
alter column portion_unit set not null,
alter column serving_equivalent set not null,
add constraint food_logs_portion_amount_positive check (portion_amount > 0),
add constraint food_logs_portion_unit_not_empty check (length(trim(portion_unit)) > 0),
add constraint food_logs_serving_equivalent_positive check (serving_equivalent > 0);
