-- Auto-create a profiles row whenever a user is created in auth.users.
-- The admin user-creation flow (admin API, used by /settings and the seed
-- script) passes full_name/role/branch_id via user_metadata; this trigger
-- keeps profiles in sync without a second round-trip from the client.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'branch_manager'),
    (new.raw_user_meta_data ->> 'branch_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
