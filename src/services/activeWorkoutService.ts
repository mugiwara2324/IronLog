import { supabase } from "../lib/supabase";

const pendingCancellationsKey = "ironlog:pending-active-workout-cancellations";

type PendingCancellation = { userId: string; workoutId: string };

function getPendingCancellations(): PendingCancellation[] {
  try {
    const value = localStorage.getItem(pendingCancellationsKey);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is PendingCancellation =>
            Boolean(item) &&
            typeof item.userId === "string" &&
            typeof item.workoutId === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function savePendingCancellations(items: PendingCancellation[]) {
  if (items.length === 0) localStorage.removeItem(pendingCancellationsKey);
  else localStorage.setItem(pendingCancellationsKey, JSON.stringify(items));
}

async function deleteActiveWorkoutRows(userId: string, workoutId: string) {
  const { error: exercisesError } = await supabase
    .from("active_workout_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("workout_id", workoutId);
  if (exercisesError) throw exercisesError;

  const { error: workoutError } = await supabase
    .from("active_workout")
    .delete()
    .eq("user_id", userId)
    .eq("workout_id", workoutId);
  if (workoutError) throw workoutError;
}

export async function cancelActiveWorkout(userId: string, workoutId: string) {
  const pending = getPendingCancellations();
  if (!pending.some((item) => item.userId === userId && item.workoutId === workoutId)) {
    pending.push({ userId, workoutId });
  }
  savePendingCancellations(pending);

  if (!navigator.onLine) return false;

  try {
    await deleteActiveWorkoutRows(userId, workoutId);
    savePendingCancellations(
      getPendingCancellations().filter(
        (item) => item.userId !== userId || item.workoutId !== workoutId,
      ),
    );
    return true;
  } catch (error) {
    console.error("Suppression de la séance active reportée :", error);
    return false;
  }
}

export async function syncPendingActiveWorkoutCancellations(userId: string) {
  if (!navigator.onLine) {
    return getPendingCancellations().filter((item) => item.userId === userId).length;
  }

  const pending = getPendingCancellations();
  const remaining: PendingCancellation[] = [];

  for (const item of pending) {
    if (item.userId !== userId) {
      remaining.push(item);
      continue;
    }

    try {
      await deleteActiveWorkoutRows(item.userId, item.workoutId);
    } catch (error) {
      console.error("Nouvelle tentative de suppression de séance échouée :", error);
      remaining.push(item);
    }
  }

  savePendingCancellations(remaining);
  return remaining.filter((item) => item.userId === userId).length;
}
