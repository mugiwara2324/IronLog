import { supabase } from "../lib/supabase";

// Récupérer toutes les mesures de l'utilisateur

export async function getBodyMeasurements() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", user.id)
    .order("date", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data;
}

// Ajouter une mesure

export async function createBodyMeasurement(measurement: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  const { data, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,

      ...measurement,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Modifier une mesure

export async function updateBodyMeasurement(id: string, measurement: any) {
  const { data, error } = await supabase
    .from("body_measurements")
    .update(measurement)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Supprimer une mesure

export async function deleteBodyMeasurement(id: string) {
  const { error } = await supabase
    .from("body_measurements")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
