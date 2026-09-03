alter table public.food_logs
add column item_quantity numeric;

update public.food_logs
set item_quantity = 1;

alter table public.food_logs
alter column item_quantity set not null,
add constraint food_logs_item_quantity_positive check (item_quantity > 0);
