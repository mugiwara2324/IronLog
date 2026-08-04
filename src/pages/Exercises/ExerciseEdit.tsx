import { useEffect, useState } from "react";

import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import { db } from "../../database/db";

export default function ExerciseEdit() {
  const { id } = useParams();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const workoutExerciseId = Number(searchParams.get("workoutExercise"));

  const [exercise, setExercise] = useState<any>(null);

  const [workoutExercise, setWorkoutExercise] = useState<any>(null);

  const [sets, setSets] = useState(0);

  const [reps, setReps] = useState("");

  const [weight, setWeight] = useState(0);

  useEffect(() => {
    async function load() {
      const exerciseData = await db.exercises.get(Number(id));

      setExercise(exerciseData);

      const workoutData = await db.workoutExercises.get(workoutExerciseId);

      setWorkoutExercise(workoutData);

      if (workoutData) {
        setSets(workoutData.sets);

        setReps(workoutData.reps);

        setWeight(workoutData.weight);
      }
    }

    load();
  }, []);

  if (!exercise || !workoutExercise) {
    return <div>Chargement...</div>;
  }

  async function save() {
    const oldExercise = await db.workoutExercises.get(workoutExerciseId);

    if (!oldExercise) {
      return;
    }

    // Vérifie si le poids a changé

    if (oldExercise.weight !== weight) {
      await db.weightHistory.add({
        exerciseId: Number(id),

        oldWeight: oldExercise.weight,

        newWeight: weight,

        date: new Date(),
      });
    }

    await db.workoutExercises.update(
      workoutExerciseId,

      {
        sets,

        reps,

        weight,
      },
    );

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
