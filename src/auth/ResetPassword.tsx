import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(
    window.location.hash.includes("type=recovery"),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendRecoveryEmail() {
    setLoading(true);
    setError("");
    setMessage("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Si un compte correspond à cette adresse, un e-mail vient d'être envoyé.");
  }

  async function updatePassword() {
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Mot de passe modifié. Redirection vers la connexion...");
    window.setTimeout(() => navigate("/login"), 1200);
  }

  return (
    <div className="auth-page flex items-center justify-center p-5">
      <div className="auth-card bg-neutral-900 rounded-3xl p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold">
          {recoveryMode ? "Nouveau mot de passe" : "Mot de passe oublié"}
        </h1>

        {recoveryMode ? (
          <div className="mt-6 space-y-4">
            <p className="text-neutral-400">Choisis un nouveau mot de passe pour ton compte.</p>
            <input
              placeholder="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
            <input
              placeholder="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
            <button
              onClick={updatePassword}
              disabled={loading}
              className="w-full bg-white text-black rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Enregistrer mon mot de passe"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-neutral-400">Indique l&apos;adresse e-mail utilisée pour créer ton compte.</p>
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-neutral-800 rounded-xl p-3"
            />
            <button
              onClick={sendRecoveryEmail}
              disabled={!email || loading}
              className="w-full bg-white text-black rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-red-400">{error}</p>}
        {message && <p className="mt-4 text-green-400">{message}</p>}

        <button onClick={() => navigate("/login")} className="mt-5 w-full text-neutral-400">
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}
