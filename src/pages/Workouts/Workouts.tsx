import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {
  createWorkout,
  getWorkouts,
} from "../../services/supabaseWorkoutService";

import { supabase } from "../../lib/supabase";

const defaultWorkoutForm = {
  name: "",
  day_of_week: 1,
  description: "",
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);

  const [history, setHistory] = useState<any[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    searchParams.get("tab") === "history" ? "history" : "program";

  const [showAdd, setShowAdd] = useState(false);

  const [newWorkout, setNewWorkout] = useState(defaultWorkoutForm);

  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkouts();

        setWorkouts(data ?? []);

        await loadHistory();
      } catch (error) {
        console.error("Erreur chargement séances", error);
      }
    }

    load();
  }, []);

  async function loadHistory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("workout_sessions")
      .select(
        `
        id,
        finished_at,
        volume,
        completed_exercises,
        workouts(
          id,
          name
        )
        `,
      )
      .eq("user_id", user.id)
      .order("finished_at", {
        ascending: false,
      });

    if (error) {
      console.error("Erreur chargement historique", error);

      return;
    }

    setHistory(data ?? []);
  }

  async function handleCreateWorkout() {
    setSaving(true);

    try {
      const created = await createWorkout(newWorkout);

      setWorkouts((prev) => [...prev, created]);

      setNewWorkout(defaultWorkoutForm);

      setShowAdd(false);
    } catch (error) {
      console.error("Erreur création séance", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1
        className="
        text-3xl
        font-bold
        "
      >
        Mes séances
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
          onClick={() => setSearchParams({})}
          className={`
          flex-1
          py-3
          rounded-xl
          font-semibold
          ${
            activeTab === "program" ? "bg-white text-black" : "text-neutral-400"
          }
          `}
        >
          Programme
        </button>

        <button
          onClick={() =>
            setSearchParams({
              tab: "history",
            })
          }
          className={`
          flex-1
          py-3
          rounded-xl
          font-semibold
          ${
            activeTab === "history" ? "bg-white text-black" : "text-neutral-400"
          }
          `}
        >
          Historique
        </button>
      </div>

      {activeTab === "program" && (
        <>
          <p
            className="
          text-neutral-400
          mt-4
          "
          >
            Programme hebdomadaire
          </p>

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
            + Ajouter une séance
          </button>

          {showAdd && (
            <div
              className="
            mt-6
            space-y-4
            "
            >
              <div
                className="
              bg-neutral-900
              rounded-3xl
              p-5
              space-y-4
              "
              >
                <label>
                  <span className="field-label">Nom de la séance</span>
                  <input
                    value={newWorkout.name}
                    onChange={(e) =>
                      setNewWorkout((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="
                w-full
                rounded-xl
                p-3
                bg-neutral-800
                "
                  />
                </label>

                <label>
                  <span className="field-label">Jour de la séance</span>
                  <select
                    value={newWorkout.day_of_week}
                    onChange={(e) =>
                      setNewWorkout((prev) => ({
                        ...prev,
                        day_of_week: Number(e.target.value),
                      }))
                    }
                    className="
                w-full
                rounded-xl
                p-3
                bg-neutral-800
                "
                  >
                  <option value={1}>Lundi</option>
                  <option value={2}>Mardi</option>
                  <option value={3}>Mercredi</option>
                  <option value={4}>Jeudi</option>
                  <option value={5}>Vendredi</option>
                  <option value={6}>Samedi</option>
                  <option value={7}>Dimanche</option>
                  </select>
                </label>

                <label>
                  <span className="field-label">Description</span>
                  <textarea
                    value={newWorkout.description}
                    onChange={(e) =>
                      setNewWorkout((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="
                w-full
                rounded-xl
                p-3
                bg-neutral-800
                min-h-[120px]
                "
                  />
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateWorkout}
                    disabled={saving}
                    className="
                  flex-1
                  bg-white
                  text-black
                  rounded-2xl
                  py-3
                  font-semibold
                  "
                  >
                    {saving ? "Enregistrement..." : "Créer"}
                  </button>

                  <button
                    onClick={() => setShowAdd(false)}
                    className="
                  flex-1
                  bg-neutral-700
                  rounded-2xl
                  py-3
                  "
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className="
          mt-8
          space-y-4
          "
          >
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="
                bg-neutral-900
                rounded-3xl
                p-5
                "
              >
                <div
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                  className="
                  cursor-pointer
                  "
                >
                  <h2
                    className="
                    text-xl
                    font-bold
                    "
                  >
                    {workout.name}
                  </h2>

                  <p
                    className="
                    text-neutral-400
                    mt-2
                    "
                  >
                    {getDayName(workout.day_of_week)}
                  </p>

                  <p
                    className="
                    mt-2
                    text-sm
                    "
                  >
                    {workout.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div
          className="
          mt-6
          space-y-4
          "
        >
          {history.length === 0 ? (
            <p
              className="
              text-neutral-400
              "
            >
              Aucune séance terminée.
            </p>
          ) : (
            history.map((session) => (
              <div
                key={session.id}
                onClick={() =>
                  navigate(`/workouts/history/${session.id}`, {
                    state: {
                      from: "history",
                    },
                  })
                }
                className="
                bg-neutral-900
                rounded-3xl
                p-5
                cursor-pointer
                "
              >
                <h2
                  className="
                  text-xl
                  font-bold
                  "
                >
                  {session.workouts?.name ?? "Séance"}
                </h2>

                <p
                  className="
                  text-neutral-400
                  mt-2
                  "
                >
                  {new Date(session.finished_at).toLocaleString()}
                </p>

                <p
                  className="
                  mt-3
                  "
                >
                  Volume :<strong> {session.volume ?? 0} kg</strong>
                </p>

                <p>
                  Exercices :
                  <strong> {session.completed_exercises ?? 0}</strong>
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getDayName(day: number) {
  const days = [
    "",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  return days[day] ?? "";
}
