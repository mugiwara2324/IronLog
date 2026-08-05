import { useEffect, useState } from "react";

import { getTodayWorkout } from "../../services/workoutService";

import type { Workout } from "../../database/db";

import { useNavigate } from "react-router-dom";

import { db } from "../../database/db";

export default function Home() {
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);

  const [loading, setLoading] = useState(true);

  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);

  async function load() {
    const todayWorkout = await getTodayWorkout();

    setWorkout(todayWorkout ?? null);

    const active = await db.activeWorkout.toCollection().first();

    if (active && todayWorkout && active.workoutId === todayWorkout.id) {
      setHasActiveWorkout(true);
    } else {
      setHasActiveWorkout(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function startWorkout() {
    if (!workout || !workout.id) {
      return;
    }

    /*
      Si une séance existe déjà,
      on la reprend au lieu d'en créer une nouvelle
    */

    const existingActive = await db.activeWorkout
      .where("workoutId")
      .equals(workout.id)
      .first();

    if (existingActive) {
      navigate(`/workout-active/${workout.id}`);
      return;
    }

    /*
      Création de la séance active
    */

    await db.activeWorkout.add({
      workoutId: workout.id,

      startedAt: new Date(),

      updatedAt: new Date(),
    });

    const exercises = await db.workoutExercises
      .where("workoutId")
      .equals(workout.id)
      .sortBy("order");

    await db.activeWorkoutExercises.bulkAdd(
      exercises.map((exercise) => ({
        workoutId: workout.id!,

        exerciseId: exercise.exerciseId,

        order: exercise.order,

        done: false,

        sets: Array.from(
          {
            length: exercise.sets,
          },

          () => ({
            weight: exercise.weight,

            reps: Number(exercise.reps.split("-")[0]),
          }),
        ),

        comment: "",
      })),
    );

    await load();

    navigate(`/workout-active/${workout.id}`);
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
      <h1
        className="
        text-3xl
        font-bold
        "
      >
        Bonjour Quentin
      </h1>

      <div
        className="
        mt-8
        bg-neutral-900
        rounded-3xl
        p-6
        "
      >
        <h2
          className="
          text-xl
          text-neutral-400
          "
        >
          Séance du jour
        </h2>

        {workout ? (
          <>
            <h3
              className="
              text-3xl
              font-bold
              mt-3
              "
            >
              {workout.name}
            </h3>

            <p
              className="
              mt-2
              text-neutral-400
              "
            >
              {workout.description}
            </p>

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
            ) : (
              <button
                onClick={startWorkout}
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
                Démarrer ma séance
              </button>
            )}
          </>
        ) : (
          <>
            <h3
              className="
              text-2xl
              font-bold
              mt-3
              "
            >
              Repos
            </h3>

            <p
              className="
              text-neutral-400
              mt-2
              "
            >
              Aucune séance prévue aujourd'hui
            </p>
          </>
        )}
      </div>
    </div>
  );
}
