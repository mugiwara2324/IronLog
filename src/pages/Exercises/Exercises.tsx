import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExercise, getExercises } from "../../services/exerciceService";
import type { Exercise } from "../../database/db";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Tous les muscles");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [muscles, setMuscles] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  useBodyScrollLock(showCreate);

  async function loadExercises() { setExercises(await getExercises()); }
  useEffect(() => { void loadExercises().catch(() => setError("Impossible de charger les exercices.")); }, []);
  const muscleOptions = useMemo(() => ["Tous les muscles", ...new Set(exercises.flatMap((item) => item.muscles ?? []))].sort((a, b) => a === "Tous les muscles" ? -1 : a.localeCompare(b, "fr")), [exercises]);
  const filtered = exercises.filter((item) => item.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")) && (muscle === "Tous les muscles" || item.muscles?.includes(muscle)));

  async function saveExercise(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const parsedMuscles = muscles.split(",").map((value) => value.trim()).filter(Boolean);
      if (!name.trim() || !parsedMuscles.length) throw new Error("Indique le nom de l’exercice et au moins un muscle.");
      await createExercise(name.trim(), parsedMuscles);
      setName(""); setMuscles(""); setShowCreate(false); await loadExercises();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d’ajouter cet exercice."); }
    finally { setSaving(false); }
  }

  return <div>
    <button type="button" onClick={() => navigate("/workouts")} className="mb-5 rounded-2xl bg-neutral-800 px-4 py-3 font-semibold">← Retour aux séances</button>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="session-kicker">Catalogue</p><h1 className="text-3xl font-bold">Exercices</h1><p className="mt-2 text-neutral-400">Recherche et sélection par groupe musculaire.</p></div>
      <button onClick={() => setShowCreate(true)} className="rounded-2xl bg-white px-5 py-3 font-semibold text-black">Ajouter un exercice</button>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
      <label className="sr-only" htmlFor="exercise-search">Rechercher un exercice</label><input id="exercise-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un exercice…" className="rounded-2xl bg-neutral-800 p-4" />
      <label className="sr-only" htmlFor="exercise-muscle-filter">Filtrer par muscle</label><select id="exercise-muscle-filter" value={muscle} onChange={(event) => setMuscle(event.target.value)} className="rounded-2xl bg-neutral-800 p-4">{muscleOptions.map((item) => <option key={item}>{item}</option>)}</select>
    </div>
    <p className="mt-4 text-sm text-neutral-400" aria-live="polite">{filtered.length} exercice{filtered.length > 1 ? "s" : ""}</p>
    <div className="mt-3 space-y-3">{filtered.map((exercise) => <button key={exercise.id} type="button" onClick={() => navigate(`/exercises/${exercise.id}`)} className="w-full rounded-3xl bg-neutral-900 p-5 text-left"><span className="block text-lg font-semibold">{exercise.name}</span><span className="mt-1 block text-sm text-neutral-400">{exercise.muscles?.join(" · ") || "Muscles non renseignés"}</span></button>)}</div>
    {!filtered.length && <p className="mt-8 rounded-3xl bg-neutral-900 p-6 text-center text-neutral-400">Aucun exercice ne correspond à cette recherche.</p>}
    {error && <p role="alert" className="mt-4 text-red-400">{error}</p>}
    {showCreate && <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><form onSubmit={saveExercise} className="modal-panel w-full max-w-md rounded-3xl bg-neutral-900 p-6" role="dialog" aria-modal="true" aria-labelledby="new-exercise-title"><h2 id="new-exercise-title" className="text-xl font-bold">Nouvel exercice</h2><label className="field-label mt-5" htmlFor="new-exercise-name">Nom</label><input id="new-exercise-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" required /><label className="field-label mt-4" htmlFor="new-exercise-muscles">Muscles (séparés par des virgules)</label><input id="new-exercise-muscles" value={muscles} onChange={(event) => setMuscles(event.target.value)} placeholder="Dos, Biceps" className="w-full rounded-xl bg-neutral-800 p-3" required />{error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}<button disabled={saving} className="mt-5 w-full rounded-2xl bg-white py-3 font-semibold text-black">{saving ? "Enregistrement…" : "Ajouter à la bibliothèque"}</button><button type="button" onClick={() => setShowCreate(false)} className="mt-3 w-full py-3 text-neutral-400">Annuler</button></form></div>}
  </div>;
}
