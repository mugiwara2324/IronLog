import { useEffect, useRef, useState } from "react";

import { getProfile } from "../../services/profileService";
import { getBodyMeasurements } from "../../services/bodyService";

import CreateProfile from "../../components/Profile/CreateProfile";
import EditProfile from "../../components/Profile/EditProfile";
import { createProgramArchive, importProgramArchive, parseProgramArchive, programArchiveToCsv } from "../../services/programArchiveService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteAccount } from "../../services/profileService";
import AppearanceSettings from "../../components/Profile/AppearanceSettings";
import { Activity, ArrowLeft, ChevronRight, Settings, Target, UserRound } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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

  const isSettingsPage = pathname === "/profile/settings";
  const isPersonalPage = pathname === "/profile/personal";

  const backButton = (title: string, subtitle: string) => (
    <header className="mb-7">
      <button type="button" onClick={() => navigate("/profile")} className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-neutral-800 hover:text-[var(--page-text)]">
        <ArrowLeft size={17} aria-hidden="true" /> Retour au profil
      </button>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
    </header>
  );

  if (isSettingsPage) {
    return (
      <div className="profile-page">
        {backButton("Réglages", "Personnalise IronLog et gère tes données et ton compte.")}
        <AppearanceSettings />

        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-800 text-[var(--accent)]"><Activity size={20} aria-hidden="true" /></div>
            <div>
              <h2 className="text-lg font-bold">Importer / exporter le programme</h2>
              <p className="mt-1 text-sm text-neutral-400">Transfère tes séances programmées et leurs exercices. L’historique d’entraînement reste séparé.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => void exportProgram("json")} disabled={archiveBusy} className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-700 disabled:opacity-50">Exporter en JSON</button>
            <button type="button" onClick={() => void exportProgram("csv")} disabled={archiveBusy} className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-700 disabled:opacity-50">Exporter en CSV</button>
            <button type="button" onClick={() => importFileRef.current?.click()} disabled={archiveBusy} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50">{archiveBusy ? "Traitement…" : "Importer un fichier"}</button>
            <input ref={importFileRef} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" onChange={(event) => void importProgramFile(event)} aria-label="Choisir un export de programme JSON ou CSV" />
          </div>
          {archiveMessage && <p role="status" className="mt-3 text-sm text-lime-300">{archiveMessage}</p>}
          {archiveError && <p role="alert" className="mt-3 text-sm text-red-400">{archiveError}</p>}
        </section>

        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Compte</h2>
          <p className="mt-1 text-sm text-neutral-400">Déconnexion et suppression de tes données IronLog.</p>
          <button disabled={accountBusy} onClick={async () => { setAccountBusy(true); try { await signOut(); } finally { setAccountBusy(false); } }} className="mt-5 w-full rounded-2xl bg-neutral-800 py-3.5 font-semibold transition hover:bg-neutral-700 disabled:opacity-50">{accountBusy ? "Patiente…" : "Déconnexion"}</button>
          <button disabled={accountBusy} onClick={async () => {
            if (!window.confirm("Supprimer définitivement ton compte et toutes les données associées ? Cette action est irréversible.")) return;
            setAccountBusy(true);
            try { await deleteAccount(); clearLocalSession(); navigate("/login"); }
            catch { window.alert("Impossible de supprimer le compte. Réessaie ou contacte le support."); }
            finally { setAccountBusy(false); }
          }} className="mt-3 w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 font-semibold text-red-500 transition hover:bg-red-500/15 disabled:opacity-50">Supprimer mon compte</button>
        </section>
      </div>
    );
  }

  if (isPersonalPage) {
    if (!profile) {
      return <div>{backButton("Données personnelles", "Tes informations et tes mesures corporelles.")}<p className="rounded-3xl bg-neutral-900 p-5 text-neutral-400">Crée ton profil pour renseigner tes informations personnelles.</p><button type="button" onClick={() => navigate("/profile")} className="mt-4 w-full rounded-2xl bg-white py-4 font-semibold text-black">Retour au profil pour le créer</button></div>;
    }
    return (
      <div className="profile-page">
        {backButton("Données personnelles", "Tes informations et ta composition corporelle au même endroit.")}
        <section className="rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Informations personnelles</p><h2 className="mt-2 text-2xl font-bold">{profile.name}</h2></div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-800 text-[var(--accent)]"><UserRound size={20} aria-hidden="true" /></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3"><ProfileStat label="Âge" value={profile.age ? `${profile.age} ans` : "—"} /><ProfileStat label="Taille" value={profile.height ? `${profile.height} cm` : "—"} /></div>
          <button type="button" onClick={() => setShowEdit(true)} className="mt-5 w-full rounded-2xl bg-white py-3.5 font-semibold text-black">Modifier mes informations</button>
        </section>

        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Dernière mesure</p><h2 className="mt-2 text-xl font-bold">Composition actuelle</h2></div><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-800 text-[var(--accent)]"><Activity size={20} aria-hidden="true" /></div></div>
          {body ? <div className="mt-5 grid grid-cols-2 gap-3"><ProfileStat label="Poids" value={`${body.weight} kg`} /><ProfileStat label="Masse grasse" value={body.bodyFat !== undefined ? `${body.bodyFat}%` : "—"} /><ProfileStat label="Masse musculaire" value={body.muscleMass !== undefined ? `${body.muscleMass}%` : "—"} /><ProfileStat label="Masse maigre" value={body.leanMass !== undefined ? `${body.leanMass} kg` : "—"} /><p className="col-span-2 text-xs text-neutral-400">Mesure du {new Date(body.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div> : <div className="mt-5 rounded-2xl bg-neutral-800 p-4"><p className="text-sm text-neutral-400">Aucune mesure corporelle enregistrée pour le moment.</p><button type="button" onClick={() => navigate("/progress")} className="mt-3 text-sm font-semibold text-[var(--accent)]">Ajouter une première mesure <span aria-hidden="true">→</span></button></div>}
        </section>
        {showEdit && <EditProfile profile={profile} mode="personal" onClose={() => setShowEdit(false)} onSave={() => { void load(); }} />}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-neutral-400">Ton espace personnel</p><h1 className="mt-1 text-3xl font-bold">Profil</h1></div>
          <button type="button" aria-label="Ouvrir les réglages" onClick={() => navigate("/profile/settings")} className="grid size-11 place-items-center rounded-2xl bg-neutral-900 text-neutral-400 transition hover:text-[var(--page-text)]"><Settings size={19} aria-hidden="true" /></button>
        </header>
        <section className="mt-6 rounded-3xl border border-[var(--line)] bg-neutral-900 p-6 sm:p-8"><h2 className="text-xl font-bold">Crée ton profil</h2><p className="mt-2 text-sm text-neutral-400">Ajoute tes informations pour suivre tes objectifs et ton évolution.</p><button onClick={() => setShowCreate(true)} className="mt-5 w-full rounded-2xl bg-white py-4 font-semibold text-black">Créer mon profil</button></section>
        {showCreate && <CreateProfile onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); void load(); }} />}
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-semibold text-neutral-400">Ton espace personnel</p><h1 className="mt-1 text-3xl font-bold">Profil</h1></div>
        <button type="button" aria-label="Ouvrir les réglages" onClick={() => navigate("/profile/settings")} className="grid size-11 place-items-center rounded-2xl border border-[var(--line)] bg-neutral-900 text-neutral-400 transition hover:bg-neutral-800 hover:text-[var(--page-text)]"><Settings size={19} aria-hidden="true" /></button>
      </header>

      <button type="button" onClick={() => navigate("/profile/personal")} className="mt-6 flex w-full items-center gap-4 rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 text-left transition hover:bg-neutral-800 sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-800 text-[var(--accent)]"><UserRound size={21} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-400">Informations & mesures</span><span className="mt-1 block truncate text-lg font-bold">{profile.name}</span><span className="mt-1 block text-sm text-neutral-400">Données personnelles et composition actuelle</span></span>
        <ChevronRight className="shrink-0 text-neutral-400" size={20} aria-hidden="true" />
      </button>

      <section className="mt-7">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]"><Target size={19} aria-hidden="true" /></span><div><h2 className="text-xl font-bold">Objectifs</h2><p className="text-sm text-neutral-400">Tes repères pour la suite</p></div></div>
        <div className="rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          {profile.goal && (profile.target_weight || profile.target_body_fat || profile.target_muscle_mass) ? <><p className="text-sm text-neutral-400">{profile.goal}</p><div className="mt-5 space-y-5"><GoalProgress label="Poids" current={body?.weight} target={profile.target_weight} progress={calculateProgress(bodyStart?.weight, body?.weight, profile.target_weight)} /><GoalProgress label="Masse grasse" current={body?.bodyFat} target={profile.target_body_fat} progress={calculateProgress(bodyStart?.bodyFat, body?.bodyFat, profile.target_body_fat)} /><GoalProgress label="Masse musculaire" current={body?.muscleMass} target={profile.target_muscle_mass} progress={calculateProgress(bodyStart?.muscleMass, body?.muscleMass, profile.target_muscle_mass)} /></div></> : <p className="text-sm text-neutral-400">Tu n’as pas encore défini d’objectif personnel.</p>}
          <button type="button" onClick={() => setShowEdit(true)} className="mt-5 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-semibold">{profile.goal ? "Modifier mes objectifs" : "Définir mes objectifs"}</button>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]"><Activity size={19} aria-hidden="true" /></span><div><h2 className="text-xl font-bold">Évolution</h2><p className="text-sm text-neutral-400">Depuis ta première mesure</p></div></div>
        <div className="rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          {bodyEvolution ? <div className="grid grid-cols-2 gap-3"><ProfileStat label="Poids" value={`${formatEvolution(bodyEvolution.weight)} kg`} /><ProfileStat label="Masse grasse" value={`${formatEvolution(bodyEvolution.bodyFat)} %`} /><ProfileStat label="Masse musculaire" value={`${formatEvolution(bodyEvolution.muscleMass)} %`} /><ProfileStat label="Masse maigre" value={`${formatEvolution(bodyEvolution.leanMass)} kg`} /></div> : <><p className="text-sm text-neutral-400">Enregistre au moins deux mesures pour voir ton évolution.</p><button type="button" onClick={() => navigate("/progress")} className="mt-3 text-sm font-semibold text-[var(--accent)]">Suivre ma progression <span aria-hidden="true">→</span></button></>}
        </div>
      </section>

      <section className="mt-7 pb-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]"><Activity size={19} aria-hidden="true" /></span><div><h2 className="text-xl font-bold">Entraînement</h2><p className="text-sm text-neutral-400">Ton activité cumulée</p></div></div>
        <div className="rounded-3xl border border-[var(--line)] bg-neutral-900 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3"><ProfileStat label="Séances terminées" value={`${workoutStats.sessions}`} /><ProfileStat label="Volume total" value={`${workoutStats.volume.toLocaleString()} kg`} /><div className="col-span-2"><ProfileStat label="Exercices terminés" value={`${workoutStats.exercises}`} /></div></div>
        </div>
      </section>
      {showEdit && <EditProfile profile={profile} mode="goals" onClose={() => setShowEdit(false)} onSave={() => { void load(); }} />}
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
