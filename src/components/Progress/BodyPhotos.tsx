import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import AddProgressPhoto from "./AddProgressPhoto";

import { supabase } from "../../lib/supabase";


type ComparisonPhoto = { id: number; image: string; date: string };

type ImageAlignment = { zoom: number; x: number; y: number };
const defaultAlignment: ImageAlignment = { zoom: 100, x: 0, y: 0 };

function PhotoComparisonCard({
  title,
  before,
  after,
}: {
  title: string;
  before: ComparisonPhoto;
  after: ComparisonPhoto;
}) {
  const [opacity, setOpacity] = useState(50);
  const [aligning, setAligning] = useState<"before" | "after">("after");
  const [beforeAlignment, setBeforeAlignment] = useState<ImageAlignment>(defaultAlignment);
  const [afterAlignment, setAfterAlignment] = useState<ImageAlignment>(defaultAlignment);
  const [frameRatio, setFrameRatio] = useState(0.8);
  const alignment = aligning === "before" ? beforeAlignment : afterAlignment;
  const setAlignment = aligning === "before" ? setBeforeAlignment : setAfterAlignment;
  const imageTransform = (value: ImageAlignment) => ({
    transform: `translate(${value.x}%, ${value.y}%) scale(${value.zoom / 100})`,
  });
  const dateLabel = (value: string) => new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-xs text-neutral-500">
            Règle le cadrage puis l’opacité
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: frameRatio, maxHeight: "72dvh" }}>
        <>
          <img src={before.image} alt={`${title}, avant, ${dateLabel(before.date)}`} className="absolute inset-0 h-full w-full object-contain" style={imageTransform(beforeAlignment)} />
          <img
              src={after.image}
              alt={`${title}, après, ${dateLabel(after.date)}`}
              onLoad={(event) => { const { naturalWidth, naturalHeight } = event.currentTarget; if (naturalWidth && naturalHeight) setFrameRatio(naturalWidth / naturalHeight); }}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ ...imageTransform(afterAlignment), opacity: opacity / 100 }}
            />
        </>
        <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">Avant · {dateLabel(before.date)}</span>
        <span className="absolute right-3 top-3 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">Après · {dateLabel(after.date)}</span>
      </div>

      <>
        <details className="group mt-4 rounded-2xl border border-white/5 bg-neutral-800/40 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-neutral-300 [&::-webkit-details-marker]:hidden">
            <span>Réglages de la superposition</span>
            <span className="flex items-center gap-2 text-xs text-neutral-500">
              {aligning === "before" ? "Photo avant" : "Photo après"} · {alignment.zoom}%
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-xl bg-neutral-800 p-1" role="group" aria-label={`Photo à aligner pour ${title}`}>
              <button type="button" onClick={() => setAligning("before")} aria-pressed={aligning === "before"} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${aligning === "before" ? "bg-neutral-600 text-white" : "text-neutral-400"}`}>Avant</button>
              <button type="button" onClick={() => setAligning("after")} aria-pressed={aligning === "after"} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${aligning === "after" ? "bg-neutral-600 text-white" : "text-neutral-400"}`}>Après</button>
            </div>
            <button type="button" onClick={() => setAlignment(defaultAlignment)} className="text-xs font-medium text-neutral-400 underline underline-offset-4">Réinitialiser {aligning === "before" ? "avant" : "après"}</button>
          </div>
          <label className="block text-xs text-neutral-400">
            Zoom · {alignment.zoom}%
            <input type="range" min="70" max="160" step="1" value={alignment.zoom} onChange={(event) => setAlignment((current) => ({ ...current, zoom: Number(event.target.value) }))} className="mt-1 w-full accent-lime-300" aria-label={`Zoom de la photo ${aligning === "before" ? "avant" : "après"}, ${title}`} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs text-neutral-400">
              Horizontal · {alignment.x}%
              <input type="range" min="-30" max="30" step="1" value={alignment.x} onChange={(event) => setAlignment((current) => ({ ...current, x: Number(event.target.value) }))} className="mt-1 w-full accent-lime-300" aria-label={`Décalage horizontal de la photo ${aligning === "before" ? "avant" : "après"}, ${title}`} />
            </label>
            <label className="block text-xs text-neutral-400">
              Vertical · {alignment.y}%
              <input type="range" min="-30" max="30" step="1" value={alignment.y} onChange={(event) => setAlignment((current) => ({ ...current, y: Number(event.target.value) }))} className="mt-1 w-full accent-lime-300" aria-label={`Décalage vertical de la photo ${aligning === "before" ? "avant" : "après"}, ${title}`} />
            </label>
          </div>
          </div>
        </details>
        <label className="mt-4 block text-xs text-neutral-400">
          Opacité de la photo après · {opacity}%
          <input type="range" min="0" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} className="mt-1 w-full accent-lime-300" aria-label={`Opacité de la photo après, ${title}`} />
        </label>
      </>
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
