import { useState } from "react";

import { supabase } from "../lib/supabase";

import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,

      password,
    });

    if (error) {
      setError(error.message);

      return;
    }

    navigate("/");
  }

  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      p-5
      "
    >
      <div
        className="
        bg-neutral-900
        rounded-3xl
        p-6
        w-full
        max-w-md
        "
      >
        <h1 className="text-3xl font-bold">Connexion</h1>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

          <input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        <button
          onClick={login}
          className="
          mt-6
          w-full
          bg-white
          text-black
          rounded-2xl
          py-4
          "
        >
          Se connecter
        </button>

        <button
          onClick={() => navigate("/register")}
          className="
          mt-4
          text-neutral-400
          w-full
          "
        >
          Créer un compte
        </button>
      </div>
    </div>
  );
}
