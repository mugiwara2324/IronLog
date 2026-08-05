import { useEffect, useState } from "react";

import { getExercises } from "../../services/exerciceService";

import type { Exercise } from "../../database/db";

import { createExercise } from "../../services/exerciceService";

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const data = await getExercises();

    setExercises(data);
  }

  async function addTestExercise() {
    await createExercise("Développé incliné haltères", "Pectoraux");

    loadExercises();
  }

  return (
    <div>
      <h1
        className="
text-3xl
font-bold
"
      >
        Exercices
      </h1>
      <button
        onClick={addTestExercise}
        className="
mt-5
bg-white
text-black
rounded-2xl
px-5
py-3
"
      >
        Ajouter exercice test
      </button>
      <div
        className="
mt-6
space-y-3
"
      >
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="
bg-neutral-900
rounded-3xl
p-5
"
          >
            <h2
              className="
text-xl
font-semibold
"
            >
              {exercise.name}
            </h2>

            <p
              className="
text-neutral-400
mt-1
"
            >
              {exercise.muscles?.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
