import { useState } from "react";

import { db } from "../../database/db";

interface Props {
  onClose: () => void;

  onSave: () => void;
}

export default function AddProgressPhoto({ onClose, onSave }: Props) {
  const [image, setImage] = useState("");

  const [category, setCategory] = useState<"front" | "side" | "back">("front");

  const [note, setNote] = useState("");

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

    await db.progressPhotos.add({
      date: new Date(),

      image,

      category,

      note,
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
          Nouvelle photo
        </h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="
        mt-6
        "
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

        <div
          className="
        mt-6
        "
        >
          <p
            className="
          text-neutral-400
          "
          >
            Position
          </p>

          <select
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

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note..."
          className="
        mt-6
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
