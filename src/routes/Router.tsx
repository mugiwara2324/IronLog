import { BrowserRouter, Routes, Route } from "react-router-dom";

import MobileLayout from "../layouts/MobileLayout";

import ProtectedRoute from "../auth/ProtectedRoute";

import Home from "../pages/Home/Home";
import Workouts from "../pages/Workouts/Workouts";
import WorkoutDetail from "../pages/Workouts/WorkoutDetail";
import WorkoutSession from "../pages/Workouts/WorkoutSession.tsx";
import WorkoutEdit from "../pages/Workouts/WorkoutEdit";
import WorkoutActive from "../pages/WorkoutActive/WorkoutActive";
import WorkoutHistory from "../pages/WorkoutHistory/WorkoutHistory.tsx";
import WorkoutHistoryEdit from "../pages/WorkoutHistory/WorkoutHistoryEdit";

import Progress from "../pages/Progress/Progress";
import Photos from "../pages/Photos/Photos";
import Profile from "../pages/Profile/Profile";

import Exercises from "../pages/Exercises/Exercises";
import ExerciseDetail from "../pages/Exercises/ExerciseDetail";
import ExerciseEdit from "../pages/Exercises/ExerciseEdit";

import Login from "../auth/Login";
import Register from "../auth/Register";
import ResetPassword from "../auth/ResetPassword";

export default function Router() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          {/* Routes publiques */}

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes protégées */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workout-active/:id"
            element={
              <ProtectedRoute>
                <WorkoutActive />
              </ProtectedRoute>
            }
          />

          <Route path="/workout-history/:id" element={<WorkoutHistory />} />

          <Route
            path="/workout-history/:id/edit"
            element={<WorkoutHistoryEdit />}
          />

          <Route
            path="/workouts"
            element={
              <ProtectedRoute>
                <Workouts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workouts/history/:id"
            element={
              <ProtectedRoute>
                <WorkoutHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/session"
            element={
              <ProtectedRoute>
                <WorkoutSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workouts/:id"
            element={
              <ProtectedRoute>
                <WorkoutDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workouts/:id/edit"
            element={
              <ProtectedRoute>
                <WorkoutEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exercises"
            element={
              <ProtectedRoute>
                <Exercises />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exercises/:id"
            element={
              <ProtectedRoute>
                <ExerciseDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exercises/:id/edit"
            element={
              <ProtectedRoute>
                <ExerciseEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/photos"
            element={
              <ProtectedRoute>
                <Photos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  );
}
