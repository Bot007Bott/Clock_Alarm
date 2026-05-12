// Entry point for Clock Suite
import { startClock } from "./utils/time.js";
import { initTabs } from "./utils/tab.js";
import { initAlarm } from "./components/alarm.js";
import { initTimer } from "./components/timer.js";
import { initStopwatch } from "./components/stopwatch.js";
import { initSettings } from "./components/settings.js";

// Initialize current time display (Phnom Penh)
startClock();
// Initialize tab navigation
initTabs();
// Initialize each component safely – a failure in one should not block the others
try {
  initAlarm();
} catch (e) {
  console.error("Alarm init error:", e);
}
try {
  initTimer();
} catch (e) {
  console.error("Timer init error:", e);
}
try {
  initStopwatch();
} catch (e) {
  console.error("Stopwatch init error:", e);
}
try {
  initSettings();
} catch (e) {
  console.error("Settings init error:", e);
}
