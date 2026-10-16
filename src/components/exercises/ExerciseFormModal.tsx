import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props {
  mode: "create" | "edit";

  workoutId?: string;

  order?: number;

  exercise?: any;

  workoutExercise?: any;

  onClose: () => void;

  onCreated?: () => void;

  onUpdated?: (newExerciseId: string) => void;
}

const musclesList = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Avant-bras",
  "Quadriceps",
  "Ischios",
  "Fessiers",
  "Mollets",
  "Abdos",
  "Lombaires",
];

export default function ExerciseFormModal({
  mode,
  workoutId,
  order,
  exercise,
  workoutExercise,
  onClose,
  onCreated,
  onUpdated,
}: Props) {
  const [name, setName] = useState(exercise?.name ?? "");

  const [description, setDescription] = useState(exercise?.description ?? "");

  const [muscles, setMuscles] = useState<string[]>(exercise?.muscles ?? []);

  const [sets, setSets] = useState(workoutExercise?.sets ?? 3);

  const [reps, setReps] = useState(workoutExercise?.reps ?? "10");

  const [weight, setWeight] = useState(workoutExercise?.weight ?? 0);
  const [volumeMultiplier, setVolumeMultiplier] = useState(workoutExercise?.volume_multiplier ?? 1);

  const [notes, setNotes] = useState(workoutExercise?.notes ?? "");

  const [results, setResults] = useState<any[]>([]);

  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useBodyScrollLock(true);

  /*
    Recherche automatique
  */
  useEffect(() => {
    async function searchExercises() {
      if (!name.trim() || selectedExercise) {
        setResults([]);
        return;
      }

      const search = name.toLowerCase().replace(/\s+/g, "");

      const { data } = await supabase.from("exercises").select("*").limit(100);

      const filtered = (data ?? []).filter((item: any) => {
        const itemName = item.name.toLowerCase().replace(/\s+/g, "");

        return itemName.includes(search);
      });

      setResults(filtered);
    }

    const timer = setTimeout(searchExercises, 300);

    return () => clearTimeout(timer);
  }, [name, selectedExercise]);

  async function selectExercise(item: any) {
    setSelectedExercise(item);

    setName(item.name);

    setDescription(item.description ?? "");

    setMuscles(item.muscles ?? []);

    /*
      récupération dernier usage
    */

    const { data } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("exercise_id", item.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data[0]) {
      setSets(data[0].sets ?? 3);

      setReps(data[0].reps ?? "10");

      setWeight(data[0].weight ?? 0);
      setVolumeMultiplier(data[0].volume_multiplier ?? 1);

      setNotes(data[0].notes ?? "");
    }

    setResults([]);
  }

  function toggleMuscle(muscle: string) {
    if (muscles.includes(muscle)) {
      setMuscles(muscles.filter((item) => item !== muscle));
    } else {
      setMuscles([...muscles, muscle]);
    }
  }

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);

    try {

    /*
      CREATION DANS UNE SEANCE
    */

    if (mode === "create") {
      if (!workoutId) return;

      let exerciseId = selectedExercise?.id;

      /*
        Si exercice inconnu => création
      */

      if (!exerciseId) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Connecte-toi pour créer un exercice.");

        const { data: newExercise, error } = await supabase
          .from("exercises")
          .insert({
            user_id: authData.user.id,
            name,
            description,
            muscles,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        exerciseId = newExercise.id;
      }

      const { error } = await supabase.from("workout_exercises").insert({
        workout_id: workoutId,

        exercise_id: exerciseId,

        order_index: order ?? 0,

        order: order ?? 0,

        sets,

        reps,

        weight,
        volume_multiplier: Number(volumeMultiplier) === 2 ? 2 : 1,

        notes,
      });

      if (error) throw error;

      onCreated?.();

      onClose();

      return;
    }

    /*
      EDITION
    */

    if (mode === "edit" && exercise) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Connecte-toi pour modifier un exercice.");

      let savedExerciseId = exercise.id as string;
      if (exercise.user_id === authData.user.id) {
        const { error: exerciseError } = await supabase
          .from("exercises")
          .update({ name: name.trim(), description, muscles })
          .eq("id", exercise.id)
          .eq("user_id", authData.user.id);

        if (exerciseError) throw exerciseError;
      } else {
        const { data: copy, error: copyError } = await supabase
          .from("exercises")
          .insert({
            user_id: authData.user.id,
            name: name.trim(),
            description,
            muscles,
          })
          .select("id")
          .single();

        if (copyError) throw copyError;
        savedExerciseId = copy.id;
      }

      if (workoutExercise) {
        const { error: workoutExerciseError } = await supabase
          .from("workout_exercises")
          .update({ exercise_id: savedExerciseId, sets, reps, weight, notes })
          .eq("id", workoutExercise.id);

        if (workoutExerciseError) throw workoutExerciseError;
      }

      onUpdated?.(savedExerciseId);

      onClose();
    }
    } catch (error) {
      console.error("Impossible d’enregistrer l’exercice", error);
      setSaveError("L’enregistrement a échoué. Vérifie ta connexion puis réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="modal-panel bg-neutral-900 rounded-3xl p-6 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-form-title"
      >
        <h2 id="exercise-form-title" className="text-2xl font-bold">
          {mode === "create" ? "Nouvel exercice" : "Modifier l'exercice"}
        </h2>

        <div className="mt-6 space-y-4">
          {mode === "create" && <label className="flex items-center gap-3 rounded-xl bg-neutral-800 p-3"><input type="checkbox" checked={Number(volumeMultiplier) === 2} onChange={(event) => setVolumeMultiplier(event.target.checked ? 2 : 1)} /><span className="text-sm">Compter les deux haltères ou les deux côtés (volume ×2)</span></label>}
          {mode === "edit" && exercise && !exercise.user_id && (
            <p className="rounded-2xl bg-neutral-800 p-3 text-sm text-neutral-400">
              La banque est partagée : tes modifications créeront une copie personnelle.
            </p>
          )}
          <div className="relative">
            <label className="field-label" htmlFor="exercise-search">Nom de l’exercice</label>
            <input
              id="exercise-search"
              placeholder="Rechercher dans les exercices"
              value={name}
              onChange={(e) => {
                setSelectedExercise(null);

                setName(e.target.value);
              }}
              className="
              w-full
              bg-neutral-800
              rounded-xl
              p-3
              "
            />

            {results.length > 0 && (
              <div
                className="
                absolute
                top-full
                left-0
                right-0
                bg-neutral-800
                rounded-xl
                mt-2
                overflow-hidden
                z-20
                "
              >
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectExercise(item)}
                    className="
                    w-full
                    text-left
                    p-3
                    hover:bg-neutral-700
                    "
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedExercise && (
            <p className="text-green-400 text-sm">
              Exercice existant sélectionné
            </p>
          )}

          <label className="field-label" htmlFor="exercise-description">Description</label>
          <textarea
            id="exercise-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <div>
            <p className="text-neutral-400 mb-3">Muscles engagés</p>

            <div className="flex flex-wrap gap-2">
              {musclesList.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMuscle(m)}
                  className={`
                  px-3
                  py-2
                  rounded-full
                  text-sm
                  ${
                    muscles.includes(m)
                      ? "bg-white text-black"
                      : "bg-neutral-800"
                  }
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {(mode === "create" || workoutExercise) && <>
          <label className="field-label" htmlFor="exercise-sets">Nombre de séries</label>
          <input
            id="exercise-sets"
            type="number"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            placeholder="Séries"
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <label className="field-label" htmlFor="exercise-reps">Répétitions par série</label>
          <input
            id="exercise-reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="Répétitions"
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <label className="field-label" htmlFor="exercise-weight">Charge initiale (kg)</label>
          <input
            id="exercise-weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            placeholder="Poids"
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <label className="field-label" htmlFor="exercise-notes">Notes</label>
          <textarea
            id="exercise-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />
          </>}
        </div>

        {saveError && <p role="alert" className="mt-4 text-sm text-red-600">{saveError}</p>}

        <button
          onClick={save}
          disabled={saving}
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
          {saving ? "Enregistrement…" : mode === "create" ? "Ajouter à la séance" : "Enregistrer les modifications"}
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
