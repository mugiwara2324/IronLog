import { useState } from "react";

import { supabase } from "../../lib/supabase";

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
  const [sets, setSets] = useState(
    (item.sets ?? []).map((set: any) => ({
      weight: set.weight,
      reps: set.reps,
    })),
  );

  const [comment, setComment] = useState(item.comment ?? "");

  function updateSet(index: number, field: "weight" | "reps", value: string) {
    const newSets = [...sets];

    newSets[index] = {
      ...newSets[index],

      [field]: value === "" ? "" : Number(value),
    };

    setSets(newSets);
  }

  async function save() {
    try {
      /*
        Sauvegarde de l'exercice actif
      */
      const { error: updateError } = await supabase
        .from("active_workout_exercises")
        .update({
          sets,
          comment,
        })
        .eq("id", item.id);

      if (updateError) {
        throw updateError;
      }

      /*
        Mise à jour date séance active
      */
      if (item.workout_id) {
        const { data: activeWorkout, error: activeError } = await supabase
          .from("active_workout")
          .select("id")
          .eq("workout_id", item.workout_id)
          .limit(1);

        if (activeError) {
          throw activeError;
        }

        if (activeWorkout && activeWorkout[0]?.id) {
          const { error: updateDateError } = await supabase
            .from("active_workout")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeWorkout[0].id);

          if (updateDateError) {
            throw updateDateError;
          }
        }
      }

      onSave();

      onClose();
    } catch (error) {
      console.error("Erreur sauvegarde exercice :", error);
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
        <h2 className="text-xl font-bold">{item.exercise?.name}</h2>

        <p className="text-neutral-400 mt-2">
          {item.exercise?.muscles?.join(" • ")}
        </p>

        <div className="mt-6 space-y-4">
          {sets.map((set: any, index: number) => (
            <div
              key={index}
              className="
                bg-neutral-800
                rounded-2xl
                p-4
                "
            >
              <p className="font-semibold mb-3">Série {index + 1}</p>

              <div className="flex gap-3">
                <div className="w-1/2">
                  <p className="text-xs text-neutral-400 mb-1">Poids (kg)</p>

                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(index, "weight", e.target.value)}
                    className="
                      w-full
                      rounded-xl
                      p-3
                      bg-neutral-700
                      "
                  />
                </div>

                <div className="w-1/2">
                  <p className="text-xs text-neutral-400 mb-1">Répétitions</p>

                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(index, "reps", e.target.value)}
                    className="
                      w-full
                      rounded-xl
                      p-3
                      bg-neutral-700
                      "
                  />
                </div>
              </div>
            </div>
          ))}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire sur l'exercice..."
            className="
            mt-4
            w-full
            rounded-xl
            p-3
            bg-neutral-800
            min-h-24
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
