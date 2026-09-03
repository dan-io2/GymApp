alter table public.foods
drop constraint if exists foods_source_check;

alter table public.foods
add constraint foods_source_check check (
  source in ('usda', 'open_food_facts', 'fatsecret', 'user', 'internal')
);

drop policy if exists "Shared foods are viewable by authenticated users" on public.foods;

create policy "Shared foods are viewable by authenticated users"
on public.foods
for select
to authenticated
using (
  source in ('usda', 'open_food_facts', 'fatsecret', 'internal')
  or created_by = auth.uid()
);
