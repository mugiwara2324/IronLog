import { createContext, useContext, useEffect, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;

  loading: boolean;

  signOut: () => Promise<void>;

  clearLocalSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Déconnexion classique de l'utilisateur
   * (bouton "Se déconnecter")
   */
  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Erreur lors de la déconnexion Supabase :", error);
    } finally {
      clearLocalSession();
    }
  }

  /**
   * Nettoyage local uniquement.
   * À utiliser après une suppression de compte,
   * car l'utilisateur n'existe déjà plus côté Supabase Auth.
   */
  function clearLocalSession() {
    setUser(null);

    Object.keys(localStorage)
      .filter((key) => key.includes("supabase"))
      .forEach((key) => {
        localStorage.removeItem(key);
      });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        clearLocalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return context;
}
