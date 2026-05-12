/**
 * settings.js – Settings UI and logic.
 * Allows manual theme toggle, displays current theme, and provides export/import of all stored data.
 */
import { getSettings, setSettings } from "../utils/storage.js";
import { getAlarms, setAlarms } from "../utils/storage.js";
import { getTimerPrefs, setTimerPrefs } from "../utils/storage.js";

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

export function initSettings() {
  const panel = document.getElementById("settings");
  if (!panel) return;

  const container = el("div", "settings-container");
  container.innerHTML = `
      <h2>Settings</h2>
      <label>
        <input type="checkbox" id="theme-toggle"> Dark mode (manual)
      </label>
      <br/>
      <button class="button" id="export-data">Export JSON</button>
      <input type="file" id="import-file" style="display:none" accept="application/json" />
      <button class="button" id="import-data">Import JSON</button>
    `;
  panel.appendChild(container);

  const themeToggle = container.querySelector("#theme-toggle");
  const exportBtn = container.querySelector("#export-data");
  const importBtn = container.querySelector("#import-data");
  const importInput = container.querySelector("#import-file");

  // Initialize theme toggle based on current body class
  const isDark = document.body.classList.contains("dark");
  themeToggle.checked = isDark;

  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    // Persist manual override in settings
    const settings = getSettings();
    settings.manualDark = themeToggle.checked;
    setSettings(settings);
  });

  // Export all stored data as JSON
  exportBtn.addEventListener("click", () => {
    const data = {
      alarms: getAlarms(),
      timerPrefs: getTimerPrefs(),
      settings: getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clock-suite-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON file
  importBtn.addEventListener("click", () => {
    importInput.value = "";
    importInput.click();
  });

  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.alarms)) setAlarms(parsed.alarms);
        if (parsed.timerPrefs && typeof parsed.timerPrefs === "object")
          setTimerPrefs(parsed.timerPrefs);
        if (parsed.settings && typeof parsed.settings === "object")
          setSettings(parsed.settings);
        // Apply manual dark mode if present
        if (
          parsed.settings &&
          typeof parsed.settings.manualDark === "boolean"
        ) {
          if (parsed.settings.manualDark) {
            document.body.classList.add("dark");
          } else {
            document.body.classList.remove("dark");
          }
          themeToggle.checked = parsed.settings.manualDark;
        }
        alert("Import successful.");
        window.location.reload();
      } catch (err) {
        alert("Failed to import JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  });
}
