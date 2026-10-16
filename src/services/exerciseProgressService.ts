import { supabase } from "../lib/supabase";

export type ExerciseProgressPoint = {
  exerciseId: string;
  date: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
};

export async function getExerciseProgressPoints(
  userId: string,
  exerciseId?: string,
): Promise<ExerciseProgressPoint[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, finished_at")
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: true });

  if (sessionsError) throw sessionsError;
  if (!sessions?.length) return [];

  const dates = new Map(sessions.map((session) => [session.id, session.finished_at]));
  let query = supabase
    .from("performed_sets")
    .select("session_id, exercise_id, weight, reps, volume_multiplier")
    .in("session_id", sessions.map((session) => session.id));

  if (exerciseId) query = query.eq("exercise_id", exerciseId);

  const { data: sets, error: setsError } = await query;
  if (setsError) throw setsError;

  const points = new Map<string, ExerciseProgressPoint>();
  for (const set of sets ?? []) {
    const date = dates.get(set.session_id);
    if (!date) continue;

    const key = `${set.exercise_id}:${set.session_id}`;
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    const point = points.get(key) ?? {
      exerciseId: set.exercise_id,
      date,
      maxWeight: 0,
      maxReps: 0,
      maxVolume: 0,
    };
    point.maxWeight = Math.max(point.maxWeight, weight);
    point.maxReps = Math.max(point.maxReps, reps);
    point.maxVolume = Math.max(point.maxVolume, weight * reps * (Number(set.volume_multiplier) === 2 ? 2 : 1));
    points.set(key, point);
  }

  return [...points.values()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
