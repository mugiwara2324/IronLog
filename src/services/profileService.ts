import { supabase } from "../lib/supabase";

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createProfile(profile: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,

      ...profile,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(profile: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function deleteAccount() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Utilisateur non connecté");
  }

  const functionsUrl =
    import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
    import.meta.env.VITE_SUPABASE_URL.replace(
      ".supabase.co",
      ".functions.supabase.co",
    );

  const response = await fetch(`${functionsUrl}/delete-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.error || "Impossible de supprimer le compte sur le serveur.",
    );
  }

  // L'utilisateur est déjà supprimé côté Supabase Auth.
  // On nettoie uniquement la session locale sans appeler signOut()
  // pour éviter un appel /logout qui retournerait 403.

  Object.keys(localStorage)
    .filter((key) => key.includes("supabase"))
    .forEach((key) => {
      localStorage.removeItem(key);
    });

  return;
}
