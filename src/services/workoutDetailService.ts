import { supabase } from "../lib/supabase";

export async function getWorkoutDetails(workoutId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      *,
      workout_exercises(
        id,
        sets,
        reps,
        weight,
        order_index,
        exercises(
          id,
          name,
          description,
          muscles
        )
      )
    `,
    )
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  data.workout_exercises.sort(
    (a: any, b: any) => a.order_index - b.order_index,
  );

  return data;
}
