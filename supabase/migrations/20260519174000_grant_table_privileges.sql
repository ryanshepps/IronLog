-- Table-level privileges for the PostgREST API roles.
--
-- The RLS policies in 20260519172000_rls_policies.sql gate row access,
-- but Row Level Security is only consulted once a role already holds
-- table privileges. Without an explicit GRANT every API role — both
-- service_role and authenticated — gets "permission denied" (42501).
--
-- service_role bypasses RLS (admin / one-off import tooling).
-- authenticated is additionally gated per-row by the RLS policies.
-- anon receives no table privileges: it has no RLS policy on any
-- user-owned table and must stay fully denied.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  public.profiles,
  public.exercises,
  public.workouts,
  public.favorites,
  public.exercise_history
  to authenticated, service_role;
