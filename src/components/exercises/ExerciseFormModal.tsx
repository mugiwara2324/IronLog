import { useState } from "react";

import { db } from "../../database/db";

interface Props {
  mode: "create" | "edit";

  workoutId?: number;

  order?: number;

  exercise?: any;

  workoutExercise?: any;

  onClose: () => void;

  onCreated?: () => void;

  onUpdated?: (newExerciseId: number) => void;
}

const musclesList = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Avant-bras",
  "Quadriceps",
  "Ischios",
  "Fessiers",
  "Mollets",
  "Abdos",
  "Lombaires",
];

export default function ExerciseFormModal({
  mode,

  workoutId,

  order,

  exercise,

  workoutExercise,

  onClose,

  onCreated,

  onUpdated,
}: Props) {
  const [name, setName] = useState(exercise?.name ?? "");

  const [description, setDescription] = useState(exercise?.description ?? "");

  const [muscles, setMuscles] = useState<string[]>(exercise?.muscles ?? []);

  const [sets, setSets] = useState(workoutExercise?.sets ?? 3);

  const [reps, setReps] = useState(workoutExercise?.reps ?? "10");

  const [weight, setWeight] = useState(workoutExercise?.weight ?? 0);

  function toggleMuscle(muscle: string) {
    if (muscles.includes(muscle)) {
      setMuscles(muscles.filter((item) => item !== muscle));
    } else {
      setMuscles([...muscles, muscle]);
    }
  }

  async function save() {
    if (!name.trim()) {
      return;
    }

    // =====================
    // CREATION
    // =====================

    if (mode === "create") {
      if (!workoutId) {
        return;
      }

      const exerciseId = await db.exercises.add({
        name,

        description,

        muscles,

        createdAt: new Date(),
      });

      await db.workoutExercises.add({
        workoutId,

        exerciseId,

        order: order ?? 0,

        sets,

        reps,

        weight,
      });

      onCreated?.();

      onClose();

      return;
    }

    // =====================
    // MODIFICATION
    // OPTION 2
    // Création d'une copie
    // =====================

    if (mode === "edit" && exercise && workoutExercise) {
      const newExerciseId = await db.exercises.add({
        name,

        description,

        muscles,

        createdAt: new Date(),
      });

      await db.workoutExercises.update(
        workoutExercise.id,

        {
          exerciseId: newExerciseId,

          sets,

          reps,

          weight,
        },
      );

      onUpdated?.(newExerciseId);

      onClose();
    }
  }

  return (
    <div
      className="
      fixed
      inset-0
      bg-black/70
      flex
      items-center
      justify-center
      p-5
      z-50
      "
    >
      <div
        className="
        bg-neutral-900
        rounded-3xl
        p-6
        w-full
        max-w-md
        max-h-[90vh]
        overflow-y-auto
        "
      >
        <h2
          className="
          text-2xl
          font-bold
          "
        >
          {mode === "create" ? "Nouvel exercice" : "Modifier l'exercice"}
        </h2>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Nom de l'exercice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <div>
            <p
              className="
              text-neutral-400
              mb-3
              "
            >
              Muscles engagés
            </p>

            <div
              className="
              flex
              flex-wrap
              gap-2
              "
            >
              {musclesList.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  className={`

                      px-3
                      py-2
                      rounded-full
                      text-sm

                      ${
                        muscles.includes(muscle)
                          ? "bg-white text-black"
                          : "bg-neutral-800"
                      }

                      `}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-neutral-400">Séries</label>

            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="
              w-full
              bg-neutral-800
              rounded-xl
              p-3
              "
            />
          </div>

          <div>
            <label className="text-neutral-400">Répétitions</label>

            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="
              w-full
              bg-neutral-800
              rounded-xl
              p-3
              "
            />
          </div>

          <div>
            <label className="text-neutral-400">Charge</label>

            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="
              w-full
              bg-neutral-800
              rounded-xl
              p-3
              "
            />
          </div>
        </div>

        <button
          onClick={save}
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
          {mode === "create" ? "Ajouter à la séance" : "Enregistrer"}
        </button>

        <button
          onClick={onClose}
          className="
          mt-3
          w-full
          text-neutral-400
          "
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
