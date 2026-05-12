/**
 * timer.js – Countdown timer UI and logic.
 * Supports custom minutes/seconds, start/pause/reset, a visual progress bar,
 * and a desktop notification when the timer finishes.
 */
import { getTimerPrefs, setTimerPrefs } from "../utils/storage.js";

// Helper to create an element
function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

export function initTimer() {
  console.log("initTimer called");
  const panel = document.getElementById("timer");
  if (!panel) return;

  // ----- UI -----
  const form = el("form", "timer-form");
  form.innerHTML = `
    <h2>Timer</h2>
    <div class="timer-presets">
      <button type="button" class="button preset-btn" data-mins="1" data-secs="0">1 min</button>
      <button type="button" class="button preset-btn" data-mins="5" data-secs="0">5 min</button>
      <button type="button" class="button preset-btn" data-mins="10" data-secs="0">10 min</button>
      <button type="button" class="button preset-btn" data-mins="25" data-secs="0">25 min</button>
    </div>
    <label>Minutes: <input type="number" min="0" value="0" class="input" id="timer-minutes"></label>
    <label>Seconds: <input type="number" min="0" max="59" value="0" class="input" id="timer-seconds"></label>
    <button type="submit" class="button">Start</button>
    <button type="button" class="button" id="timer-pause" disabled>Pause</button>
    <button type="button" class="button" id="timer-reset" disabled>Reset</button>
  `;
  panel.appendChild(form);

  // Digital countdown display
  const displayDiv = el("div", "timer-display");
  displayDiv.style.fontSize = "2rem";
  displayDiv.style.marginTop = "0.5rem";
  displayDiv.style.textAlign = "center";
  displayDiv.textContent = "00:00";
  panel.appendChild(displayDiv);

  const progressContainer = el("div", "progress-container");
  progressContainer.style.position = "relative";
  progressContainer.style.height = "1rem";
  progressContainer.style.background = "var(--color-border)";
  progressContainer.style.borderRadius = "4px";
  progressContainer.style.marginTop = "0.5rem";
  const progressBar = el("div", "progress-bar");
  progressBar.style.height = "100%";
  progressBar.style.width = "0%";
  progressBar.style.background = "var(--color-primary)";
  progressBar.style.borderRadius = "4px";
  progressContainer.appendChild(progressBar);
  panel.appendChild(progressContainer);

  // ----- State -----
  let totalMs = 0; // total duration set by user
  let remainingMs = 0;
  let intervalId = null;
  let endTimestamp = null;

  // Restore any saved timer prefs (optional)
  const saved = getTimerPrefs();
  if (saved && saved.remainingMs) {
    const now = Date.now();
    if (saved.endTimestamp && saved.endTimestamp > now) {
      remainingMs = saved.endTimestamp - now;
      totalMs = saved.totalMs;
      startTicking();
    }
  }

  // ----- Event handlers -----
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const mins = Math.max(
      0,
      Number(form.querySelector("#timer-minutes").value) || 0,
    );
    const secs = Math.max(
      0,
      Math.min(59, Number(form.querySelector("#timer-seconds").value) || 0),
    );
    totalMs = (mins * 60 + secs) * 1000;
    if (totalMs <= 0) return;
    remainingMs = totalMs;
    startTimer();
  });

  // Preset buttons
  form.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      form.querySelector("#timer-minutes").value = btn.dataset.mins;
      form.querySelector("#timer-seconds").value = btn.dataset.secs;
    });
  });

  const pauseBtn = form.querySelector("#timer-pause");
  const resetBtn = form.querySelector("#timer-reset");

  pauseBtn.addEventListener("click", () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      pauseBtn.textContent = "Resume";
    } else {
      // resume
      endTimestamp = Date.now() + remainingMs;
      startTicking();
      pauseBtn.textContent = "Pause";
    }
  });

  resetBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
    remainingMs = 0;
    updateUI(0);
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    form.querySelector("#timer-minutes").disabled = false;
    form.querySelector("#timer-seconds").disabled = false;
    pauseBtn.textContent = "Pause";
    setTimerPrefs({}); // clear saved prefs
  });

  // ----- Core timer logic -----
  function startTimer() {
    // Disable inputs while running
    form.querySelector("#timer-minutes").disabled = true;
    form.querySelector("#timer-seconds").disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    endTimestamp = Date.now() + remainingMs;
    startTicking();
  }

  function startTicking() {
    updateUI(remainingMs);
    intervalId = setInterval(() => {
      const now = Date.now();
      remainingMs = Math.max(0, endTimestamp - now);
      updateUI(remainingMs);
      setTimerPrefs({ totalMs, remainingMs, endTimestamp });
      if (remainingMs === 0) {
        clearInterval(intervalId);
        intervalId = null;
        finishTimer();
      }
    }, 200);
  }

  // Pause interval when tab is hidden, resume when visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    } else {
      // Only resume if timer was running (endTimestamp is set and time remains)
      if (endTimestamp && remainingMs > 0) {
        startTicking();
      }
    }
  });

  function updateUI(ms) {
    // Update digital display (mm:ss)
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const minsStr = String(mins).padStart(2, "0");
    const secsStr = String(secs).padStart(2, "0");
    displayDiv.textContent = `${minsStr}:${secsStr}`;

    const totalSec = Math.floor(totalMs / 1000);
    const curSec = Math.floor(ms / 1000);
    const percent = totalMs ? (curSec / totalSec) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  }

  function finishTimer() {
    // Notification API – request permission if not granted yet
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer finished", {
        body: "Your countdown timer has ended.",
      });
    } else {
      alert("Timer finished");
    }
    // Reset UI
    resetBtn.click();
  }
}
