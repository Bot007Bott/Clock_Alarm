/**
 * alarm.js – Alarm UI and logic.
 * Uses storage.js for persistence and the Audio API for playback.
 */
import { getAlarms, setAlarms } from "../utils/storage.js";

// Simple list of built‑in sound files (add more in src/assets/sounds/)
const DEFAULT_SOUNDS = [{ label: "Beep" }, { label: "Chime" }];

// Helper: create a DOM element with optional class and innerHTML
function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

// Render the alarm panel UI and wire events
export function initAlarm() {
  const panel = document.getElementById("alarm");
  if (!panel) {
    console.warn("Alarm panel not found");
    return;
  }
  console.log("initAlarm called");
  const scheduledMap = new Map();

  // ----- Form for adding a new alarm -----
  const form = el("form", "alarm-form");
  form.innerHTML = `
    <h2>Set Alarm</h2>
    <div class="form-group">
      <label>Time</label>
      <input type="time" step="60" required class="input" id="alarm-time">
    </div>
    <div class="form-group">
      <label>Label</label>
      <input type="text" placeholder="Optional" class="input" id="alarm-label">
    </div>
    <div class="form-group">
      <label>Sound</label>
      <select class="input" id="alarm-sound">${DEFAULT_SOUNDS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("")}</select>
    </div>
    <div class="form-group form-group--inline">
      <label>Enable</label>
      <input type="checkbox" id="alarm-enabled" checked>
    </div>
    <div class="form-group">
      <label>Repeat</label>
      <select class="input" id="alarm-repeat">
        <option value="once">Once</option>
        <option value="daily">Daily</option>
      </select>
    </div>
    <button type="submit" class="button">Add Alarm</button>
  `;
  panel.appendChild(form);

  // ----- Container for existing alarms -----
  const listContainer = el("div", "alarm-list");
  panel.appendChild(listContainer);

  // Load alarms from storage and start scheduling
  let alarms = getAlarms();
  scheduleAllAlarms();
  renderList();

  // Form submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const timeInput = form.querySelector("#alarm-time");
    const labelInput = form.querySelector("#alarm-label");
    const soundSelect = form.querySelector("#alarm-sound");
    const enabledCheckbox = form.querySelector("#alarm-enabled");

    const time = timeInput.value; // "HH:MM"
    if (!time) return;
    const [hour, minute] = time.split(":").map(Number);
    const now = new Date();
    const alarmDate = new Date(now);
    alarmDate.setHours(hour, minute, 0, 0);
    // If the time has already passed today, schedule for tomorrow
    if (alarmDate <= now) alarmDate.setDate(alarmDate.getDate() + 1);

    const soundIdx = Math.min(
      Number(soundSelect.value),
      DEFAULT_SOUNDS.length - 1,
    );
    const repeatSelect = form.querySelector("#alarm-repeat");
    const newAlarm = {
      id: crypto.randomUUID(),
      timestamp: alarmDate.getTime(),
      label: labelInput.value.trim(),
      soundIndex: soundIdx,
      enabled: enabledCheckbox.checked,
      repeat: repeatSelect.value,
    };
    alarms.push(newAlarm);
    setAlarms(alarms);
    scheduleAlarm(newAlarm);
    renderList();
    form.reset();
    // reset enable checkbox to true after reset
    form.querySelector("#alarm-enabled").checked = true;
  });

  // ----- Render alarm list -----
  function renderList() {
    listContainer.innerHTML = "";
    if (alarms.length === 0) {
      listContainer.appendChild(el("p", null, "No alarms set."));
      return;
    }
    const ul = el("ul");
    alarms.forEach((a) => {
      const li = el("li");
      const timeStr = new Date(a.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Phnom_Penh",
      });
      li.innerHTML = `
        <div class="alarm-card">
          <div class="alarm-card-info">
            <span class="alarm-card-time">${timeStr}</span>
            <span class="alarm-card-label">${a.label ? a.label + " · " : ""}${a.repeat === "daily" ? "🔁 Daily" : "🔂 Once"}</span>
          </div>
          <div class="alarm-card-actions">
            <button class="button" data-id="${a.id}" data-action="toggle">${a.enabled ? "Disable" : "Enable"}</button>
            <button class="button" data-id="${a.id}" data-action="delete">Delete</button>
            ${a.enabled ? `<button class="button" data-id="${a.id}" data-action="snooze">Snooze 5m</button>` : ""}
          </div>
        </div>
      `;
      ul.appendChild(li);
    });
    listContainer.appendChild(ul);

    // Attach listeners for toggle, delete, snooze
    listContainer.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const alarm = alarms.find((x) => x.id === id);
        if (!alarm) return;
        if (action === "toggle") {
          alarm.enabled = !alarm.enabled;
          setAlarms(alarms);
          if (alarm.enabled) scheduleAlarm(alarm);
        } else if (action === "delete") {
          // Cancel any pending timeout
          if (alarm._timeoutId) clearTimeout(alarm._timeoutId);
          alarms = alarms.filter((x) => x.id !== id);
          setAlarms(alarms);
          scheduledMap.delete(id); // remove from map so it doesn't stay in memory
        } else if (action === "snooze") {
          snoozeAlarm(alarm);
        }
        renderList();
      });
    });
  }

  // ----- Scheduling helpers -----
  function scheduleAlarm(alarm) {
    if (!alarm.enabled) return;
    // Clear previous schedule if any
    if (scheduledMap.has(alarm.id)) clearTimeout(scheduledMap.get(alarm.id));
    const now = Date.now();
    const delay = alarm.timestamp - now;
    if (delay <= 0) {
      // If for some reason the time is past, fire immediately and reschedule next day
      triggerAlarm(alarm);
      return;
    }
    const timeoutId = setTimeout(() => triggerAlarm(alarm), delay);
    scheduledMap.set(alarm.id, timeoutId);
    alarm._timeoutId = timeoutId; // store on object for reference on delete
  }

  function scheduleAllAlarms() {
    alarms.forEach(scheduleAlarm);
  }

  function triggerAlarm(alarm) {
    // Play sound
    const soundInfo = DEFAULT_SOUNDS[alarm.soundIndex] || DEFAULT_SOUNDS[0];
    function playBeep(freq = 880) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.3;
      if (audioCtx.state === "suspended") audioCtx.resume();
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        audioCtx.currentTime + 1,
      );
      oscillator.stop(audioCtx.currentTime + 1.1);
      oscillator.onended = () => audioCtx.close();
    }
    if (soundInfo.label === "Beep") playBeep();
    else if (soundInfo.label === "Chime") playBeep(440);

    // Show toast
    const toast = el("div", "alarm-toast");
    toast.innerHTML = `
    <span>⏰ ${alarm.label || "Alarm"} – ${new Date(alarm.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Phnom_Penh" })}</span>
    <div style="display:flex; gap:0.5rem;">
      <button class="button" id="toast-snooze">Snooze 5m</button>
      <button class="button" id="toast-dismiss">Dismiss</button>
    </div>
  `;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add("show"));

    function closeToast() {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }

    toast.querySelector("#toast-snooze").addEventListener("click", () => {
      snoozeAlarm(alarm);
      closeToast();
    });

    toast.querySelector("#toast-dismiss").addEventListener("click", () => {
      if (alarm.repeat === "daily") {
        // reschedule for tomorrow
        alarm.timestamp += 24 * 60 * 60 * 1000;
        alarm.enabled = true;
        scheduleAlarm(alarm);
      } else {
        alarm.enabled = false;
      }
      setAlarms(alarms);
      renderList();
      closeToast();
    });

    // Auto-dismiss after 60 seconds if user ignores it
    setTimeout(() => {
      if (document.body.contains(toast)) {
        if (alarm.repeat === "daily") {
          alarm.timestamp += 24 * 60 * 60 * 1000;
          alarm.enabled = true;
          scheduleAlarm(alarm);
        } else {
          alarm.enabled = false;
        }
        setAlarms(alarms);
        renderList();
        closeToast();
      }
    }, 60000);
  }

  function snoozeAlarm(alarm) {
    const now = Date.now();
    const newTime = now + 5 * 60 * 1000; // 5 minutes
    alarm.timestamp = newTime;
    alarm.enabled = true;
    setAlarms(alarms);
    scheduleAlarm(alarm);
    renderList();
  }
}
