import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { db } from "../../database/db";

interface Props {
  exercise: any;

  onClose: () => void;
}

export default function ExerciseProgressDetail({ exercise, onClose }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    async function load() {
      const data = await db.weightHistory
        .where("exerciseId")
        .equals(exercise.id)
        .sortBy("date");

      setHistory(data);

      const bestRecord = await db.records
        .where("exerciseId")
        .equals(exercise.id)
        .first();

      setRecord(bestRecord ?? null);
    }

    load();
  }, [exercise]);

  const bestWeight = history.length
    ? Math.max(...history.map((item) => item.newWeight))
    : 0;

  const firstWeight = history.length ? history[0].oldWeight : 0;

  const progression = bestWeight && firstWeight ? bestWeight - firstWeight : 0;

  const progressionPercent = firstWeight
    ? Math.round((progression / firstWeight) * 100)
    : 0;

  const lastUpdate = history.length ? history[history.length - 1].date : null;

  const chartData = history.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),

    weight: item.newWeight,
  }));

  return (
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
max-h-[80vh]
overflow-y-auto
translate-y-[-3%]
"
      >
        <button
          onClick={onClose}
          className="
text-neutral-400
"
        >
          ← Retour
        </button>

        <h2
          className="
text-2xl
font-bold
mt-6
"
        >
          {exercise.name}
        </h2>

        {/* RECORDS PERSONNELS */}

        {record && (
          <div
            className="
mt-6
bg-neutral-900
rounded-3xl
p-5
"
          >
            <h3
              className="
text-xl
font-bold
"
            >
              🏆 Records personnels
            </h3>

            <div
              className="
grid
grid-cols-2
gap-4
mt-5
"
            >
              <RecordStat label="Charge max" value={`${record.maxWeight} kg`} />

              <RecordStat label="Reps max" value={`${record.maxReps}`} />

              <RecordStat label="Volume max" value={`${record.maxVolume} kg`} />

              <RecordStat
                label="Dernier record"
                value={new Date(record.date).toLocaleDateString()}
              />
            </div>
          </div>
        )}

        <div
          className="
mt-6
"
        >
          <p
            className="
text-neutral-400
"
          >
            Record actuel
          </p>

          <div
            className="
grid
grid-cols-2
gap-4
mt-6
"
          >
            <RecordStat label="Départ" value={`${firstWeight} kg`} />

            <RecordStat label="Progression" value={`+${progression} kg`} />

            <RecordStat label="Evolution" value={`+${progressionPercent}%`} />

            <RecordStat label="Records" value={`${history.length}`} />
          </div>

          {lastUpdate && (
            <p
              className="
mt-4
text-neutral-400
"
            >
              Dernière progression :{new Date(lastUpdate).toLocaleDateString()}
            </p>
          )}

          <p
            className="
text-4xl
font-bold
mt-4
"
          >
            {bestWeight ? `${bestWeight} kg` : "-"}
          </p>
        </div>

        <div
          className="
mt-8
"
        >
          <h3
            className="
font-bold
mb-4
"
          >
            Evolution de la charge
          </h3>

          <div
            className="
h-64
"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="white"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="
mt-8
"
        >
          <h3
            className="
font-bold
"
          >
            Historique
          </h3>

          <div
            className="
mt-4
space-y-3
"
          >
            {history.map((item) => (
              <div
                key={item.id}
                className="
bg-neutral-800
rounded-xl
p-3
"
              >
                <p>
                  {item.oldWeight} kg → {item.newWeight} kg
                </p>

                <p
                  className="
text-neutral-400
text-sm
"
                >
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="
bg-neutral-800
rounded-2xl
p-4
"
    >
      <p
        className="
text-neutral-400
text-sm
"
      >
        {label}
      </p>

      <p
        className="
font-bold
mt-1
"
      >
        {value}
      </p>
    </div>
  );
}
