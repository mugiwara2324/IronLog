import { useState, type ReactNode } from "react";
import { updateProfile } from "../../services/profileService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props {
  profile: any;
  mode: "personal" | "goals";
  onClose: () => void;
  onSave: () => void;
}

export default function EditProfile({ profile, mode, onClose, onSave }: Props) {
  const [name, setName] = useState(profile.name ?? "");
  const [age, setAge] = useState(profile.age == null ? "" : String(profile.age));
  const [height, setHeight] = useState(profile.height == null ? "" : String(profile.height));
  const [goal, setGoal] = useState(profile.goal ?? "");
  const [targetWeight, setTargetWeight] = useState(profile.target_weight == null ? "" : String(profile.target_weight));
  const [targetBodyFat, setTargetBodyFat] = useState(profile.target_body_fat == null ? "" : String(profile.target_body_fat));
  const [targetMuscleMass, setTargetMuscleMass] = useState(profile.target_muscle_mass == null ? "" : String(profile.target_muscle_mass));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useBodyScrollLock(true);

  async function save() {
    if (saving) return;
    if (mode === "personal" && !name.trim()) {
      setErrorMessage("Saisis ton nom avant d’enregistrer.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const changes = mode === "personal"
        ? { name: name.trim(), age: age ? Number(age) : null, height: height ? Number(height) : null }
        : {
            goal,
            target_weight: targetWeight ? Number(targetWeight) : null,
            target_body_fat: targetBodyFat ? Number(targetBodyFat) : null,
            target_muscle_mass: targetMuscleMass ? Number(targetMuscleMass) : null,
          };
      await updateProfile(changes);
      onSave();
      onClose();
    } catch (error) {
      console.error("Erreur mise à jour profil :", error);
      setErrorMessage("Les modifications n’ont pas pu être enregistrées. Vérifie ta connexion puis réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const isPersonal = mode === "personal";

  return (
    <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="modal-panel max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto rounded-3xl bg-neutral-900 p-6" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Profil</p>
        <h2 id="edit-profile-title" className="mt-2 text-2xl font-bold">{isPersonal ? "Informations personnelles" : "Mes objectifs"}</h2>
        <p className="mt-2 text-sm text-neutral-400">{isPersonal ? "Mets à jour ton nom et tes informations de base." : "Ajuste tes repères sportifs et corporels."}</p>

        <div className="mt-6 space-y-4">
          {isPersonal ? <>
            <Field label="Nom" id="profile-name"><input id="profile-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
            <Field label="Âge (ans)" id="profile-age"><input id="profile-age" type="number" min="0" max="120" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
            <Field label="Taille (cm)" id="profile-height"><input id="profile-height" type="number" min="0" max="260" inputMode="numeric" value={height} onChange={(event) => setHeight(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
          </> : <>
            <Field label="Objectif sportif" id="profile-goal"><select id="profile-goal" value={goal} onChange={(event) => setGoal(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3"><option value="">Choisir un objectif</option><option value="Perte de gras">Perte de gras</option><option value="Prise de muscle">Prise de muscle</option><option value="Force">Force</option><option value="Basket">Performance basket</option></select></Field>
            <Field label="Poids cible (kg)" id="profile-target-weight"><input id="profile-target-weight" type="number" min="0" step="0.1" inputMode="decimal" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
            <Field label="Masse grasse cible (%)" id="profile-target-fat"><input id="profile-target-fat" type="number" min="0" max="100" step="0.1" inputMode="decimal" value={targetBodyFat} onChange={(event) => setTargetBodyFat(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
            <Field label="Masse musculaire cible (%)" id="profile-target-muscle"><input id="profile-target-muscle" type="number" min="0" max="100" step="0.1" inputMode="decimal" value={targetMuscleMass} onChange={(event) => setTargetMuscleMass(event.target.value)} className="w-full rounded-xl bg-neutral-800 p-3" /></Field>
          </>}
        </div>

        {errorMessage && <p role="alert" className="mt-4 text-sm text-red-400">{errorMessage}</p>}
        <button type="button" onClick={() => void save()} disabled={saving} className="mt-6 w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-55">{saving ? "Enregistrement…" : "Enregistrer"}</button>
        <button type="button" onClick={onClose} disabled={saving} className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-neutral-400 disabled:opacity-50">Annuler</button>
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="field-label">{label}</label>{children}</div>;
}
