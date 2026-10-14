import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "../../lib/supabase";
import { getExerciseProgressPoints, type ExerciseProgressPoint } from "../../services/exerciseProgressService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props { exercise: { id: string; name: string }; onClose: () => void; }

export default function ExerciseProgressDetail({ exercise, onClose }: Props) {
  const [history, setHistory] = useState<ExerciseProgressPoint[]>([]);

  useBodyScrollLock(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try { setHistory(await getExerciseProgressPoints(user.id, exercise.id)); }
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

  return <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-panel bg-neutral-900 rounded-3xl p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="exercise-progress-title">
    <button onClick={onClose} className="text-neutral-400">← Retour</button><h2 id="exercise-progress-title" className="text-2xl font-bold mt-6">{exercise.name}</h2>
    <div className="grid grid-cols-2 gap-3 mt-6"><Stat label="Meilleure charge" value={`${bestWeight} kg`} /><Stat label="Progression" value={`${progression >= 0 ? "+" : ""}${progression} kg`} /><Stat label="Meilleur volume" value={`${bestVolume} kg`} /><Stat label="Reps max" value={`${bestReps}`} /></div>
    <h3 className="font-bold mt-8">Évolution de la charge</h3>{history.length ? <div className="h-64 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3" /><XAxis dataKey="date" stroke="var(--subtle)" tick={{ fill: "var(--muted)" }} /><YAxis stroke="var(--subtle)" tick={{ fill: "var(--muted)" }} /><Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--line)", color: "var(--page-text)" }} /><Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={3} /></LineChart></ResponsiveContainer></div> : <p className="mt-4 text-neutral-400">Aucune donnée.</p>}
    <div className="mt-8 space-y-3">{history.map((point) => <div key={`${point.exerciseId}-${point.date}`} className="bg-neutral-800 rounded-xl p-3"><p>{point.maxWeight} kg · {point.maxReps} reps · {point.maxVolume} kg</p><p className="text-neutral-400 text-sm">{new Date(point.date).toLocaleDateString()}</p></div>)}</div>
  </div></div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-neutral-800 rounded-2xl p-4"><p className="text-neutral-400 text-sm">{label}</p><p className="font-bold mt-1">{value}</p></div>; }
