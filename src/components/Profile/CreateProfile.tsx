import { useState } from "react";

import { createProfile } from "../../services/profileService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props {
  onSave: () => void;
  onClose: () => void;
}

export default function CreateProfile({ onSave, onClose }: Props) {
  const [name, setName] = useState("");

  const [age, setAge] = useState("");

  const [height, setHeight] = useState("");

  const [goal, setGoal] = useState("");

  const [targetWeight, setTargetWeight] = useState("");

  const [targetBodyFat, setTargetBodyFat] = useState("");

  const [targetMuscleMass, setTargetMuscleMass] = useState("");

  useBodyScrollLock(true);

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
      className="modal-overlay"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="modal-panel bg-neutral-900 rounded-3xl p-6 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-profile-title"
      >
        <h2 id="create-profile-title" className="text-2xl font-bold">
          Créer ton profil
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="create-profile-name">Nom</label>
            <input id="create-profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-age">Âge (ans)</label>
            <input id="create-profile-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-height">Taille (cm)</label>
            <input id="create-profile-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-goal">Objectif sportif</label>
            <select id="create-profile-goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3">
          <option value="">Choisir un objectif</option>

          <option value="Perte de gras">Perte de gras</option>

          <option value="Prise de muscle">Prise de muscle</option>

          <option value="Force">Force</option>

          <option value="Basket">Performance basket</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-target-weight">Poids cible (kg)</label>
            <input id="create-profile-target-weight" type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-target-fat">Masse grasse cible (%)</label>
            <input id="create-profile-target-fat" type="number" value={targetBodyFat} onChange={(e) => setTargetBodyFat(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
          <div>
            <label className="field-label" htmlFor="create-profile-target-muscle">Masse musculaire cible (%)</label>
            <input id="create-profile-target-muscle" type="number" value={targetMuscleMass} onChange={(e) => setTargetMuscleMass(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3" />
          </div>
        </div>

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
