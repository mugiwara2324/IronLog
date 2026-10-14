import { useState } from "react";

import { createBodyMeasurement } from "../../services/bodyService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

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

  useBodyScrollLock(true);

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

    try {
      await createBodyMeasurement({
        weight: Number(form.weight),

        body_fat: form.bodyFat ? Number(form.bodyFat) : null,

        muscle_mass: form.muscleMass ? Number(form.muscleMass) : null,

        bone_mass: form.boneMass ? Number(form.boneMass) : null,

        water_percentage: form.waterPercentage
          ? Number(form.waterPercentage)
          : null,

        lean_mass: form.leanMass ? Number(form.leanMass) : null,
      });

      onSave();

      onClose();
    } catch (error) {
      console.error(error);

      alert("Erreur lors de l'enregistrement de la mesure");
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
        aria-labelledby="body-measurement-title"
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
          id="body-measurement-title"
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
            id="measurement-weight"
            label="Poids (kg)"
            value={form.weight}
            onChange={(v) => update("weight", v)}
          />

          <Input
            id="measurement-fat"
            label="Masse grasse (%)"
            value={form.bodyFat}
            onChange={(v) => update("bodyFat", v)}
          />

          <Input
            id="measurement-muscle"
            label="Masse musculaire (%)"
            value={form.muscleMass}
            onChange={(v) => update("muscleMass", v)}
          />

          <Input
            id="measurement-bone"
            label="Masse osseuse (%)"
            value={form.boneMass}
            onChange={(v) => update("boneMass", v)}
          />

          <Input
            id="measurement-water"
            label="Hydratation (%)"
            value={form.waterPercentage}
            onChange={(v) => update("waterPercentage", v)}
          />

          <Input
            id="measurement-lean"
            label="Masse maigre (kg)"
            value={form.leanMass}
            onChange={(v) => update("leanMass", v)}
          />

          <Input
            id="measurement-metabolic-age"
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
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
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
