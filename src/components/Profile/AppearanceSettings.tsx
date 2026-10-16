import { useState } from "react";
import { getThemePreference, saveThemePreference, type ThemePreference } from "../../services/themeService";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Automatique (par défaut)" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export default function AppearanceSettings() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);

  function changePreference(value: ThemePreference) {
    setPreference(value);
    saveThemePreference(value);
  }

  return (
    <section className="mt-6 rounded-3xl bg-neutral-900 p-6">
      <h2 className="text-lg font-bold">Apparence</h2>
      <label className="mt-3 block">
        <span className="mb-2 block text-sm font-semibold">Thème</span>
        <select
          value={preference}
          onChange={(event) => changePreference(event.target.value as ThemePreference)}
          className="w-full rounded-xl bg-neutral-800 p-3"
          aria-label="Thème de l’application"
        >
          {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </section>
  );
}
