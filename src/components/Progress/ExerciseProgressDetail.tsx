import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "../../lib/supabase";
import { getExerciseProgressPoints, type ExerciseProgressPoint } from "../../services/exerciseProgressService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props { exercise: { id: string; name: string }; onClose: () => void; }

export default function ExerciseProgressDetail({ exercise, onClose }: Props) {
  const [history, setHistory] = useState<ExerciseProgressPoint[]>([]);
  const [startingWeight, setStartingWeight] = useState("");
  const [savingStartingWeight, setSavingStartingWeight] = useState(false);
  const [startingWeightMessage, setStartingWeightMessage] = useState("");
  const [matchingPrograms, setMatchingPrograms] = useState(0);

  useBodyScrollLock(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        setHistory(await getExerciseProgressPoints(user.id, exercise.id));
        const { data: programs, error: programsError } = await supabase.from("workouts").select("id").eq("user_id", user.id);
        if (programsError) throw programsError;
        const programIds = (programs ?? []).map((program) => program.id);
        if (!programIds.length) return;
        const { data: planned, error: plannedError } = await supabase.from("workout_exercises").select("id, weight").eq("exercise_id", exercise.id).in("workout_id", programIds);
        if (plannedError) throw plannedError;
        setMatchingPrograms(planned?.length ?? 0);
        if (planned?.length) setStartingWeight(String(Math.max(...planned.map((item) => Number(item.weight) || 0))));
      }
      catch (error) { console.error("Erreur détail progression :", error); }
    }
    load();
  }, [exercise.id]);

  const firstWeight = history[0]?.maxWeight ?? 0;
  const bestWeight = Math.max(0, ...history.map((point) => point.maxWeight));
  const bestReps = Math.max(0, ...history.map((point) => point.maxReps));
  const bestVolume = Math.max(0, ...history.map((point) => point.maxVolume));
  const progression = bestWeight - firstWeight;
  const chartData = history.map((point) => ({ date: new Date(point.date).toLocaleDateString(), weight: point.maxWeight }));

  async function saveStartingWeight() {
    const weight = Number(startingWeight);
    if (!Number.isFinite(weight) || weight < 0) { setStartingWeightMessage("Saisis une charge valide, égale ou supérieure à 0 kg."); return; }
    setSavingStartingWeight(true);
    setStartingWeightMessage("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Reconnecte-toi pour modifier la charge de départ.");
      const { data: programs, error: programsError } = await supabase.from("workouts").select("id").eq("user_id", user.id);
      if (programsError) throw programsError;
      const programIds = (programs ?? []).map((program) => program.id);
      if (!programIds.length) throw new Error("Aucun programme ne contient cet exercice.");
      const { data: planned, error: plannedError } = await supabase.from("workout_exercises").select("id").eq("exercise_id", exercise.id).in("workout_id", programIds);
      if (plannedError) throw plannedError;
      if (!planned?.length) throw new Error("Cet exercice n’est associé à aucun programme.");
      const { error: updateError } = await supabase.from("workout_exercises").update({ weight }).in("id", planned.map((item) => item.id));
      if (updateError) throw updateError;
      setMatchingPrograms(planned.length);
      setStartingWeightMessage(`Charge de départ mise à ${weight} kg pour ${planned.length} programme${planned.length > 1 ? "s" : ""}. L’historique des séances passées n’a pas été modifié.`);
    } catch (error) {
      console.error("Erreur changement charge de départ :", error);
      setStartingWeightMessage(error instanceof Error ? error.message : "La charge de départ n’a pas pu être enregistrée.");
    } finally {
      setSavingStartingWeight(false);
    }
  }

  return <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-panel bg-neutral-900 rounded-3xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="exercise-progress-title">
    <button onClick={onClose} className="text-neutral-400">← Retour</button><h2 id="exercise-progress-title" className="text-2xl font-bold mt-6">{exercise.name}</h2>
    <div className="grid grid-cols-2 gap-3 mt-6"><Stat label="Meilleure charge" value={`${bestWeight} kg`} /><Stat label="Progression" value={`${progression >= 0 ? "+" : ""}${progression} kg`} /><Stat label="Meilleur volume" value={`${bestVolume} kg`} /><Stat label="Reps max" value={`${bestReps}`} /></div>
    <section className="mt-6 rounded-2xl bg-neutral-800 p-4">
      <h3 className="font-bold">Charge de départ des prochaines séances</h3>
      <p className="mt-1 text-sm text-neutral-400">Définis le poids proposé au lancement de cet exercice. La valeur sera appliquée à tous tes programmes qui le contiennent, sans modifier les séances passées.</p>
      {matchingPrograms > 0 ? <div className="mt-3 flex items-center gap-3"><label className="flex-1"><span className="sr-only">Nouvelle charge de départ en kilogrammes</span><input type="number" min="0" step="0.5" value={startingWeight} onChange={(event) => setStartingWeight(event.target.value)} className="w-full rounded-xl bg-neutral-900 p-3" aria-label="Nouvelle charge de départ en kilogrammes" /></label><button type="button" onClick={() => void saveStartingWeight()} disabled={savingStartingWeight} className="rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold disabled:opacity-60">{savingStartingWeight ? "Enregistrement…" : "Appliquer"}</button></div> : <p className="mt-3 text-sm text-neutral-400">Cet exercice n’est pas encore dans un de tes programmes.</p>}
      {startingWeightMessage && <p role="status" className="mt-3 text-sm">{startingWeightMessage}</p>}
    </section>
    <h3 className="font-bold mt-8">Évolution de la charge</h3>{history.length ? <div className="h-64 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3" /><XAxis dataKey="date" stroke="var(--subtle)" tick={{ fill: "var(--muted)" }} /><YAxis stroke="var(--subtle)" tick={{ fill: "var(--muted)" }} /><Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--line)", color: "var(--page-text)" }} /><Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <p className="mt-4 text-neutral-400">Aucune donnée.</p>}
    <div className="mt-8 space-y-3">{history.map((point) => <div key={`${point.exerciseId}-${point.date}`} className="bg-neutral-800 rounded-xl p-3"><p>{point.maxWeight} kg · {point.maxReps} reps · {point.maxVolume} kg</p><p className="text-neutral-400 text-sm">{new Date(point.date).toLocaleDateString()}</p></div>)}</div>
  </div></div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-neutral-800 rounded-2xl p-4"><p className="text-neutral-400 text-sm">{label}</p><p className="font-bold mt-1">{value}</p></div>; }
