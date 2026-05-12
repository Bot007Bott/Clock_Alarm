/**
 * time.js – helpers for displaying the current time in Phnom Penh (GMT+7)
 */

// Update the #current-time element every second
import { getSettings, setSettings } from "./storage.js";

export function startClock() {
  const timeEl = document.getElementById('current-time');
  if (!timeEl) return;

  const update = () => {
    const now = new Date();
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Phnom_Penh',
    };
    timeEl.textContent = now.toLocaleTimeString('en-US', options);

    // Determine theme: manual override takes precedence
    const settings = getSettings();
    if (settings && typeof settings.manualDark === 'boolean') {
      // Manual mode: apply stored preference
      if (settings.manualDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      // Do not auto‑switch when manual override is set
      return;
    }

    // Automatic night‑mode after 20:00 Phnom Penh time
    const hour = now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Phnom_Penh' });
    if (parseInt(hour, 10) >= 20) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  update();
  setInterval(update, 1000);
}
