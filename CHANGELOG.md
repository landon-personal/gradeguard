# Changelog

All notable changes to the GradeGuard desktop app are tracked here. The web app at [gradeguard.org](https://gradeguard.org) is built and deployed separately via Base44.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — 2026-04-27 (morning shift)

Pushed to `landon-personal/gradeguardnewsync` (branch `claude/peaceful-gates-0sykN`). Auto-syncs to gradeguard.org after merge.

### Added (web)
- **CalendarView** (`src/components/dashboard/CalendarView.jsx`) — monthly calendar grid on the Dashboard showing assignment due dates and test deadlines as color-coded dots (subject-hashed colors, red for tests). Click any day to see an inline list of what's due. Navigate months with prev/next arrows and a "Today" reset button. Only shows incomplete items so the calendar stays focused on planning.
- **FocusTimer** (`src/components/dashboard/FocusTimer.jsx`) — Pomodoro-style countdown timer on the Dashboard (web companion to the Electron tray timer). Presets: 25m Pomodoro, 45m Long session, 5m Break. Circular SVG progress ring, session counter, Start/Pause/Reset controls. Auto-suggests a break timer when a session ends.
- **ActivityHeatmap** (`src/components/gamification/ActivityHeatmap.jsx`) — GitHub-style contribution calendar on the Achievements page showing completed assignments over the last 13 weeks. Color-coded by completions per day; hover for date + count tooltip. Shows active-day count and best streak in the period.

### Fixed (web)
- **Dashboard `onFeedback`** — was wired to `() => {}` (no-op). Student mood/difficulty ratings were being saved to localStorage and read by `feedbackInstruction`, but the AI plan never actually regenerated after a rating. Now calls `generateAIPlan()` so feedback is applied immediately.
- **Dashboard `generateAIPlan`** — had try/finally but no catch, causing an unhandled promise rejection on LLM failure. Added catch block.
- **AnonymizationToggle `handleAnonymize`** — `setLoading(false)` was outside the finally block; added double-submit guard.
- **StudyAssistant `sendMessage`** — added double-submit guard.
- **StudyAssistant `handleFileAttach`** — wrapped UploadFile in try/catch/finally; moves `setUploadingFile(false)` to finally; shows error message in chat on failure.
- **SmartScanModal `handleFile` + `handleClarifySubmit`** — wrapped in try/catch/finally; `handleFile` resets to upload step with toast on error; `handleClarifySubmit` has double-submit guard.
- **MiniGames** — removed remaining `console.error` calls in all 3 games (trivia, memory match, TermGuesser); catch blocks now silently handle failures.
- **AssignmentForm + TestForm `handleAISuggest`** — wrapped in try/catch/finally with double-submit guard.
- **RoomView `handleStartQuiz` + `handleSubmit`** — added double-submit guards; wrapped in try/catch/finally. On submit error, resets `submitted` so the student can retry.
- **AssignmentAttachment `handleFileChange` + `handleRemove`** — wrapped in try/catch/finally with guards; toast on failure.
- **TodoItemCard `handleComplete`** — added double-submit guard + try/catch; resets `completing` on error.
- **StudyRooms `handleCreate` + `handleJoin`** — added guards + try/catch/finally.
- **Assignments `handleBulkCreate`** — wrapped loop in try/catch/finally; `queryClient.invalidateQueries` moved to finally so cache always refreshes.
- **Assignments `handleStatusChange`** — wrapped `awardPoints` in try/catch (non-critical; status change already succeeded).
- **Layout `handleDismissWhatsNew`** — wrapped profile update in try/catch (modal already dismissed, failure is non-critical).

### Security / CMS compliance (web)
Removed all remaining `console.error` calls that could expose student data or internal state to browser devtools:
- `StudyAssistant` — 4 calls removed
- `StudySchedule` — 1 call removed  
- `AIAssignmentChat` — 2 calls removed (including one that logged raw LLM output containing assignment names)
- `Onboarding` — 2 calls removed
- `MiniGames` — 3 calls removed
- `FlaggedMessagesPanel` — 1 call removed

---

## [Unreleased] — 2026-04-26 (evening shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Fixed (web) — recovery from repo migration
The web canonical was swapped earlier today from `base44dev/grade-guard` to `landon-personal/gradeguardnewsync`. The new repo was seeded from an older snapshot, so most of the prior shifts' "stuck on Loading…" / silent-failure fixes had to be re-applied.

- **Onboarding `saveProfile` + `handleSchoolCodeNext`** — re-ported try/catch/finally + double-submit guard + `saveError` UI under "Finish Setup". Without these, a transient error during the final onboarding step left the student stranded — same critical-path bug we fixed before.
- **StudyAssistant `generateFlashcards`, `generateQuiz`, post-quiz Socratic feedback, and the main chat `sendMessage`** — re-ported try/catch/finally with friendly fallback assistant messages. Each had been unwrapped, leaving the chat hung on a "Generating…" bubble if the LLM hiccupped.
- **StudySchedule `generateSchedule`** — re-ported the try/catch/finally + visible error-state UI with "Try again" button, plus double-submit guard. Was the highest-stakes regression because schedule generation auto-runs on data change.
- **Assignments / Tests / AdminDashboard CRUD mutations** — re-added `onError` toasts to all 9 useMutation calls (create/update/delete on each).
- **Friends `copyAssignmentMutation` + `copyTestMutation`** — re-added `onError` toasts.
- **MiniGames LightningRound + MemoryMatch** — re-wrapped LLM trivia/pair generation in try/catch/finally.
- **NotificationSettingsPanel `save`** — re-wrapped save in try/catch/finally with `toast.error` on failure.

### Fixed (web) — new for this shift
- **WeeklySummaryButton `handleSend`** — wrapped in try/catch/finally + double-submit guard; previously a network blip left the button stuck on "Generating & sending…" indefinitely.
- **SharedNoteComposer `handleFile` + `handleSave`** — same pattern; uploads and saves now surface failures via toast and clear loading state.
- **FlaggedMessagesPanel `handleBulkAction`** — bulk update loop swallowed errors silently and never cleared `bulkProcessing` if a single update threw. Now counts failures and reports them.
- **FlaggedMessagesPanel `updateMutation`** — added `onError` toast.
- **Achievements `toggleMutation`** — leaderboard opt-in/out toggle now reports failures.
- **StudentList `reassignMutation`** — admin student reassignment now reports failures.
- **AIAssignmentChat `send`** — wrapped LLM call AND the `JSON.parse` of the `ASSIGNMENTS_READY` payload. A malformed model response no longer crashes the parse and hangs the chat.

### Polish (web)
- **WeeklySummaryButton** — added a basic email shape check before submitting, so typos like "mom@gmail" get caught instantly instead of after a server round-trip.
- **Lint cleanup** — removed 30 unused imports across 18 files.

### Why
The repo migration silently regressed the web app to pre-fix state for almost every async handler in the codebase. With CMS school verification active, a single "stuck spinner" during a school admin's demo would be a poor first impression. Re-applied everything plus closed a few new gaps.

---

## [Unreleased] — 2026-04-26 (afternoon shift)

Pushed straight to the web app (`base44dev/grade-guard`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Fixed (web)
- **Onboarding `saveProfile`** — wrapped multi-await flow in try/catch/finally + double-submit guard + visible error message. Was the worst bug in the app for new sign-ups: a transient error during the final "Finish Setup" step left users stuck on the saving spinner forever, unable to complete onboarding. Particularly bad for school admins evaluating GradeGuard.
- **Onboarding `handleSchoolCodeNext`** — wrapped school-code lookup in try/catch with a clear error message. Previously, a failed lookup left the Next button silently unresponsive.
- **StudyAssistant `generateQuiz`** + post-quiz Socratic feedback + `sendMessage` (the main chat) — wrapped 3 more LLM call sites in try/catch/finally. The main chat one is the most critical since it's the central feature of the AI tutor.
- **Friends `copyAssignmentMutation`** + `copyTestMutation` — added `onError` handlers. Both "copy this from my friend" actions silently swallowed errors.
- **Assignments / Tests / AdminDashboard CRUD mutations** — added `onError` handlers to all 9 useMutation calls (create/update/delete on each). Previously, e.g. a failed delete left the item visible with no feedback.
- **MiniGames** — wrapped LLM-based question/pair/term generation in all 3 games (TestTrivia, MemoryMatch, VocabGuesser). Each was vulnerable to "stuck on Loading…" if the LLM call failed.
- **NotificationSettingsPanel `save`** — wrapped save in try/catch/finally + toast.error on failure. Previously, a failed save left the modal in the saving state with no feedback (and the user might assume their settings stuck).

### Why
Continued the pattern bug sweep. Every async API/LLM call without a try/catch is a "stuck on Loading…" or silent-failure waiting to happen. With CMS school verification looming, every silent fail is a school admin's first impression.

---

## [1.2.0] — 2026-04-26 — Welcome / Preferences window + web bug fixes

### Added (desktop)
- **Welcome window on first launch** (`electron/preferences.html` + `preferences.cjs`) — opens automatically the first time you run GradeGuard, explaining the menu-bar timer and keyboard shortcuts. This was a real discoverability gap in 1.1.0 — users had no way to know what desktop features existed.
- **Preferences window** — accessible via tray menu *Preferences…* (or `⌘,` on Mac). Lets you toggle "Open at login" without diving into System Settings.
- **First-launch flag** — written to `userData/.first-launch-shown` so the welcome only shows once.
- **`⌘,` shortcut** to open Preferences on Mac.
- **Cmd+Shift+F shortcut hint** added to the tray menu's "Start focus session" label (was missing).

### Fixed (web — pushed to base44dev/grade-guard, auto-syncs to gradeguard.org)
8 critical "stuck on Loading…" bugs across the AI flows. Pattern: an API/LLM call without `try/catch/finally` would leave the loading spinner spinning forever if the call failed. Fixed:
- `WeeklySummaryButton.handleSend` — share weekly summary via email
- `AnonymizationToggle.handleAnonymize` — admin anonymize-all-students action
- `StudySchedule.generateSchedule` — flagship AI study schedule generator (also added an error-state UI with a "Try again" button)
- `AIAssignmentChat.send` — chat-to-add-assignments flow (also handles malformed JSON from LLM gracefully)
- `StudyAssistant.generateFlashcards` — AI flashcard generator
- `AssignmentForm.handleAISuggest` — AI subject/difficulty/time suggestions on the new-assignment form
- `TestForm.handleAISuggest` — same on the new-test form
- `SmartScanModal.handleFile` + `handleClarifySubmit` — photo-scan-an-agenda OCR flow (also added a visible error message and falls back to upload step instead of getting stuck)

Each fix pairs the wrap with a double-submit guard (`if (loading) return`) so rapid clicking can't fire duplicate API calls.

### Changed (web)
- `TodaysFocusCard` now renders an "All caught up!" empty state with a CTA button when the user has no pending items. Previously returned `null`, which made the dashboard feel empty for new users.
- `TodaysFocusCard` is now clickable — tapping it navigates to `/Assignments` or `/Tests` depending on the focus item.
- Added `toast.error()` feedback on `AssignmentForm` and `TestForm` AI-suggest failures.
- Auto-fixed 30 unused-import lint errors across 17 files.

### Why
- **Welcome window:** new users were installing the desktop app, seeing the website inside a window, and having no clue about the menu-bar timer / focus mode / hotkeys. The Preferences window also surfaces the auto-launch toggle, which was previously buried in macOS System Settings.
- **Bug fixes:** every AI flow in the app was vulnerable to silent network failures leaving the UI hung. Particularly bad for the school verification push — a school admin tries the demo, the AI hiccups once, and the app appears broken.

---

## [1.1.0] — 2026-04-26 — Desktop study tools

First release with real desktop-only features. The previous releases were essentially the website in a window; this is the first one where downloading the app gives you something the website can't.

### Added
- **Menu-bar Pomodoro timer** (`electron/tray.cjs`) — system tray icon with 25/5/15/50 min presets. The countdown stays visible in the menu bar even when the main window is closed.
- **Focus session mode** (`electron/focus.cjs` + `focus.html`) — fullscreen distraction-free overlay with a giant timer. Triggered by `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows). Esc to exit.
- **Quick-add hotkey** (`electron/quickadd.cjs`) — `Cmd+Shift+G` / `Ctrl+Shift+G` from anywhere pops a small assignment-add window pointed at `gradeguard.org/Assignments`. Auto-closes on blur.
- **Native notifications** — desktop pings when timers finish.
- **Auto-launch on login** — `app.setLoginItemSettings({ openAtLogin: true })` in `electron/main.cjs`.

### Changed
- `electron/main.cjs` rewritten to wire up the tray, global shortcuts, focus IPC, app menu (Mac), and dock-tray persistence (window-all-closed no longer quits on macOS).
- Removed `dist/**/*` from `electron-builder` `files` array — we no longer bundle the React build (we load `gradeguard.org` directly), so installers shrunk by ~3 MB.
- Removed `vite build` from the `dist:*` scripts for the same reason — Electron build no longer depends on the React build.

### Why
Phase 1 of the "give people a real reason to install the desktop app" plan. The web app can't run a global hotkey, can't put a timer in the menu bar, can't fire OS notifications when closed, and can't auto-launch on login.

---

## [1.0.2] — 2026-04-26 — Fix Apple Silicon "damaged" error

### Fixed
- **macOS Apple Silicon Gatekeeper "damaged" warning.** Previously `mac.identity` was set to `null`, which skipped signing entirely. On arm64 Macs, *unsigned* code is rejected with the misleading "is damaged and can't be opened" message instead of the milder "unidentified developer" warning. Removed `identity: null` and added `CSC_IDENTITY_AUTO_DISCOVERY=false` to force ad-hoc signing.

### Why
Real downloaders couldn't open the app at all on M-series Macs. Ad-hoc signing produces the standard "unidentified developer" warning that users can bypass via System Settings → Privacy & Security → Open Anyway.

---

## [1.0.1] — 2026-04-26 — Fix login

### Fixed
- **Login "Network Error".** Previously Electron loaded the bundled React build from `file://`, which broke Base44's cookie-based auth (CORS + cookie scope rejected requests). Switched `electron/main.cjs` to `win.loadURL('https://gradeguard.org')` — the desktop app is now a window pointed at the live web app, like Slack/Discord/Linear desktop. Auth, cookies, and everything else just works.

### Removed
- The `isDev` / `loadFile` branch in `electron/main.cjs` — no longer needed.

### Why
The bundled-offline approach had too many auth/cookie/CORS friction points for a Base44-backed app. Loading the live URL is the standard pattern for SaaS desktop apps.

---

## [1.0.0] — 2026-04-26 — Initial desktop release

First desktop release. Mac DMG (Intel + Apple Silicon) and Windows NSIS installer.

### Added
- Electron wrapper around the GradeGuard React app.
- `electron/main.cjs` — main process, opens a 1280×800 window.
- `electron-builder` config in `package.json` — Mac dmg (x64+arm64), Windows nsis (x64+arm64).
- App icon (`build/icon.png`, upscaled from a 159×159 source to 1024×1024).
- `HashRouter` fallback for `file://` loads (later obsoleted by switching to `loadURL` in 1.0.1, but kept for safety).

### Why
Make GradeGuard installable as a real desktop app, not just a browser bookmark.
