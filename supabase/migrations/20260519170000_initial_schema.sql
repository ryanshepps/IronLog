create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default 'Athlete',
  units text not null default 'lbs' check (units in ('kg', 'lbs')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  muscle_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create unique index exercises_user_name_unique
  on public.exercises (user_id, lower(name))
  where user_id is not null;

create unique index exercises_builtin_name_unique
  on public.exercises (lower(name))
  where user_id is null;

create table public.workouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  exercises jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts (user_id, date desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table public.exercise_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  last_weight integer not null default 0,
  last_reps integer not null default 0,
  last_feeling integer not null default 5 check (last_feeling between 1 and 10),
  last_performed timestamptz,
  personal_record integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

create trigger exercise_history_set_updated_at
before update on public.exercise_history
for each row execute function public.set_updated_at();
