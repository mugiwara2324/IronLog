import { supabase } from "../lib/supabase";

export async function savePerformedSet(
  sessionId: string,
  exerciseId: string,
  weight: number,
  reps: number,
) {
  const { data, error } = await supabase
    .from("performed_sets")
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      weight,
      reps,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
