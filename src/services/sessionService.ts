import { supabase } from "../lib/supabase";

export async function startWorkoutSession(workoutId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_id: workoutId,
      started_at: new Date(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function finishWorkoutSession(
  sessionId: string,
  volume: number,
  completedExercises: number,
) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      finished_at: new Date(),
      volume,
      completed_exercises: completedExercises,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
