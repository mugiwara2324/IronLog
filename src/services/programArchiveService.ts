import { supabase } from "../lib/supabase";

const FORMAT = "ironlog-program";
const VERSION = 1;
const PAGE_SIZE = 500;
const CSV_COLUMNS = ["record_type", "source_workout_id", "workout_name", "day_of_week", "workout_description", "source_exercise_id", "exercise_name", "exercise_muscles", "exercise_description", "exercise_order", "planned_sets", "planned_reps", "planned_weight_kg"] as const;

export interface ProgramExercise { sourceId?: string; name: string; muscles: string[]; description: string; order: number; sets: number; reps: string; weight: number }
export interface Program { sourceId?: string; name: string; dayOfWeek: number; description: string; exercises: ProgramExercise[] }
export interface ProgramArchive { format: typeof FORMAT; version: typeof VERSION; exportedAt: string; programs: Program[] }
export interface ImportSummary { programsAdded: number; exercisesAdded: number; exercisesSkipped: number }
type RawExercise = { id?: string; name?: string | null; muscles?: string[] | null; description?: string | null };
type RawWorkoutExercise = { exercise_id?: string; order?: number | null; order_index?: number | null; sets?: number | null; reps?: string | number | null; weight?: number | null; exercises?: RawExercise | RawExercise[] | null };
type RawWorkout = { id: string; name: string; day_of_week: number; description?: string | null; workout_exercises?: RawWorkoutExercise[] | null };
const normalize = (value: string) => value.trim().toLocaleLowerCase("fr");
const finiteNumber = (value: unknown, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const relation = <T,>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
async function userId() { const { data, error } = await supabase.auth.getUser(); if (error) throw error; if (!data.user) throw new Error("Connecte-toi pour importer ou exporter ton programme."); return data.user.id; }

export async function createProgramArchive(): Promise<ProgramArchive> {
  const id = await userId(); const rows: RawWorkout[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("workouts").select("id, name, day_of_week, description, workout_exercises(*, exercises(id, name, muscles, description))").eq("user_id", id).order("day_of_week").range(from, from + PAGE_SIZE - 1);
    if (error) throw error; rows.push(...((data ?? []) as unknown as RawWorkout[])); if ((data?.length ?? 0) < PAGE_SIZE) break;
  }
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), programs: rows.map((workout) => ({ sourceId: workout.id, name: workout.name, dayOfWeek: finiteNumber(workout.day_of_week, 1), description: workout.description ?? "", exercises: (workout.workout_exercises ?? []).map((item, index) => { const exercise = relation(item.exercises); return { sourceId: item.exercise_id ?? exercise?.id, name: exercise?.name ?? "Exercice", muscles: strings(exercise?.muscles), description: exercise?.description ?? "", order: finiteNumber(item.order ?? item.order_index, index), sets: Math.max(1, finiteNumber(item.sets, 1)), reps: String(item.reps ?? ""), weight: finiteNumber(item.weight) }; }).sort((a, b) => a.order - b.order) })) };
}
function csvCell(value: unknown) { const text = value === null || value === undefined ? "" : String(value); return /[",\r\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function programArchiveToCsv(archive: ProgramArchive) {
  const rows: unknown[][] = [CSV_COLUMNS as unknown as string[]];
  for (const program of archive.programs) {
    const base = { source_workout_id: program.sourceId, workout_name: program.name, day_of_week: program.dayOfWeek, workout_description: program.description };
    for (const exercise of program.exercises.length ? program.exercises : [null]) {
      const values: Record<string, unknown> = exercise ? { record_type: "program_exercise", ...base, source_exercise_id: exercise.sourceId, exercise_name: exercise.name, exercise_muscles: exercise.muscles.join("|"), exercise_description: exercise.description, exercise_order: exercise.order, planned_sets: exercise.sets, planned_reps: exercise.reps, planned_weight_kg: exercise.weight } : { record_type: "program", ...base };
      rows.push(CSV_COLUMNS.map((column) => values[column] ?? ""));
    }
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const c = text[i]; if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; } else if (c === '"' && !field) quoted = true; else if (c === delimiter) { row.push(field); field = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; } else field += c; }
  if (quoted) throw new Error("Le fichier CSV contient un champ entre guillemets incomplet."); if (field || row.length) { row.push(field); if (row.some(Boolean)) rows.push(row); } return rows;
}
function csvNumber(value: string, label: string, fallback = 0) { if (!value?.trim()) return fallback; const n = Number(value.replace(",", ".")); if (!Number.isFinite(n)) throw new Error(`Valeur invalide dans la colonne « ${label} ».`); return n; }
function archiveFromCsv(text: string): ProgramArchive {
  const clean = text.replace(/^\uFEFF/, ""), firstLine = clean.split(/\r?\n/, 1)[0] ?? "", delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",", rows = parseCsv(clean, delimiter);
  if (!rows.length) throw new Error("Le fichier CSV est vide."); const indexes = new Map(rows[0].map((name, i) => [name, i])); for (const column of CSV_COLUMNS) if (!indexes.has(column)) throw new Error(`Colonne manquante dans le CSV : ${column}.`);
  const value = (row: string[], col: typeof CSV_COLUMNS[number]) => row[indexes.get(col)!] ?? "", programs = new Map<string, Program>();
  for (const row of rows.slice(1)) { const kind = value(row, "record_type"), name = value(row, "workout_name").trim(); if (kind !== "program" && kind !== "program_exercise") throw new Error(`Type de ligne CSV inconnu : ${kind}.`); if (!name) throw new Error("Un programme du CSV n’a pas de nom."); const day = csvNumber(value(row, "day_of_week"), "day_of_week", 0); if (!Number.isInteger(day) || day < 1 || day > 7) throw new Error(`Jour invalide pour le programme « ${name} ».`); const sourceId = value(row, "source_workout_id") || undefined, key = sourceId ?? `${normalize(name)}|${day}`, program = programs.get(key) ?? { sourceId, name, dayOfWeek: day, description: value(row, "workout_description"), exercises: [] }; programs.set(key, program);
    if (kind === "program_exercise") { const exerciseName = value(row, "exercise_name").trim(); if (!exerciseName) throw new Error(`Un exercice de « ${name} » n’a pas de nom.`); const order = csvNumber(value(row, "exercise_order"), "exercise_order"); if (!program.exercises.some((exercise) => exercise.order === order)) program.exercises.push({ sourceId: value(row, "source_exercise_id") || undefined, name: exerciseName, muscles: value(row, "exercise_muscles").split("|").filter(Boolean), description: value(row, "exercise_description"), order, sets: Math.max(1, csvNumber(value(row, "planned_sets"), "planned_sets", 1)), reps: value(row, "planned_reps"), weight: Math.max(0, csvNumber(value(row, "planned_weight_kg"), "planned_weight_kg")) }); }
  }
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), programs: [...programs.values()] };
}
export function parseProgramArchive(text: string, fileName: string): ProgramArchive {
  const ext = fileName.split(".").pop()?.toLowerCase(); if (ext === "csv") return archiveFromCsv(text); if (ext !== "json") throw new Error("Choisis un fichier JSON ou CSV de programme IronLog."); let input: unknown; try { input = JSON.parse(text); } catch { throw new Error("Le fichier JSON est illisible."); }
  if (!input || typeof input !== "object") throw new Error("Le fichier ne contient pas un programme IronLog."); const raw = input as Record<string, unknown>; if (raw.format !== FORMAT || raw.version !== VERSION || !Array.isArray(raw.programs)) throw new Error("Le format de ce fichier n’est pas pris en charge. Importe un export de programme IronLog.");
  const programs: Program[] = raw.programs.map((item) => { if (!item || typeof item !== "object") throw new Error("Un programme du fichier est invalide."); const p = item as Record<string, unknown>, name = typeof p.name === "string" ? p.name.trim() : "", day = finiteNumber(p.dayOfWeek, 0); if (!name || !Number.isInteger(day) || day < 1 || day > 7 || !Array.isArray(p.exercises)) throw new Error("Un programme a un nom, un jour ou une liste d’exercices invalide."); return { sourceId: typeof p.sourceId === "string" ? p.sourceId : undefined, name, dayOfWeek: day, description: typeof p.description === "string" ? p.description : "", exercises: p.exercises.map((value) => { if (!value || typeof value !== "object") throw new Error(`Un exercice de « ${name} » est invalide.`); const e = value as Record<string, unknown>, exerciseName = typeof e.name === "string" ? e.name.trim() : ""; if (!exerciseName) throw new Error(`Un exercice de « ${name} » n’a pas de nom.`); return { sourceId: typeof e.sourceId === "string" ? e.sourceId : undefined, name: exerciseName, muscles: strings(e.muscles), description: typeof e.description === "string" ? e.description : "", order: Math.max(0, finiteNumber(e.order)), sets: Math.max(1, finiteNumber(e.sets, 1)), reps: String(e.reps ?? ""), weight: Math.max(0, finiteNumber(e.weight)) }; }) }; });
  return { format: FORMAT, version: VERSION, exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(), programs };
}
function programKey(name: string, day: number) { return `${normalize(name)}|${day}`; }
async function getOrCreateExercise(name: string, muscles: string[], description: string, known: Map<string, string>) { const key = normalize(name), existing = known.get(key); if (existing) return existing; const { data, error } = await supabase.from("exercises").insert({ name, muscles, description, created_at: new Date().toISOString() }).select("id").single(); if (error) throw error; known.set(key, data.id); return data.id as string; }
export async function importProgramArchive(archive: ProgramArchive): Promise<ImportSummary> {
  const id = await userId(), summary = { programsAdded: 0, exercisesAdded: 0, exercisesSkipped: 0 }, knownExercises = new Map<string, string>();
  for (let from = 0; ; from += PAGE_SIZE) { const { data, error } = await supabase.from("exercises").select("id, name").range(from, from + PAGE_SIZE - 1); if (error) throw error; for (const e of data ?? []) knownExercises.set(normalize(e.name), e.id); if ((data?.length ?? 0) < PAGE_SIZE) break; }
  const { data: existing, error } = await supabase.from("workouts").select("id, name, day_of_week").eq("user_id", id); if (error) throw error; const knownPrograms = new Map((existing ?? []).map((item) => [programKey(item.name, Number(item.day_of_week)), item.id]));
  for (const program of archive.programs) { const key = programKey(program.name, program.dayOfWeek); let workoutId = knownPrograms.get(key); if (!workoutId) { const { data, error: insertError } = await supabase.from("workouts").insert({ user_id: id, name: program.name, day_of_week: program.dayOfWeek, description: program.description }).select("id").single(); if (insertError) throw insertError; workoutId = data.id; knownPrograms.set(key, workoutId); summary.programsAdded++; }
    const { data: current, error: currentError } = await supabase.from("workout_exercises").select("exercise_id, order, order_index").eq("workout_id", workoutId); if (currentError) throw currentError; const existingKeys = new Set((current ?? []).map((item) => `${item.exercise_id}|${item.order ?? item.order_index ?? 0}`));
    for (const exercise of program.exercises) { const exerciseId = await getOrCreateExercise(exercise.name, exercise.muscles, exercise.description, knownExercises), exerciseKey = `${exerciseId}|${exercise.order}`; if (existingKeys.has(exerciseKey)) { summary.exercisesSkipped++; continue; } const { error: addError } = await supabase.from("workout_exercises").insert({ workout_id: workoutId, exercise_id: exerciseId, order: exercise.order, order_index: exercise.order, sets: exercise.sets, reps: exercise.reps, weight: exercise.weight, notes: "" }); if (addError) throw addError; existingKeys.add(exerciseKey); summary.exercisesAdded++; }
  }
  return summary;
}
