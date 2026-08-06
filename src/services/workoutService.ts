import { supabase } from "../lib/supabase";

const dayMap: any = {
  0: "Dimanche",

  1: "Lundi",

  2: "Mardi",

  3: "Mercredi",

  4: "Jeudi",

  5: "Vendredi",

  6: "Samedi",
};

export function getCurrentDayName() {
  const today = new Date();

  return dayMap[today.getDay()];
}

export function getCurrentDayOfWeek(): number {
  // Convert JS getDay() 0..6 (0 = Sunday) to day_of_week 1..7 (1 = Monday, 7 = Sunday)
  const js = new Date().getDay();

  if (js === 0) return 7;

  return js;
}

export async function getTodayWorkout() {
  const dayOfWeek = getCurrentDayOfWeek();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return null;

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .eq("user_id", user.id)
    .limit(1);

  if (error) return null;

  return data && data[0] ? data[0] : null;
}
