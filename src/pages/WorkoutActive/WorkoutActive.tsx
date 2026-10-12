import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type SetEntry = {
  weight: number | string;
  reps: number | string;
  completed: boolean;
};

type ExerciseInfo = {
  id?: string;
  name?: string;
  muscles?: string[];
};

type WorkoutExerciseInfo = {
  id?: string;
  reps?: string | number;
  weight?: string | number;
  sets?: number;
};

type SupabaseActiveExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number | null;
  done: boolean | null;
  sets: unknown;
  comment?: string | null;
};

type ExerciseRecordInfo = {
  id: string;
  max_weight: number | string;
  max_reps: number | string;
  max_volume: number | string;
};

type ActiveExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number;
  done: boolean;
  sets: SetEntry[];
  comment?: string;
  exercise?: ExerciseInfo | null;
  workoutExercise?: WorkoutExerciseInfo | null;
};

type SessionDraft = {
  userId: string;
  workoutId: string;
  activeWorkoutId: string | null;
  updatedAt: string;
  revision: number;
  dirty: boolean;
  exercises: ActiveExercise[];
};

type SyncStatus = "saved" | "saving" | "pending" | "offline" | "error";

function cacheKey(userId: string, workoutId: string) {
  return `ironlog:active-workout:${userId}:${workoutId}`;
}

function readDraft(key: string): SessionDraft | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as SessionDraft) : null;
  } catch {
    return null;
  }
}

function targetRepRange(value: unknown) {
  const text = String(value ?? "");
  const rangeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|à|a|to)\s*(\d+(?:[.,]\d+)?)/i);
  if (rangeMatch) {
    const first = Number(rangeMatch[1].replace(",", "."));
    const second = Number(rangeMatch[2].replace(",", "."));
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return { min: Math.min(first, second), max: Math.max(first, second) };
    }
  }

  const numbers = text.match(/\d+(?:[.,]\d+)?/g)?.map((part) => Number(part.replace(",", ".")));
  const exact = numbers?.at(-1);
  return exact !== undefined && Number.isFinite(exact) ? { min: exact, max: exact } : null;
}

function normalizeExercise(
  item: SupabaseActiveExercise,
  workoutId: string,
  exercise: ExerciseInfo | null,
  workoutExercise: WorkoutExerciseInfo | null,
): ActiveExercise {
  const rawSets: unknown[] = Array.isArray(item.sets) ? item.sets : [];
  const sets: SetEntry[] = rawSets.map((value) => {
    const set = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const weight = set.weight;
    const reps = set.reps;
    return {
      weight: typeof weight === "number" || typeof weight === "string" ? weight : 0,
      reps: typeof reps === "number" || typeof reps === "string" ? reps : 0,
      completed: Boolean(set.completed || item.done),
    };
  });
  const done = sets.length > 0 && sets.every((set) => set.completed);

  return {
    ...item,
    workout_id: workoutId,
    order: Number(item.order ?? 0),
    done,
    sets,
    comment: item.comment ?? "",
    exercise,
    workoutExercise,
  };
}

function getBestWeight(sets: SetEntry[]) {
  const completed = sets.filter((set) => set.completed);
  if (completed.length === 0) return 0;
  return Math.max(...completed.map((set) => Number(set.weight) || 0));
}

export default function WorkoutActive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [setError, setSetError] = useState<{ exerciseId: string; message: string } | null>(null);

  const latestExercises = useRef<ActiveExercise[]>([]);
  const revision = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveTimer = useRef<number | null>(null);
  const retryTimer = useRef<number | null>(null);
  const retryDelay = useRef(1000);
  const currentUserId = useRef<string | null>(null);
  const currentWorkoutId = useRef<string | undefined>(id);
  const currentActiveWorkoutId = useRef<string | null>(null);
  const currentCacheKey = useRef<string | null>(null);
  const startedAt = useRef(new Date().toISOString());

  const loadExercises = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
      const user = sessionResult.session?.user;
      if (sessionError || !user) throw sessionError ?? new Error("Session utilisateur indisponible.");

      setUserId(user.id);
      currentUserId.current = user.id;
      currentWorkoutId.current = id;
      const key = cacheKey(user.id, id);
      currentCacheKey.current = key;
      const draft = readDraft(key);
      const hasLocalDraft = Boolean(draft && draft.userId === user.id && draft.workoutId === id);
      const useCachedDraft = hasLocalDraft && (draft?.dirty === true || !navigator.onLine);

      if (useCachedDraft && draft) {
        revision.current = draft.revision;
        currentActiveWorkoutId.current = draft.activeWorkoutId;
        latestExercises.current = draft.exercises;
        setExercises(draft.exercises);
        setSyncStatus(navigator.onLine ? "pending" : "offline");
        setExpandedExerciseId(draft.exercises.find((item) => !item.done)?.id ?? draft.exercises[0]?.id ?? null);
      }

      if (!navigator.onLine && useCachedDraft) return;

      const { data: activeWorkout, error: activeWorkoutError } = await supabase
        .from("active_workout")
        .select("id, started_at")
        .eq("workout_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (activeWorkoutError) {
        if (useCachedDraft) return;
        throw activeWorkoutError;
      }

      const activeId = activeWorkout?.id ?? (useCachedDraft ? draft?.activeWorkoutId ?? null : null);
      currentActiveWorkoutId.current = activeId;
      if (activeWorkout?.started_at) startedAt.current = activeWorkout.started_at;

      const { data: activeRows, error: activeRowsError } = await supabase
        .from("active_workout_exercises")
        .select("*")
        .eq("workout_id", id)
        .order("order");

      if (activeRowsError) {
        if (useCachedDraft) return;
        throw activeRowsError;
      }

      const activeItems = (activeRows ?? []) as unknown as SupabaseActiveExercise[];
      const fullExercises = await Promise.all(
        activeItems.map(async (item) => {
          const [exerciseResult, workoutExerciseResult] = await Promise.all([
            supabase.from("exercises").select("*").eq("id", item.exercise_id).maybeSingle(),
            supabase
              .from("workout_exercises")
              .select("*")
              .eq("workout_id", id)
              .eq("exercise_id", item.exercise_id)
              .maybeSingle(),
          ]);

          if (exerciseResult.error) throw exerciseResult.error;
          if (workoutExerciseResult.error) throw workoutExerciseResult.error;
          return normalizeExercise(
            item,
            id,
            exerciseResult.data as ExerciseInfo | null,
            workoutExerciseResult.data as WorkoutExerciseInfo | null,
          );
        }),
      );

      let visibleExercises = fullExercises;
      if (useCachedDraft && draft) {
        const localById = new Map<string, ActiveExercise>(draft.exercises.map((item) => [item.id, item]));
        const merged = fullExercises.map((item) => {
          const local = localById.get(item.id);
          if (!local) return item;
          return { ...item, ...local, exercise: item.exercise, workoutExercise: item.workoutExercise };
        });
        const remoteIds = new Set(fullExercises.map((item) => item.id));
        visibleExercises = [...merged, ...draft.exercises.filter((item) => !remoteIds.has(item.id))];
      }

      latestExercises.current = visibleExercises;
      setExercises(visibleExercises);
      setExpandedExerciseId(visibleExercises.find((item) => !item.done)?.id ?? visibleExercises[0]?.id ?? null);
      if (!draft?.dirty) setSyncStatus("saved");
    } catch (error) {
      console.error("Erreur récupération exercices actifs :", error);
      if (latestExercises.current.length > 0) {
        setSyncStatus(navigator.onLine ? "pending" : "offline");
      } else {
        setErrorMessage("Impossible de charger cette séance. Vérifie ta connexion puis réessaie.");
        setSyncStatus(navigator.onLine ? "error" : "offline");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // This route effect owns the loading and error state for its remote reads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExercises();
  }, [loadExercises]);

  function makeDraft(items: ActiveExercise[], nextRevision: number, dirty: boolean): SessionDraft | null {
    const currentUser = currentUserId.current;
    const workoutId = currentWorkoutId.current;
    if (!currentUser || !workoutId) return null;

    return {
      userId: currentUser,
      workoutId,
      activeWorkoutId: currentActiveWorkoutId.current,
      updatedAt: new Date().toISOString(),
      revision: nextRevision,
      dirty,
      exercises: items,
    };
  }

  async function syncDraft(draft: SessionDraft): Promise<boolean> {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return false;
    }

    let succeeded = false;
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (draft.revision !== revision.current) return;
        setSyncStatus("saving");

        for (const item of draft.exercises) {
          const { data, error } = await supabase
            .from("active_workout_exercises")
            .update({ done: item.done, sets: item.sets, comment: item.comment ?? "" })
            .eq("id", item.id)
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (!data) throw new Error("Une série active n’a pas été retrouvée côté serveur.");
        }

        if (draft.activeWorkoutId) {
          const { data, error } = await supabase
            .from("active_workout")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", draft.activeWorkoutId)
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (!data) throw new Error("La séance active n’a pas été retrouvée côté serveur.");
        }

        if (draft.revision === revision.current) {
          const key = currentCacheKey.current;
          const localDraft = key ? readDraft(key) : null;
          if (key && localDraft?.revision === draft.revision) {
            localStorage.setItem(key, JSON.stringify({ ...localDraft, dirty: false }));
          }
          setSyncStatus("saved");
          setErrorMessage(null);
          retryDelay.current = 1000;
          if (retryTimer.current !== null) {
            window.clearTimeout(retryTimer.current);
            retryTimer.current = null;
          }
          succeeded = true;
        }
      })
      .catch((error) => {
        console.error("Synchronisation de la séance impossible :", error);
        if (draft.revision === revision.current) {
          setSyncStatus(navigator.onLine ? "pending" : "offline");
          setErrorMessage("Tes changements sont gardés sur cet appareil et seront renvoyés dès que la connexion revient.");
          if (navigator.onLine && retryTimer.current === null) {
            const delay = retryDelay.current;
            retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
            retryTimer.current = window.setTimeout(() => {
              retryTimer.current = null;
              const latestDraft = makeDraft(latestExercises.current, revision.current, true);
              if (latestDraft) void syncDraft(latestDraft);
            }, delay);
          }
        }
      });

    await saveQueue.current;
    return succeeded;
  }

  function commitExercises(next: ActiveExercise[]) {
    latestExercises.current = next;
    setExercises(next);
    setErrorMessage(null);

    const nextRevision = revision.current + 1;
    revision.current = nextRevision;
    retryDelay.current = 1000;
    if (retryTimer.current !== null) {
      window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    const draft = makeDraft(next, nextRevision, true);
    if (!draft) return;

    try {
      if (currentCacheKey.current) localStorage.setItem(currentCacheKey.current, JSON.stringify(draft));
      setSyncStatus(navigator.onLine ? "saving" : "offline");
    } catch (error) {
      console.error("Brouillon local indisponible :", error);
      setSyncStatus("error");
      setErrorMessage("Le stockage local est indisponible. Garde la page ouverte jusqu’à la synchronisation.");
    }

    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void syncDraft(draft);
      saveTimer.current = null;
    }, 650);
  }

  function updateSet(exerciseId: string, setIndex: number, field: "weight" | "reps", value: string) {
    const current = latestExercises.current.find((item) => item.id === exerciseId);
    if (!current) return;

    const sets = current.sets.map((set, index) =>
      index === setIndex ? { ...set, [field]: value } : set,
    );
    commitExercises(latestExercises.current.map((item) => (item.id === exerciseId ? { ...item, sets } : item)));
  }

  function validateSet(exerciseId: string, setIndex: number) {
    const current = latestExercises.current.find((item) => item.id === exerciseId);
    const selectedSet = current?.sets[setIndex];
    if (!current || !selectedSet) return;

    const weight = Number(selectedSet.weight);
    const reps = Number(selectedSet.reps);
    if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(reps) || reps < 1) {
      setSetError({ exerciseId, message: "Renseigne une charge et au moins une répétition." });
      return;
    }

    const sets = current.sets.map((set, index) =>
      index === setIndex ? { ...set, weight, reps, completed: true } : { ...set },
    );
    const range = targetRepRange(current.workoutExercise?.reps);

    // A validated set in the programmed rep range carries its load forward to the remaining sets.
    // Sets above or below the target range never raise the following loads automatically.
    if (range && reps >= range.min && reps <= range.max) {
      for (let index = setIndex + 1; index < sets.length; index += 1) {
        if (!sets[index].completed) sets[index] = { ...sets[index], weight };
      }
    }

    const done = sets.length > 0 && sets.every((set) => set.completed);
    const next = latestExercises.current.map((item) =>
      item.id === exerciseId ? { ...item, sets, done } : item,
    );
    setSetError(null);
    commitExercises(next);
  }

  function reopenSet(exerciseId: string, setIndex: number) {
    const next = latestExercises.current.map((item) => {
      if (item.id !== exerciseId) return item;
      const sets = item.sets.map((set, index) => index === setIndex ? { ...set, completed: false } : set);
      return { ...item, sets, done: sets.length > 0 && sets.every((set) => set.completed) };
    });
    commitExercises(next);
  }

  async function saveCurrentState() {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const draft = makeDraft(latestExercises.current, revision.current, true);
    if (!draft) return false;
    try {
      if (currentCacheKey.current) localStorage.setItem(currentCacheKey.current, JSON.stringify(draft));
    } catch (error) {
      console.error("Impossible de sauvegarder le brouillon local :", error);
    }
    return syncDraft(draft);
  }

  // The listener uses stable refs so it only needs to be registered once.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    function onOnline() {
      if (retryTimer.current !== null) {
        window.clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      retryDelay.current = 1000;
      const key = currentCacheKey.current;
      const draft = key ? readDraft(key) : null;
      if (!draft?.dirty) {
        setSyncStatus("saved");
        return;
      }
      revision.current = Math.max(revision.current, draft.revision);
      void syncDraft(draft);
    }

    function onOffline() {
      if (readDraft(currentCacheKey.current ?? "")?.dirty) setSyncStatus("offline");
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  async function checkRecord(item: ActiveExercise) {
    const completedSets = item.sets.filter((set) => set.completed);
    if (completedSets.length === 0) return;

    const { data: rawRecordData, error: recordError } = await supabase
      .from("records")
      .select("*")
      .eq("exercise_id", item.exercise_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (recordError) {
      console.error("Erreur lecture record :", recordError);
      return;
    }

    const recordData = rawRecordData as ExerciseRecordInfo | null;
    const bestSet = completedSets.reduce((best, current) =>
      Number(current.weight) * Number(current.reps) > Number(best.weight) * Number(best.reps)
        ? current
        : best,
    );
    const volume = Number(bestSet.weight) * Number(bestSet.reps);

    if (!recordData) {
      const { error } = await supabase.from("records").insert({
        user_id: userId,
        exercise_id: item.exercise_id,
        max_weight: Number(bestSet.weight),
        max_reps: Number(bestSet.reps),
        max_volume: volume,
        date: new Date().toISOString(),
      });
      if (error) console.error("Erreur création record :", error);
      return;
    }

    if (
      Number(bestSet.weight) > Number(recordData.max_weight) ||
      Number(bestSet.reps) > Number(recordData.max_reps) ||
      volume > Number(recordData.max_volume)
    ) {
      const { error } = await supabase
        .from("records")
        .update({
          max_weight: Math.max(Number(recordData.max_weight), Number(bestSet.weight)),
          max_reps: Math.max(Number(recordData.max_reps), Number(bestSet.reps)),
          max_volume: Math.max(Number(recordData.max_volume), volume),
          date: new Date().toISOString(),
        })
        .eq("id", recordData.id);
      if (error) console.error("Erreur mise à jour record :", error);
    }
  }

  async function finishWorkout() {
    if (!id || finishing) return;
    if (exercises.length === 0 || exercises.some((exercise) => !exercise.done)) {
      setErrorMessage("Valide chaque série pour terminer les exercices de ta séance.");
      return;
    }
    if (!navigator.onLine) {
      setSyncStatus("offline");
      setErrorMessage("Tes séries sont gardées sur cet appareil. Reconnecte-toi pour enregistrer la séance dans ton historique.");
      return;
    }

    setFinishing(true);
    setErrorMessage(null);

    try {
      const synced = await saveCurrentState();
      if (!synced) throw new Error("La synchronisation n’est pas terminée. Réessaie dans un instant.");

      const now = new Date().toISOString();
      const volume = exercises.reduce(
        (total, item) => total + item.sets.reduce((subtotal, set) => subtotal + Number(set.weight) * Number(set.reps), 0),
        0,
      );

      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          workout_id: id,
          started_at: startedAt.current,
          finished_at: now,
          volume,
          completed_exercises: exercises.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const performedSets = exercises.flatMap((item) =>
        item.sets.flatMap((set, index) => set.completed ? [{
          session_id: session.id,
          exercise_id: item.exercise_id,
          weight: Number(set.weight),
          reps: Number(set.reps),
          set_number: index + 1,
        }] : []),
      );

      if (performedSets.length > 0) {
        const { error: performedError } = await supabase.from("performed_sets").insert(performedSets);
        if (performedError) {
          await supabase.from("workout_sessions").delete().eq("id", session.id);
          throw performedError;
        }
      }

      for (const item of exercises) {
        const bestWeight = getBestWeight(item.sets);
        const oldWeight = Number(item.workoutExercise?.weight ?? 0);

        if (bestWeight > oldWeight) {
          const { error: historyError } = await supabase.from("weight_history").insert({
            user_id: userId,
            exercise_id: item.exercise_id,
            old_weight: oldWeight,
            new_weight: bestWeight,
            date: now,
          });
          if (historyError) console.error("Erreur historique des charges :", historyError);

          if (item.workoutExercise?.id) {
            const { error: workoutExerciseError } = await supabase
              .from("workout_exercises")
              .update({ weight: bestWeight })
              .eq("id", item.workoutExercise.id);
            if (workoutExerciseError) console.error("Erreur mise à jour charge cible :", workoutExerciseError);
          }
        }

        await checkRecord(item);
      }

      const { error: cleanupError } = await supabase
        .from("active_workout_exercises")
        .delete()
        .eq("workout_id", id);
      if (cleanupError) console.error("Erreur nettoyage séance active :", cleanupError);

      if (currentActiveWorkoutId.current) {
        const { error } = await supabase
          .from("active_workout")
          .delete()
          .eq("id", currentActiveWorkoutId.current);
        if (error) console.error("Erreur suppression séance active :", error);
      }

      if (currentCacheKey.current) localStorage.removeItem(currentCacheKey.current);
      navigate(`/workout-history/${session.id}`);
    } catch (error: unknown) {
      console.error("Erreur de fin de séance :", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "La séance n’a pas pu être enregistrée. Tes séries restent disponibles pour réessayer.",
      );
      setSyncStatus(navigator.onLine ? "pending" : "offline");
    } finally {
      setFinishing(false);
    }
  }

  if (loading) return <div className="text-neutral-400">Chargement de ta séance…</div>;

  const totalSets = exercises.reduce((total, item) => total + item.sets.length, 0);
  const completedSets = exercises.reduce((total, item) => total + item.sets.filter((set) => set.completed).length, 0);
  const completedExercises = exercises.filter((item) => item.done).length;
  const allDone = exercises.length > 0 && completedExercises === exercises.length;
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const SyncIcon = syncStatus === "saved"
    ? CheckCircle2
    : syncStatus === "saving"
      ? LoaderCircle
      : syncStatus === "offline"
        ? CloudOff
        : Cloud;
  const syncLabel = {
    saved: "Enregistré",
    saving: "Enregistrement",
    pending: "À synchroniser",
    offline: "Hors ligne",
    error: "À vérifier",
  }[syncStatus];

  return (
    <div>
      <header className="session-header">
        <div>
          <p className="session-kicker">Entraînement en cours</p>
          <h1>Ta séance</h1>
          <p className="text-sm text-neutral-400">Chaque série validée est sauvegardée au fur et à mesure.</p>
        </div>
        <div className={`sync-indicator is-${syncStatus}`} aria-live="polite">
          <SyncIcon size={15} className={syncStatus === "saving" ? "animate-spin" : ""} aria-hidden="true" />
          <span>{syncLabel}</span>
        </div>
      </header>

      <section className="session-summary" aria-label="Progression de la séance">
        <div className="session-summary-top">
          <strong>{completedExercises}<span> / {exercises.length}</span></strong>
          <span>{completedSets} / {totalSets} séries</span>
        </div>
        <div className="session-progress-track" role="progressbar" aria-label="Séries validées" aria-valuenow={completedSets} aria-valuemin={0} aria-valuemax={totalSets}>
          <div className="session-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="session-summary-caption">{allDone ? "Tout est prêt. Tu peux terminer la séance." : "Valide chaque série pour faire avancer ta séance."}</p>
      </section>

      {errorMessage && <p role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-400">{errorMessage}</p>}

      {exercises.length === 0 && !errorMessage && (
        <p className="mt-6 rounded-2xl bg-neutral-900 p-5 text-sm text-neutral-400">Aucun exercice n’est associé à cette séance.</p>
      )}

      <div className="active-exercise-list">
        {exercises.map((item, index) => {
          const expanded = expandedExerciseId === item.id;
          const repRange = item.workoutExercise?.reps;
          const range = targetRepRange(repRange);

          return (
            <section key={item.id} className={`active-exercise-card${item.done ? " is-complete" : ""}`}>
              <button
                type="button"
                className="exercise-heading"
                onClick={() => setExpandedExerciseId(expanded ? null : item.id)}
                aria-expanded={expanded}
              >
                <span className="exercise-title-wrap">
                  <span className="exercise-index">{item.done ? <Check size={18} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="exercise-name">{item.exercise?.name ?? "Exercice"}</span>
                    <span className="exercise-meta">{item.sets.length} séries · {range ? `${range.min}–${range.max} reps` : `${repRange ?? "répétitions libres"} reps`} · {item.workoutExercise?.weight ?? 0} kg</span>
                  </span>
                </span>
                <span className="exercise-state">
                  {item.done ? <><CheckCircle2 size={17} aria-hidden="true" /> Terminé</> : <>{item.sets.filter((set) => set.completed).length}/{item.sets.length} séries</>}
                  {expanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
                </span>
              </button>

              {expanded && (
                <div className="exercise-set-list">
                  {item.sets.map((set, setIndex) => (
                    <div key={setIndex} className={`set-row${set.completed ? " is-complete" : ""}`}>
                      <span className="set-number">Série {setIndex + 1}</span>
                      <div className="set-field">
                        <label htmlFor={`weight-${item.id}-${setIndex}`}>Poids · kg</label>
                        <input
                          id={`weight-${item.id}-${setIndex}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.5"
                          value={set.weight}
                          disabled={set.completed}
                          onChange={(event) => updateSet(item.id, setIndex, "weight", event.target.value)}
                          aria-label={`Poids de la série ${setIndex + 1} de ${item.exercise?.name ?? "l’exercice"}, en kilogrammes`}
                        />
                      </div>
                      <div className="set-field">
                        <label htmlFor={`reps-${item.id}-${setIndex}`}>Répétitions</label>
                        <input
                          id={`reps-${item.id}-${setIndex}`}
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="1"
                          value={set.reps}
                          disabled={set.completed}
                          onChange={(event) => updateSet(item.id, setIndex, "reps", event.target.value)}
                          aria-label={`Répétitions de la série ${setIndex + 1} de ${item.exercise?.name ?? "l’exercice"}`}
                        />
                      </div>
                      {set.completed ? (
                        <button type="button" className="set-confirm-button is-ready" onClick={() => reopenSet(item.id, setIndex)} aria-label={`Corriger la série ${setIndex + 1}`}>
                          <Check size={17} aria-hidden="true" /><span>Corriger</span>
                        </button>
                      ) : (
                        <button type="button" className="set-confirm-button is-ready" onClick={() => validateSet(item.id, setIndex)} aria-label={`Valider la série ${setIndex + 1}`}>
                          <Check size={17} aria-hidden="true" /><span>Valider</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {setError?.exerciseId === item.id && <p role="alert" className="set-error">{setError.message}</p>}
                  {item.done && <p className="px-2 pb-1 text-xs font-medium text-lime-300">Exercice terminé · toutes les séries sont validées</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {syncStatus !== "saved" && (
        <button
          type="button"
          onClick={() => void saveCurrentState()}
          disabled={!navigator.onLine || finishing}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-800 py-3 text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw size={16} aria-hidden="true" /> Réessayer la synchronisation
        </button>
      )}

      <button
        type="button"
        onClick={() => void finishWorkout()}
        disabled={!allDone || finishing || syncStatus !== "saved"}
        className="finish-workout-button w-full rounded-2xl bg-white py-4 font-semibold disabled:opacity-40"
      >
        {finishing ? "Enregistrement de la séance…" : allDone ? "Terminer la séance" : "Valide toutes les séries"}
      </button>
      {!allDone && exercises.length > 0 && <p className="finish-workout-hint">L’exercice se termine automatiquement après sa dernière série.</p>}
    </div>
  );
}
