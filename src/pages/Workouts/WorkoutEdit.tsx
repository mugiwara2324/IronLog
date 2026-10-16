import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ExerciseFormModal from "../../components/exercises/ExerciseFormModal";
import { supabase } from "../../lib/supabase";
import { updateWorkout } from "../../services/supabaseWorkoutService";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

type WorkoutRecord = {
  id: string;
  name: string;
  day_of_week: number;
  description?: string | null;
};

type ExerciseSummary = {
  id: string;
  name: string;
};

type WorkoutExerciseRow = {
  id: string | number;
  exercise_id: string | number;
  order?: number | null;
  order_index?: number | null;
  sets: number | string;
  reps: number | string;
  weight: number | string;
  volume_multiplier?: number;
  exercise?: ExerciseSummary | null;
  exerciseId?: string | number;
};

type SavedWorkoutExercise = {
  id: string | number;
  exercise_id: string | number;
  weight: number | string;
};

export default function WorkoutEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const [workoutResult, exerciseResult] = await Promise.all([
        supabase.from("workouts").select("*").eq("id", id).single(),
        supabase.from("workout_exercises").select("*").eq("workout_id", id),
      ]);

      if (workoutResult.error) throw workoutResult.error;
      if (exerciseResult.error) throw exerciseResult.error;

      setWorkout(workoutResult.data as WorkoutRecord);

      const sortedData = ([...(exerciseResult.data ?? [])] as WorkoutExerciseRow[]).sort(
        (a, b) =>
          Number(a.order ?? a.order_index ?? 0) -
          Number(b.order ?? b.order_index ?? 0),
      );

      const full = await Promise.all(
        sortedData.map(async (item) => {
          const { data: rawExercise, error } = await supabase
            .from("exercises")
            .select("*")
            .eq("id", item.exercise_id ?? item.exerciseId)
            .single();

          if (error) throw error;
          const exercise = rawExercise as ExerciseSummary | null;
          return { ...item, exercise };
        }),
      );

      setExercises(full);
    } catch (error) {
      console.error("Erreur chargement séance :", error);
      setErrorMessage("Impossible de charger cette séance. Réessaie quand la connexion sera rétablie.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // This route effect owns the loading and error state for its remote reads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function deleteExercise(workoutExerciseId: string | number) {
    const confirmed = window.confirm("Retirer cet exercice de la séance ?");
    if (!confirmed) return;

    setErrorMessage(null);
    const { error: deleteError } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", workoutExerciseId);

    if (deleteError) {
      setErrorMessage("Impossible de retirer cet exercice. Vérifie ta connexion puis réessaie.");
      return;
    }

    const remaining = exercises.filter((item) => item.id !== workoutExerciseId);
    const results = await Promise.all(
      remaining.map((item, position) =>
        supabase
          .from("workout_exercises")
          .update({ order: position, order_index: position })
          .eq("id", item.id),
      ),
    );

    if (results.some((result) => result.error)) {
      setErrorMessage("L’exercice a été retiré, mais son nouvel ordre n’a pas pu être enregistré.");
    }

    await load();
  }

  function updateExercise(exerciseId: string | number, field: "sets" | "reps" | "weight" | "volume_multiplier", value: string | number) {
    setExercises((previous) =>
      previous.map((item) =>
        item.id === exerciseId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function moveExercise(index: number, direction: number) {
    setExercises((previous) => {
      const next = [...previous];
      const target = index + direction;
      if (target < 0 || target >= next.length) return previous;

      [next[index], next[target]] = [next[target], next[index]];
      return next.map((exercise, position) => ({
        ...exercise,
        order: position,
        order_index: position,
      }));
    });
  }

  async function save() {
    if (!id || !workout) return;
    if (!workout.name?.trim()) {
      setErrorMessage("Donne un nom à ta séance avant de l’enregistrer.");
      return;
    }
    if (exercises.some((item) => Number(item.sets) < 1 || !String(item.reps ?? "").trim() || Number(item.weight) < 0)) {
      setErrorMessage("Vérifie les séries, les répétitions et la charge de chaque exercice.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user.id;
      if (!currentUserId) throw new Error("Reconnecte-toi pour enregistrer cette séance.");

      await updateWorkout(id, {
        name: workout.name.trim(),
        day_of_week: Number(workout.day_of_week),
        description: workout.description ?? "",
      });

      const { data: savedExercises, error: readError } = await supabase
        .from("workout_exercises")
        .select("id, exercise_id, weight")
        .eq("workout_id", id);

      if (readError) throw readError;
      const savedRows = (savedExercises ?? []) as SavedWorkoutExercise[];
      const savedById = new Map<string | number, SavedWorkoutExercise>(
        savedRows.map((item) => [item.id, item]),
      );

      await Promise.all(
        exercises.map(async (item, position) => {
          const old = savedById.get(item.id);
          const { error } = await supabase
            .from("workout_exercises")
            .update({
              sets: Number(item.sets),
              reps: String(item.reps).trim(),
              weight: Number(item.weight),
              volume_multiplier: Number(item.volume_multiplier) === 2 ? 2 : 1,
              order: position,
              order_index: position,
            })
            .eq("id", item.id);

          if (error) throw error;

          if (old && Number(old.weight) !== Number(item.weight)) {
            const { error: historyError } = await supabase
              .from("weight_history")
              .insert({
                user_id: currentUserId,
                exercise_id: old.exercise_id,
                old_weight: old.weight,
                new_weight: Number(item.weight),
                date: new Date().toISOString(),
              });

            if (historyError) throw historyError;
          }
        }),
      );
      navigate(-1);
    } catch (error: unknown) {
      console.error("Erreur sauvegarde séance :", error);
      setErrorMessage(
        error instanceof Error
          ? `Enregistrement interrompu : ${error.message}`
          : "La séance n’a pas pu être enregistrée. Réessaie quand la connexion sera rétablie.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-neutral-400">Chargement de la séance…</div>;
  if (!workout) return <div role="alert" className="text-red-400">{errorMessage ?? "Séance introuvable."}</div>;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 rounded-2xl bg-neutral-800 px-5 py-3 font-semibold"
      >
        ← Retour
      </button>

      <p className="session-kicker">Programme hebdomadaire</p>
      <h1>Modifier la séance</h1>

      <section className="mt-6 rounded-3xl bg-neutral-900 p-5">
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold text-neutral-400">Nom de la séance</span>
          <input
            value={workout.name ?? ""}
            onChange={(event) => setWorkout((previous) => previous ? { ...previous, name: event.target.value } : previous)}
            className="w-full rounded-xl bg-neutral-800 p-3"
            placeholder="Ex. Haut du corps"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold text-neutral-400">Jour de référence</span>
          <select
            value={workout.day_of_week ?? 1}
            onChange={(event) => setWorkout((previous) => previous ? { ...previous, day_of_week: Number(event.target.value) } : previous)}
            className="w-full rounded-xl bg-neutral-800 p-3"
          >
            {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-400">Description</span>
          <textarea
            value={workout.description ?? ""}
            onChange={(event) => setWorkout((previous) => previous ? { ...previous, description: event.target.value } : previous)}
            className="min-h-24 w-full rounded-xl bg-neutral-800 p-3"
            placeholder="Quelques notes pour cette séance"
          />
        </label>
      </section>

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="mt-5 w-full rounded-2xl bg-white py-4 font-semibold"
      >
        + Ajouter un exercice
      </button>

      <div className="mt-6 space-y-4">
        {exercises.map((item, index) => (
          <section key={item.id} className="rounded-3xl bg-neutral-900 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-500">EXERCICE {String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-lg font-bold">{item.exercise?.name ?? "Exercice"}</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" aria-label={`Monter ${item.exercise?.name}`} onClick={() => moveExercise(index, -1)} className="rounded-xl bg-neutral-800 px-3 py-2">↑</button>
                <button type="button" aria-label={`Descendre ${item.exercise?.name}`} onClick={() => moveExercise(index, 1)} className="rounded-xl bg-neutral-800 px-3 py-2">↓</button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label>
                <span className="mb-2 block text-xs font-semibold text-neutral-400">Séries</span>
                <input type="number" min="1" value={item.sets} onChange={(event) => updateExercise(item.id, "sets", event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-neutral-400">Répétitions cibles</span>
                <input value={item.reps} onChange={(event) => updateExercise(item.id, "reps", event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" placeholder="10–12" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-neutral-400">Charge de départ (kg)</span>
                <input type="number" min="0" step="0.5" value={item.weight} onChange={(event) => updateExercise(item.id, "weight", event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-800 p-3">
              <input type="checkbox" checked={Number(item.volume_multiplier ?? 1) === 2} onChange={(event) => updateExercise(item.id, "volume_multiplier", event.target.checked ? 2 : 1)} />
              <span className="text-sm">Compter les deux haltères ou les deux côtés (volume ×2)</span>
            </label>

            <button type="button" onClick={() => void deleteExercise(item.id)} className="mt-4 text-sm font-semibold text-red-400">
              Retirer l’exercice
            </button>
          </section>
        ))}
      </div>

      {errorMessage && <p role="alert" className="mt-4 text-sm text-red-400">{errorMessage}</p>}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-7 w-full rounded-2xl bg-white py-4 font-semibold disabled:opacity-55"
      >
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>

      {showAdd && (
        <ExerciseFormModal
          mode="create"
          workoutId={id}
          order={exercises.length}
          onClose={() => setShowAdd(false)}
          onCreated={() => void load()}
        />
      )}
    </div>
  );
}
