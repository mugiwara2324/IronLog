import { useState } from "react";

import { supabase } from "../../lib/supabase";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Props {
  onClose: () => void;

  onSave: () => void;
}

export default function AddProgressPhoto({ onClose, onSave }: Props) {
  const [image, setImage] = useState("");

  const [category, setCategory] = useState<"front" | "side" | "back">("front");

  const [note, setNote] = useState("");

  useBodyScrollLock(true);

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");

          const maxWidth = 800;

          const scale = maxWidth / img.width;

          canvas.width = maxWidth;

          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");

          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };

        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const compressed = await compressImage(file);

    setImage(compressed);
  }

  async function save() {
    if (!image) {
      alert("Choisis une image");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Utilisateur non connecté");
      return;
    }

    const { error } = await supabase.from("progress_photos").insert({
      user_id: user.id,
      date: new Date().toISOString(),
      image,
      category,
      note,
      is_reference: false,
    });

    if (error) {
      console.error("Erreur ajout photo :", error);
      throw error;
    }

    onSave();

    onClose();
  }

  return (
    <div
      className="modal-overlay"
    >
      <div
        className="modal-panel bg-neutral-900 rounded-3xl p-6 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-photo-title"
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
          id="progress-photo-title"
          className="
        text-2xl
        font-bold
        mt-6
        "
        >
          Nouvelle photo
        </h2>

        <label className="field-label mt-6" htmlFor="progress-photo-file">Photo à ajouter</label>
        <input
          id="progress-photo-file"
          type="file"
          accept="image/*"
          onChange={handleImage}
        />

        {image && (
          <img
            src={image}
            className="
            mt-4
            w-full
            rounded-2xl
            "
          />
        )}

        <div className="mt-6">
          <label className="field-label" htmlFor="progress-photo-position">Position</label>
          <select
            id="progress-photo-position"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="
          mt-2
          w-full
          bg-neutral-800
          rounded-xl
          p-3
          "
          >
            <option value="front">Face</option>

            <option value="side">Profil</option>

            <option value="back">Dos</option>
          </select>
        </div>

        <label className="field-label mt-6" htmlFor="progress-photo-note">Note</label>
        <textarea
          id="progress-photo-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter une note"
          className="
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
