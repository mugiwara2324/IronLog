import { useState } from "react";

import { db } from "../../database/db";

interface Props {
  onClose: () => void;

  onSave: () => void;
}

export default function AddBodyMeasurement({ onClose, onSave }: Props) {
  const [form, setForm] = useState({
    weight: "",

    bodyFat: "",

    muscleMass: "",

    boneMass: "",

    waterPercentage: "",

    leanMass: "",

    metabolicAge: "",
  });

  function update(field: string, value: string) {
    setForm({
      ...form,

      [field]: value,
    });
  }

  async function save() {
    if (!form.weight) {
      alert("Le poids est obligatoire");

      return;
    }

    await db.bodyHistory.add({
      date: new Date(),

      weight: Number(form.weight),

      bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,

      muscleMass: form.muscleMass ? Number(form.muscleMass) : undefined,

      boneMass: form.boneMass ? Number(form.boneMass) : undefined,

      waterPercentage: form.waterPercentage
        ? Number(form.waterPercentage)
        : undefined,

      leanMass: form.leanMass ? Number(form.leanMass) : undefined,

      metabolicAge: form.metabolicAge ? Number(form.metabolicAge) : undefined,
    });

    onSave();

    onClose();
  }

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
max-h-[85vh]
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
          Nouvelle mesure
        </h2>

        <div
          className="
mt-6
space-y-4
"
        >
          <Input
            label="Poids (kg)"
            value={form.weight}
            onChange={(v) => update("weight", v)}
          />

          <Input
            label="Masse grasse (%)"
            value={form.bodyFat}
            onChange={(v) => update("bodyFat", v)}
          />

          <Input
            label="Masse musculaire (%)"
            value={form.muscleMass}
            onChange={(v) => update("muscleMass", v)}
          />

          <Input
            label="Masse osseuse (%)"
            value={form.boneMass}
            onChange={(v) => update("boneMass", v)}
          />

          <Input
            label="Hydratation (%)"
            value={form.waterPercentage}
            onChange={(v) => update("waterPercentage", v)}
          />

          <Input
            label="Masse maigre (kg)"
            value={form.leanMass}
            onChange={(v) => update("leanMass", v)}
          />

          <Input
            label="Age métabolique"
            value={form.metabolicAge}
            onChange={(v) => update("metabolicAge", v)}
          />

          <button
            onClick={save}
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
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        className="
text-sm
text-neutral-400
"
      >
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
mt-1
w-full
bg-neutral-800
rounded-xl
p-3
outline-none
"
      />
    </div>
  );
}
