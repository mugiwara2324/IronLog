import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { getInitialReps } from "../../utils/reps";

export default function WorkoutSession() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState<any[]>([]);

  const [workoutName, setWorkoutName] = useState("");

  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);

  const [completed, setCompleted] = useState<string[]>([]);

  async function loadWorkout() {
    const days = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];

    const today = days[new Date().getDay()];

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      throw new Error("Utilisateur non authentifié");
    }

    const { data: workout } = await supabase
      .from("workouts")
      .select("*")
      .eq("day", today)
      .eq("user_id", user.id)
      .limit(1);

    const wk = workout && workout[0] ? workout[0] : null;

    if (!wk?.id) return;

    setWorkoutName(wk.name);

    const { data: active } = await supabase
      .from("active_workout")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    const act = active && active[0] ? active[0] : null;

    /*
      Si une séance existe déjà
      et correspond à aujourd'hui
    */

    if (act && act.workout_id === wk.id) {
      setActiveWorkoutId(act.id ?? null);

      const { data: activeExercises } = await supabase
        .from("active_workout_exercises")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", wk.id);

      const sortedActiveExercises = (activeExercises ?? [])
        .slice()
        .sort(
          (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0),
        );

      const fullExercises = await Promise.all(
        (sortedActiveExercises ?? []).map(async (item: any) => {
          const { data: exercise } = await supabase
            .from("exercises")
            .select("*")
            .eq("id", item.exercise_id)
            .limit(1);

          return {
            ...item,
            exercise: exercise && exercise[0] ? exercise[0] : null,
          };
        }),
      );

      setExercises(fullExercises);

      setCompleted(
        (activeExercises ?? [])
          .filter((item: any) => item.done)
          .map((item: any) => item.id),
      );

      return;
    }

    /*
      Nouvelle séance
    */

    const { data: insertedActive, error: activeError } = await supabase
      .from("active_workout")
      .insert({
        user_id: user.id,
        workout_id: wk.id,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (activeError) {
      throw activeError;
    }

    setActiveWorkoutId(insertedActive?.id ?? null);

    const { data: workoutExercises } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("workout_id", wk.id);

    const sortedWorkoutExercises = (workoutExercises ?? [])
      .slice()
      .sort(
        (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0),
      );

    const toInsert = await Promise.all(
      (sortedWorkoutExercises ?? []).map(async (item: any) => {
        const sets = Array.from({ length: item.sets }, () => ({
          weight: item.weight,
          reps: getInitialReps(item.reps),
        }));

        const { data: inserted } = await supabase
          .from("active_workout_exercises")
          .insert({
            user_id: user.id,
            workout_id: wk.id,
            exercise_id: item.exercise_id,
            order: item.order,
            done: false,
            sets,
          })
          .select();

        const id = inserted && inserted[0] ? inserted[0].id : undefined;

        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.exercise_id)
          .limit(1);

        return {
          id,
          workoutId: wk.id,
          exerciseId: item.exercise_id,
          order: item.order,
          done: false,
          sets,
          exercise: exercise && exercise[0] ? exercise[0] : null,
        };
      }),
    );

    setExercises(toInsert);
  }

  useEffect(() => {
    loadWorkout();
  }, []);

  async function toggleExercise(id: string) {
    const current = exercises.find((item) => item.id === id);

    if (!current) return;

    const newDone = !current.done;

    const query = supabase
      .from("active_workout_exercises")
      .update({ done: newDone })
      .eq("id", id);

    await query;

    if (activeWorkoutId) {
      await supabase
        .from("active_workout")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeWorkoutId);
    }

    setExercises(
      exercises.map((item) =>
        item.id === id ? { ...item, done: newDone } : item,
      ),
    );

    if (newDone) setCompleted([...completed, id]);
    else setCompleted(completed.filter((item) => item !== id));
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="
  mb-5
  bg-neutral-800
  rounded-2xl
  px-5
  py-3
  font-semibold
  "
      >
        ← Retour
      </button>

      <h1
        className="
        text-3xl
        font-bold
        mt-6
        "
      >
        {workoutName}
      </h1>

      <p
        className="
        mt-3
        text-neutral-400
        "
      >
        Progression : {completed.length}/{exercises.length}
      </p>

      <div
        className="
        mt-8
        space-y-4
        "
      >
        {exercises.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleExercise(item.id)}
            className="
            bg-neutral-900
            rounded-3xl
            p-5
            "
          >
            <div
              className="
              flex
              justify-between
              "
            >
              <h2
                className="
                font-bold
                text-lg
                "
              >
                {item.exercise?.name}
              </h2>

              <span>{item.done ? "✅" : "⬜"}</span>
            </div>

            <p
              className="
              text-neutral-400
              mt-3
              "
            >
              {item.sets.length} séries
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
