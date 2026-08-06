import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import WorkoutExerciseEditor from "../../components/WorkoutExerciseEditor/WorkoutExerciseEditor";

export default function WorkoutActive() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [exercises, setExercises] = useState<any[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const [newRecords, setNewRecords] = useState<any[]>([]);

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  async function loadExercises() {
    if (!id) {
      return;
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return;
    }

    const { data: activeWorkout } = await supabase
      .from("active_workout")
      .select("*")
      .eq("workout_id", id)
      .eq("user_id", user.id)
      .limit(1);

    const aw =
      activeWorkout && activeWorkout.length > 0 ? activeWorkout[0] : null;

    if (aw) {
      const today = new Date();

      const start = new Date(aw.started_at);

      if (
        start.getDate() !== today.getDate() ||
        start.getMonth() !== today.getMonth() ||
        start.getFullYear() !== today.getFullYear()
      ) {
        await supabase
          .from("active_workout_exercises")
          .delete()
          .eq("workout_id", id);

        await supabase
          .from("active_workout")
          .delete()
          .eq("id", aw.id)
          .eq("user_id", user.id);

        setExercises([]);

        return;
      }

      setActiveWorkoutId(aw.id);
    }

    /*
      active_workout_exercises ne possède pas user_id
    */

    const { data: activeExercises, error } = await supabase
      .from("active_workout_exercises")
      .select("*")
      .eq("workout_id", id);

    if (error) {
      console.error("Erreur récupération exercices actifs :", error);

      return;
    }

    console.log("ACTIVE EXERCISES :", activeExercises);

    const sortedActiveExercises = (activeExercises ?? [])
      .slice()
      .sort((a: any, b: any) => Number(a.order) - Number(b.order));

    const fullExercises = await Promise.all(
      sortedActiveExercises.map(async (item: any) => {
        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.exercise_id)
          .limit(1);

        const { data: workoutExercise } = await supabase
          .from("workout_exercises")
          .select("*")
          .eq("workout_id", id)
          .eq("exercise_id", item.exercise_id)
          .limit(1);

        return {
          ...item,

          workout_id: id,

          exercise: exercise && exercise.length > 0 ? exercise[0] : null,

          workoutExercise:
            workoutExercise && workoutExercise.length > 0
              ? workoutExercise[0]
              : null,
        };
      }),
    );

    setExercises(fullExercises);

    if (fullExercises.length === 0) {
      console.warn("Séance active vide détectée");
    }
  }

  useEffect(() => {
    loadExercises();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentState();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [exercises]);

  async function toggleExercise(activeExerciseId: string, done: boolean) {
    const { error } = await supabase
      .from("active_workout_exercises")
      .update({
        done,
      })
      .eq("id", activeExerciseId);

    if (error) {
      console.error("Erreur update exercice :", error);

      return;
    }

    if (activeWorkoutId) {
      await supabase
        .from("active_workout")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeWorkoutId);
    }

    setExercises((prev) =>
      prev.map((item) =>
        item.id === activeExerciseId
          ? {
              ...item,
              done,
            }
          : item,
      ),
    );
  }

  function getBestWeight(sets: any[]) {
    if (!sets || sets.length === 0) {
      return 0;
    }

    const maxReps = Math.max(...sets.map((set) => Number(set.reps)));

    const bestSets = sets.filter((set) => Number(set.reps) === maxReps);

    return Math.max(...bestSets.map((set) => Number(set.weight)));
  }
  async function checkRecord(item: any) {
    if (!item.sets || item.sets.length === 0) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const bestSet = item.sets.reduce((best: any, current: any) => {
      const currentVolume = Number(current.weight) * Number(current.reps);

      const bestVolume = Number(best.weight) * Number(best.reps);

      return currentVolume > bestVolume ? current : best;
    });

    const volume = Number(bestSet.weight) * Number(bestSet.reps);

    const { data: recordData } = await supabase
      .from("records")
      .select("*")
      .eq("exercise_id", item.exercise_id)
      .limit(1);

    const record = recordData && recordData.length > 0 ? recordData[0] : null;

    let isNew = false;

    if (!record) {
      await supabase.from("records").insert({
        user_id: user.id,

        exercise_id: item.exercise_id,

        max_weight: Number(bestSet.weight),

        max_reps: Number(bestSet.reps),

        max_volume: volume,

        date: new Date().toISOString(),
      });

      isNew = true;
    } else if (
      Number(bestSet.weight) > Number(record.max_weight) ||
      Number(bestSet.reps) > Number(record.max_reps) ||
      volume > Number(record.max_volume)
    ) {
      await supabase
        .from("records")
        .update({
          max_weight: Math.max(
            Number(record.max_weight),
            Number(bestSet.weight),
          ),

          max_reps: Math.max(Number(record.max_reps), Number(bestSet.reps)),

          max_volume: Math.max(Number(record.max_volume), volume),

          date: new Date().toISOString(),
        })
        .eq("id", record.id);

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
    await saveCurrentState();

    if (!id) {
      return;
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("Utilisateur non authentifié");

      return;
    }

    /*
      Une séance vide est autorisée
      (cas crash / bug / test)
    */

    const allDone =
      exercises.length === 0 ||
      exercises.every((exercise) => exercise.done === true);

    if (!allDone) {
      alert(
        "Tous les exercices doivent être terminés avant de valider la séance.",
      );

      return;
    }

    const confirm = window.confirm(
      "Terminer cette séance ?\n\nElle sera enregistrée dans ton historique.",
    );

    if (!confirm) {
      return;
    }

    let volume = 0;

    for (const item of exercises) {
      item.sets?.forEach((set: any) => {
        volume += Number(set.weight) * Number(set.reps);
      });

      if (item.sets?.length) {
        const bestWeight = getBestWeight(item.sets);

        const oldWeight = item.workoutExercise?.weight;

        if (oldWeight !== undefined && bestWeight > Number(oldWeight)) {
          await supabase.from("weight_history").insert({
            user_id: user.id,

            exercise_id: item.exercise_id,

            old_weight: oldWeight,

            new_weight: bestWeight,

            date: new Date().toISOString(),
          });

          if (item.workoutExercise?.id) {
            await supabase
              .from("workout_exercises")
              .update({
                weight: bestWeight,
              })
              .eq("id", item.workoutExercise.id);
          }
        }

        await checkRecord(item);
      }
    }

    /*
      Historique séance
    */

    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,

        workout_id: id,

        started_at: new Date().toISOString(),

        finished_at: new Date().toISOString(),

        volume,

        completed_exercises: exercises.length,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Erreur création session :", sessionError);

      return;
    } /*
      Sauvegarde des séries réalisées
    */

    const performedSets: any[] = [];

    for (const item of exercises) {
      for (const set of item.sets ?? []) {
        performedSets.push({
          session_id: session.id,

          exercise_id: item.exercise_id,

          weight: Number(set.weight),

          reps: Number(set.reps),
        });
      }
    }

    if (performedSets.length > 0) {
      const { error: performedError } = await supabase
        .from("performed_sets")
        .insert(performedSets);

      if (performedError) {
        console.error("Erreur performed sets :", performedError);
      }
    }

    /*
      Suppression séance active
    */

    const { error: deleteExercisesError } = await supabase
      .from("active_workout_exercises")
      .delete()
      .eq("workout_id", id);

    if (deleteExercisesError) {
      console.error(
        "Erreur suppression exercices actifs :",
        deleteExercisesError,
      );
    }

    if (activeWorkoutId) {
      await supabase.from("active_workout").delete().eq("id", activeWorkoutId);
    }

    navigate("/");
  }

  async function saveCurrentState() {
    for (const item of exercises) {
      await supabase
        .from("active_workout_exercises")
        .update({
          done: item.done,

          sets: item.sets,

          comment: item.comment,
        })
        .eq("id", item.id);
    }

    if (activeWorkoutId) {
      await supabase
        .from("active_workout")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeWorkoutId);
    }
  }

  const allDone =
    exercises.length === 0 ||
    exercises.every((exercise) => exercise.done === true);

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
              {item.workoutExercise?.sets} séries ×{item.workoutExercise?.reps}
            </p>

            <p className="mt-1">
              Charge validée :
              {item.sets ? ` ${getBestWeight(item.sets)} kg` : " -"}
            </p>
          </div>
        ))}

        <button
          disabled={!allDone}
          onClick={finishWorkout}
          className="
            mt-8
            w-full
            bg-white
            text-black
            rounded-2xl
            py-4
            font-semibold
            disabled:opacity-40
          "
        >
          {exercises.length === 0
            ? "Terminer la séance"
            : allDone
              ? "Terminer la séance"
              : "Termine tous les exercices"}
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
