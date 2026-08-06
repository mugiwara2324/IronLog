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

import {
  getBodyMeasurements,
  deleteBodyMeasurement,
} from "../../services/bodyService";

import { getProfile } from "../../services/profileService";

export default function BodyProgress() {
  const [history, setHistory] = useState<any[]>([]);

  const [showAdd, setShowAdd] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  async function loadHistory() {
    try {
      const data = await getBodyMeasurements();

      const formatted = data
        .map((item) => ({
          ...item,

          weight:
            item.weight !== null && item.weight !== undefined
              ? Number(item.weight)
              : undefined,
          bodyFat:
            item.body_fat !== null && item.body_fat !== undefined
              ? Number(item.body_fat)
              : undefined,
          muscleMass:
            item.muscle_mass !== null && item.muscle_mass !== undefined
              ? Number(item.muscle_mass)
              : undefined,
          boneMass:
            item.bone_mass !== null && item.bone_mass !== undefined
              ? Number(item.bone_mass)
              : undefined,
          waterPercentage:
            item.water_percentage !== null &&
            item.water_percentage !== undefined
              ? Number(item.water_percentage)
              : undefined,
          leanMass:
            item.lean_mass !== null && item.lean_mass !== undefined
              ? Number(item.lean_mass)
              : undefined,
        }))
        .reverse();

      setHistory(formatted);

      const profileData = await getProfile();

      setProfile(profileData);
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteMeasurement(id: string) {
    const confirmDelete = window.confirm(
      "Supprimer cette mesure ? Cette action est irréversible.",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteBodyMeasurement(id);

      loadHistory();
    } catch (error) {
      console.error(error);
    }
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
    latest && profile && latest.weight && profile.height
      ? Number(latest.weight) > 0 && Number(profile.height) > 0
        ? (
            Number(latest.weight) / Math.pow(Number(profile.height) / 100, 2)
          ).toFixed(1)
        : null
      : null;

  const fatKg =
    latest?.bodyFat !== undefined
      ? ((latest.weight * latest.bodyFat) / 100).toFixed(1)
      : null;

  const leanKg = latest
    ? Number.isFinite(Number(latest.leanMass))
      ? Number(latest.leanMass)
      : fatKg
        ? Number(latest.weight) - Number(fatKg)
        : undefined
    : null;

  const metabolicAge = calculateMetabolicAge();

  const chartData = [...history].reverse().map((item) => {
    const bodyFatKg =
      item.bodyFat !== undefined
        ? Number(((item.weight * item.bodyFat) / 100).toFixed(1))
        : undefined;

    const leanMassKg =
      item.leanMass !== undefined && Number.isFinite(Number(item.leanMass))
        ? Number(item.leanMass)
        : item.bodyFat !== undefined && Number.isFinite(Number(item.weight))
          ? Number(
              (item.weight - item.weight * (item.bodyFat / 100)).toFixed(1),
            )
          : undefined;

    const leanMassPercent =
      item.leanMass !== undefined && Number.isFinite(Number(item.leanMass))
        ? Number(((Number(item.leanMass) / item.weight) * 100).toFixed(1))
        : item.bodyFat !== undefined
          ? Number((100 - item.bodyFat).toFixed(1))
          : undefined;

    return {
      date: new Date(item.date).toLocaleDateString(),
      weight: item.weight,
      bodyFat: item.bodyFat,
      bodyFatKg,
      muscleMass: item.muscleMass,
      leanMassKg,
      leanMassPercent,
    };
  });

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
      <ChartCard
        title="Evolution du poids"
        data={chartData}
        dataKey="weight"
        unit="kg"
      />
      <ChartCard
        title="Evolution masse grasse"
        data={chartData}
        toggleOptions={[
          { label: "%", dataKey: "bodyFat", unit: "%" },
          { label: "kg", dataKey: "bodyFatKg", unit: "kg" },
        ]}
      />
      <ChartCard
        title="Evolution masse maigre"
        data={chartData}
        toggleOptions={[
          { label: "%", dataKey: "leanMassPercent", unit: "%" },
          { label: "kg", dataKey: "leanMassKg", unit: "kg" },
        ]}
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
  dataKey,
  unit,
  toggleOptions,
}: {
  title: string;
  data: any[];
  dataKey?: string;
  unit?: string;
  toggleOptions?: Array<{
    label: string;
    dataKey: string;
    unit: string;
  }>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentOption = toggleOptions
    ? toggleOptions[selectedIndex]
    : { dataKey, unit };

  if (!currentOption.dataKey || !currentOption.unit) {
    return null;
  }

  return (
    <div
      className="
      mt-8
      bg-neutral-900
      rounded-3xl
      p-5
      "
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3
            className="
            font-bold
            mb-0
            "
          >
            {title}
          </h3>

          {toggleOptions && (
            <div className="flex gap-2">
              {toggleOptions.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                    selectedIndex === index
                      ? "border-white bg-white text-black"
                      : "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? `${value}${currentOption.unit}`
                    : String(value)
                }
              />

              <Tooltip
                formatter={(value: any) => `${value}${currentOption.unit}`}
              />

              <Line
                type="monotone"
                dataKey={currentOption.dataKey}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
