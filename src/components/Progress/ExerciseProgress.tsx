import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { getExerciseProgressPoints } from "../../services/exerciseProgressService";
import ExerciseProgressDetail from "./ExerciseProgressDetail";

type ExerciseRecord = { id: string; name: string; bestWeight: number; bestReps: number; bestVolume: number; sessionsCount: number };

export default function ExerciseProgress() {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [points, exercisesResult] = await Promise.all([
          getExerciseProgressPoints(user.id),
          supabase.from("exercises").select("id, name"),
        ]);
        if (exercisesResult.error) throw exercisesResult.error;

        const names = new Map((exercisesResult.data ?? []).map((exercise) => [exercise.id, exercise.name]));
        const byExercise = new Map<string, ExerciseRecord>();
        for (const point of points) {
          const record = byExercise.get(point.exerciseId) ?? { id: point.exerciseId, name: names.get(point.exerciseId) ?? "Exercice", bestWeight: 0, bestReps: 0, bestVolume: 0, sessionsCount: 0 };
          record.bestWeight = Math.max(record.bestWeight, point.maxWeight);
          record.bestReps = Math.max(record.bestReps, point.maxReps);
          record.bestVolume = Math.max(record.bestVolume, point.maxVolume);
          record.sessionsCount += 1;
          byExercise.set(point.exerciseId, record);
        }
        setRecords([...byExercise.values()].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Erreur chargement progression :", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return <div>
    <h2 className="text-xl font-bold">Progression par exercice</h2>
    <p className="mt-2 text-neutral-400">Basée sur les séries réellement réalisées.</p>
    {loading ? <p className="mt-6 text-neutral-400">Chargement...</p> : records.length === 0 ? <p className="mt-6 text-neutral-400">Termine une séance pour voir ta progression.</p> : <div className="mt-6 space-y-4">
      {records.map((item) => <button key={item.id} onClick={() => setSelectedExercise(item)} className="w-full text-left bg-neutral-900 rounded-3xl p-5"><div className="flex justify-between gap-4"><div><h3 className="font-bold text-lg">{item.name}</h3><p className="mt-2 text-sm text-neutral-400">{item.sessionsCount} séance{item.sessionsCount > 1 ? "s" : ""}</p></div><div className="text-right"><p className="font-bold">{item.bestWeight} kg</p><p className="text-sm text-neutral-400">meilleure charge</p></div></div><p className="mt-3 text-sm text-neutral-400">Meilleur volume : {item.bestVolume} kg · {item.bestReps} reps max</p></button>)}
    </div>}
    {selectedExercise && <ExerciseProgressDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
  </div>;
}
