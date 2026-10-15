-- Keep the exercise catalogue shared, while allowing private user copies.
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_name_unique;

CREATE UNIQUE INDEX IF NOT EXISTS exercises_user_name_unique
  ON public.exercises (user_id, name)
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "Allow insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow select exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can view exercises" ON public.exercises;

CREATE POLICY "Users can view shared and own exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
