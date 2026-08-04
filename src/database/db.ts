import Dexie from "dexie";
import type { Table } from "dexie";

export interface Exercise {
  id?: number;

  name: string;

  description?: string;

  muscles: string[];

  createdAt: Date;
}

export interface Workout {
  id?: number;

  name: string;

  day: string;

  description: string;
}

export interface WorkoutExercise {
  id?: number;

  workoutId: number;

  exerciseId: number;

  order: number;

  sets: number;

  reps: string;

  weight: number;
}

export interface WeightHistory {
  id?: number;

  exerciseId: number;

  oldWeight: number;

  newWeight: number;

  date: Date;
}

export interface Profile {
  id?: number;

  name: string;

  age: number;

  height: number;

  weight?: number;

  bodyFat?: number;

  muscleMass?: number;

  goal?: string;

  targetWeight?: number;

  targetBodyFat?: number;

  targetMuscleMass?: number;
}

export interface WorkoutSet {
  weight: number;

  reps: number;
}

export interface ActiveWorkoutExercise {
  id?: number;

  workoutId: number;

  exerciseId: number;

  order: number;

  done: boolean;

  sets: WorkoutSet[];

  comment?: string;
}

export interface WorkoutHistory {
  id?: number;

  workoutId: number;

  date: Date;

  volume: number;

  completedExercises: number;
}

export interface ActiveWorkout {
  id?: number;

  workoutId: number;

  startedAt: Date;

  updatedAt: Date;
}

export interface BodyHistory {
  id?: number;

  date: Date;

  weight: number;

  bodyFat?: number;

  muscleMass?: number;

  boneMass?: number;

  waterPercentage?: number;

  metabolicAge?: number;

  leanMass?: number;
}

export interface ProgressPhoto {
  id?: number;

  date: Date;

  image: string;

  category: "front" | "side" | "back";

  note?: string;

  isReference?: boolean;
}

export interface ExerciseRecord {
  id?: number;

  exerciseId: number;

  maxWeight: number;

  maxReps: number;

  maxVolume: number;

  date: Date;
}

export class IronLogDatabase extends Dexie {
  exercises!: Table<Exercise, number>;

  workouts!: Table<Workout, number>;

  workoutExercises!: Table<WorkoutExercise, number>;

  weightHistory!: Table<WeightHistory, number>;

  profile!: Table<Profile, number>;

  activeWorkoutExercises!: Table<ActiveWorkoutExercise, number>;

  activeWorkout!: Table<ActiveWorkout, number>;

  workoutHistory!: Table<WorkoutHistory, number>;

  bodyHistory!: Table<BodyHistory, number>;

  progressPhotos!: Table<ProgressPhoto, number>;

  records!: Table<ExerciseRecord, number>;

  constructor() {
    super("IronLogDatabase");

    this.version(8).stores({
      exercises: "++id,name",

      workouts: "++id,name,day",

      workoutExercises: "++id,workoutId,exerciseId,order",

      weightHistory: "++id,exerciseId,date",

      profile: "++id",

      activeWorkoutExercises: "++id,workoutId,exerciseId,order",

      activeWorkout: "++id,workoutId",

      workoutHistory: "++id,workoutId,date",

      bodyHistory: "++id,date",

      progressPhotos: "++id,date,category",

      records: "++id,exerciseId,date",
    });
  }
}

export const db = new IronLogDatabase();
// (window as any).db = db;
