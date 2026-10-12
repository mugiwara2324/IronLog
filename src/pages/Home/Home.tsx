import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentDayOfWeek,
  getDayName,
  getWeeklyWorkoutPlan,
  type WorkoutTemplate,
  WEEK_DAYS,
} from "../../services/workoutService";
import { supabase } from "../../lib/supabase";
import { syncPendingActiveWorkoutCancellations } from "../../services/activeWorkoutService";

type CompletedSession = {
  id: string;
  workout_id: string;
  finished_at: string;
  workouts?: { name?: string | null } | null;
};

function getStartOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay() || 7;

  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function getInitialReps(value: unknown) {
  const text = String(value ?? "");
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|à|a|to)\s*\d+(?:[.,]\d+)?/i);
  const afterMultiplier = text.match(/\d+\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
  const first = range?.[1] ?? afterMultiplier?.[1] ?? text.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "0";
  return Number(first.replace(",", "."));
}

export default function Home() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingWorkoutId, setStartingWorkoutId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancellationPending, setCancellationPending] = useState(false);

  async function load() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      const pendingCancellations = await syncPendingActiveWorkoutCancellations(user.id);

      const [weeklyPlan, activeResult, sessionsResult] = await Promise.all([
        getWeeklyWorkoutPlan(),
        supabase
          .from("active_workout")
          .select("workout_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("workout_sessions")
          .select("id, workout_id, finished_at, workouts(name)")
          .eq("user_id", user.id)
          .not("finished_at", "is", null)
          .gte("finished_at", getStartOfCurrentWeek())
          .order("finished_at", { ascending: false })
          .limit(20),
      ]);

      if (activeResult.error) throw activeResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      setWorkouts(weeklyPlan);
      setActiveWorkoutId(pendingCancellations > 0 ? null : activeResult.data?.workout_id ?? null);
      setCompletedSessions((sessionsResult.data ?? []) as CompletedSession[]);
      setCancellationPending(pendingCancellations > 0);
    } catch (error) {
      console.error("Erreur chargement accueil :", error);
      setErrorMessage("Impossible de charger tes séances.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Loading the authenticated home screen is the effect's external data sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const handleOnline = () => void load();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  async function startWorkout(workout: WorkoutTemplate) {
    const confirmed = window.confirm(
      `Commencer la séance « ${workout.name} » ?\n\nToute séance en cours sera remplacée.`,
    );

    if (!confirmed) return;

    setStartingWorkoutId(workout.id);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilisateur non authentifié");

      const pendingCancellations = await syncPendingActiveWorkoutCancellations(user.id);
      if (pendingCancellations > 0) {
        throw new Error("La suppression de la séance précédente est en attente. Réessaie dans un instant.");
      }

      if (activeWorkoutId === workout.id) {
        navigate(`/workout-active/${workout.id}`);
        return;
      }

      const { data: workoutExercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("exercise_id, sets, reps, weight, order, order_index")
        .eq("workout_id", workout.id);

      if (exercisesError) throw exercisesError;
      if (!workoutExercises?.length) {
        throw new Error("Cette séance ne contient aucun exercice.");
      }

      // Une seule séance active à la fois : on remplace celle qui n'a pas été terminée.
      const { error: deleteExercisesError } = await supabase
        .from("active_workout_exercises")
        .delete()
        .eq("user_id", user.id);
      if (deleteExercisesError) throw deleteExercisesError;

      const { error: deleteActiveError } = await supabase
        .from("active_workout")
        .delete()
        .eq("user_id", user.id);

      if (deleteActiveError) throw deleteActiveError;

      if (activeWorkoutId) {
        try {
          localStorage.removeItem(`ironlog:active-workout:${user.id}:${activeWorkoutId}`);
        } catch (error) {
          console.warn("Impossible de nettoyer l’ancien brouillon local :", error);
        }
      }

      const { error: activeError } = await supabase.from("active_workout").insert({
        user_id: user.id,
        workout_id: workout.id,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (activeError) throw activeError;

      const activeExercises = [...workoutExercises]
        .sort((a, b) => Number(a.order ?? a.order_index ?? 0) - Number(b.order ?? b.order_index ?? 0))
        .map((exercise, index) => ({
        user_id: user.id,
        workout_id: workout.id,
        exercise_id: exercise.exercise_id,
        order: exercise.order ?? exercise.order_index ?? index + 1,
        done: false,
        sets: Array.from({ length: exercise.sets }, () => ({
          weight: exercise.weight,
          reps: getInitialReps(exercise.reps),
        })),
      }));

      const { error: insertExercisesError } = await supabase
        .from("active_workout_exercises")
        .insert(activeExercises);

      if (insertExercisesError) throw insertExercisesError;

      navigate(`/workout-active/${workout.id}`);
    } catch (error: unknown) {
      console.error("Erreur démarrage séance :", error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur au démarrage de la séance.");
    } finally {
      setStartingWorkoutId(null);
    }
  }

  if (loading) return <div>Chargement...</div>;

  const todayDay = getCurrentDayOfWeek();

  return (
    <div>
      <h1 className="text-3xl font-bold">Bon retour</h1>

      <section className="mt-8 bg-neutral-900 rounded-3xl p-6">
        <p className="text-sm text-neutral-400">Aujourd&apos;hui · {getDayName(todayDay)}</p>
        <h2 className="text-2xl font-bold mt-2">Choisis ta séance</h2>
        <p className="mt-2 text-neutral-400">
          Le planning est un repère : tu peux démarrer n&apos;importe quelle séance, n&apos;importe quel jour.
        </p>

        {activeWorkoutId && (
          <button
            onClick={() => navigate(`/workout-active/${activeWorkoutId}`)}
            className="mt-5 w-full bg-neutral-700 rounded-2xl py-3 font-semibold"
          >
            Reprendre ma séance en cours
          </button>
        )}

        {cancellationPending && (
          <p role="status" className="mt-4 rounded-2xl bg-amber-400/10 p-4 text-sm text-amber-200">
            La séance est annulée sur cet appareil. Sa suppression en ligne sera retentée dès que la connexion sera rétablie.
          </p>
        )}

        <div className="mt-5 space-y-3">
          {workouts.map((workout) => (
            <button
              key={workout.id}
              onClick={() => startWorkout(workout)}
              disabled={startingWorkoutId !== null}
              className="w-full text-left bg-neutral-800 rounded-2xl p-4 disabled:opacity-50"
            >
              <span className="block font-bold">{workout.name}</span>
              <span className="block text-sm text-neutral-400 mt-1">
                Prévue le {getDayName(workout.day_of_week)} · {startingWorkoutId === workout.id ? "Démarrage..." : "Démarrer"}
              </span>
            </button>
          ))}
        </div>

        {workouts.length === 0 && (
          <button onClick={() => navigate("/workouts")} className="mt-5 w-full bg-white text-black rounded-2xl py-3 font-semibold">
            Créer ma première séance
          </button>
        )}
        {errorMessage && <p className="mt-4 text-red-400">{errorMessage}</p>}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Mon planning hebdomadaire</h2>
          <button onClick={() => navigate("/workouts")} className="text-sm text-neutral-400">Modifier</button>
        </div>

        <div className="mt-4 space-y-3">
          {WEEK_DAYS.map((day) => {
            const planned = workouts.filter((workout) => workout.day_of_week === day.value);
            const completed = completedSessions.filter((session) => new Date(session.finished_at).getDay() === (day.value === 7 ? 0 : day.value));

            return (
              <div key={day.value} className={`rounded-2xl p-4 ${day.value === todayDay ? "bg-white text-black" : "bg-neutral-900"}`}>
                <p className="font-semibold">{day.label}{day.value === todayDay ? " · Aujourd'hui" : ""}</p>
                {planned.length > 0 ? (
                  planned.map((workout) => <p key={workout.id} className="mt-1 text-sm opacity-70">Prévu : {workout.name}</p>)
                ) : <p className="mt-1 text-sm opacity-70">Repos</p>}
                {completed.map((session) => <p key={session.id} className="mt-2 text-sm font-semibold">✓ Réalisé : {session.workouts?.name ?? "Séance"}</p>)}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
