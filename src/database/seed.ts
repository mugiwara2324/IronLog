import { db } from "./db";

export async function seedExercises() {
  const count = await db.exercises.count();

  if (count > 0) {
    return;
  }

  const exercises = [
    {
      name: "Développé couché haltères",
      muscleGroup: "Pectoraux",
    },

    {
      name: "Développé incliné haltères",
      muscleGroup: "Pectoraux",
    },

    {
      name: "Développé épaules assis",
      muscleGroup: "Épaules",
    },

    {
      name: "Pec Fly",
      muscleGroup: "Pectoraux",
    },

    {
      name: "Élévations latérales",
      muscleGroup: "Épaules",
    },

    {
      name: "Extension triceps à la poulie",
      muscleGroup: "Triceps",
    },

    {
      name: "Extension triceps un bras",
      muscleGroup: "Triceps",
    },

    {
      name: "Tirage vertical devant",
      muscleGroup: "Dos",
    },

    {
      name: "Rowing poulie prise serrée",
      muscleGroup: "Dos",
    },

    {
      name: "Rowing haltères",
      muscleGroup: "Dos",
    },

    {
      name: "Pull-over",
      muscleGroup: "Dos",
    },

    {
      name: "Rear Delt",
      muscleGroup: "Arrière épaule",
    },

    {
      name: "Curl barre EZ",
      muscleGroup: "Biceps",
    },

    {
      name: "Curl poulie",
      muscleGroup: "Biceps",
    },

    {
      name: "Presse",
      muscleGroup: "Jambes",
    },

    {
      name: "Leg Curl",
      muscleGroup: "Ischio",
    },

    {
      name: "Leg Extension",
      muscleGroup: "Quadriceps",
    },

    {
      name: "Crunch machine",
      muscleGroup: "Abdos",
    },

    {
      name: "Hip Abduction",
      muscleGroup: "Fessiers",
    },

    {
      name: "Hip Adduction",
      muscleGroup: "Adducteurs",
    },

    {
      name: "Mollets",
      muscleGroup: "Mollets",
    },

    {
      name: "Pompes classiques",
      muscleGroup: "Pectoraux",
    },

    {
      name: "Pompes diamant",
      muscleGroup: "Triceps",
    },

    {
      name: "Pompes piquées",
      muscleGroup: "Épaules",
    },

    {
      name: "Pompes claquées",
      muscleGroup: "Explosivité",
    },

    {
      name: "Pompes archers",
      muscleGroup: "Explosivité",
    },

    {
      name: "Pompes déclinées",
      muscleGroup: "Pectoraux",
    },
  ];

  await db.exercises.bulkAdd(
    exercises.map((e) => ({
      ...e,

      createdAt: new Date(),
    })),
  );
}
