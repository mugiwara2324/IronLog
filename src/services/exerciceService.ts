import { db } from "../database/db";

export async function createExercise(
  name: string,

  muscleGroup: string,
) {
  return await db.exercises.add({
    name,

    muscleGroup,

    createdAt: new Date(),
  });
}

export async function getExercises() {
  return await db.exercises.toArray();
}
