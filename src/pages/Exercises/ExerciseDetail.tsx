import { useEffect, useState } from "react";

import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import ExerciseFormModal from "../../components/exercises/ExerciseFormModal";

export default function ExerciseDetail() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const workoutExerciseId = searchParams.get("workoutExercise");

  const [exercise, setExercise] = useState<any>(null);

  const [workoutExercise, setWorkoutExercise] = useState<any>(null);

  const [history, setHistory] = useState<any[]>([]);

  const [showEdit, setShowEdit] = useState(false);

  async function load(exerciseId?: string) {
    const currentExerciseId = exerciseId ?? id;

    if (!currentExerciseId) {
      return;
    }

    const { data: exerciseData } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", currentExerciseId)
      .limit(1);

    setExercise(exerciseData && exerciseData[0] ? exerciseData[0] : null);

    if (workoutExerciseId) {
      const { data: workoutData } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("id", workoutExerciseId)
        .limit(1);

      setWorkoutExercise(workoutData && workoutData[0] ? workoutData[0] : null);
    }

    const { data: historyData } = await supabase
      .from("weight_history")
      .select("*")
      .eq("exercise_id", currentExerciseId)
      .order("date", { ascending: false })
      .limit(3);

    setHistory(historyData ?? []);
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!exercise) {
    return <div>Chargement...</div>;
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
        {exercise.name}
      </h1>

      <div
        className="
        mt-6
        bg-neutral-900
        rounded-3xl
        p-5
        "
      >
        <h2
          className="
          font-bold
          text-xl
          "
        >
          Muscles engagés
        </h2>

        <div
          className="
          mt-3
          flex
          flex-wrap
          gap-2
          "
        >
          {exercise.muscles?.length ? (
            exercise.muscles.map((muscle: string) => (
              <span
                key={muscle}
                className="
                bg-neutral-800
                rounded-full
                px-4
                py-2
                text-sm
                "
              >
                {muscle}
              </span>
            ))
          ) : (
            <p className="text-neutral-400">Aucun muscle renseigné</p>
          )}
        </div>
      </div>

      <div
        className="
        mt-4
        bg-neutral-900
        rounded-3xl
        p-5
        "
      >
        <h2
          className="
          font-bold
          text-xl
          "
        >
          Description
        </h2>

        <p
          className="
          mt-3
          text-neutral-300
          leading-relaxed
          "
        >
          {exercise.description || "Aucune description disponible."}
        </p>
      </div>

      {workoutExercise && (
        <div
          className="
          mt-8
          bg-neutral-900
          rounded-3xl
          p-5
          "
        >
          <h2
            className="
            font-bold
            text-xl
            "
          >
            Paramètres de séance
          </h2>

          <div
            className="
            mt-4
            space-y-2
            "
          >
            <p>Séries : {workoutExercise.sets}</p>

            <p>Répétitions : {workoutExercise.reps}</p>

            <p>
              Charge :
              {workoutExercise.weight === 0
                ? " Poids du corps"
                : ` ${workoutExercise.weight} kg`}
            </p>
          </div>
        </div>
      )}

      <div
        className="
        mt-5
        bg-neutral-900
        rounded-3xl
        p-5
        "
      >
        <h2
          className="
          font-bold
          text-xl
          "
        >
          Evolution des charges
        </h2>

        {history.length === 0 ? (
          <p
            className="
              text-neutral-400
              mt-3
              "
          >
            Aucune évolution enregistrée.
          </p>
        ) : (
          <div
            className="
              mt-4
              space-y-4
              "
          >
            {history.map((item) => (
              <div
                key={item.id}
                className="
                    bg-neutral-800
                    rounded-2xl
                    p-4
                    "
              >
                <p className="text-sm text-neutral-400">
                  {new Date(item.date).toLocaleDateString("fr-FR")}
                </p>

                <p className="mt-2">
                  {item.oldWeight} kg
                  {" → "}
                  {item.newWeight} kg
                </p>

                <p className="text-green-400 font-semibold">
                  +{item.newWeight - item.oldWeight}
                  kg
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowEdit(true)}
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
        Modifier l'exercice
      </button>

      {showEdit && (
        <ExerciseFormModal
          mode="edit"
          exercise={exercise}
          workoutExercise={workoutExercise}
          onClose={() => {
            setShowEdit(false);
          }}
          onUpdated={(newExerciseId: string) => {
            setShowEdit(false);

            const query = searchParams.toString();
            navigate(`/exercises/${newExerciseId}${query ? `?${query}` : ""}`, { replace: true });
            load(newExerciseId);
          }}
        />
      )}
    </div>
  );
}
