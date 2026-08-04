import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { db } from "../../database/db";

import WorkoutExerciseEditor from "../../components/WorkoutExerciseEditor/WorkoutExerciseEditor";

export default function WorkoutActive() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [exercises, setExercises] = useState<any[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const [newRecords, setNewRecords] = useState<any[]>([]);

  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);

  async function loadExercises() {
    if (!id) return;

    const activeWorkout = await db.activeWorkout
      .where("workoutId")
      .equals(Number(id))
      .first();

    /*
      Si une ancienne séance existe
      et qu'elle n'est pas du jour
    */

    if (activeWorkout) {
      const today = new Date();

      const start = new Date(activeWorkout.startedAt);

      if (
        start.getDate() !== today.getDate() ||
        start.getMonth() !== today.getMonth() ||
        start.getFullYear() !== today.getFullYear()
      ) {
        await db.activeWorkoutExercises
          .where("workoutId")
          .equals(Number(id))
          .delete();

        await db.activeWorkout.delete(activeWorkout.id!);

        return;
      }

      setActiveWorkoutId(activeWorkout.id!);
    }

    const activeExercises = await db.activeWorkoutExercises
      .where("workoutId")
      .equals(Number(id))
      .sortBy("order");

    const fullExercises = await Promise.all(
      activeExercises.map(async (item) => {
        const exercise = await db.exercises.get(item.exerciseId);

        const workoutExercise = await db.workoutExercises
          .where("workoutId")
          .equals(Number(id))
          .filter((x) => x.exerciseId === item.exerciseId)
          .first();

        return {
          ...item,

          exercise,

          workoutExercise,
        };
      }),
    );

    setExercises(fullExercises);
  }

  useEffect(() => {
    loadExercises();
  }, [id]);

  async function toggleExercise(exerciseId: number, done: boolean) {
    await db.activeWorkoutExercises.update(exerciseId, {
      done,
    });

    if (activeWorkoutId) {
      await db.activeWorkout.update(activeWorkoutId, {
        updatedAt: new Date(),
      });
    }

    setExercises(
      exercises.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              done,
            }
          : item,
      ),
    );
  }

  function getBestWeight(sets: any[]) {
    if (!sets || !sets.length) {
      return 0;
    }

    const maxReps = Math.max(...sets.map((set) => Number(set.reps)));

    const bestSets = sets.filter((set) => Number(set.reps) === maxReps);

    return Math.max(...bestSets.map((set) => Number(set.weight)));
  }

  async function checkRecord(item: any) {
    if (!item.sets?.length) {
      return;
    }

    const bestSet = item.sets.reduce((best: any, current: any) => {
      const currentVolume = Number(current.weight) * Number(current.reps);

      const bestVolume = Number(best.weight) * Number(best.reps);

      return currentVolume > bestVolume ? current : best;
    });

    const volume = Number(bestSet.weight) * Number(bestSet.reps);

    const record = await db.records
      .where("exerciseId")
      .equals(item.exerciseId)
      .first();

    let isNew = false;

    if (!record) {
      await db.records.add({
        exerciseId: item.exerciseId,

        maxWeight: Number(bestSet.weight),

        maxReps: Number(bestSet.reps),

        maxVolume: volume,

        date: new Date(),
      });

      isNew = true;
    } else if (
      Number(bestSet.weight) > record.maxWeight ||
      Number(bestSet.reps) > record.maxReps ||
      volume > record.maxVolume
    ) {
      await db.records.update(
        record.id!,

        {
          maxWeight: Math.max(record.maxWeight, Number(bestSet.weight)),

          maxReps: Math.max(record.maxReps, Number(bestSet.reps)),

          maxVolume: Math.max(record.maxVolume, volume),

          date: new Date(),
        },
      );

      isNew = true;
    }

    if (isNew) {
      setNewRecords((prev) => [
        ...prev,

        {
          name: item.exercise?.name,

          weight: Number(bestSet.weight),

          reps: Number(bestSet.reps),
        },
      ]);
    }
  }

  async function finishWorkout() {
    const confirm = window.confirm(
      "Terminer cette séance ?\n\nElle sera enregistrée dans ton historique.",
    );

    if (!confirm) {
      return;
    }

    if (!id) {
      return;
    }

    let volume = 0;

    for (const item of exercises) {
      if (!item.done) {
        continue;
      }

      item.sets?.forEach((set: any) => {
        volume += Number(set.weight) * Number(set.reps);
      });

      if (item.sets?.length) {
        const bestWeight = getBestWeight(item.sets);

        const oldWeight = item.workoutExercise?.weight;

        if (oldWeight !== undefined && bestWeight > oldWeight) {
          await db.weightHistory.add({
            exerciseId: item.exerciseId,

            oldWeight,

            newWeight: bestWeight,

            date: new Date(),
          });

          await db.workoutExercises
            .where("id")
            .equals(item.workoutExercise.id)
            .modify({
              weight: bestWeight,
            });
        }

        await checkRecord(item);
      }
    }

    await db.workoutHistory.add({
      workoutId: Number(id),

      date: new Date(),

      volume,

      completedExercises: exercises.filter((item) => item.done).length,
    });

    await db.activeWorkoutExercises
      .where("workoutId")
      .equals(Number(id))
      .delete();

    if (activeWorkoutId) {
      await db.activeWorkout.delete(activeWorkoutId);
    }

    navigate("/");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Séance en cours</h1>

      <p className="mt-2 text-neutral-400">
        {exercises.filter((item) => item.done).length}/{exercises.length}
        exercices terminés
      </p>

      <div className="mt-8 space-y-4">
        {exercises.map((item, index) => (
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
            <div className="flex gap-3 items-center">
              <input
                type="checkbox"
                checked={item.done}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => toggleExercise(item.id, e.target.checked)}
              />

              <h2 className="font-bold text-lg">
                {index + 1}. {item.exercise?.name}
              </h2>
            </div>

            <p className="mt-3 text-neutral-400">
              {item.workoutExercise?.sets}
              séries ×{item.workoutExercise?.reps}
            </p>

            <p className="mt-1">
              Charge validée :
              {item.sets ? ` ${getBestWeight(item.sets)} kg` : " -"}
            </p>
          </div>
        ))}

        <button
          onClick={finishWorkout}
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
          Terminer la séance
        </button>
      </div>

      {selectedExercise && (
        <WorkoutExerciseEditor
          item={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onSave={async () => {
            await loadExercises();

            setSelectedExercise(null);
          }}
        />
      )}

      {newRecords.length > 0 && (
        <div
          className="
          fixed
          inset-0
          bg-black/70
          flex
          items-center
          justify-center
          p-4
          "
        >
          <div
            className="
            bg-neutral-900
            rounded-3xl
            p-6
            w-full
            max-w-md
            "
          >
            <h2 className="text-2xl font-bold">🏆 Nouveau(x) record(s)</h2>

            {newRecords.map((record, index) => (
              <div
                key={index}
                className="
                bg-neutral-800
                rounded-2xl
                p-4
                mt-4
                "
              >
                <p className="font-bold">{record.name}</p>

                <p>
                  {record.weight}kg × {record.reps}
                </p>
              </div>
            ))}

            <button
              onClick={() => navigate("/")}
              className="
              mt-6
              w-full
              bg-white
              text-black
              rounded-2xl
              py-3
              "
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
