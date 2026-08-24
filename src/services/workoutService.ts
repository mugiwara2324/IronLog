import { supabase } from "../lib/supabase";

export const WEEK_DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
] as const;

export type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string | null;
  day_of_week: number;
};

export function getCurrentDayOfWeek(): number {
  const day = new Date().getDay();

  return day === 0 ? 7 : day;
}

export function getDayName(dayOfWeek: number) {
  return WEEK_DAYS.find((day) => day.value === dayOfWeek)?.label ?? "";
}

/**
 * Le planning est un repère hebdomadaire : ces séances restent disponibles
 * tous les jours et ne sont jamais limitées au jour auquel elles sont associées.
 */
export async function getWeeklyWorkoutPlan(): Promise<WorkoutTemplate[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, description, day_of_week")
    .eq("user_id", user.id)
    .order("day_of_week");

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkoutTemplate[];
}
