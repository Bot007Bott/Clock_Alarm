/**
 * storage.js – wraps localStorage for the Clock Suite.
 * All data is stored under a single top‑level key "clockSuite" to avoid clutter.
 */

const STORAGE_KEY = 'clockSuite';

function loadRoot() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse storage JSON', e);
    return {};
  }
}

function saveRoot(root) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch (e) {
    console.error('Failed to write storage JSON', e);
  }
}

// Alarms – array of {id, time (ISO string), label, sound, enabled, snoozedUntil?}
export function getAlarms() {
  const root = loadRoot();
  return root.alarms || [];
}
export function setAlarms(alarms) {
  const root = loadRoot();
  root.alarms = alarms;
  saveRoot(root);
}

// Timer preferences – mostly for preset durations (optional)
export function getTimerPrefs() {
  const root = loadRoot();
  return root.timerPrefs || {};
}
export function setTimerPrefs(prefs) {
  const root = loadRoot();
  root.timerPrefs = prefs;
  saveRoot(root);
}

// General settings – theme override, sound enable flag, etc.
export function getSettings() {
  const root = loadRoot();
  return root.settings || {};
}
export function setSettings(settings) {
  const root = loadRoot();
  root.settings = settings;
  saveRoot(root);
}
