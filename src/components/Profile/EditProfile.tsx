import { useState } from "react";

import { db } from "../../database/db";

interface Props {
  profile: any;

  onClose: () => void;

  onSave: () => void;
}

export default function EditProfile({
  profile,

  onClose,

  onSave,
}: Props) {
  const [name, setName] = useState(profile.name);

  const [age, setAge] = useState(profile.age.toString());

  const [height, setHeight] = useState(profile.height.toString());

  const [goal, setGoal] = useState(profile.goal || "");

  const [targetWeight, setTargetWeight] = useState(
    profile.targetWeight?.toString() || "",
  );

  const [targetBodyFat, setTargetBodyFat] = useState(
    profile.targetBodyFat?.toString() || "",
  );

  const [targetMuscleMass, setTargetMuscleMass] = useState(
    profile.targetMuscleMass?.toString() || "",
  );

  async function save() {
    await db.profile.update(
      profile.id,

      {
        name,

        age: Number(age),

        height: Number(height),

        goal,

        targetWeight: targetWeight ? Number(targetWeight) : undefined,

        targetBodyFat: targetBodyFat ? Number(targetBodyFat) : undefined,

        targetMuscleMass: targetMuscleMass
          ? Number(targetMuscleMass)
          : undefined,
      },
    );

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
"
      >
        <h2
          className="
text-2xl
font-bold
"
        >
          Modifier profil
        </h2>

        <input
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

        <button
          onClick={onClose}
          className="
mt-3
w-full
text-neutral-400
"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
