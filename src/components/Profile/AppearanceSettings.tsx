import { useState } from "react";
import {
  getGlassTransparency,
  getThemePreference,
  saveGlassTransparency,
  saveThemePreference,
  type ThemePreference,
} from "../../services/themeService";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Automatique (par défaut)" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export default function AppearanceSettings() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);
  const [transparency, setTransparency] = useState(getGlassTransparency);

  function changePreference(value: ThemePreference) {
    setPreference(value);
    saveThemePreference(value);
  }

  function changeTransparency(value: number) {
    setTransparency(value);
    saveGlassTransparency(value);
  }

  return (
    <section className="mt-6 rounded-3xl bg-neutral-900 p-6">
      <h2 className="text-lg font-bold">Apparence</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:items-end">
        <label className="block">
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

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="glass-transparency" className="text-sm font-semibold">
              Transparence du verre
            </label>
            <output htmlFor="glass-transparency" className="text-sm font-semibold tabular-nums text-[var(--accent)]">
              {transparency} %
            </output>
          </div>
          <input
            id="glass-transparency"
            type="range"
            min={0}
            max={60}
            step={1}
            value={transparency}
            onChange={(event) => changeTransparency(Number(event.currentTarget.value))}
            aria-valuetext={`${transparency} % de transparence`}
            className="app-accent-range w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-neutral-400">
            <span>Opaque</span>
            <span>Plus transparent</span>
          </div>
        </div>
      </div>
    </section>
  );
}
