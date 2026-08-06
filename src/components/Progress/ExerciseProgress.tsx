import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import ExerciseProgressDetail from "./ExerciseProgressDetail";

export default function ExerciseProgress() {
  const [records, setRecords] = useState<any[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: exercises } = await supabase.from("exercises").select("*");

      const { data: history } = await supabase
        .from("weight_history")
        .select("*")
        .eq("user_id", user.id);

      const { data: dbRecords } = await supabase
        .from("records")
        .select("*")
        .eq("user_id", user.id);

      const data = (exercises ?? []).map((exercise: any) => {
        const exerciseHistory = (history ?? []).filter(
          (item: any) => (item.exercise_id ?? item.exerciseId) === exercise.id,
        );

        const weightHistory = exerciseHistory.length
          ? Math.max(
              ...exerciseHistory.map(
                (item: any) => item.new_weight ?? item.newWeight,
              ),
            )
          : 0;

        const record = (dbRecords ?? []).find(
          (item: any) => (item.exercise_id ?? item.exerciseId) === exercise.id,
        );

        return {
          ...exercise,
          bestWeight: record?.max_weight ?? record?.maxWeight ?? weightHistory,
          bestReps: record?.max_reps ?? record?.maxReps ?? 0,
          bestVolume: record?.max_volume ?? record?.maxVolume ?? 0,
          hasRecord: !!record,
        };
      });

      setRecords(data);
    }

    load();
  }, []);

  return (
    <div>
      <h2
        className="
text-xl
font-bold
"
      >
        Records exercices
      </h2>

      <div
        className="
mt-6
space-y-4
"
      >
        {records.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedExercise(item)}
            className="
bg-neutral-900
rounded-3xl
p-5
cursor-pointer
"
          >
            <div
              className="
flex
justify-between
items-center
"
            >
              <h3
                className="
font-bold
text-lg
"
              >
                {item.name}
              </h3>

              {item.hasRecord && (
                <span
                  className="
bg-yellow-500/20
text-yellow-400
px-3
py-1
rounded-full
text-sm
font-bold
"
                >
                  🏆 Record
                </span>
              )}
            </div>

            {item.bestWeight > 0 ? (
              <div
                className="
mt-3
text-neutral-400
space-y-1
"
              >
                <p>
                  Meilleur :{" "}
                  <span
                    className="
text-white
font-bold
"
                  >
                    {item.bestWeight} kg
                  </span>
                  {item.bestReps > 0 && ` × ${item.bestReps} reps`}
                </p>

                {item.bestVolume > 0 && (
                  <p>
                    Volume :{" "}
                    <span
                      className="
text-white
font-bold
"
                    >
                      {item.bestVolume} kg
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p
                className="
mt-2
text-neutral-400
"
              >
                Pas encore enregistré
              </p>
            )}
          </div>
        ))}
      </div>

      {selectedExercise && (
        <ExerciseProgressDetail
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
