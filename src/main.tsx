import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
// Le seed local Dexie avait été exécuté ici. On évite le seed automatique au démarrage
// pour ne pas lancer des scripts IndexedDB non désirés. Utiliser le seed côté
// services si nécessaire (après authentification).
import { AuthProvider } from "./auth/AuthProvider";
import { applyThemePreference, getThemePreference } from "./services/themeService";
// import { addExerciseDetails } from "./database/seedDescriptions";

// addExerciseDetails();

// seedProgram(); // Désactivé — appeler manuellement via l'UI si besoin

applyThemePreference(getThemePreference());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
