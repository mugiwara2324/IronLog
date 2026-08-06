import { supabase } from "../lib/supabase";

// ===============================
// Récupérer les séances utilisateur
// ===============================

export async function getWorkouts() {
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
        *,
        exercises(*)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("day_of_week");

  if (error) {
    throw error;
  }

  return data;
}

// ===============================
// Récupérer une séance précise
// ===============================

export async function getWorkout(id: string) {
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
        *,
        exercises(*)
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ===============================
// Créer une séance
// ===============================

export async function createWorkout(workout: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,

      name: workout.name,

      day_of_week: workout.day_of_week,

      description: workout.description,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ===============================
// Modifier une séance
// ===============================

export async function updateWorkout(id: string, workout: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("workouts")
    .update(workout)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ===============================
// Supprimer une séance
// ===============================

export async function deleteWorkout(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}
