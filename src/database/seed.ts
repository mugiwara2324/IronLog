import { db } from "./db";

export async function seedExercises() {
  const count = await db.exercises.count();

  if (count > 0) {
    return;
  }

  const exercises = [
    {
      name: "Développé couché haltères",
      muscles: ["Pectoraux", "Triceps", "Épaules"],
    },

    {
      name: "Développé incliné haltères",
      muscles: ["Pectoraux", "Épaules", "Triceps"],
    },

    {
      name: "Développé épaules assis",
      muscles: ["Épaules", "Triceps"],
    },

    {
      name: "Pec Fly",
      muscles: ["Pectoraux"],
    },

    {
      name: "Élévations latérales",
      muscles: ["Épaules"],
    },

    {
      name: "Extension triceps à la poulie",
      muscles: ["Triceps"],
    },

    {
      name: "Extension triceps un bras",
      muscles: ["Triceps"],
    },

    {
      name: "Tirage vertical devant",
      muscles: ["Dos", "Biceps"],
    },

    {
      name: "Rowing poulie prise serrée",
      muscles: ["Dos", "Biceps"],
    },

    {
      name: "Rowing haltères",
      muscles: ["Dos", "Biceps"],
    },

    {
      name: "Pull-over",
      muscles: ["Dos", "Pectoraux"],
    },

    {
      name: "Rear Delt",
      muscles: ["Épaules"],
    },

    {
      name: "Curl barre EZ",
      muscles: ["Biceps", "Avant-bras"],
    },

    {
      name: "Curl poulie",
      muscles: ["Biceps"],
    },

    {
      name: "Presse",
      muscles: ["Quadriceps", "Fessiers", "Ischios"],
    },

    {
      name: "Leg Curl",
      muscles: ["Ischios"],
    },

    {
      name: "Leg Extension",
      muscles: ["Quadriceps"],
    },

    {
      name: "Crunch machine",
      muscles: ["Abdos"],
    },

    {
      name: "Hip Abduction",
      muscles: ["Fessiers"],
    },

    {
      name: "Hip Adduction",
      muscles: ["Adducteurs"],
    },

    {
      name: "Mollets",
      muscles: ["Mollets"],
    },

    {
      name: "Pompes classiques",
      muscles: ["Pectoraux", "Triceps", "Épaules"],
    },

    {
      name: "Pompes diamant",
      muscles: ["Triceps", "Pectoraux"],
    },

    {
      name: "Pompes piquées",
      muscles: ["Épaules", "Triceps"],
    },

    {
      name: "Pompes claquées",
      muscles: ["Pectoraux", "Explosivité"],
    },

    {
      name: "Pompes archers",
      muscles: ["Pectoraux", "Épaules"],
    },

    {
      name: "Pompes déclinées",
      muscles: ["Pectoraux", "Épaules", "Triceps"],
    },
  ];

  await db.exercises.bulkAdd(
    exercises.map((e) => ({
      ...e,
      createdAt: new Date(),
    })),
  );
}
