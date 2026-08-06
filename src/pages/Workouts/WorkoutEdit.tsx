import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import ExerciseFormModal from "../../components/exercises/ExerciseFormModal";

export default function WorkoutEdit() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [workout, setWorkout] = useState<any>(null);

  const [exercises, setExercises] = useState<any[]>([]);

  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    if (!id) return;

    const { data: workoutData } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .limit(1);

    setWorkout(workoutData && workoutData[0] ? workoutData[0] : null);

    const { data: data } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("workout_id", id);

    const sortedData = (data ?? [])
      .slice()
      .sort(
        (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0),
      );

    const full = await Promise.all(
      (sortedData ?? []).map(async (item: any) => {
        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.exercise_id ?? item.exerciseId)
          .limit(1);

        return {
          ...item,
          exercise: exercise && exercise[0] ? exercise[0] : null,
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
    const confirmed = window.confirm(
      "Supprimer cet exercice de la séance ? Cette action est irréversible.",
    );

    if (!confirmed) {
      return;
    }

    await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", workoutExerciseId);

    const remaining = exercises.filter((item) => item.id !== workoutExerciseId);

    for (let i = 0; i < remaining.length; i++) {
      await supabase
        .from("workout_exercises")
        .update({ order: i })
        .eq("id", remaining[i].id);
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
      await supabase
        .from("workout_exercises")
        .update({ order: i })
        .eq("id", newExercises[i].id);

      newExercises[i].order = i;
    }

    setExercises(newExercises);
  }

  async function save() {
    for (const item of exercises) {
      const { data: oldData } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("id", item.id)
        .limit(1);

      const old = oldData && oldData[0] ? oldData[0] : null;

      if (!old) continue;

      if (old.weight !== item.weight) {
        await supabase.from("weight_history").insert({
          exercise_id: item.exercise.id,
          old_weight: old.weight,
          new_weight: item.weight,
          date: new Date().toISOString(),
        });
      }

      await supabase
        .from("workout_exercises")
        .update({
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          order: item.order,
        })
        .eq("id", item.id);
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
          workoutId={id}
          order={exercises.length}
          onClose={() => setShowAdd(false)}
          onCreated={() => load()}
        />
      )}
    </div>
  );
}
