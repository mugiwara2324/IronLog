import { db } from "../database/db";

export async function createExercise(
  name: string,
  muscles: string[],
  description: string = "",
) {
  return await db.exercises.add({
    name,

    description,

    muscles,

    createdAt: new Date(),
  });
}

export async function getExercises() {
  return await db.exercises.toArray();
}
