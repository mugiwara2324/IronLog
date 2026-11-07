export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "ironlog:theme-preference";
const GLASS_TRANSPARENCY_STORAGE_KEY = "ironlog:glass-transparency";
const DEFAULT_GLASS_TRANSPARENCY = 22;
const MAX_GLASS_TRANSPARENCY = 60;

function normalizeGlassTransparency(value: number) {
  return Math.max(0, Math.min(MAX_GLASS_TRANSPARENCY, Math.round(value)));
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Keep the system appearance if local storage is unavailable.
  }
  return "system";
}

export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }
}

export function saveThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The setting still applies for the current page if storage is unavailable.
  }
  applyThemePreference(preference);
}

export function getGlassTransparency() {
  try {
    const stored = localStorage.getItem(GLASS_TRANSPARENCY_STORAGE_KEY);
    if (stored !== null && Number.isFinite(Number(stored))) {
      return normalizeGlassTransparency(Number(stored));
    }
  } catch {
    // Use the default transparency if local storage is unavailable.
  }
  return DEFAULT_GLASS_TRANSPARENCY;
}

export function applyGlassTransparency(value: number) {
  const transparency = normalizeGlassTransparency(value);
  const root = document.documentElement;
  root.style.setProperty("--glass-transparency", `${transparency}%`);
  const navigationTransparency = Math.min(78, Math.round(8 + transparency * 1.36));
  root.style.setProperty("--glass-navigation-transparency", `${navigationTransparency}%`);
}

export function saveGlassTransparency(value: number) {
  const transparency = normalizeGlassTransparency(value);
  try {
    localStorage.setItem(GLASS_TRANSPARENCY_STORAGE_KEY, String(transparency));
  } catch {
    // The current page still uses the selected value if storage is unavailable.
  }
  applyGlassTransparency(transparency);
}
