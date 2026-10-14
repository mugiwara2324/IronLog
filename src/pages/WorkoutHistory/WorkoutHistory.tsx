import { useEffect, useState } from "react";

import { useParams, useNavigate, useLocation } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function WorkoutHistory() {
  const { id } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const from = location.state?.from;

  const [session, setSession] = useState<any>(null);

  const [exercises, setExercises] = useState<any[]>([]);

  const [openExercise, setOpenExercise] = useState<string | null>(null);

  async function load() {
    if (!id) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    /*
      Récupération de la séance terminée
      id = workout_sessions.id
    */

    const { data: workoutSession, error } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Erreur récupération séance historique :", error);

      return;
    }

    setSession(workoutSession);

    /*
      Récupération des séries réalisées

      On essaye d'abord avec session_id
    */

    const { data: performedSets, error: setsError } = await supabase
      .from("performed_sets")
      .select(
        `
          *,
          exercises(
            id,
            name
          )
          `,
      )
      .eq("session_id", workoutSession.id);

    if (setsError) {
      console.error("Erreur récupération séries :", setsError);

      return;
    }

    /*
      Regroupement par exercice
    */

    const groupedExercises: any = {};

    (performedSets ?? []).forEach((set: any) => {
      const exerciseId = set.exercise_id;

      if (!groupedExercises[exerciseId]) {
        groupedExercises[exerciseId] = {
          id: exerciseId,

          name: set.exercises?.name ?? "Exercice",

          sets: [],
        };
      }

      groupedExercises[exerciseId].sets.push(set);
    });

    setExercises(Object.values(groupedExercises));
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!session) {
    return <div>Chargement...</div>;
  }

  function isToday(date: string) {
    const d = new Date(date);

    const today = new Date();

    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (from === "home") {
            navigate("/");
          } else {
            navigate("/workouts?tab=history");
          }
        }}
        className="
  mb-5
  bg-neutral-800
  rounded-2xl
  px-5
  py-3
  font-semibold
  "
      >
        ← Retour
      </button>
      <h1 className="text-3xl font-bold">Séance terminée</h1>

      <div
        className="
        mt-6
        bg-neutral-900
        rounded-3xl
        p-6
        "
      >
        <p>
          Volume total :<strong> {session.volume} kg</strong>
        </p>

        <p>
          Exercices terminés :<strong> {session.completed_exercises}</strong>
        </p>

        <p className="text-neutral-400 mt-2">
          {new Date(session.finished_at).toLocaleString()}
        </p>

        {/* 
          Modification autorisée uniquement
          depuis une vraie séance du jour
          sera gérée ailleurs.
          
          Ici historique = toujours modifiable
        */}

        {isToday(session.finished_at) && (
          <button
            onClick={() => navigate(`/workout-history/${session.id}/edit`)}
            className="
      mt-5
      bg-blue-600
      rounded-2xl
      px-5
      py-3
      font-bold
      "
          >
            Modifier la séance
          </button>
        )}
      </div>

      <div
        className="
        mt-6
        space-y-4
        "
      >
        {exercises.length === 0 ? (
          <p className="text-neutral-400">
            Aucun détail d'exercice disponible.
          </p>
        ) : (
          exercises.map((exercise) => {
            const isOpen = openExercise === exercise.id;

            const bestWeight = Math.max(
              ...exercise.sets.map((set: any) => Number(set.weight)),
            );
            const topSet = [...exercise.sets].sort((a: any, b: any) => Number(b.weight) - Number(a.weight))[0];

            return (
              <section key={exercise.id} className="rounded-3xl bg-neutral-900 p-5">
                <button type="button" aria-expanded={isOpen} aria-controls={`exercise-sets-${exercise.id}`} onClick={() => setOpenExercise(isOpen ? null : exercise.id)} className="flex w-full items-center justify-between gap-3 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                  <div>
                    <h2 className="text-xl font-bold">{exercise.name}</h2>

                    <p className="text-neutral-400 mt-1">
                      {exercise.sets.length} séries
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">{bestWeight} kg × {topSet?.reps ?? "—"}</p>

                    <p className="text-neutral-400 text-sm">{bestWeight === 0 ? "charge saisie · reps" : "meilleure série · reps"}</p>
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`exercise-sets-${exercise.id}`}
                    className="
                        mt-5
                        space-y-3
                        "
                  >
                    {exercise.sets.map((set: any, index: number) => (
                      <div
                        key={index}
                        className="
                                bg-neutral-800
                                rounded-2xl
                                p-4
                                flex
                                justify-between
                                "
                      >
                        <span>Série {index + 1}</span>

                        <span className="font-semibold">
                          {set.weight} kg × {set.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
