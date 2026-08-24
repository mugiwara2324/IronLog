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
        order,
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
    (a: any, b: any) =>
      Number(a.order ?? a.order_index ?? 0) -
      Number(b.order ?? b.order_index ?? 0),
  );

  return data;
}
