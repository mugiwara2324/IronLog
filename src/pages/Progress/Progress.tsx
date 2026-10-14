import { useState } from "react";
import ExerciseProgress from "../../components/Progress/ExerciseProgress";
import BodyProgress from "../../components/Progress/BodyProgress";
import BodyPhotos from "../../components/Progress/BodyPhotos";

export default function Progress() {
  const [activeTab, setActiveTab] = useState<"exercises" | "body" | "photos">(
    "exercises",
  );

  return (
    <div>
      <h1
        className="
      text-3xl
      font-bold
      "
      >
        Progression
      </h1>

      <div
        className="
      mt-6
      flex
      bg-neutral-900
      rounded-2xl
      p-1
      "
      >
        <button
          type="button"
          aria-pressed={activeTab === "exercises"}
          onClick={() => setActiveTab("exercises")}
          className={`
        flex-1
        py-3
        rounded-xl
        ${
          activeTab === "exercises" ? "bg-white text-black" : "text-neutral-400"
        }
        `}
        >
          Exercices
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "body"}
          onClick={() => setActiveTab("body")}
          className={`
        flex-1
        py-3
        rounded-xl
        ${activeTab === "body" ? "bg-white text-black" : "text-neutral-400"}
        `}
        >
          Corps
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "photos"}
          onClick={() => setActiveTab("photos")}
          className={`
        flex-1
        py-3
        rounded-xl
        ${activeTab === "photos" ? "bg-white text-black" : "text-neutral-400"}
        `}
        >
          Photos
        </button>
      </div>

      <div
        className="
      mt-8
      "
      >
        {activeTab === "exercises" && <ExerciseProgress />}

        {activeTab === "body" && <BodyProgress />}

        {activeTab === "photos" && <BodyPhotos />}
      </div>
    </div>
  );
}
