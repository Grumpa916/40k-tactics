// Visual-only, per-device preference. Never part of an army roster or saved battle.
export const APP_THEME_STORAGE_KEY = '40k-tactics.color-theme';
export const DEFAULT_APP_THEME = 'custodes';
export const APP_THEMES = Object.freeze(['custodes', 'classic']);

function safeStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}
export function normalizeAppTheme(value) {
  return APP_THEMES.includes(value) ? value : DEFAULT_APP_THEME;
}
export function readAppTheme(storage = safeStorage()) {
  try { return normalizeAppTheme(storage?.getItem(APP_THEME_STORAGE_KEY)); }
  catch { return DEFAULT_APP_THEME; }
}
export function saveAppTheme(theme, storage = safeStorage()) {
  const result = normalizeAppTheme(theme);
  try { storage?.setItem(APP_THEME_STORAGE_KEY, result); }
  catch { /* Private browsing/disabled storage: keep this session's choice. */ }
  return result;
}
export function renderAppThemeToggle(theme) {
  const current = normalizeAppTheme(theme);
  const next = current === 'custodes' ? 'Classic' : 'Custodes';
  return '<button type="button" class="app-theme-toggle" data-app-theme-toggle ' +
    'aria-pressed="' + String(current === 'custodes') + '" ' +
    'aria-label="Switch to ' + next + ' color theme" ' +
    'title="Switch to ' + next + ' color theme">Theme: ' +
    (current === 'custodes' ? 'Custodes' : 'Classic') + '</button>';
}
export function applyAppThemeToShell(container, theme) {
  const current = normalizeAppTheme(theme);
  container?.querySelector?.('.battle-shell')?.setAttribute?.('data-app-theme', current);
  container?.querySelectorAll?.('[data-app-theme-toggle]')?.forEach(button => {
    button.setAttribute('aria-pressed', String(current === 'custodes'));
    button.setAttribute('aria-label', 'Switch to ' + (current === 'custodes' ? 'Classic' : 'Custodes') + ' color theme');
    button.setAttribute('title', 'Switch to ' + (current === 'custodes' ? 'Classic' : 'Custodes') + ' color theme');
    button.textContent = 'Theme: ' + (current === 'custodes' ? 'Custodes' : 'Classic');
  });
  return current;
}
export function nextAppTheme(theme) {
  return normalizeAppTheme(theme) === 'custodes' ? 'classic' : 'custodes';
}
