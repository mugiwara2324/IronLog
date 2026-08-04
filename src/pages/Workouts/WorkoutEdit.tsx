import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { db } from "../../database/db";

import ExerciseFormModal from "../../components/exercises/ExerciseFormModal";

export default function WorkoutEdit() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [workout, setWorkout] = useState<any>(null);

  const [exercises, setExercises] = useState<any[]>([]);

  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    if (!id) return;

    const workoutData = await db.workouts.get(Number(id));

    setWorkout(workoutData);

    const data = await db.workoutExercises
      .where("workoutId")
      .equals(Number(id))
      .sortBy("order");

    const full = await Promise.all(
      data.map(async (item) => {
        const exercise = await db.exercises.get(item.exerciseId);

        return {
          ...item,

          exercise,
        };
      }),
    );

    setExercises(full);
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (showAdd) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAdd]);

  async function deleteExercise(workoutExerciseId: number) {
    await db.workoutExercises.delete(workoutExerciseId);

    const remaining = exercises.filter((item) => item.id !== workoutExerciseId);

    for (let i = 0; i < remaining.length; i++) {
      await db.workoutExercises.update(remaining[i].id, {
        order: i,
      });
    }

    load();
  }

  function updateExercise(exerciseId: number, field: string, value: any) {
    setExercises(
      exercises.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  async function moveExercise(index: number, direction: number) {
    const newExercises = [...exercises];

    const target = index + direction;

    if (target < 0 || target >= newExercises.length) {
      return;
    }

    [newExercises[index], newExercises[target]] = [
      newExercises[target],
      newExercises[index],
    ];

    for (let i = 0; i < newExercises.length; i++) {
      await db.workoutExercises.update(newExercises[i].id, {
        order: i,
      });

      newExercises[i].order = i;
    }

    setExercises(newExercises);
  }

  async function save() {
    for (const item of exercises) {
      const old = await db.workoutExercises.get(item.id);

      if (!old) continue;

      if (old.weight !== item.weight) {
        await db.weightHistory.add({
          exerciseId: item.exercise.id,

          oldWeight: old.weight,

          newWeight: item.weight,

          date: new Date(),
        });
      }

      await db.workoutExercises.update(item.id, {
        sets: item.sets,

        reps: item.reps,

        weight: item.weight,

        order: item.order,
      });
    }

    navigate(-1);
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
        Modifier {workout?.name}
      </h1>

      <button
        onClick={() => setShowAdd(true)}
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
        + Ajouter un exercice
      </button>

      <div
        className="
        mt-8
        space-y-4
        "
      >
        {exercises.map((item, index) => (
          <div
            key={item.id}
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
              items-center
              "
            >
              <h2
                className="
                font-bold
                text-lg
                "
              >
                {index + 1}. {item.exercise?.name}
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() => moveExercise(index, -1)}
                  className="
                  bg-neutral-800
                  px-3
                  py-2
                  rounded-xl
                  "
                >
                  ↑
                </button>

                <button
                  onClick={() => moveExercise(index, 1)}
                  className="
                  bg-neutral-800
                  px-3
                  py-2
                  rounded-xl
                  "
                >
                  ↓
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="number"
                value={item.sets}
                onChange={(e) =>
                  updateExercise(item.id, "sets", Number(e.target.value))
                }
                className="
                w-full
                bg-neutral-800
                rounded-xl
                p-3
                "
              />

              <input
                value={item.reps}
                onChange={(e) =>
                  updateExercise(item.id, "reps", e.target.value)
                }
                className="
                w-full
                bg-neutral-800
                rounded-xl
                p-3
                "
              />

              <input
                type="number"
                value={item.weight}
                onChange={(e) =>
                  updateExercise(item.id, "weight", Number(e.target.value))
                }
                className="
                w-full
                bg-neutral-800
                rounded-xl
                p-3
                "
              />
            </div>

            <button
              onClick={() => deleteExercise(item.id)}
              className="
              mt-4
              text-red-400
              "
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={save}
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
        Enregistrer les modifications
      </button>

      {showAdd && (
        <ExerciseFormModal
          mode="create"
          workoutId={Number(id)}
          order={exercises.length}
          onClose={() => setShowAdd(false)}
          onCreated={() => load()}
        />
      )}
    </div>
  );
}
