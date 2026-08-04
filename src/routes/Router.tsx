import { BrowserRouter, Routes, Route } from "react-router-dom";

import MobileLayout from "../layouts/MobileLayout";

import Home from "../pages/Home/Home";
import Workouts from "../pages/Workouts/Workouts";
import WorkoutDetail from "../pages/Workouts/WorkoutDetail";
import WorkoutSession from "../pages/Workouts/WorkoutSession.tsx";
import WorkoutEdit from "../pages/Workouts/WorkoutEdit";
import WorkoutActive from "../pages/WorkoutActive/WorkoutActive";
import Progress from "../pages/Progress/Progress";
import Photos from "../pages/Photos/Photos";
import Profile from "../pages/Profile/Profile";
import Exercises from "../pages/Exercises/Exercises";
import ExerciseDetail from "../pages/Exercises/ExerciseDetail";
import ExerciseEdit from "../pages/Exercises/ExerciseEdit";

export default function Router() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/workout-active/:id" element={<WorkoutActive />} />

          <Route path="/workouts" element={<Workouts />} />

          <Route path="/session" element={<WorkoutSession />} />

          <Route path="/workouts/:id" element={<WorkoutDetail />} />

          <Route path="/workouts/:id/edit" element={<WorkoutEdit />} />

          <Route path="/exercises" element={<Exercises />} />

          <Route path="/exercises/:id" element={<ExerciseDetail />} />

          <Route path="/exercises/:id/edit" element={<ExerciseEdit />} />

          <Route path="/progress" element={<Progress />} />

          <Route path="/photos" element={<Photos />} />

          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  );
}
