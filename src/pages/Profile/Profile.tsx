import { useEffect, useState } from "react";

import { db } from "../../database/db";

import CreateProfile from "../../components/Profile/CreateProfile";
import EditProfile from "../../components/Profile/EditProfile";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);

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
    const data = await db.profile.toCollection().first();

    setProfile(data ?? null);

    const bodyData = await db.bodyHistory.orderBy("date").reverse().first();

    setBody(bodyData ?? null);

    const bodyHistory = await db.bodyHistory.orderBy("date").toArray();

    if (bodyHistory.length > 0) {
      setBodyStart(bodyHistory[0]);
    }

    if (bodyHistory.length > 1) {
      const start = bodyHistory[0];

      const current = bodyHistory[bodyHistory.length - 1];

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
          current.leanMass !== undefined && start.leanMass !== undefined
            ? current.leanMass - start.leanMass
            : null,
      });
    }

    const workouts = await db.workoutHistory
      .orderBy("date")
      .reverse()
      .toArray();

    const volume = workouts.reduce((total, item) => total + item.volume, 0);

    const exercises = workouts.reduce(
      (total, item) => total + item.completedExercises,
      0,
    );

    let lastWorkout = null;

    if (workouts.length) {
      const last = workouts[0];

      const workout = await db.workouts.get(last.workoutId);

      lastWorkout = {
        name: workout?.name ?? "Séance",

        date: last.date,
      };
    }

    setWorkoutStats({
      sessions: workouts.length,

      volume,

      exercises,

      last: lastWorkout,
    });
  }

  useEffect(() => {
    load();
  }, []);

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
              target={profile.targetWeight}
              progress={calculateProgress(
                bodyStart.weight,
                body.weight,
                profile.targetWeight,
              )}
            />

            <GoalProgress
              label="Masse grasse"
              current={body.bodyFat}
              target={profile.targetBodyFat}
              progress={calculateProgress(
                bodyStart.bodyFat,
                body.bodyFat,
                profile.targetBodyFat,
              )}
            />

            <GoalProgress
              label="Muscle"
              current={body.muscleMass}
              target={profile.targetMuscleMass}
              progress={calculateProgress(
                bodyStart.muscleMass,
                body.muscleMass,
                profile.targetMuscleMass,
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

      {showEdit && (
        <EditProfile
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={() => load()}
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

function ProfileStat({
  label,

  value,
}: {
  label: string;

  value: string;
}) {
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
