import { useState } from "react";

import { createProfile } from "../../services/profileService";

interface Props {
  onSave: () => void;
}

export default function CreateProfile({ onSave }: Props) {
  const [name, setName] = useState("");

  const [age, setAge] = useState("");

  const [height, setHeight] = useState("");

  const [goal, setGoal] = useState("");

  const [targetWeight, setTargetWeight] = useState("");

  const [targetBodyFat, setTargetBodyFat] = useState("");

  const [targetMuscleMass, setTargetMuscleMass] = useState("");

  async function save() {
    if (!name || !age || !height) {
      alert("Merci de remplir les informations obligatoires");
      return;
    }

    try {
      await createProfile({
        name,
        age: Number(age),
        height: Number(height),
        goal,
        target_weight: targetWeight ? Number(targetWeight) : null,
        target_body_fat: targetBodyFat ? Number(targetBodyFat) : null,
        target_muscle_mass: targetMuscleMass ? Number(targetMuscleMass) : null,
      });

      onSave();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du profil");
    }
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
      "
      >
        <h2
          className="
        text-2xl
        font-bold
        "
        >
          Créer ton profil
        </h2>

        <input
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="
        mt-6
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        />

        <input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        />

        <input
          placeholder="Taille en cm"
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        />

        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        >
          <option value="">Objectif</option>

          <option value="Perte de gras">Perte de gras</option>

          <option value="Prise de muscle">Prise de muscle</option>

          <option value="Force">Force</option>

          <option value="Basket">Performance basket</option>
        </select>

        <input
          type="number"
          placeholder="Poids objectif (kg)"
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        />

        <input
          type="number"
          placeholder="Masse grasse objectif (%)"
          value={targetBodyFat}
          onChange={(e) => setTargetBodyFat(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
        />

        <input
          type="number"
          placeholder="Masse musculaire objectif (%)"
          value={targetMuscleMass}
          onChange={(e) => setTargetMuscleMass(e.target.value)}
          className="
        mt-3
        w-full
        bg-neutral-800
        rounded-xl
        p-3
        "
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
  );
}
