ALTER TABLE public.workout_exercises
  ADD COLUMN volume_multiplier smallint NOT NULL DEFAULT 1
  CHECK (volume_multiplier IN (1, 2));

ALTER TABLE public.performed_sets
  ADD COLUMN volume_multiplier smallint NOT NULL DEFAULT 1
  CHECK (volume_multiplier IN (1, 2));

-- Exercises whose programmed name explicitly identifies dumbbells count each
-- side/implement in the total volume by default. Unilateral machine exercises
-- can be marked manually in the workout editor.
UPDATE public.workout_exercises AS planned
SET volume_multiplier = 2
FROM public.exercises AS exercise
WHERE exercise.id = planned.exercise_id
  AND (exercise.name ILIKE '%haltère%' OR exercise.name ILIKE '%dumbbell%');

-- Backfill completed sets from the owning user's current workout template.
UPDATE public.performed_sets AS performed
SET volume_multiplier = COALESCE((
  SELECT MAX(planned.volume_multiplier)
  FROM public.workout_sessions AS session
  JOIN public.workout_exercises AS planned
    ON planned.workout_id = session.workout_id
   AND planned.exercise_id = performed.exercise_id
  WHERE session.id = performed.session_id
), 1);

UPDATE public.workout_sessions AS session
SET volume = COALESCE((
  SELECT SUM(performed.weight * performed.reps * performed.volume_multiplier)
  FROM public.performed_sets AS performed
  WHERE performed.session_id = session.id
), 0);

UPDATE public.records AS record
SET max_volume = COALESCE((
  SELECT MAX(performed.weight * performed.reps * performed.volume_multiplier)
  FROM public.workout_sessions AS session
  JOIN public.performed_sets AS performed ON performed.session_id = session.id
  WHERE session.user_id = record.user_id
    AND performed.exercise_id = record.exercise_id
), 0);
