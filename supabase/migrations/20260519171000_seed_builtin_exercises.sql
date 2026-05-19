insert into public.exercises (id, user_id, name, category, muscle_groups)
values
  ('bench-press', null, 'Bench Press', 'Chest', '["Chest", "Triceps", "Shoulders"]'::jsonb),
  ('incline-dumbbell-press', null, 'Incline Dumbbell Press', 'Chest', '["Upper Chest", "Shoulders", "Triceps"]'::jsonb),
  ('barbell-squat', null, 'Barbell Squat', 'Legs', '["Quadriceps", "Glutes", "Hamstrings"]'::jsonb),
  ('romanian-deadlift', null, 'Romanian Deadlift', 'Legs', '["Hamstrings", "Glutes", "Lower Back"]'::jsonb),
  ('leg-press', null, 'Leg Press', 'Legs', '["Quadriceps", "Glutes"]'::jsonb),
  ('hip-thrust', null, 'Hip Thrust', 'Legs', '["Glutes", "Hamstrings"]'::jsonb),
  ('deadlift', null, 'Deadlift', 'Back', '["Back", "Glutes", "Hamstrings"]'::jsonb),
  ('barbell-row', null, 'Barbell Row', 'Back', '["Back", "Biceps"]'::jsonb),
  ('pull-ups', null, 'Pull-Ups', 'Back', '["Lats", "Biceps", "Upper Back"]'::jsonb),
  ('lat-pulldown', null, 'Lat Pulldown', 'Back', '["Lats", "Biceps"]'::jsonb),
  ('overhead-press', null, 'Overhead Press', 'Shoulders', '["Shoulders", "Triceps"]'::jsonb),
  ('lateral-raise', null, 'Lateral Raise', 'Shoulders', '["Side Delts"]'::jsonb),
  ('barbell-curl', null, 'Barbell Curl', 'Arms', '["Biceps"]'::jsonb),
  ('tricep-pushdown', null, 'Tricep Pushdown', 'Arms', '["Triceps"]'::jsonb),
  ('hammer-curl', null, 'Hammer Curl', 'Arms', '["Biceps", "Forearms"]'::jsonb),
  ('plank', null, 'Plank', 'Core', '["Core", "Shoulders"]'::jsonb),
  ('hanging-leg-raise', null, 'Hanging Leg Raise', 'Core', '["Core", "Hip Flexors"]'::jsonb),
  ('kettlebell-swing', null, 'Kettlebell Swing', 'Full Body', '["Glutes", "Hamstrings", "Core", "Shoulders"]'::jsonb),
  ('running', null, 'Running', 'Cardio', '["Legs", "Cardiovascular"]'::jsonb)
on conflict (id) do update
set
  user_id = excluded.user_id,
  name = excluded.name,
  category = excluded.category,
  muscle_groups = excluded.muscle_groups;
