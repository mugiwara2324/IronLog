import { supabase } from "../lib/supabase";

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  return user;
}

async function getExerciseId(name: string) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id")
    .eq("name", name)
    .single();

  if (error || !data) {
    throw new Error(`Exercice introuvable : ${name}`);
  }

  return data.id;
}

export async function seedProgram(userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser();

  /*
  ============================
  Vérification programme existant
  ============================
  */

  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id);

  if (existing && existing.length > 0) {
    return;
  }

  /*
  ============================
  Création bibliothèque exercices
  ============================
  */

  const exercises = [
    {
      name: "Développé couché haltères",
      muscles: ["Pectoraux", "Triceps", "Épaules"],
      description: "Développé horizontal avec haltères.",
    },

    {
      name: "Développé incliné haltères",
      muscles: ["Pectoraux haut", "Triceps", "Épaules"],
      description: "Accent haut des pectoraux.",
    },

    {
      name: "Développé épaules assis",
      muscles: ["Épaules", "Triceps"],
      description: "Développement vertical.",
    },

    {
      name: "Pec Fly",
      muscles: ["Pectoraux"],
      description: "Isolation pectoraux.",
    },

    {
      name: "Élévations latérales",
      muscles: ["Épaules"],
      description: "Largeur épaules.",
    },

    {
      name: "Extension triceps poulie",
      muscles: ["Triceps"],
      description: "Extension à la poulie.",
    },

    {
      name: "Tirage vertical devant",
      muscles: ["Dos", "Biceps"],
      description: "Tirage vertical.",
    },

    {
      name: "Rowing poulie prise serrée",
      muscles: ["Dos", "Biceps"],
      description: "Tirage horizontal.",
    },

    {
      name: "Curl barre EZ",
      muscles: ["Biceps"],
      description: "Curl barre EZ.",
    },

    {
      name: "Presse",
      muscles: ["Quadriceps", "Fessiers"],
      description: "Presse à cuisses.",
    },

    {
      name: "Leg Curl",
      muscles: ["Ischios"],
      description: "Flexion jambes.",
    },

    {
      name: "Leg Extension",
      muscles: ["Quadriceps"],
      description: "Extension jambes.",
    },

    {
      name: "Pompes classiques",
      muscles: ["Pectoraux", "Triceps"],
      description: "Pompes.",
    },

    {
      name: "Pompes claquées",
      muscles: ["Pectoraux", "Explosivité"],
      description: "Pompes explosives.",
    },
  ];

  const { error: exerciseError } = await supabase
    .from("exercises")
    .upsert(exercises, { onConflict: "name" });

  if (exerciseError) {
    throw exerciseError;
  }

  /*
  ============================
  Création séances
  ============================
  */

  const workouts = [
    {
      user_id: user.id,
      name: "Push",
      day_of_week: 1,
      description: "Pectoraux / Épaules / Triceps",
    },

    {
      user_id: user.id,
      name: "Pull",
      day_of_week: 3,
      description: "Dos / Biceps",
    },

    {
      user_id: user.id,
      name: "Legs",
      day_of_week: 5,
      description: "Jambes / Abdos",
    },

    {
      user_id: user.id,
      name: "PAG Force",
      day_of_week: 2,
      description: "Pompes / Abdos / Gainage",
    },

    {
      user_id: user.id,
      name: "PAG Explosivité",
      day_of_week: 6,
      description: "Explosivité basket",
    },
  ];

  const { data: createdWorkouts, error: workoutError } = await supabase
    .from("workouts")
    .insert(workouts)
    .select();

  if (workoutError) {
    throw workoutError;
  }

  /*
  ============================
  Association exercices
  ============================
  */

  const push = createdWorkouts.find((w) => w.name === "Push");
  const pull = createdWorkouts.find((w) => w.name === "Pull");
  const legs = createdWorkouts.find((w) => w.name === "Legs");
  const pagForce = createdWorkouts.find((w) => w.name === "PAG Force");
  const pagExplosive = createdWorkouts.find(
    (w) => w.name === "PAG Explosivité",
  );

  const links = [
    {
      workout_id: push.id,
      exercise_id: await getExerciseId("Développé couché haltères"),
      order_index: 1,
      sets: 4,
      reps: "8-10",
      weight: 20,
    },

    {
      workout_id: push.id,
      exercise_id: await getExerciseId("Développé incliné haltères"),
      order_index: 2,
      sets: 3,
      reps: "10-12",
      weight: 16,
    },

    {
      workout_id: pull.id,
      exercise_id: await getExerciseId("Tirage vertical devant"),
      order_index: 1,
      sets: 4,
      reps: "8-10",
      weight: 45,
    },

    {
      workout_id: legs.id,
      exercise_id: await getExerciseId("Presse"),
      order_index: 1,
      sets: 4,
      reps: "10",
      weight: 100,
    },

    {
      workout_id: pagForce.id,
      exercise_id: await getExerciseId("Pompes classiques"),
      order_index: 1,
      sets: 3,
      reps: "12-20",
      weight: 0,
    },

    {
      workout_id: pagExplosive.id,
      exercise_id: await getExerciseId("Pompes claquées"),
      order_index: 1,
      sets: 4,
      reps: "5-8",
      weight: 0,
    },
  ];

  const { error: linkError } = await supabase
    .from("workout_exercises")
    .insert(links);

  if (linkError) {
    throw linkError;
  }

  console.log("Programme créé avec succès");
}
