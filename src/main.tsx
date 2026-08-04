import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { seedProgram } from "./database/programSeed";
// import { addExerciseDetails } from "./database/seedDescriptions";

// addExerciseDetails();

seedProgram();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
