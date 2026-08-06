-- Migration pour ajouter les tables nécessaires au modèle Supabase utilisé par l'app
-- Date: 2026-08-05

-- Remarque: ces statements supposent que l'extension pgcrypto ou gen_random_uuid() est disponible.

-- Table pour gérer la séance active (équivalent d'active_workout)
CREATE TABLE IF NOT EXISTS active_workout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  started_at timestamp,
  updated_at timestamp
);

-- Table pour les exercices d'une séance active (équivalent d'active_workout_exercises)
CREATE TABLE IF NOT EXISTS active_workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  "order" integer,
  done boolean DEFAULT false,
  sets jsonb,
  comment text
);

ALTER TABLE active_workout_exercises
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Historique des poids (équivalent de weightHistory)
CREATE TABLE IF NOT EXISTS weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  old_weight numeric,
  new_weight numeric,
  date timestamp DEFAULT now()
);

-- Photos de progression
CREATE TABLE IF NOT EXISTS progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamp DEFAULT now(),
  image text,
  category text,
  note text,
  is_reference boolean DEFAULT false
);

-- Historique simplifié des séances (utilisé dans le code comme workout_history)
CREATE TABLE IF NOT EXISTS workout_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  date timestamp DEFAULT now(),
  volume numeric,
  completed_exercises integer
);

-- Ajout d'une colonne "order" dans workout_exercises pour compatibilité avec le code
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS "order" integer;

-- Si une colonne order_index existe, synchroniser les valeurs existantes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workout_exercises' AND column_name='order_index') THEN
    UPDATE workout_exercises SET "order" = order_index WHERE "order" IS NULL;
  END IF;
END$$;

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_active_workout_workout_id ON active_workout(workout_id);
CREATE INDEX IF NOT EXISTS idx_active_workout_exercises_user_id ON active_workout_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_active_exercises_workout_id ON active_workout_exercises(workout_id);

-- Enable row-level security and owner policies
ALTER TABLE active_workout ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Owner policy active_workout" ON active_workout
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE active_workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Owner policy active_workout_exercises" ON active_workout_exercises
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Owner policy workout_history" ON workout_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_weight_history_exercise_id ON weight_history(exercise_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_workout_id ON workout_history(workout_id);

-- Fin de migration
