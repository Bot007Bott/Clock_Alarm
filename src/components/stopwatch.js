/**
 * stopwatch.js – Stopwatch UI and logic.
 * Uses performance.now() for high‑resolution timing, displays elapsed time,
 * provides lap functionality, and an export button to download laps as plain text.
 */

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

export function initStopwatch() {
  const panel = document.getElementById("stopwatch");
  if (!panel) return;

  const container = el("div", "stopwatch-container");
  container.innerHTML = `
      <h2>Stopwatch</h2>
      <div id="sw-display" style="font-size:2rem; margin:0.5rem 0;">00:00.00</div>
      <button class="button" id="sw-start">Start</button>
      <button class="button" id="sw-lap" disabled>Lap</button>
      <button class="button" id="sw-reset" disabled>Reset</button>
      <button class="button" id="sw-export" disabled>Export Laps</button>
      <ul id="sw-lap-list" style="margin-top:0.5rem; max-height:150px; overflow-y:auto;"></ul>
    `;
  panel.appendChild(container);

  const display = container.querySelector("#sw-display");
  const startBtn = container.querySelector("#sw-start");
  const lapBtn = container.querySelector("#sw-lap");
  const resetBtn = container.querySelector("#sw-reset");
  const exportBtn = container.querySelector("#sw-export");
  const lapList = container.querySelector("#sw-lap-list");

  let startTime = 0; // timestamp when started (performance.now())
  let elapsed = 0; // total elapsed ms when paused
  let intervalId = null;
  let laps = [];

  function format(ms) {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const hund = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(hund).padStart(2, "0")}`;
  }

  function updateDisplay() {
    const now = performance.now();
    const current = elapsed + (now - startTime);
    display.textContent = format(current);
  }

  function start() {
    startTime = performance.now();
    intervalId = setInterval(updateDisplay, 50);
    startBtn.textContent = "Pause";
    lapBtn.disabled = false;
    resetBtn.disabled = false;
    exportBtn.disabled = laps.length === 0;
  }

  function pause() {
    clearInterval(intervalId);
    intervalId = null;
    const now = performance.now();
    elapsed += now - startTime;
    startBtn.textContent = "Resume";
    lapBtn.disabled = true;
  }

  function reset() {
    clearInterval(intervalId);
    intervalId = null;
    elapsed = 0;
    startTime = 0;
    laps = [];
    display.textContent = "00:00.00";
    lapList.innerHTML = "";
    startBtn.textContent = "Start";
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    exportBtn.disabled = true;
  }

  function addLap() {
    const now = performance.now();
    const total = elapsed + (now - startTime);
    const lapTime = format(total);
    laps.push(lapTime);
    const lapNumber = laps.length;
    const li = el(
      "li",
      null,
      `<span style="opacity:0.5; margin-right:0.5rem;">Lap ${lapNumber}</span>${lapTime}`,
    );
    lapList.appendChild(li);
    exportBtn.disabled = false;
  }

  function exportLaps() {
    const content = laps.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laps.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  startBtn.addEventListener("click", () => {
    if (!intervalId) {
      // No active interval: either fresh start or resume after pause
      if (elapsed === 0) {
        // Fresh start
        start();
      } else {
        // Resume after pause
        start();
      }
    } else {
      // Currently running – pause it
      pause();
    }
  });

  lapBtn.addEventListener("click", addLap);
  resetBtn.addEventListener("click", reset);
  exportBtn.addEventListener("click", exportLaps);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    } else {
      // Only resume if stopwatch was running (startTime is set)
      if (startTime && elapsed >= 0 && !intervalId) {
        startTime = performance.now();
        intervalId = setInterval(updateDisplay, 50);
      }
    }
  });
}
