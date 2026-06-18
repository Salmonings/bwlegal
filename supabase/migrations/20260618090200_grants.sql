-- Migrations run as the `postgres` role, whose objects don't inherit the
-- default grants that Supabase normally wires up for dashboard-created
-- tables. RLS policies alone don't grant table access — Postgres still
-- requires the base GRANT before RLS gets a chance to filter rows. `anon`
-- is intentionally left without grants: every page/route requires auth.
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- Keep this true for any tables added by future migrations (also run as postgres).
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
