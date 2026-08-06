import { useEffect, useState } from "react";

import { getTodayWorkout } from "../../services/workoutService";

import type { Workout } from "../../database/db";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function Home() {
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);

  const [loading, setLoading] = useState(true);

  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);

  const [hasFinishedWorkout, setHasFinishedWorkout] = useState(false);

  async function load() {
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error("Utilisateur non authentifié");
      }

      const todayWorkout = await getTodayWorkout();

      setWorkout(todayWorkout ?? null);

      if (todayWorkout) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: finishedSession, error: finishedError } = await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("workout_id", todayWorkout.id)
          .gte("finished_at", startOfDay.toISOString())
          .limit(1);

        if (finishedError) {
          console.error("Erreur récupération séance terminée :", finishedError);
        }

        setHasFinishedWorkout(!!finishedSession && finishedSession.length > 0);
      }

      if (!todayWorkout) {
        setHasActiveWorkout(false);
        return;
      }

      /*
        Vérification séance active
      */

      const { data: activeWorkout, error: activeError } = await supabase
        .from("active_workout")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", todayWorkout.id)
        .limit(1);

      if (activeError) {
        console.error("Erreur récupération active workout :", activeError);

        setHasActiveWorkout(false);
        return;
      }

      const active =
        activeWorkout && activeWorkout.length > 0 ? activeWorkout[0] : null;

      if (!active) {
        setHasActiveWorkout(false);
        return;
      }

      /*
        Vérification qu'il reste des exercices actifs

        Cas :
        - crash pendant création
        - refresh après suppression partielle
        - ancienne séance vide
      */

      const { data: activeExercises, error: exercisesError } = await supabase
        .from("active_workout_exercises")
        .select("id")
        .eq("workout_id", todayWorkout.id);

      if (exercisesError) {
        console.error("Erreur récupération exercices actifs :", exercisesError);

        setHasActiveWorkout(false);

        return;
      }

      if (!activeExercises || activeExercises.length === 0) {
        console.warn("Séance active sans exercices détectée, nettoyage");

        await supabase.from("active_workout").delete().eq("id", active.id);

        setHasActiveWorkout(false);

        return;
      }

      setHasActiveWorkout(true);
    } catch (error) {
      console.error("Erreur Home.load :", error);

      setHasActiveWorkout(false);

      setWorkout(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  async function startWorkout() {
    if (!workout || !workout.id) {
      return;
    }

    setStarting(true);

    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        throw new Error("Utilisateur non authentifié");
      }

      /*
        Vérification d'une séance active existante
      */

      const { data: existingActive } = await supabase
        .from("active_workout")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", workout.id)
        .limit(1);

      if (existingActive && existingActive.length > 0) {
        const { data: activeExercises } = await supabase
          .from("active_workout_exercises")
          .select("id")
          .eq("workout_id", workout.id);

        /*
          Si une séance active existe mais sans exercice,
          on nettoie et on recrée.
        */

        if (!activeExercises || activeExercises.length === 0) {
          await supabase
            .from("active_workout")
            .delete()
            .eq("id", existingActive[0].id);
        } else {
          navigate(`/workout-active/${workout.id}`);

          return;
        }
      }

      /*
        Nettoyage anciennes données actives
      */

      await supabase
        .from("active_workout_exercises")
        .delete()
        .eq("workout_id", workout.id);

      await supabase.from("active_workout").delete().eq("user_id", user.id);

      /*
        Création séance active
      */

      const { error: activeError } = await supabase
        .from("active_workout")
        .insert({
          user_id: user.id,

          workout_id: workout.id,

          started_at: new Date().toISOString(),

          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (activeError) {
        throw activeError;
      }

      /*
        Récupération exercices de la séance
      */

      const { data: workoutExercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", workout.id)
        .order("order", {
          ascending: true,
        });

      if (exercisesError) {
        throw exercisesError;
      }

      if (!workoutExercises || workoutExercises.length === 0) {
        throw new Error("Cette séance ne contient aucun exercice");
      }

      /*
        Création exercices actifs

        IMPORTANT :
        active_workout_exercises n'a PAS de user_id
      */

      const activeExercises = workoutExercises.map(
        (exercise: any, index: number) => ({
          workout_id: workout.id,

          exercise_id: exercise.exercise_id,

          order: index + 1,

          done: false,

          sets: Array.from(
            {
              length: exercise.sets,
            },
            () => ({
              weight: exercise.weight,

              reps: Number(
                String(exercise.reps)
                  .replace(/[^\d-]/g, "")
                  .split("-")[0],
              ),
            }),
          ),
        }),
      );

      const { error: insertExercisesError } = await supabase
        .from("active_workout_exercises")
        .insert(activeExercises);

      if (insertExercisesError) {
        throw insertExercisesError;
      }

      navigate(`/workout-active/${workout.id}`);
    } catch (error: any) {
      console.error("Erreur startWorkout :", error);

      setErrorMessage(error.message ?? "Erreur démarrage séance");
    } finally {
      setStarting(false);
    }
  }

  function resumeWorkout() {
    if (!workout?.id) {
      return;
    }

    navigate(`/workout-active/${workout.id}`);
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Bonjour Quentin</h1>

      <div className="mt-8 bg-neutral-900 rounded-3xl p-6">
        <h2 className="text-xl text-neutral-400">Séance du jour</h2>

        {workout ? (
          <>
            <h3 className="text-3xl font-bold mt-3">{workout.name}</h3>

            <p className="mt-2 text-neutral-400">{workout.description}</p>

            {hasActiveWorkout ? (
              <button
                onClick={resumeWorkout}
                className="
    mt-6
    w-full
    bg-white
    text-black
    rounded-2xl
    py-4
    font-semibold
    "
              >
                Reprendre ma séance
              </button>
            ) : hasFinishedWorkout ? (
              <button
                onClick={() => navigate(`/workout-history/${workout.id}`)}
                className="
    mt-6
    w-full
    bg-white
    text-black
    rounded-2xl
    py-4
    font-semibold
    "
              >
                Voir la séance
              </button>
            ) : (
              <button
                onClick={startWorkout}
                disabled={starting}
                className="
    mt-6
    w-full
    bg-white
    text-black
    rounded-2xl
    py-4
    font-semibold
    disabled:opacity-50
    "
              >
                {starting ? "Démarrage..." : "Démarrer ma séance"}
              </button>
            )}

            {errorMessage && (
              <p className="mt-3 text-red-400">{errorMessage}</p>
            )}
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold mt-3">Repos</h3>

            <p className="text-neutral-400 mt-2">
              Aucune séance prévue aujourd'hui
            </p>
          </>
        )}
      </div>
    </div>
  );
}
