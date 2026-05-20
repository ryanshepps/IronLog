alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.favorites enable row level security;
alter table public.exercise_history enable row level security;

alter table public.exercises alter column user_id set default auth.uid();
alter table public.workouts alter column user_id set default auth.uid();
alter table public.favorites alter column user_id set default auth.uid();
alter table public.exercise_history alter column user_id set default auth.uid();

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "exercises_select_builtin_or_own"
on public.exercises for select
to authenticated
using (user_id is null or user_id = auth.uid());

create policy "exercises_insert_own"
on public.exercises for insert
to authenticated
with check (user_id = auth.uid());

create policy "exercises_update_own"
on public.exercises for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "exercises_delete_own"
on public.exercises for delete
to authenticated
using (user_id = auth.uid());

create policy "workouts_select_own"
on public.workouts for select
to authenticated
using (user_id = auth.uid());

create policy "workouts_insert_own"
on public.workouts for insert
to authenticated
with check (user_id = auth.uid());

create policy "workouts_update_own"
on public.workouts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "workouts_delete_own"
on public.workouts for delete
to authenticated
using (user_id = auth.uid());

create policy "favorites_select_own"
on public.favorites for select
to authenticated
using (user_id = auth.uid());

create policy "favorites_insert_own"
on public.favorites for insert
to authenticated
with check (user_id = auth.uid());

create policy "favorites_delete_own"
on public.favorites for delete
to authenticated
using (user_id = auth.uid());

create policy "exercise_history_select_own"
on public.exercise_history for select
to authenticated
using (user_id = auth.uid());

create policy "exercise_history_insert_own"
on public.exercise_history for insert
to authenticated
with check (user_id = auth.uid());

create policy "exercise_history_update_own"
on public.exercise_history for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "exercise_history_delete_own"
on public.exercise_history for delete
to authenticated
using (user_id = auth.uid());
