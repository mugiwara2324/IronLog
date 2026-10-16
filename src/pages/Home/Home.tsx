import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Dumbbell, Play, RefreshCw, Trash2 } from "lucide-react";

import {
  getCurrentDayOfWeek,
  getDayName,
  getWeeklyWorkoutPlan,
  type WorkoutTemplate,
  WEEK_DAYS,
} from "../../services/workoutService";
import { supabase } from "../../lib/supabase";
import { cancelActiveWorkout, syncPendingActiveWorkoutCancellations } from "../../services/activeWorkoutService";
import { getInitialReps } from "../../utils/reps";

type CompletedSession = {
  id: string;
  workout_id: string;
  finished_at: string;
  workouts?: { name?: string | null } | null;
};

type ActiveWorkoutOverview = {
  workoutId: string;
  totalSets: number;
  completedSets: number;
  canCancel: boolean;
};

function getStartOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function getSessionDay(date: string) {
  const day = new Date(date).getDay();
  return day === 0 ? 7 : day;
}

function formatFirstName(name: string | null | undefined) {
  const firstName = name?.trim().split(/\s+/)[0] ?? "";
  return firstName ? firstName[0].toLocaleUpperCase("fr-FR") + firstName.slice(1) : "";
}

export default function Home() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutOverview | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancellationPending, setCancellationPending] = useState(false);
  const initialRetryUsed = useRef(false);
  const initialRetryTimer = useRef<number | null>(null);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const pendingCancellations = await syncPendingActiveWorkoutCancellations(user.id);
      const [weeklyPlan, activeResult, sessionsResult, profileResult] = await Promise.all([
        getWeeklyWorkoutPlan(),
        supabase.from("active_workout").select("workout_id")
          .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("workout_sessions")
          .select("id, workout_id, finished_at, workouts(name)")
          .eq("user_id", user.id).not("finished_at", "is", null)
          .gte("finished_at", getStartOfCurrentWeek())
          .order("finished_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle(),
      ]);

      if (activeResult.error) throw activeResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const history = (sessionsResult.data ?? []) as CompletedSession[];
      setFirstName(formatFirstName(profileResult.data?.name));
      setWorkouts(weeklyPlan);
      setCompletedSessions(history);
      setCancellationPending(pendingCancellations > 0);
      setErrorMessage(null);

      const plannedToday = weeklyPlan.find((workout) => workout.day_of_week === getCurrentDayOfWeek());
      setSelectedWorkoutId((current) => plannedToday
        ? weeklyPlan.some((workout) => workout.id === current) ? current : plannedToday.id
        : "");

      const activeWorkoutId = pendingCancellations === 0 ? activeResult.data?.workout_id : null;
      if (!activeWorkoutId) {
        setActiveWorkout(null);
      } else {
        const { data: activeExercises, error: activeExercisesError } = await supabase
          .from("active_workout_exercises").select("sets, done")
          .eq("user_id", user.id).eq("workout_id", activeWorkoutId);
        if (activeExercisesError) throw activeExercisesError;

        const sets = (activeExercises ?? []).flatMap((exercise) =>
          Array.isArray(exercise.sets) ? exercise.sets as Array<{ completed?: boolean }> : [],
        );
        const completedSets = sets.filter((set) => set.completed).length;
        const hasCompletedExercise = (activeExercises ?? []).some((exercise) => exercise.done);
        setActiveWorkout({
          workoutId: activeWorkoutId,
          totalSets: sets.length,
          completedSets,
          canCancel: completedSets === 0 && !hasCompletedExercise,
        });
      }
    } catch (error) {
      console.error("Erreur chargement accueil :", error);
      setErrorMessage("Impossible de charger tes séances.");
      if (!initialRetryUsed.current && navigator.onLine) {
        initialRetryUsed.current = true;
        initialRetryTimer.current = window.setTimeout(() => { void load(); }, 600);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Loading the authenticated home screen is the effect's external data sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const handleOnline = () => void load();
    const handleFocus = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (initialRetryTimer.current !== null) window.clearTimeout(initialRetryTimer.current);
    };
  }, []);

  async function startWorkout() {
    if (starting || activeWorkout || cancellationPending) return;
    const workout = workouts.find((item) => item.id === selectedWorkoutId);
    if (!workout) {
      setErrorMessage("Choisis une séance avant de la lancer.");
      return;
    }

    setStarting(true);
    setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Recheck the server so a second tab cannot accidentally replace an active workout.
      const { data: existingActive, error: existingActiveError } = await supabase
        .from("active_workout").select("workout_id").eq("user_id", user.id)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (existingActiveError) throw existingActiveError;
      if (existingActive?.workout_id) {
        await load();
        setErrorMessage("Une séance est déjà en cours. Termine-la ou annule-la avant d’en démarrer une autre.");
        return;
      }

      const pendingCancellations = await syncPendingActiveWorkoutCancellations(user.id);
      if (pendingCancellations > 0) {
        setCancellationPending(true);
        throw new Error("L’annulation précédente attend une connexion pour se synchroniser.");
      }

      const { data: workoutExercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("exercise_id, sets, reps, weight, order, order_index")
        .eq("workout_id", workout.id);
      if (exercisesError) throw exercisesError;
      if (!workoutExercises?.length) throw new Error("Cette séance ne contient aucun exercice.");

      const { error: activeError } = await supabase.from("active_workout").insert({
        user_id: user.id,
        workout_id: workout.id,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (activeError) throw activeError;

      const activeExercises = [...workoutExercises]
        .sort((a, b) => Number(a.order ?? a.order_index ?? 0) - Number(b.order ?? b.order_index ?? 0))
        .map((exercise, index) => ({
          user_id: user.id,
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          order: exercise.order ?? exercise.order_index ?? index + 1,
          done: false,
          sets: Array.from({ length: exercise.sets }, () => ({
            weight: exercise.weight,
            reps: getInitialReps(exercise.reps),
          })),
        }));

      const { error: insertExercisesError } = await supabase
        .from("active_workout_exercises").insert(activeExercises);
      if (insertExercisesError) {
        await supabase.from("active_workout").delete().eq("user_id", user.id).eq("workout_id", workout.id);
        throw insertExercisesError;
      }

      navigate(`/workout-active/${workout.id}`);
    } catch (error: unknown) {
      console.error("Erreur démarrage séance :", error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur au démarrage de la séance.");
    } finally {
      setStarting(false);
    }
  }

  async function cancelWorkout() {
    if (!activeWorkout || !activeWorkout.canCancel || cancelling) return;
    const workoutName = workouts.find((item) => item.id === activeWorkout.workoutId)?.name ?? "cette séance";
    if (!window.confirm(`Annuler « ${workoutName} » ? La séance ne sera pas ajoutée à l’historique.`)) return;

    setCancelling(true);
    setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");
      const removedOnline = await cancelActiveWorkout(user.id, activeWorkout.workoutId);
      try { localStorage.removeItem(`ironlog:active-workout:${user.id}:${activeWorkout.workoutId}`); } catch { /* cache facultatif */ }
      setActiveWorkout(null);
      setCancellationPending(!removedOnline);
      if (!removedOnline) setErrorMessage("L’annulation est enregistrée sur cet appareil et sera synchronisée dès que possible.");
    } catch (error) {
      console.error("Erreur annulation séance :", error);
      setErrorMessage("La séance n’a pas pu être annulée. Réessaie dans un instant.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div role="status" className="text-neutral-400">Chargement de l’accueil…</div>;

  const todayDay = getCurrentDayOfWeek();
  const selectedWorkout = workouts.find((workout) => workout.id === selectedWorkoutId);
  const plannedDays = WEEK_DAYS.flatMap((day) => {
    const sessions = workouts.filter((workout) => workout.day_of_week === day.value);
    return sessions.length ? [{ ...day, sessions }] : [];
  });
  const completedThisWeek = completedSessions.length;

  return (
    <div className="home-dashboard">
      <header className="home-welcome">
        <div>
          <h1 className="home-greeting-title">
            <span>Bonjour{firstName ? ` ${firstName}` : ""} !</span>
            <span className="home-greeting-subtitle">Prêt à t’entraîner ?</span>
          </h1>
          <p className="mt-2 text-neutral-400">{getDayName(todayDay)} · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
        </div>
      </header>

      {activeWorkout ? (
        <section className="home-active-card" aria-labelledby="active-workout-heading">
          <div className="home-active-card__title">
            <div className="home-active-card__identity">
              <div className="home-card-icon"><Dumbbell size={20} aria-hidden="true" /></div>
              <h2 id="active-workout-heading">{workouts.find((item) => item.id === activeWorkout.workoutId)?.name ?? "Ta séance"}</h2>
            </div>
            <span className="home-status-pill"><span className="home-status-dot" /> En cours</span>
          </div>
          <p className="home-card-copy">
            {activeWorkout.totalSets > 0
              ? `${activeWorkout.completedSets} série${activeWorkout.completedSets > 1 ? "s" : ""} validée${activeWorkout.completedSets > 1 ? "s" : ""} sur ${activeWorkout.totalSets}`
              : "Ta séance est prête à reprendre."}
          </p>
          {activeWorkout.totalSets > 0 && <div className="home-progress-track" role="progressbar" aria-label="Progression de la séance" aria-valuenow={activeWorkout.completedSets} aria-valuemin={0} aria-valuemax={activeWorkout.totalSets}><span style={{ width: `${Math.round(activeWorkout.completedSets / activeWorkout.totalSets * 100)}%` }} /></div>}
          <button type="button" onClick={() => navigate(`/workout-active/${activeWorkout.workoutId}`)} className="home-primary-button">
            <Play size={17} fill="currentColor" aria-hidden="true" /> Reprendre ma séance <ArrowRight size={18} aria-hidden="true" />
          </button>
          {activeWorkout.canCancel ? (
            <button type="button" onClick={() => void cancelWorkout()} disabled={cancelling} className="home-secondary-button">
              <Trash2 size={16} aria-hidden="true" /> {cancelling ? "Annulation…" : "Annuler cette séance"}
            </button>
          ) : (
            <p className="home-lock-note"><Check size={15} aria-hidden="true" /> Une série est validée : termine cette séance avant d’en lancer une autre.</p>
          )}
        </section>
      ) : (
        <section className="home-start-card" aria-labelledby="start-workout-heading">
          <div className="home-start-card__heading">
            <div className="home-card-icon"><Play size={20} aria-hidden="true" /></div>
            <div>
              <h2 id="start-workout-heading">Commencer une séance</h2>
            </div>
          </div>

          {workouts.length > 0 ? (
            <>
              <select id="home-workout-select" aria-label="Sélectionnez une séance à lancer" value={selectedWorkoutId} onChange={(event) => setSelectedWorkoutId(event.target.value)} className="home-workout-select" disabled={cancellationPending || starting}>
                <option value="" disabled>Sélectionnez une séance</option>
                {workouts.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}{workout.day_of_week === todayDay ? " · prévue aujourd’hui" : ` · ${getDayName(workout.day_of_week)}`}</option>)}
              </select>
              {selectedWorkout?.description && <p className="home-card-copy">{selectedWorkout.description}</p>}
              {!workouts.some((workout) => workout.day_of_week === todayDay) && <p className="home-card-copy">Aucune séance n’est prévue aujourd’hui. Tu peux en choisir une dans ton programme.</p>}
              {cancellationPending && <p role="status" className="home-pending-note"><RefreshCw size={16} aria-hidden="true" /> L’annulation précédente attend une connexion. Tu pourras lancer une séance après sa synchronisation.</p>}
              <button type="button" onClick={() => void startWorkout()} disabled={starting || Boolean(activeWorkout) || cancellationPending || !selectedWorkoutId} className="home-primary-button">
                <Play size={17} fill="currentColor" aria-hidden="true" /> {starting ? "Préparation…" : "Lancer la séance"} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <p className="home-card-copy">Crée ton programme hebdomadaire pour retrouver ici les séances à lancer.</p>
              <button type="button" onClick={() => navigate("/workouts")} className="home-primary-button">Créer une séance <ArrowRight size={18} aria-hidden="true" /></button>
            </>
          )}
        </section>
      )}

      {errorMessage && <p role="alert" className="home-error">{errorMessage}</p>}

      <section className="home-week-overview" aria-label="Résumé de la semaine">
        <div><span>{plannedDays.reduce((sum, day) => sum + day.sessions.length, 0)}</span><small>séances au programme</small></div>
        <div><span>{completedThisWeek}</span><small>réalisée{completedThisWeek > 1 ? "s" : ""} cette semaine</small></div>
      </section>

      <section className="home-weekly-plan" aria-labelledby="weekly-plan-heading">
        <div className="home-section-heading">
          <div><p className="home-eyebrow">Organisation</p><h2 id="weekly-plan-heading">Mon planning</h2></div>
          <button type="button" onClick={() => navigate("/workouts")} className="home-icon-link" aria-label="Ouvrir mes séances" title="Ouvrir mes séances">
            <CalendarDays size={20} aria-hidden="true" />
          </button>
        </div>

        {plannedDays.length > 0 ? (
          <div className="home-plan-list">
            {plannedDays.map((day) => {
              const completed = completedSessions.filter((session) => getSessionDay(session.finished_at) === day.value);
              return (
                <article key={day.value} className={`home-plan-day${day.value === todayDay ? " is-today" : ""}`}>
                  <div className="home-plan-day__label"><span>{day.label}</span>{day.value === todayDay && <span className="home-today-pill">Aujourd’hui</span>}</div>
                  <div className="home-plan-day__sessions">
                    {day.sessions.map((workout) => {
                      const wasCompleted = completed.some((session) => session.workout_id === workout.id);
                      return <button key={workout.id} type="button" onClick={() => navigate(`/workouts/${workout.id}`)} className="home-plan-session">
                        <span className="home-plan-session__mark">{wasCompleted ? <Check size={16} aria-hidden="true" /> : <Dumbbell size={15} aria-hidden="true" />}</span>
                        <span className="home-plan-session__name">{workout.name}</span>
                        <span className="home-plan-session__status">{wasCompleted ? "Effectuée" : "Programme"}</span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>;
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="home-empty-plan"><CalendarDays size={21} aria-hidden="true" /><p>Aucune séance au planning pour le moment.</p><button type="button" onClick={() => navigate("/workouts")}>Construire mon programme <ArrowRight size={15} aria-hidden="true" /></button></div>
        )}
      </section>
    </div>
  );
}
