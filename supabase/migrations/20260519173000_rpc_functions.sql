create or replace function public.rename_exercise(exercise_id text, new_name text)
returns public.exercises
language plpgsql
set search_path = public
as $$
declare
  renamed public.exercises;
begin
  if auth.uid() is null then
    raise exception 'authenticated user required';
  end if;

  if length(trim(new_name)) = 0 then
    raise exception 'exercise name required';
  end if;

  update public.exercises
  set name = trim(new_name)
  where exercises.id = rename_exercise.exercise_id
    and exercises.user_id = auth.uid()
  returning * into renamed;

  if renamed.id is null then
    raise exception 'custom exercise not found';
  end if;

  update public.exercise_history
  set exercise_name = renamed.name
  where user_id = auth.uid()
    and exercise_history.exercise_id = rename_exercise.exercise_id;

  update public.workouts
  set exercises = coalesce(
    (
      select jsonb_agg(
        case
          when item.exercise ->> 'exerciseId' = rename_exercise.exercise_id
            then jsonb_set(item.exercise, '{exerciseName}', to_jsonb(renamed.name), true)
          else item.exercise
        end
        order by item.ordinality
      )
      from jsonb_array_elements(workouts.exercises) with ordinality as item(exercise, ordinality)
    ),
    '[]'::jsonb
  )
  where user_id = auth.uid()
    and exists (
      select 1
      from jsonb_array_elements(workouts.exercises) as item(exercise)
      where item.exercise ->> 'exerciseId' = rename_exercise.exercise_id
    );

  return renamed;
end;
$$;

create or replace function public.delete_custom_exercise(exercise_id text)
returns void
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authenticated user required';
  end if;

  delete from public.favorites
  where user_id = auth.uid()
    and favorites.exercise_id = delete_custom_exercise.exercise_id;

  delete from public.exercise_history
  where user_id = auth.uid()
    and exercise_history.exercise_id = delete_custom_exercise.exercise_id;

  delete from public.exercises
  where exercises.id = delete_custom_exercise.exercise_id
    and exercises.user_id = auth.uid();
end;
$$;

revoke all on function public.rename_exercise(text, text) from public;
revoke all on function public.delete_custom_exercise(text) from public;
grant execute on function public.rename_exercise(text, text) to authenticated;
grant execute on function public.delete_custom_exercise(text) to authenticated;
