import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { db } from "../../database/db";

export default function WorkoutSession() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState<any[]>([]);

  const [workoutName, setWorkoutName] = useState("");

  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);

  const [completed, setCompleted] = useState<number[]>([]);

  async function loadWorkout() {
    const days = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];

    const today = days[new Date().getDay()];

    const workout = await db.workouts.where("day").equals(today).first();

    if (!workout?.id) {
      return;
    }

    setWorkoutName(workout.name);

    let active = await db.activeWorkout.toCollection().first();

    /*
      Si une séance existe déjà
      et correspond à aujourd'hui
    */

    if (active && active.workoutId === workout.id) {
      setActiveWorkoutId(active.id ?? null);

      const activeExercises = await db.activeWorkoutExercises
        .where("workoutId")
        .equals(workout.id)
        .sortBy("order");

      const fullExercises = await Promise.all(
        activeExercises.map(async (item) => {
          const exercise = await db.exercises.get(item.exerciseId);

          return {
            ...item,
            exercise,
          };
        }),
      );

      setExercises(fullExercises);

      setCompleted(
        activeExercises.filter((item) => item.done).map((item) => item.id!),
      );

      return;
    }

    /*
      Nouvelle séance
    */

    const activeId = await db.activeWorkout.add({
      workoutId: workout.id,

      startedAt: new Date(),

      updatedAt: new Date(),
    });

    setActiveWorkoutId(activeId);

    const workoutExercises = await db.workoutExercises
      .where("workoutId")
      .equals(workout.id)
      .sortBy("order");

    const activeExercises = await Promise.all(
      workoutExercises.map(async (item) => {
        const sets = Array.from(
          {
            length: item.sets,
          },
          () => ({
            weight: item.weight,

            reps: Number(item.reps),
          }),
        );

        const id = await db.activeWorkoutExercises.add({
          workoutId: workout.id!,

          exerciseId: item.exerciseId,

          order: item.order,

          done: false,

          sets,
        });

        const exercise = await db.exercises.get(item.exerciseId);

        return {
          id,

          workoutId: workout.id,

          exerciseId: item.exerciseId,

          order: item.order,

          done: false,

          sets,

          exercise,
        };
      }),
    );

    setExercises(activeExercises);
  }

  useEffect(() => {
    loadWorkout();
  }, []);

  async function toggleExercise(id: number) {
    const current = exercises.find((item) => item.id === id);

    if (!current) {
      return;
    }

    const newDone = !current.done;

    await db.activeWorkoutExercises.update(id, {
      done: newDone,
    });

    if (activeWorkoutId) {
      await db.activeWorkout.update(activeWorkoutId, {
        updatedAt: new Date(),
      });
    }

    setExercises(
      exercises.map((item) =>
        item.id === id
          ? {
              ...item,
              done: newDone,
            }
          : item,
      ),
    );

    if (newDone) {
      setCompleted([...completed, id]);
    } else {
      setCompleted(completed.filter((item) => item !== id));
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="
        text-neutral-400
        "
      >
        ← Retour
      </button>

      <h1
        className="
        text-3xl
        font-bold
        mt-6
        "
      >
        {workoutName}
      </h1>

      <p
        className="
        mt-3
        text-neutral-400
        "
      >
        Progression : {completed.length}/{exercises.length}
      </p>

      <div
        className="
        mt-8
        space-y-4
        "
      >
        {exercises.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleExercise(item.id)}
            className="
            bg-neutral-900
            rounded-3xl
            p-5
            "
          >
            <div
              className="
              flex
              justify-between
              "
            >
              <h2
                className="
                font-bold
                text-lg
                "
              >
                {item.exercise?.name}
              </h2>

              <span>{item.done ? "✅" : "⬜"}</span>
            </div>

            <p
              className="
              text-neutral-400
              mt-3
              "
            >
              {item.sets.length} séries
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
