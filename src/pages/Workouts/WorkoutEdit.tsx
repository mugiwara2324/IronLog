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

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      .sort((a: any, b: any) =>
        Number(a.order ?? a.order_index ?? 0) -
        Number(b.order ?? b.order_index ?? 0),
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

    setErrorMessage(null);

    const { error: deleteError } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", workoutExerciseId);

    if (deleteError) {
      setErrorMessage("Impossible de supprimer cet exercice.");
      return;
    }

    const remaining = exercises.filter((item) => item.id !== workoutExerciseId);

    const results = await Promise.all(remaining.map((item, position) =>
      supabase
        .from("workout_exercises")
        .update({ order: position, order_index: position })
        .eq("id", item.id),
    ));

    if (results.some((result) => result.error)) {
      setErrorMessage("L'exercice a été supprimé, mais l'ordre n'a pas pu être enregistré.");
      return;
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

  function moveExercise(index: number, direction: number) {
    const newExercises = [...exercises];

    const target = index + direction;

    if (target < 0 || target >= newExercises.length) {
      return;
    }

    [newExercises[index], newExercises[target]] = [
      newExercises[target],
      newExercises[index],
    ];

    setExercises(newExercises.map((exercise, position) => ({
      ...exercise,
      order: position,
      order_index: position,
    })));
  }

  async function save() {
    setSaving(true);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const { data: savedExercises, error: readError } = await supabase
        .from("workout_exercises")
        .select("id, exercise_id, weight")
        .eq("workout_id", id);

      if (readError) throw readError;
      const savedById = new Map((savedExercises ?? []).map((item) => [item.id, item]));

      await Promise.all(exercises.map(async (item, position) => {
        const old = savedById.get(item.id);
        const { error } = await supabase
          .from("workout_exercises")
          .update({ sets: Number(item.sets), reps: item.reps, weight: Number(item.weight), order: position, order_index: position })
          .eq("id", item.id);
        if (error) throw error;

        if (old && Number(old.weight) !== Number(item.weight)) {
          const { error: historyError } = await supabase.from("weight_history").insert({
            user_id: user.id,
            exercise_id: old.exercise_id,
            old_weight: old.weight,
            new_weight: Number(item.weight),
            date: new Date().toISOString(),
          });
          if (historyError) throw historyError;
        }
      }));

      navigate(-1);
    } catch (error: unknown) {
      console.error("Erreur sauvegarde séance :", error);
      setErrorMessage(error instanceof Error ? error.message : "La séance n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
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
        disabled={saving}
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
        {saving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>

      {errorMessage && <p className="mt-4 text-red-400">{errorMessage}</p>}

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
