import { supabase } from "../lib/supabase";

export async function recalculateExerciseRecord(
  userId: string,
  exerciseId: string,
) {
  /*
    Récupération de toutes les séries
    de cet exercice appartenant à l'utilisateur
  */

  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      id
    `,
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Erreur récupération sessions :", error);

    return;
  }

  if (!sessions || sessions.length === 0) {
    return;
  }

  const sessionIds = sessions.map((session) => session.id);

  const { data: sets, error: setError } = await supabase
    .from("performed_sets")
    .select(
      `
      weight,
      reps
    `,
    )
    .eq("exercise_id", exerciseId)
    .in("session_id", sessionIds);

  if (setError) {
    console.error("Erreur récupération séries :", setError);

    return;
  }

  if (!sets || sets.length === 0) {
    return;
  }

  /*
    Calcul des records
  */

  let maxWeight = 0;

  let maxReps = 0;

  let maxVolume = 0;

  sets.forEach((set: any) => {
    const weight = Number(set.weight);

    const reps = Number(set.reps);

    const volume = weight * reps;

    if (weight > maxWeight) {
      maxWeight = weight;
    }

    if (reps > maxReps) {
      maxReps = reps;
    }

    if (volume > maxVolume) {
      maxVolume = volume;
    }
  });

  /*
    Vérification existence record
  */

  const { data: existing } = await supabase
    .from("records")
    .select("id")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .limit(1);

  const record = existing?.[0];

  if (record) {
    await supabase
      .from("records")
      .update({
        max_weight: maxWeight,

        max_reps: maxReps,

        max_volume: maxVolume,

        date: new Date().toISOString(),
      })
      .eq("id", record.id);
  } else {
    await supabase.from("records").insert({
      user_id: userId,

      exercise_id: exerciseId,

      max_weight: maxWeight,

      max_reps: maxReps,

      max_volume: maxVolume,

      date: new Date().toISOString(),
    });
  }
}
