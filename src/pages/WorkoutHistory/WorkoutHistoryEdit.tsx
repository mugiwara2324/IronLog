import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { recalculateExerciseRecord } from "../../services/recordService";

export default function WorkoutHistoryEdit() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [sets, setSets] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;

    const { data, error } = await supabase
      .from("performed_sets")
      .select(
        `
        id,
        exercise_id,
        weight,
        reps,
        set_number,
        exercises(
          name
        )
      `,
      )
      .eq("session_id", id)
      .order("exercise_id")
      .order("set_number");

    if (error) {
      console.error(error);

      return;
    }

    setSets(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  function updateSet(index: number, field: string, value: any) {
    setSets((prev) => {
      const copy = [...prev];

      copy[index] = {
        ...copy[index],
        [field]: value,
      };

      return copy;
    });
  }

  async function save() {
    if (!id) return;

    /*
    1) Mise à jour des séries modifiées
  */

    for (const set of sets) {
      const { error } = await supabase
        .from("performed_sets")
        .update({
          weight: Number(set.weight),
          reps: Number(set.reps),
        })
        .eq("id", set.id);

      if (error) {
        console.error("Erreur modification série :", error);

        return;
      }
    }

    /*
    2) Récupération des séries actuelles
    pour recalculer le volume
  */

    const { data: updatedSets, error: fetchError } = await supabase
      .from("performed_sets")
      .select(
        `
      weight,
      reps
    `,
      )
      .eq("session_id", id);

    if (fetchError) {
      console.error("Erreur récupération séries :", fetchError);

      return;
    }

    /*
    3) Calcul volume total
  */

    let volume = 0;

    (updatedSets ?? []).forEach((set: any) => {
      volume += Number(set.weight) * Number(set.reps);
    });

    /*
    4) Mise à jour du résumé séance
  */

    const { error: updateError } = await supabase
      .from("workout_sessions")
      .update({
        volume,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Erreur mise à jour volume :", updateError);

      return;
    }

    /*
  Recalcul des records concernés
*/

    const exerciseIds = [...new Set(sets.map((set: any) => set.exercise_id))];

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      for (const exerciseId of exerciseIds) {
        await recalculateExerciseRecord(user.id, exerciseId);
      }
    }

    navigate(-1);
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Modifier la séance</h1>

      <div className="mt-6 space-y-4">
        {sets.map((set, index) => (
          <div
            key={set.id}
            className="
              bg-neutral-900
              rounded-3xl
              p-5
              "
          >
            <h2 className="font-bold text-lg">{set.exercises?.name}</h2>

            <p className="text-neutral-400 mt-2">
              Série {set.set_number ?? index + 1}
            </p>

            <div
              className="
                flex
                gap-3
                mt-4
              "
            >
              <input
                type="number"
                value={set.weight}
                onChange={(e) => updateSet(index, "weight", e.target.value)}
                className="
                  bg-neutral-800
                  rounded-xl
                  p-3
                  w-full
                  "
              />

              <input
                type="number"
                value={set.reps}
                onChange={(e) => updateSet(index, "reps", e.target.value)}
                className="
                  bg-neutral-800
                  rounded-xl
                  p-3
                  w-full
                  "
              />
            </div>

            <div
              className="
                flex
                gap-2
                mt-2
                text-neutral-400
                text-sm
              "
            >
              <span>kg</span>

              <span>répétitions</span>
            </div>
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
        Sauvegarder
      </button>
    </div>
  );
}
