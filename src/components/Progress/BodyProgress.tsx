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

import AddBodyMeasurement from "./AddBodyMeasurement";

import { db } from "../../database/db";

export default function BodyProgress() {
  const [history, setHistory] = useState<any[]>([]);

  const [showAdd, setShowAdd] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  async function loadHistory() {
    const data = await db.bodyHistory.orderBy("date").reverse().toArray();

    setHistory(data);

    const profileData = await db.profile.toCollection().first();

    setProfile(profileData ?? null);
  }

  async function deleteMeasurement(id: number) {
    const confirmDelete = window.confirm(
      "Supprimer cette mesure ? Cette action est irréversible.",
    );

    if (!confirmDelete) {
      return;
    }

    await db.bodyHistory.delete(id);

    loadHistory();
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const latest = history.length ? history[0] : null;

  const first = history.length ? history[history.length - 1] : null;

  function difference(current: number | undefined, start: number | undefined) {
    if (current === undefined || start === undefined) {
      return "-";
    }

    const diff = current - start;

    if (diff > 0) {
      return `+${Math.round(diff * 10) / 10}`;
    }

    return `${Math.round(diff * 10) / 10}`;
  }

  const bmi =
    latest && profile
      ? (latest.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
      : null;

  const fatKg =
    latest?.bodyFat !== undefined
      ? ((latest.weight * latest.bodyFat) / 100).toFixed(1)
      : null;

  const leanKg = latest
    ? (latest.leanMass ?? (fatKg ? latest.weight - Number(fatKg) : undefined))
    : null;

  const metabolicAge = calculateMetabolicAge();

  const chartData = [...history].reverse().map((item) => ({
    date: new Date(item.date).toLocaleDateString(),

    weight: item.weight,

    bodyFat: item.bodyFat,

    muscleMass: item.muscleMass,
  }));

  function calculateMetabolicAge() {
    if (!latest || !profile) {
      return null;
    }

    let age = profile.age;

    if (latest.bodyFat !== undefined) {
      if (latest.bodyFat > 25) {
        age += 5;
      } else if (latest.bodyFat > 20) {
        age += 3;
      } else if (latest.bodyFat < 15) {
        age -= 3;
      }
    }

    if (latest.muscleMass !== undefined) {
      if (latest.muscleMass > 70) {
        age -= 2;
      } else if (latest.muscleMass < 50) {
        age += 2;
      }
    }

    return Math.max(18, Math.round(age));
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Evolution corporelle</h2>
      <button
        onClick={() => setShowAdd(true)}
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
        + Ajouter une mesure
      </button>
      {latest ? (
        <div
          className="
          mt-6
          bg-neutral-900
          rounded-3xl
          p-5
          "
        >
          <p className="text-neutral-400">Dernière mesure</p>

          <p
            className="
            text-4xl
            font-bold
            mt-2
            "
          >
            {latest.weight} kg
          </p>

          <div
            className="
            grid
            grid-cols-2
            gap-4
            mt-6
            "
          >
            <Stat label="IMC" value={bmi ?? "-"} />

            <Stat
              label="Masse grasse"
              value={latest.bodyFat !== undefined ? `${latest.bodyFat}%` : "-"}
            />

            <Stat label="Masse grasse" value={fatKg ? `${fatKg} kg` : "-"} />

            <Stat
              label="Masse musculaire"
              value={
                latest.muscleMass !== undefined ? `${latest.muscleMass}%` : "-"
              }
            />

            <Stat
              label="Masse maigre"
              value={
                leanKg !== null && leanKg !== undefined
                  ? `${Number(leanKg).toFixed(1)} kg`
                  : "-"
              }
            />

            <Stat
              label="Masse osseuse"
              value={
                latest.boneMass !== undefined ? `${latest.boneMass}%` : "-"
              }
            />

            <Stat
              label="Hydratation"
              value={
                latest.waterPercentage !== undefined
                  ? `${latest.waterPercentage}%`
                  : "-"
              }
            />

            <Stat
              label="Age métabolique estimé"
              value={metabolicAge ? `${metabolicAge} ans` : "-"}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-neutral-400">Aucune mesure enregistrée.</p>
      )}{" "}
      {first && latest && history.length > 1 && (
        <div
          className="
          mt-8
          bg-neutral-900
          rounded-3xl
          p-5
          "
        >
          <h3
            className="
            font-bold
            text-xl
            "
          >
            Depuis le début
          </h3>

          <div
            className="
            grid
            grid-cols-2
            gap-4
            mt-5
            "
          >
            <Stat
              label="Poids"
              value={`${difference(latest.weight, first.weight)} kg`}
            />

            <Stat
              label="Masse grasse"
              value={difference(latest.bodyFat, first.bodyFat) + " %"}
            />

            <Stat
              label="Muscle"
              value={difference(latest.muscleMass, first.muscleMass) + " %"}
            />
          </div>
        </div>
      )}
      <ChartCard title="Evolution du poids" data={chartData} keyName="weight" />
      <ChartCard
        title="Evolution masse grasse"
        data={chartData}
        keyName="bodyFat"
      />
      <ChartCard
        title="Evolution masse musculaire"
        data={chartData}
        keyName="muscleMass"
      />
      {history.length > 0 && (
        <div className="mt-8">
          <h3
            className="
            text-xl
            font-bold
            "
          >
            Historique
          </h3>

          <div
            className="
            mt-4
            space-y-4
            "
          >
            {history.map((item) => (
              <div
                key={item.id}
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
                  items-start
                  "
                >
                  <div>
                    <p className="text-neutral-400">
                      {new Date(item.date).toLocaleDateString()}
                    </p>

                    <p
                      className="
                      text-2xl
                      font-bold
                      mt-2
                      "
                    >
                      {item.weight} kg
                    </p>

                    {item.bodyFat !== undefined && (
                      <p className="text-neutral-400 mt-1">
                        Masse grasse : {item.bodyFat}%
                      </p>
                    )}

                    {item.muscleMass !== undefined && (
                      <p className="text-neutral-400">
                        Masse musculaire : {item.muscleMass}%
                      </p>
                    )}

                    {item.waterPercentage !== undefined && (
                      <p className="text-neutral-400">
                        Hydratation : {item.waterPercentage}%
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteMeasurement(item.id)}
                    className="
                    text-red-400
                    text-sm
                    "
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAdd && (
        <AddBodyMeasurement
          onClose={() => setShowAdd(false)}
          onSave={() => loadHistory()}
        />
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  keyName,
}: {
  title: string;
  data: any[];
  keyName: string;
}) {
  return (
    <div
      className="
      mt-8
      bg-neutral-900
      rounded-3xl
      p-5
      "
    >
      <h3
        className="
        font-bold
        mb-4
        "
      >
        {title}
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Line type="monotone" dataKey={keyName} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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
