import { useEffect, useState } from "react";

import { db } from "../../database/db";

import ExerciseProgressDetail from "./ExerciseProgressDetail";

export default function ExerciseProgress() {
  const [records, setRecords] = useState<any[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const exercises = await db.exercises.toArray();

      const history = await db.weightHistory.toArray();

      const dbRecords = await db.records.toArray();

      const data = exercises.map((exercise) => {
        const exerciseHistory = history.filter(
          (item) => item.exerciseId === exercise.id,
        );

        const weightHistory = exerciseHistory.length
          ? Math.max(...exerciseHistory.map((item) => item.newWeight))
          : 0;

        const record = dbRecords.find(
          (item) => item.exerciseId === exercise.id,
        );

        return {
          ...exercise,

          bestWeight: record?.maxWeight ?? weightHistory,

          bestReps: record?.maxReps ?? 0,

          bestVolume: record?.maxVolume ?? 0,

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
