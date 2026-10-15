import { supabase } from "../lib/supabase";

export async function createExercise(
  name: string,
  muscles: string[],
  description: string = "",
) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Connecte-toi pour créer un exercice.");

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: authData.user.id,
      name,
      muscles,
      description,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getExercises() {
  const { data, error } = await supabase.from("exercises").select("*");

  if (error) throw error;

  return data ?? [];
}
