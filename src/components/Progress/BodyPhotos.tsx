import { useEffect, useState } from "react";
import AddProgressPhoto from "./AddProgressPhoto";

import { supabase } from "../../lib/supabase";

export default function BodyPhotos() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "front" | "side" | "back">(
    "all",
  );

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("progress_photos")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    setPhotos(
      (data ?? []).map((p: any) => ({ ...p, isReference: p.is_reference })),
    );
  }

  const filteredPhotos =
    filter === "all"
      ? photos
      : photos.filter((photo) => photo.category === filter);

  async function deletePhoto(id: number) {
    const confirmDelete = window.confirm("Supprimer cette photo ?");

    if (!confirmDelete) {
      return;
    }

    await supabase.from("progress_photos").delete().eq("id", id);

    loadPhotos();
  }

  async function setReference(id: number) {
    const { data: currentRefs } = await supabase
      .from("progress_photos")
      .select("id")
      .eq("is_reference", true);

    if (currentRefs && currentRefs.length) {
      for (const r of currentRefs) {
        await supabase
          .from("progress_photos")
          .update({ is_reference: false })
          .eq("id", r.id);
      }
    }

    await supabase
      .from("progress_photos")
      .update({ is_reference: true })
      .eq("id", id);

    loadPhotos();
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function getComparison(category: string) {
    const categoryPhotos = photos
      .filter((photo) => photo.category === category)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      first:
        categoryPhotos.find((photo) => photo.isReference) || categoryPhotos[0],

      last: categoryPhotos[categoryPhotos.length - 1],
    };
  }

  function getCategoryName(category: string) {
    switch (category) {
      case "front":
        return "Face";

      case "side":
        return "Profil";

      case "back":
        return "Dos";

      default:
        return category;
    }
  }

  return (
    <div>
      <h2
        className="
      text-xl
      font-bold
      "
      >
        Photos évolution
      </h2>
      <div
        className="
mt-6
flex
gap-2
overflow-x-auto
"
      >
        {[
          {
            id: "all",
            label: "Toutes",
          },
          {
            id: "front",
            label: "Face",
          },
          {
            id: "side",
            label: "Profil",
          },
          {
            id: "back",
            label: "Dos",
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={`
px-4
py-2
rounded-full
whitespace-nowrap
${filter === item.id ? "bg-white text-black" : "bg-neutral-800"}
`}
          >
            {item.label}
          </button>
        ))}
      </div>

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
        + Ajouter une photo
      </button>

      <div
        className="
mt-8
"
      >
        <h3
          className="
text-xl
font-bold
"
        >
          Comparaison
        </h3>

        <div
          className="
mt-4
space-y-6
"
        >
          {["front", "side", "back"].map((category) => {
            const { first, last } = getComparison(category);

            if (!first || !last || first.id === last.id) {
              return null;
            }

            return (
              <div
                key={category}
                className="
bg-neutral-900
rounded-3xl
p-5
"
              >
                <h4
                  className="
font-bold
mb-4
"
                >
                  {category === "front"
                    ? "Face"
                    : category === "side"
                      ? "Profil"
                      : "Dos"}
                </h4>

                <div
                  className="
grid
grid-cols-2
gap-4
"
                >
                  <div>
                    <p
                      className="
text-neutral-400
text-sm
mb-2
"
                    >
                      Début
                    </p>

                    <img
                      src={first.image}
                      className="
rounded-2xl
aspect-square
object-cover
"
                    />
                  </div>

                  <div>
                    <p
                      className="
text-neutral-400
text-sm
mb-2
"
                    >
                      Aujourd'hui
                    </p>

                    <img
                      src={last.image}
                      className="
rounded-2xl
aspect-square
object-cover
"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {photos.length === 0 ? (
        <p
          className="
        mt-6
        text-neutral-400
        "
        >
          Aucune photo enregistrée.
        </p>
      ) : (
        <div
          className="
        mt-8
        grid
        grid-cols-2
        gap-4
        "
        >
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="
              bg-neutral-900
              rounded-3xl
              p-4
              "
            >
              <div
                className="
                aspect-square
                bg-neutral-800
                rounded-2xl
                flex
                items-center
                justify-center
                "
              >
                {photo.image ? (
                  <img
                    src={photo.image}
                    className="
                    w-full
                    h-full
                    object-cover
                    rounded-2xl
                    "
                  />
                ) : (
                  <span
                    className="
                    text-neutral-500
                    "
                  >
                    Image
                  </span>
                )}
              </div>

              <p
                className="
font-bold
"
              >
                {getCategoryName(photo.category)}

                {photo.isReference && " ⭐"}
              </p>

              <p
                className="
                text-neutral-400
                text-sm
                "
              >
                {new Date(photo.date).toLocaleDateString()}
              </p>
              <button
                onClick={() => setReference(photo.id)}
                className="
mt-2
w-full
bg-yellow-500/10
text-yellow-400
rounded-xl
py-2
"
              >
                ⭐ Définir comme référence
              </button>
              <button
                onClick={() => deletePhoto(photo.id)}
                className="
mt-4
w-full
bg-red-500/10
text-red-400
rounded-xl
py-2
"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <AddProgressPhoto
          onClose={() => setShowAdd(false)}
          onSave={() => loadPhotos()}
        />
      )}
    </div>
  );
}
