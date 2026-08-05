import { useState } from "react";

import { db } from "../../database/db";

interface Props {
  item: any;

  onClose: () => void;

  onSave: () => void;
}

export default function WorkoutExerciseEditor({
  item,
  onClose,
  onSave,
}: Props) {
  const [sets, setSets] = useState(item.sets);

  const [comment, setComment] = useState(item.comment ?? "");

  function updateSet(index: number, field: "weight" | "reps", value: number) {
    const newSets = [...sets];

    newSets[index] = {
      ...newSets[index],

      [field]: value,
    };

    setSets(newSets);
  }

  async function save() {
    await db.activeWorkoutExercises.update(item.id, {
      sets,

      comment,
    });

    onSave();

    onClose();
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
overflow-hidden
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
max-h-[85vh]
overflow-y-auto
"
      >
        <h2
          className="
text-xl
font-bold
"
        >
          {item.exercise.name}
        </h2>

        <div
          className="
mt-6
space-y-4
"
        >
          {sets.map((set: any, index: number) => (
            <div
              key={index}
              className="
bg-neutral-800
rounded-2xl
p-4
"
            >
              <p
                className="
font-semibold
mb-3
"
              >
                Série {index + 1}
              </p>

              <div
                className="
flex
gap-3
"
              >
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(index, "weight", Number(e.target.value))
                  }
                  className="
w-1/2
rounded-xl
p-3
bg-neutral-700
"
                />

                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(index, "reps", Number(e.target.value))
                  }
                  className="
w-1/2
rounded-xl
p-3
bg-neutral-700
"
                />
              </div>
            </div>
          ))}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire..."
            className="
mt-4
w-full
rounded-xl
p-3
bg-neutral-800
"
          />
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
          Enregistrer
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
