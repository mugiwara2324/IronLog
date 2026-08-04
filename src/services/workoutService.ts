import { db } from "../database/db";

const dayMap: any = {
  0: "Dimanche",

  1: "Lundi",

  2: "Mardi",

  3: "Mercredi",

  4: "Jeudi",

  5: "Vendredi",

  6: "Samedi",
};

export function getCurrentDay() {
  const today = new Date();

  return dayMap[today.getDay()];
}

export async function getTodayWorkout() {
  const day = getCurrentDay();

  const workout = await db.workouts.where("day").equals(day).first();

  return workout;
}
