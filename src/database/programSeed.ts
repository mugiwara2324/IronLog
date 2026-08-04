import { db } from "./db";

export async function seedProgram() {
  const existing = await db.workouts.count();

  if (existing > 0) {
    return;
  }

  await db.exercises.bulkAdd([
    {
      name: "Développé couché haltères",
      muscles: ["Pectoraux", "Triceps", "Deltoïde antérieur"],
      description: "Développé horizontal avec haltères.",
      createdAt: new Date(),
    },

    {
      name: "Développé incliné haltères",
      muscles: ["Pectoraux haut", "Triceps", "Épaules"],
      description: "Accent sur le haut des pectoraux.",
      createdAt: new Date(),
    },

    {
      name: "Développé épaules assis",
      muscles: ["Deltoïdes", "Triceps"],
      description: "Développement vertical des épaules.",
      createdAt: new Date(),
    },

    {
      name: "Pec Fly",
      muscles: ["Pectoraux"],
      description: "Isolation des pectoraux.",
      createdAt: new Date(),
    },

    {
      name: "Élévations latérales",
      muscles: ["Deltoïde moyen"],
      description: "Isolation largeur d'épaule.",
      createdAt: new Date(),
    },

    {
      name: "Extension triceps à la poulie",
      muscles: ["Triceps"],
      description: "Extension verticale à la poulie.",
      createdAt: new Date(),
    },

    {
      name: "Extension triceps un bras",
      muscles: ["Triceps"],
      description: "Travail unilatéral du triceps.",
      createdAt: new Date(),
    },

    {
      name: "Tirage vertical devant",
      muscles: ["Grand dorsal", "Biceps"],
      description: "Tirage vertical vers la poitrine.",
      createdAt: new Date(),
    },

    {
      name: "Rowing poulie prise serrée",
      muscles: ["Dos", "Biceps"],
      description: "Tirage horizontal pour l'épaisseur du dos.",
      createdAt: new Date(),
    },

    {
      name: "Rowing haltères",
      muscles: ["Grand dorsal", "Trapèzes"],
      description: "Rowing unilatéral haltère.",
      createdAt: new Date(),
    },

    {
      name: "Pull-over",
      muscles: ["Grand dorsal", "Pectoraux"],
      description: "Extension des bras avec haltère.",
      createdAt: new Date(),
    },

    {
      name: "Rear Delt",
      muscles: ["Deltoïde arrière"],
      description: "Isolation arrière d'épaule.",
      createdAt: new Date(),
    },

    {
      name: "Curl barre EZ",
      muscles: ["Biceps"],
      description: "Flexion du coude avec barre EZ.",
      createdAt: new Date(),
    },

    {
      name: "Curl poulie",
      muscles: ["Biceps"],
      description: "Curl en tension continue.",
      createdAt: new Date(),
    },

    {
      name: "Avant-bras barre",
      muscles: ["Avant-bras"],
      description: "Flexion des poignets barre.",
      createdAt: new Date(),
    },

    {
      name: "Avant-bras prise marteau",
      muscles: ["Avant-bras"],
      description: "Renforcement des avant-bras.",
      createdAt: new Date(),
    },

    {
      name: "Presse",
      muscles: ["Quadriceps", "Fessiers", "Ischio"],
      description: "Presse à cuisses.",
      createdAt: new Date(),
    },

    {
      name: "Leg Curl",
      muscles: ["Ischio-jambiers"],
      description: "Flexion des jambes.",
      createdAt: new Date(),
    },

    {
      name: "Leg Extension",
      muscles: ["Quadriceps"],
      description: "Extension des jambes.",
      createdAt: new Date(),
    },

    {
      name: "Crunch machine",
      muscles: ["Abdominaux"],
      description: "Flexion du buste avec charge.",
      createdAt: new Date(),
    },

    {
      name: "Hip Abduction",
      muscles: ["Fessiers"],
      description: "Abduction de hanche.",
      createdAt: new Date(),
    },

    {
      name: "Hip Adduction",
      muscles: ["Adducteurs"],
      description: "Adduction de hanche.",
      createdAt: new Date(),
    },

    {
      name: "Mollets",
      muscles: ["Mollets"],
      description: "Extension de cheville.",
      createdAt: new Date(),
    },

    {
      name: "Pompes classiques",
      muscles: ["Pectoraux", "Triceps"],
      description: "Pompes classiques au poids du corps.",
      createdAt: new Date(),
    },

    {
      name: "Pompes diamant",
      muscles: ["Triceps", "Pectoraux"],
      description: "Pompes avec prise serrée.",
      createdAt: new Date(),
    },

    {
      name: "Pompes piquées",
      muscles: ["Épaules", "Triceps"],
      description: "Variante orientée épaules.",
      createdAt: new Date(),
    },

    {
      name: "Crucifix Crunch",
      muscles: ["Abdominaux"],
      description: "Crunch avec ouverture des bras.",
      createdAt: new Date(),
    },

    {
      name: "Relevés de jambes",
      muscles: ["Abdominaux"],
      description: "Montée de jambes contrôlée.",
      createdAt: new Date(),
    },

    {
      name: "Gainage face",
      muscles: ["Abdominaux", "Gainage"],
      description: "Maintien isométrique.",
      createdAt: new Date(),
    },

    {
      name: "Gainage latéral",
      muscles: ["Obliques", "Gainage"],
      description: "Gainage latéral.",
      createdAt: new Date(),
    },

    {
      name: "Pompes claquées",
      muscles: ["Pectoraux", "Explosivité"],
      description: "Pompes explosives.",
      createdAt: new Date(),
    },

    {
      name: "Pompes archers",
      muscles: ["Pectoraux", "Triceps"],
      description: "Pompes unilatérales.",
      createdAt: new Date(),
    },

    {
      name: "Pompes déclinées",
      muscles: ["Pectoraux haut", "Épaules"],
      description: "Pompes pieds surélevés.",
      createdAt: new Date(),
    },

    {
      name: "Relevés de planche latérale",
      muscles: ["Obliques"],
      description: "Travail dynamique du gainage.",
      createdAt: new Date(),
    },

    {
      name: "Gainage dos",
      muscles: ["Chaîne postérieure"],
      description: "Renforcement du dos en isométrie.",
      createdAt: new Date(),
    },
  ]);

  const getExerciseId = async (name: string) => {
    const exercise = await db.exercises.where("name").equals(name).first();

    if (!exercise?.id) {
      throw new Error(`Exercice introuvable : ${name}`);
    }

    return exercise.id;
  };

  const pushId = await db.workouts.add({
    name: "Push (Pectoraux / Épaules / Triceps)",

    day: "Lundi",

    description: "Pectoraux / Épaules / Triceps",
  });

  const pullId = await db.workouts.add({
    name: "Pull (Dos / Arrière épaule / Biceps / Avant-bras)",

    day: "Mercredi",

    description: "Dos / Arrière épaule / Biceps / Avant-bras",
  });

  const legsId = await db.workouts.add({
    name: "Legs (Jambes / Abdos)",

    day: "Vendredi",

    description: "Jambes / Abdos",
  });

  const pagAId = await db.workouts.add({
    name: "PAG - Séance A (Force / Renforcement)",

    day: "Mardi",

    description: "Pompes / Abdos / Gainage - Force",
  });

  const pagBId = await db.workouts.add({
    name: "PAG - Séance B (Explosivité)",

    day: "Samedi",

    description: "Pompes / Abdos / Gainage - Explosivité",
  });

  await db.workoutExercises.bulkAdd([
    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Développé couché haltères"),

      order: 1,

      sets: 4,

      reps: "8-10",

      weight: 20,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Développé incliné haltères"),

      order: 2,

      sets: 3,

      reps: "10-12",

      weight: 16,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Développé épaules assis"),

      order: 3,

      sets: 3,

      reps: "8-10",

      weight: 14,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Pec Fly"),

      order: 4,

      sets: 3,

      reps: "12-15",

      weight: 45,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Élévations latérales"),

      order: 5,

      sets: 3,

      reps: "15",

      weight: 8,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Extension triceps à la poulie"),

      order: 6,

      sets: 3,

      reps: "10-12",

      weight: 15.8,
    },

    {
      workoutId: pushId,

      exerciseId: await getExerciseId("Extension triceps un bras"),

      order: 7,

      sets: 2,

      reps: "12-15",

      weight: 6.8,
    },
  ]);

  await db.workoutExercises.bulkAdd([
    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Tirage vertical devant"),

      order: 1,

      sets: 4,

      reps: "8-10",

      weight: 45,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Rowing poulie prise serrée"),

      order: 2,

      sets: 3,

      reps: "10",

      weight: 45,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Rowing haltères"),

      order: 3,

      sets: 3,

      reps: "10-12",

      weight: 12,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Pull-over"),

      order: 4,

      sets: 3,

      reps: "12",

      weight: 10,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Rear Delt"),

      order: 5,

      sets: 3,

      reps: "15",

      weight: 25,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Curl barre EZ"),

      order: 6,

      sets: 3,

      reps: "10-12",

      weight: 20,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Curl poulie"),

      order: 7,

      sets: 2,

      reps: "12-15",

      weight: 11.3,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Avant-bras barre"),

      order: 8,

      sets: 2,

      reps: "10-12",

      weight: 30,
    },

    {
      workoutId: pullId,

      exerciseId: await getExerciseId("Avant-bras prise marteau"),

      order: 9,

      sets: 2,

      reps: "10-12",

      weight: 10,
    },
  ]);

  await db.workoutExercises.bulkAdd([
    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Presse"),

      order: 1,

      sets: 4,

      reps: "10",

      weight: 100,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Leg Curl"),

      order: 2,

      sets: 4,

      reps: "10-12",

      weight: 59,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Leg Extension"),

      order: 3,

      sets: 3,

      reps: "12",

      weight: 59,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Crunch machine"),

      order: 4,

      sets: 3,

      reps: "12",

      weight: 54,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Hip Abduction"),

      order: 5,

      sets: 3,

      reps: "15",

      weight: 59,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Hip Adduction"),

      order: 6,

      sets: 3,

      reps: "15",

      weight: 45,
    },

    {
      workoutId: legsId,

      exerciseId: await getExerciseId("Mollets"),

      order: 7,

      sets: 4,

      reps: "15",

      weight: 80,
    },
  ]);

  await db.workoutExercises.bulkAdd([
    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Pompes classiques"),

      order: 1,

      sets: 3,

      reps: "12-20",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Pompes diamant"),

      order: 2,

      sets: 3,

      reps: "8-12",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Pompes piquées"),

      order: 3,

      sets: 3,

      reps: "8-12",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Crucifix Crunch"),

      order: 4,

      sets: 3,

      reps: "10-12",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Relevés de jambes"),

      order: 5,

      sets: 3,

      reps: "8-12",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Gainage face"),

      order: 6,

      sets: 3,

      reps: "45-60s",

      weight: 0,
    },

    {
      workoutId: pagAId,

      exerciseId: await getExerciseId("Gainage latéral"),

      order: 7,

      sets: 2,

      reps: "30-45s",

      weight: 0,
    },
  ]);

  await db.workoutExercises.bulkAdd([
    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Pompes claquées"),

      order: 1,

      sets: 4,

      reps: "5-8",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Pompes archers"),

      order: 2,

      sets: 3,

      reps: "6-8",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Pompes déclinées"),

      order: 3,

      sets: 3,

      reps: "10-15",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Relevés de planche latérale"),

      order: 4,

      sets: 3,

      reps: "10-15",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Relevés de jambes"),

      order: 5,

      sets: 3,

      reps: "8-12",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Gainage dos"),

      order: 6,

      sets: 3,

      reps: "30-45s",

      weight: 0,
    },

    {
      workoutId: pagBId,

      exerciseId: await getExerciseId("Gainage face"),

      order: 7,

      sets: 2,

      reps: "45-60s",

      weight: 0,
    },
  ]);

  console.log("Exercices créés");
}
