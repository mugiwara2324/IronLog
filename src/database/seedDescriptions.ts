import { db } from "./db";

export async function addExerciseDetails() {
  const exercises = await db.exercises.toArray();

  for (const exercise of exercises) {
    let description = "";

    let muscles: string[] = [];

    switch (exercise.name) {
      case "Développé couché":
      case "Développé couché haltères":
        description =
          "Exercice de poussée horizontal ciblant principalement les pectoraux. Garder les omoplates serrées et contrôler la descente.";

        muscles = ["Grand pectoral", "Deltoïde antérieur", "Triceps"];

        break;

      case "Tirage vertical devant":
        description =
          "Tirage vertical permettant de développer la largeur du dos. Tirer avec les coudes et garder le buste légèrement incliné.";

        muscles = ["Grand dorsal", "Biceps", "Rhomboïdes"];

        break;

      default:
        continue;
    }

    await db.exercises.update(
      exercise.id!,

      {
        description,

        muscles,
      },
    );
  }

  console.log("Détails exercices ajoutés");
}
