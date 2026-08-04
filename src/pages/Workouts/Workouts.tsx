import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { db } from "../../database/db";

export default function Workouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await db.workouts.toArray();

      setWorkouts(data);
    }

    load();
  }, []);

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

      <p
        className="
            text-neutral-400
            mt-2
            "
      >
        Programme hebdomadaire
      </p>

      <div
        className="
            mt-8
            space-y-4
            "
      >
        {workouts.map((workout) => (
          <div
            key={workout.id}
            onClick={() => {
              navigate(`/workouts/${workout.id}`);
            }}
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
              {workout.name}
            </h2>

            <p
              className="
                        text-neutral-400
                        mt-2
                        "
            >
              {workout.day}
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
        ))}
      </div>
    </div>
  );
}
