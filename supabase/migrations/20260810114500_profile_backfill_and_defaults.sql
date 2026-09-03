alter table public.profiles
alter column preferred_unit_system set default 'imperial';

insert into public.profiles (id)
select users.id
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;
