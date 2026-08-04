import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { db } from "../../database/db";

export default function WorkoutDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [workout, setWorkout] = useState<any>(null);

  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const workoutData = await db.workouts.get(Number(id));

      if (!workoutData) return;

      setWorkout(workoutData);

      const workoutExercises = await db.workoutExercises
        .where("workoutId")
        .equals(Number(id))
        .sortBy("order");

      const fullExercises = await Promise.all(
        workoutExercises.map(async (item) => {
          const exercise = await db.exercises.get(item.exerciseId);

          return {
            ...item,
            exercise,
          };
        }),
      );

      setExercises(fullExercises);
    }

    load();
  }, [id]);

  if (!workout) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-neutral-400">
        ← Retour
      </button>

      <h1
        className="
        text-3xl
        font-bold
        mt-6
        "
      >
        {workout.name}
      </h1>

      <p
        className="
        text-neutral-400
        mt-2
        "
      >
        {workout.day}
      </p>

      <p className="mt-2">{workout.description}</p>

      <div
        className="
        mt-8
        space-y-4
        "
      >
        {exercises.map((item, index) => (
          <div
            key={item.id}
            onClick={() => {
              navigate(
                `/exercises/${item.exercise.id}?workoutExercise=${item.id}`,
              );
            }}
            className="
            bg-neutral-900
            rounded-3xl
            p-5
            cursor-pointer
            active:scale-[0.98]
            transition
            "
          >
            <div
              className="
              flex
              gap-3
              "
            >
              <span
                className="
                text-neutral-500
                font-bold
                "
              >
                {index + 1}
              </span>

              <h2
                className="
                font-bold
                text-lg
                "
              >
                {item.exercise.name}
              </h2>
            </div>

            <p
              className="
              mt-3
              text-neutral-400
              "
            >
              {item.sets} séries × {item.reps}
            </p>

            <p>{item.weight === 0 ? "Poids du corps" : `${item.weight} kg`}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(`/workouts/${workout.id}/edit`)}
        className="
        mt-8
        w-full
        bg-white
        text-black
        rounded-2xl
        py-4
        font-semibold
        "
      >
        Modifier la séance
      </button>
    </div>
  );
}
