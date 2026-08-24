import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { deleteWorkout } from "../../services/supabaseWorkoutService";
import { getWorkoutDetails } from "../../services/workoutDetailService";

export default function WorkoutDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [workout, setWorkout] = useState<any>(null);

  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const workoutData = await getWorkoutDetails(id);

        if (!workoutData) {
          return;
        }

        setWorkout(workoutData);

        const sortedExercises = [...(workoutData.workout_exercises ?? [])]
          .sort((a, b) =>
            Number(a.order ?? a.order_index ?? 0) -
            Number(b.order ?? b.order_index ?? 0),
          )
          .map((item) => ({
            ...item,
            exercise: item.exercises,
          }));

        setExercises(sortedExercises);
      } catch (error) {
        console.error("Erreur chargement séance :", error);
      }
    }

    load();
  }, [id]);

  async function handleDeleteWorkout() {
    if (!workout?.id) return;

    const confirmed = window.confirm(
      "Supprimer cette séance ? Cette action est irréversible.",
    );

    if (!confirmed) return;

    try {
      await deleteWorkout(workout.id);
      navigate("/workouts");
    } catch (error) {
      console.error("Erreur suppression séance :", error);
    }
  }

  if (!workout) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="
  mb-5
  bg-neutral-800
  rounded-2xl
  px-5
  py-3
  font-semibold
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
        {workout.name}
      </h1>

      <p
        className="
        text-neutral-400
        mt-2
        "
      >
        Jour de référence : {getDayName(workout.day_of_week)}
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

      <button
        onClick={handleDeleteWorkout}
        className="
        mt-4
        w-full
        bg-red-600
        text-white
        rounded-2xl
        py-4
        font-semibold
        "
      >
        Supprimer la séance
      </button>
    </div>
  );
}

function getDayName(day: number) {
  return ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][day] ?? "";
}
