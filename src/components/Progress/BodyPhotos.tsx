import { useEffect, useState } from "react";
import AddProgressPhoto from "./AddProgressPhoto";

import { supabase } from "../../lib/supabase";


type ComparisonPhoto = { id: number; image: string; date: string };

function PhotoComparisonCard({
  title,
  before,
  after,
}: {
  title: string;
  before: ComparisonPhoto;
  after: ComparisonPhoto;
}) {
  const [mode, setMode] = useState<"slider" | "overlay" | "difference">("slider");
  const [adjustment, setAdjustment] = useState(50);
  const dateLabel = (value: string) => new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const modes = [
    { id: "slider", label: "Curseur" },
    { id: "overlay", label: "Superposition" },
    { id: "difference", label: "Différence" },
  ] as const;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-xs text-neutral-500">
            {mode === "slider" ? "Fais glisser pour comparer" : mode === "overlay" ? "Règle l’opacité de la photo après" : "Les écarts de couleur révèlent les différences"}
          </p>
        </div>
        <div className="flex rounded-xl bg-neutral-800 p-1" role="group" aria-label={`Mode de comparaison ${title}`}>
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              aria-pressed={mode === item.id}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === item.id ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black">
        {mode === "slider" ? (
          <>
            <img src={after.image} alt={`${title}, après, ${dateLabel(after.date)}`} className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - adjustment}% 0 0)` }}>
              <img src={before.image} alt={`${title}, avant, ${dateLabel(before.date)}`} className="h-full w-full object-contain" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${adjustment}%` }}>
              <div className="h-full w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
              <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/70 text-white shadow-lg" aria-hidden="true">↔</div>
            </div>
          </>
        ) : (
          <>
            <img src={before.image} alt={`${title}, avant, ${dateLabel(before.date)}`} className="absolute inset-0 h-full w-full object-contain" />
            <img
              src={after.image}
              alt={`${title}, après, ${dateLabel(after.date)}`}
              className="absolute inset-0 h-full w-full object-contain"
              style={{
                opacity: adjustment / 100,
                mixBlendMode: mode === "difference" ? "difference" : "normal",
              }}
            />
          </>
        )}
        <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">Avant · {dateLabel(before.date)}</span>
        <span className="absolute right-3 top-3 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">Après · {dateLabel(after.date)}</span>
      </div>
      <label className="mt-4 block">
        <span className="sr-only">
          {mode === "slider" ? `Position du comparateur pour ${title}` : `Opacité de la photo après pour ${title}`}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={adjustment}
          onChange={(event) => setAdjustment(Number(event.target.value))}
          className="w-full accent-lime-300"
          aria-label={mode === "slider" ? `Comparer les photos avant et après, ${title}` : `Régler la superposition des photos, ${title}`}
        />
      </label>
      <div className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{mode === "slider" ? "Avant" : "Après transparent"}</span>
        <span>{mode === "slider" ? "Après" : "Après opaque"}</span>
      </div>
    </section>
  );
}

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

    const last = categoryPhotos[categoryPhotos.length - 1];
    const reference = categoryPhotos.find((photo) => photo.isReference);
    const first = reference?.id !== last?.id
      ? reference ?? categoryPhotos[0]
      : categoryPhotos.find((photo) => photo.id !== last?.id);

    return { first, last };
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

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {(filter === "all" ? ["front", "side", "back"] : [filter]).map((category) => {
            const { first, last } = getComparison(category);
            if (!first || !last || first.id === last.id) return null;
            return (
              <PhotoComparisonCard
                key={category}
                title={getCategoryName(category)}
                before={first}
                after={last}
              />
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
