import { useState } from "react";

import { supabase } from "../lib/supabase";

import { useNavigate } from "react-router-dom";

// import { seedProgram } from "./../services/programService";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [name, setName] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function register() {
    setError("");

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,

      password,
    });

    if (error) {
      setError(error.message);

      setLoading(false);

      return;
    }

    const user = data.user;

    if (user) {
      // await seedProgram(user.id);

      await supabase.from("profiles").insert({
        user_id: user.id,

        name,
      });

      setLoading(false);

      if (data.session) {
        navigate("/");
      } else {
        setError(
          "Compte créé. Confirmez votre email puis connectez-vous pour initialiser votre compte.",
        );
        navigate("/login");
      }

      return;
    }

    setLoading(false);
    setError(
      "Compte créé. Confirmez votre email puis connectez-vous pour initialiser votre compte.",
    );
    navigate("/login");
  }

  return (
    <div
      className="auth-page flex items-center justify-center p-5"
    >
      <div
        className="
        auth-card
        bg-neutral-900
        rounded-3xl
        p-6
        w-full
        max-w-md
        "
      >
        <h1
          className="
          text-3xl
          font-bold
          "
        >
          Créer un compte
        </h1>

        <div
          className="
          mt-6
          space-y-4
          "
        >
          <input
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
            w-full
            bg-neutral-800
            rounded-xl
            p-3
            "
          />

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
          onClick={register}
          disabled={loading}
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
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <button
          onClick={() => navigate("/login")}
          className="
          mt-4
          text-neutral-400
          w-full
          "
        >
          J'ai déjà un compte
        </button>
      </div>
    </div>
  );
}
