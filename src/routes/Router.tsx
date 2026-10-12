import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MobileLayout from "../layouts/MobileLayout";

import ProtectedRoute from "../auth/ProtectedRoute";

const Home = lazy(() => import("../pages/Home/Home"));
const Workouts = lazy(() => import("../pages/Workouts/Workouts"));
const WorkoutDetail = lazy(() => import("../pages/Workouts/WorkoutDetail"));
const WorkoutSession = lazy(() => import("../pages/Workouts/WorkoutSession"));
const WorkoutEdit = lazy(() => import("../pages/Workouts/WorkoutEdit"));
const WorkoutActive = lazy(() => import("../pages/WorkoutActive/WorkoutActive"));
const WorkoutHistory = lazy(() => import("../pages/WorkoutHistory/WorkoutHistory"));
const WorkoutHistoryEdit = lazy(() => import("../pages/WorkoutHistory/WorkoutHistoryEdit"));
const Progress = lazy(() => import("../pages/Progress/Progress"));
const Photos = lazy(() => import("../pages/Photos/Photos"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Exercises = lazy(() => import("../pages/Exercises/Exercises"));
const ExerciseDetail = lazy(() => import("../pages/Exercises/ExerciseDetail"));
const ExerciseEdit = lazy(() => import("../pages/Exercises/ExerciseEdit"));
const Login = lazy(() => import("../auth/Login"));
const Register = lazy(() => import("../auth/Register"));
const ResetPassword = lazy(() => import("../auth/ResetPassword"));

export default function Router() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Suspense
          fallback={
            <div className="p-5 text-neutral-400" role="status">
              Chargement de la page…
            </div>
          }
        >
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
        </Suspense>
      </MobileLayout>
    </BrowserRouter>
  );
}
