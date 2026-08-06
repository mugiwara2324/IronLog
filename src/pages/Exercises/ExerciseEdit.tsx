import { useEffect, useState } from "react";

import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function ExerciseEdit() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const workoutExerciseId = searchParams.get("workoutExercise");

  const [exercise, setExercise] = useState<any>(null);

  const [workoutExercise, setWorkoutExercise] = useState<any>(null);

  const [sets, setSets] = useState(0);

  const [reps, setReps] = useState("");

  const [weight, setWeight] = useState(0);

  useEffect(() => {
    async function load() {
      if (!id || !workoutExerciseId) {
        return;
      }
      const { data: exerciseData } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .limit(1);

      setExercise(exerciseData && exerciseData[0] ? exerciseData[0] : null);

      const { data: workoutData } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("id", workoutExerciseId)
        .limit(1);

      const wd = workoutData && workoutData[0] ? workoutData[0] : null;

      setWorkoutExercise(wd);

      if (wd) {
        setSets(wd.sets);

        setReps(wd.reps);

        setWeight(wd.weight);
      }
    }

    load();
  }, [id, workoutExerciseId]);

  if (!exercise || !workoutExercise) {
    return <div>Chargement...</div>;
  }

  async function save() {
    const { data: oldExerciseData } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("id", workoutExerciseId)
      .limit(1);

    const oldExercise =
      oldExerciseData && oldExerciseData[0] ? oldExerciseData[0] : null;

    if (!oldExercise) {
      return;
    }

    // Vérifie si le poids a changé

    if (oldExercise.weight !== weight) {
      await supabase.from("weight_history").insert({
        exercise_id: id,
        old_weight: oldExercise.weight,
        new_weight: weight,
        date: new Date().toISOString(),
      });
    }

    await supabase
      .from("workout_exercises")
      .update({ sets, reps, weight })
      .eq("id", workoutExerciseId);

    navigate(-1);
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
        Modifier
        <br />
        {exercise.name}
      </h1>

      <div
        className="
            mt-8
            space-y-4
            "
      >
        <div>
          <label>Séries</label>

          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            className="
                w-full
                bg-neutral-900
                rounded-xl
                p-4
                "
          />
        </div>

        <div>
          <label>Répétitions</label>

          <input
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="
                w-full
                bg-neutral-900
                rounded-xl
                p-4
                "
          />
        </div>

        <div>
          <label>Charge (kg)</label>

          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="
                w-full
                bg-neutral-900
                rounded-xl
                p-4
                "
          />
        </div>
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
        Enregistrer
      </button>
    </div>
  );
}
