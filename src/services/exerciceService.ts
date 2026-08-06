import { supabase } from "../lib/supabase";

export async function createExercise(
  name: string,
  muscles: string[],
  description: string = "",
) {
  const { data, error } = await supabase
    .from("exercises")
    .insert({
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
