import { useEffect, useRef, useState } from "react";

import { getProfile } from "../../services/profileService";
import { getBodyMeasurements } from "../../services/bodyService";

import CreateProfile from "../../components/Profile/CreateProfile";
import EditProfile from "../../components/Profile/EditProfile";
import { createProgramArchive, importProgramArchive, parseProgramArchive, programArchiveToCsv } from "../../services/programArchiveService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../../services/profileService";

export default function Profile() {
  const navigate = useNavigate();
  const { signOut, clearLocalSession } = useAuth();
  const [accountBusy, setAccountBusy] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [showEdit, setShowEdit] = useState(false);

  const [body, setBody] = useState<any>(null);

  const [bodyEvolution, setBodyEvolution] = useState<any>(null);

  const [bodyStart, setBodyStart] = useState<any>(null);

  const [workoutStats, setWorkoutStats] = useState({
    sessions: 0,
    volume: 0,
    exercises: 0,
    last: null as any,
  });

  async function load() {
    /*
  =========================
  Profil utilisateur
  =========================
  */

    const profileData = await getProfile();

    setProfile(profileData);

    /*
  =========================
  Mesures corporelles
  =========================
  */

    const measurements = await getBodyMeasurements();

    const bodyHistory = measurements
      .map((item) => ({
        ...item,

        bodyFat: item.body_fat,

        muscleMass: item.muscle_mass,

        boneMass: item.bone_mass,

        waterPercentage: item.water_percentage,

        leanMass: item.lean_mass,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (bodyHistory.length > 0) {
      const latest = bodyHistory[bodyHistory.length - 1];

      const fatKg =
        latest.bodyFat !== undefined
          ? (latest.weight * latest.bodyFat) / 100
          : null;

      const leanMass =
        latest.leanMass ?? (fatKg !== null ? latest.weight - fatKg : undefined);

      setBody({
        ...latest,

        leanMass,
      });

      setBodyStart(bodyHistory[0]);
    } else {
      setBody(null);
    }

    /*
  =========================
  Evolution corporelle
  =========================
  */

    if (bodyHistory.length > 1) {
      const start = bodyHistory[0];

      const current = bodyHistory[bodyHistory.length - 1];

      const startFatKg =
        start.bodyFat !== undefined
          ? (start.weight * start.bodyFat) / 100
          : null;

      const currentFatKg =
        current.bodyFat !== undefined
          ? (current.weight * current.bodyFat) / 100
          : null;

      const startLeanMass =
        start.leanMass ??
        (startFatKg !== null ? start.weight - startFatKg : undefined);

      const currentLeanMass =
        current.leanMass ??
        (currentFatKg !== null ? current.weight - currentFatKg : undefined);

      setBodyEvolution({
        weight: current.weight - start.weight,

        bodyFat:
          current.bodyFat !== undefined && start.bodyFat !== undefined
            ? current.bodyFat - start.bodyFat
            : null,

        muscleMass:
          current.muscleMass !== undefined && start.muscleMass !== undefined
            ? current.muscleMass - start.muscleMass
            : null,

        leanMass:
          currentLeanMass !== undefined && startLeanMass !== undefined
            ? currentLeanMass - startLeanMass
            : null,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: sessions, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("id, finished_at, volume, completed_exercises")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false });
    if (sessionError) throw sessionError;
    const history = sessions ?? [];
    setWorkoutStats({
      sessions: history.length,
      volume: history.reduce((sum, item) => sum + Number(item.volume ?? 0), 0),
      exercises: history.reduce((sum, item) => sum + Number(item.completed_exercises ?? 0), 0),
      last: history[0]?.finished_at ?? null,
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function exportProgram(format: "json" | "csv") {
    setArchiveBusy(true); setArchiveMessage(null); setArchiveError(null);
    try {
      const archive = await createProgramArchive();
      const content = format === "json" ? JSON.stringify(archive, null, 2) : `\uFEFF${programArchiveToCsv(archive)}`;
      const mimeType = format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
      const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
      const link = document.createElement("a"); link.href = url;
      link.download = `ironlog-programme-${new Date().toISOString().slice(0, 10)}.${format}`;
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setArchiveMessage(`Export terminé : ${archive.programs.length} séance(s) du programme.`);
    } catch (error) { setArchiveError(error instanceof Error ? error.message : "Impossible d’exporter le programme."); }
    finally { setArchiveBusy(false); }
  }

  async function importProgramFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setArchiveBusy(true); setArchiveMessage(null); setArchiveError(null);
    try {
      const archive = parseProgramArchive(await file.text(), file.name);
      if (!window.confirm(`Importer ${archive.programs.length} séance(s) programmée(s) et leurs exercices ?\n\nAucune donnée d’historique ne sera importée. Les séances et exercices déjà présents seront ignorés.`)) return;
      const summary = await importProgramArchive(archive);
      setArchiveMessage(`Import terminé : ${summary.programsAdded} séance(s) ajoutée(s), ${summary.exercisesAdded} exercice(s) ajouté(s), ${summary.exercisesSkipped} déjà présent(s).`);
    } catch (error) { setArchiveError(error instanceof Error ? error.message : "Impossible d’importer ce programme."); }
    finally { setArchiveBusy(false); event.target.value = ""; }
  }

  function formatEvolution(value: number | null) {
    if (value === null) {
      return "-";
    }

    const rounded = Math.round(value * 10) / 10;

    if (rounded > 0) {
      return `+${rounded}`;
    }

    return `${rounded}`;
  }

  function calculateProgress(
    start: number | undefined,
    current: number | undefined,
    target: number | undefined,
  ) {
    if (start === undefined || current === undefined || target === undefined) {
      return 0;
    }

    const total = Math.abs(target - start);

    if (total === 0) {
      return 100;
    }

    let done;

    if (target < start) {
      done = start - current;
    } else {
      done = current - start;
    }

    const progress = Math.round((done / total) * 100);

    return Math.min(Math.max(progress, 0), 100);
  }

  if (!profile) {
    return (
      <div>
        <h1
          className="
          text-3xl
          font-bold
          "
        >
          Profil
        </h1>

        <p
          className="
          mt-3
          text-neutral-400
          "
        >
          Aucun profil créé
        </p>

        <button
          onClick={() => setShowCreate(true)}
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
          Créer mon profil
        </button>

        {showCreate && (
          <CreateProfile
            onSave={() => {
              setShowCreate(false);

              load();
            }}
          />
        )}
      </div>
    );
  }
  return (
    <div>
      <h1
        className="
        text-3xl
        font-bold
        "
      >
        Profil
      </h1>

      <div
        className="
        mt-8
        bg-neutral-900
        rounded-3xl
        p-6
        "
      >
        <h2
          className="
          text-2xl
          font-bold
          "
        >
          {profile.name}
        </h2>

        <p className="mt-3">{profile.age} ans</p>

        <p>{profile.height} cm</p>

        <p
          className="
          mt-3
          text-neutral-400
          "
        >
          Objectif : {profile.goal || "-"}
        </p>

        <button
          onClick={() => setShowEdit(true)}
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
          Modifier le profil
        </button>
      </div>

      {body && (
        <div
          className="
          mt-6
          bg-neutral-900
          rounded-3xl
          p-6
          "
        >
          <h3
            className="
            text-xl
            font-bold
            "
          >
            Composition actuelle
          </h3>

          <div
            className="
            grid
            grid-cols-2
            gap-4
            mt-5
            "
          >
            <ProfileStat label="Poids" value={`${body.weight} kg`} />

            <ProfileStat
              label="Masse grasse"
              value={body.bodyFat !== undefined ? `${body.bodyFat}%` : "-"}
            />

            <ProfileStat
              label="Muscle"
              value={
                body.muscleMass !== undefined ? `${body.muscleMass}%` : "-"
              }
            />

            <ProfileStat
              label="Masse maigre"
              value={body.leanMass !== undefined ? `${body.leanMass} kg` : "-"}
            />
          </div>
        </div>
      )}

      {profile.goal && bodyStart && body && (
        <div
          className="
          mt-6
          bg-neutral-900
          rounded-3xl
          p-6
          "
        >
          <h3
            className="
            text-xl
            font-bold
            "
          >
            🎯 Objectifs
          </h3>

          <p
            className="
            mt-2
            text-neutral-400
            "
          >
            {profile.goal}
          </p>

          <div
            className="
            mt-5
            space-y-5
            "
          >
            <GoalProgress
              label="Poids"
              current={body.weight}
              target={profile.target_weight}
              progress={calculateProgress(
                bodyStart.weight,
                body.weight,
                profile.target_weight,
              )}
            />

            <GoalProgress
              label="Masse grasse"
              current={body.bodyFat}
              target={profile.target_body_fat}
              progress={calculateProgress(
                bodyStart.bodyFat,
                body.bodyFat,
                profile.target_body_fat,
              )}
            />

            <GoalProgress
              label="Muscle"
              current={body.muscleMass}
              target={profile.target_muscle_mass}
              progress={calculateProgress(
                bodyStart.muscleMass,
                body.muscleMass,
                profile.target_muscle_mass,
              )}
            />
          </div>
        </div>
      )}

      {bodyEvolution && (
        <div
          className="
          mt-6
          bg-neutral-900
          rounded-3xl
          p-6
          "
        >
          <h3
            className="
            text-xl
            font-bold
            "
          >
            Evolution depuis le début
          </h3>

          <div
            className="
            grid
            grid-cols-2
            gap-4
            mt-5
            "
          >
            <ProfileStat
              label="Poids"
              value={formatEvolution(bodyEvolution.weight) + " kg"}
            />

            <ProfileStat
              label="Masse grasse"
              value={formatEvolution(bodyEvolution.bodyFat) + " %"}
            />

            <ProfileStat
              label="Muscle"
              value={formatEvolution(bodyEvolution.muscleMass) + " %"}
            />

            <ProfileStat
              label="Masse maigre"
              value={formatEvolution(bodyEvolution.leanMass) + " kg"}
            />
          </div>
        </div>
      )}

      <div
        className="
        mt-6
        bg-neutral-900
        rounded-3xl
        p-6
        "
      >
        <h3
          className="
          text-xl
          font-bold
          "
        >
          Entraînement
        </h3>

        <div
          className="
          grid
          grid-cols-2
          gap-4
          mt-5
          "
        >
          <ProfileStat label="Séances" value={`${workoutStats.sessions}`} />

          <ProfileStat
            label="Volume total"
            value={`${workoutStats.volume.toLocaleString()} kg`}
          />

          <ProfileStat
            label="Exercices terminés"
            value={`${workoutStats.exercises}`}
          />
        </div>
      </div>

      <details className="program-archive mt-6 rounded-2xl px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-neutral-200">Importer / exporter mon programme</summary>
        <p className="mt-3 text-sm text-neutral-400">Sauvegarde ou réutilise tes séances programmées et leurs exercices. L’historique d’entraînement n’est pas inclus.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportProgram("json")} disabled={archiveBusy} className="rounded-xl bg-neutral-800 px-3 py-2 text-sm font-medium disabled:opacity-50">Exporter JSON</button>
          <button type="button" onClick={() => void exportProgram("csv")} disabled={archiveBusy} className="rounded-xl bg-neutral-800 px-3 py-2 text-sm font-medium disabled:opacity-50">Exporter CSV</button>
          <button type="button" onClick={() => importFileRef.current?.click()} disabled={archiveBusy} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">{archiveBusy ? "Traitement…" : "Importer JSON ou CSV"}</button>
          <input ref={importFileRef} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" onChange={(event) => void importProgramFile(event)} aria-label="Choisir un export de programme JSON ou CSV" />
        </div>
        {archiveMessage && <p role="status" className="mt-3 text-sm text-lime-300">{archiveMessage}</p>}
        {archiveError && <p role="alert" className="mt-3 text-sm text-red-400">{archiveError}</p>}
      </details>

      <section className="mt-6 rounded-3xl bg-neutral-900 p-6">
        <h2 className="text-lg font-bold">Compte</h2>
        <p className="mt-1 text-sm text-neutral-400">Les actions de compte sont séparées de la modification du profil.</p>
        <button disabled={accountBusy} onClick={async () => { setAccountBusy(true); try { await signOut(); } finally { setAccountBusy(false); } }} className="mt-4 w-full rounded-2xl bg-neutral-800 py-3 font-semibold">Déconnexion</button>
        <button disabled={accountBusy} onClick={async () => {
          if (!window.confirm("Supprimer définitivement ton compte et toutes les données associées ? Cette action est irréversible.")) return;
          setAccountBusy(true);
          try { await deleteAccount(); clearLocalSession(); navigate("/login"); }
          catch { window.alert("Impossible de supprimer le compte. Réessaie ou contacte le support."); }
          finally { setAccountBusy(false); }
        }} className="mt-3 w-full rounded-2xl bg-red-600 py-3 font-semibold text-white">Supprimer mon compte</button>
      </section>

      {showEdit && (
        <EditProfile
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={() => {
            load();
          }}
        />
      )}
    </div>
  );
}

function GoalProgress({
  label,
  current,
  target,
  progress,
}: {
  label: string;
  current?: number;
  target?: number;
  progress: number;
}) {
  if (!target) {
    return null;
  }

  return (
    <div>
      <div
        className="
        flex
        justify-between
        text-sm
        mb-2
        "
      >
        <span>{label}</span>

        <span
          className="
          text-neutral-400
          "
        >
          {current ?? "-"} → {target}
        </span>
      </div>

      <div
        className="
        h-3
        bg-neutral-800
        rounded-full
        overflow-hidden
        "
      >
        <div
          className="
          h-3
          bg-white
          rounded-full
          "
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <p
        className="
        text-xs
        text-neutral-400
        mt-1
        "
      >
        {progress}% atteint
      </p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="
      bg-neutral-800
      rounded-2xl
      p-4
      "
    >
      <p
        className="
        text-neutral-400
        text-sm
        "
      >
        {label}
      </p>

      <p
        className="
        font-bold
        mt-1
        "
      >
        {value}
      </p>
    </div>
  );
}
