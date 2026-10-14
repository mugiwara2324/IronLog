import { useState } from "react";
import { updateProfile } from "../../services/profileService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

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
  const [name, setName] = useState(profile.name ?? "");

  const [age, setAge] = useState(
    profile.age !== null && profile.age !== undefined
      ? profile.age.toString()
      : "",
  );

  const [height, setHeight] = useState(
    profile.height !== null && profile.height !== undefined
      ? profile.height.toString()
      : "",
  );

  const [goal, setGoal] = useState(profile.goal ?? "");

  const [targetWeight, setTargetWeight] = useState(
    profile.target_weight !== null && profile.target_weight !== undefined
      ? profile.target_weight.toString()
      : "",
  );

  const [targetBodyFat, setTargetBodyFat] = useState(
    profile.target_body_fat !== null && profile.target_body_fat !== undefined
      ? profile.target_body_fat.toString()
      : "",
  );

  const [targetMuscleMass, setTargetMuscleMass] = useState(
    profile.target_muscle_mass !== null &&
      profile.target_muscle_mass !== undefined
      ? profile.target_muscle_mass.toString()
      : "",
  );


  useBodyScrollLock(true);

  async function save() {
    await updateProfile({
      name,

      age: age ? Number(age) : null,

      height: height ? Number(height) : null,

      goal,

      target_weight: targetWeight ? Number(targetWeight) : null,

      target_body_fat: targetBodyFat ? Number(targetBodyFat) : null,

      target_muscle_mass: targetMuscleMass ? Number(targetMuscleMass) : null,
    });

    onSave();

    onClose();
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
        aria-labelledby="edit-profile-title"
      >
        <h2 id="edit-profile-title" className="text-2xl font-bold">
          Modifier profil
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="profile-name">
              Nom
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-age">
              Âge (ans)
            </label>
            <input
              id="profile-age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-height">
              Taille (cm)
            </label>
            <input
              id="profile-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-goal">
              Objectif sportif
            </label>
            <select
              id="profile-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            >
              <option value="">Choisir un objectif</option>
              <option value="Perte de gras">Perte de gras</option>
              <option value="Prise de muscle">Prise de muscle</option>
              <option value="Force">Force</option>
              <option value="Basket">Performance basket</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="profile-target-weight">
              Poids cible (kg)
            </label>
            <input
              id="profile-target-weight"
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-target-fat">
              Masse grasse cible (%)
            </label>
            <input
              id="profile-target-fat"
              type="number"
              value={targetBodyFat}
              onChange={(e) => setTargetBodyFat(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-target-muscle">
              Masse musculaire cible (%)
            </label>
            <input
              id="profile-target-muscle"
              type="number"
              value={targetMuscleMass}
              onChange={(e) => setTargetMuscleMass(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
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
