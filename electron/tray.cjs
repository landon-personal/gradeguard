const { Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');

const PRESETS = [
  { label: 'Pomodoro (25 min)', minutes: 25 },
  { label: 'Short break (5 min)', minutes: 5 },
  { label: 'Long break (15 min)', minutes: 15 },
  { label: 'Deep work (50 min)', minutes: 50 },
];

let tray = null;
let timer = null;
let secondsLeft = 0;
let totalSeconds = 0;
let presetLabel = '';
let isPaused = false;

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function notify(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
}

function startTimer(minutes, label) {
  stopTimer();
  totalSeconds = minutes * 60;
  secondsLeft = totalSeconds;
  presetLabel = label;
  isPaused = false;
  tick();
  timer = setInterval(() => {
    if (!isPaused) {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        finishTimer();
      } else {
        tick();
      }
    }
  }, 1000);
  buildMenu();
}

function pauseTimer() {
  isPaused = !isPaused;
  buildMenu();
  tick();
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  secondsLeft = 0;
  totalSeconds = 0;
  presetLabel = '';
  isPaused = false;
  if (tray) tray.setTitle('');
  buildMenu();
}

function finishTimer() {
  const finishedLabel = presetLabel;
  stopTimer();
  notify('GradeGuard timer done', `${finishedLabel} finished. Nice work!`);
}

function tick() {
  if (!tray) return;
  if (totalSeconds === 0) {
    tray.setTitle('');
    return;
  }
  const text = isPaused ? `⏸ ${formatTime(secondsLeft)}` : `⏱ ${formatTime(secondsLeft)}`;
  tray.setTitle(text);
}

function buildMenu({ openMain, openQuickAdd, openFocus, openPreferences, quit } = lastHandlers) {
  lastHandlers = { openMain, openQuickAdd, openFocus, openPreferences, quit };
  const running = totalSeconds > 0;
  const items = [
    { label: 'Open GradeGuard', click: () => openMain && openMain() },
    { label: 'Quick add assignment  (⌘⇧G)', click: () => openQuickAdd && openQuickAdd() },
    { label: 'Start focus session  (⌘⇧F)', click: () => openFocus && openFocus() },
    { type: 'separator' },
    { label: 'Study timer', enabled: false },
    ...PRESETS.map((p) => ({
      label: p.label,
      click: () => startTimer(p.minutes, p.label),
    })),
  ];
  if (running) {
    items.push(
      { type: 'separator' },
      { label: `Running: ${presetLabel}`, enabled: false },
      { label: isPaused ? 'Resume' : 'Pause', click: pauseTimer },
      { label: 'Stop timer', click: stopTimer },
    );
  }
  items.push(
    { type: 'separator' },
    { label: 'Preferences…', click: () => openPreferences && openPreferences() },
    { label: 'Quit GradeGuard', click: () => quit && quit() },
  );
  tray.setContextMenu(Menu.buildFromTemplate(items));
}

let lastHandlers = {};

function createTray(handlers) {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip('GradeGuard — study timer');
  buildMenu(handlers);
  return tray;
}

module.exports = { createTray };
