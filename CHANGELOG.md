# Changelog

All notable changes to the GradeGuard desktop app are tracked here. The web app at [gradeguard.org](https://gradeguard.org) is built and deployed separately via Base44.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — 2026-04-26 (late-evening shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Fixed (web) — Dashboard
- **`generateAIPlan`** — wrapped the LLM call in try/catch (was try/finally only). On failure the error bubbled up uncaught, AI job polling kept ticking, and the empty state told the user to "tap refresh" while the refresh button was hidden until a `todoList` existed. Added `aiPlanError` state, a friendly toast, and a "Try again" button on the SmartTodoList empty/error path.
- **`handleCompleteFromTodo`** — applied an optimistic UI + react-query cache update, then `await secureEntity().update()` with no error handling. A failed save left the item visually completed but not persisted, so the next refresh resurrected it. Now snapshots prior state, reverts cache + plan + signatures on throw, and toasts. XP award is treated as non-fatal (assignment is already saved).

### Fixed (web) — re-ports of prior shifts that were lost in the snapshot
The new web canonical was seeded from a snapshot before several previous-shift fixes — re-applied:
- **`SmartScanModal.handleFile` + `handleClarifySubmit`** — re-ported try/catch on photo-of-an-agenda OCR flow, fall back to the upload step on scan failure with a visible red banner, and double-submit guard on the clarify button.
- **`AssignmentForm.handleAISuggest` + `TestForm.handleAISuggest`** — re-ported try/catch + double-submit guard. A failed call was leaving the AI Suggest button stuck on "..." forever.

### Fixed (web) — Study Rooms
- **`RoomView.handleStartQuiz`** — wrapped the LLM + secureEntity update in try/catch with a toast; added a `if (generating) return` guard. A network blip was leaving every member of the room staring at "Generating Quiz..." forever.
- **`RoomView.handleSubmit`** — wrapped the result-create + status-update awaits, added a `if (submitted) return` guard, and reverts the optimistic submitted=true on save failure so the user isn't stuck on a leaderboard with no entry.
- **Initial room load** — added `.catch()` toasts to the two top-of-mount `secureEntity().filter()` calls; previously they were silently swallowed leaving the spinner spinning.

### Fixed (web) — small reliability / clipboard
- **MoodCheckIn** — `JSON.parse` of localStorage was unguarded. A corrupt entry from an older build re-threw on every render. Wrapped in try/catch and clear the bad key.
- **FriendChatPanel cooldown timer** — `setTimeout` id was never captured, so unmount during cooldown leaked a state-after-unmount warning. Stored in a ref and cleared on unmount and re-arm.
- **FriendCodeCard `copyCode`** — fired `toast.success("Friend code copied!")` synchronously without awaiting `navigator.clipboard.writeText`. A denied or unavailable Clipboard API silently lied to the user. Now awaits, and toasts an error with a hint to long-press the code.
- **InviteLinkButton `handleInvite`** — same: `await navigator.clipboard.writeText(url)` had no catch in the fall-through path when `navigator.share` was absent. Now toasts on failure.
- **AdminDashboard `copyCode`** — same await + try/catch treatment for the school-code copy in the admin tools.
- **CMSCompliance `downloadDoc`** — try/finally with no catch swallowed a failed `generateCMSDocument` server call. Now toasts and guards a missing `file_url`.
- **CMSCompliance `copyText`** — same await + try/catch for the answer-snippet copy buttons.
- **Friends friend-code auto-assign** — the first-visit `secureEntity("StudentProfile").update` for assigning a friend code had no `.catch()` — a failed update left `friendCodeReady=false` forever, hiding the "Your friend code" card with no recovery short of reload. Now still flips `friendCodeReady` on error so the rest of the page renders.

### Fixed (web) — additional async hardening
- **StudyRooms `handleCreate` + `handleJoin` + invite-link auto-join effect + leave callback** — all four awaited base44/secureEntity calls without try/catch. Network blips were stranding users on "Creating..." or "Joining...", or trapping them in a study room they thought they'd left (the selectedRoomId reset only ran after a successful await). Now all wrapped + double-submit guards on create/join + leave always resets selectedRoomId in a finally.
- **MiniGames `TermGuesser`** — re-ported try/catch on the term-generation LLM call. LightningRound + MemoryMatch were already wrapped in the prior shift but TermGuesser was missed in the snapshot.
- **Assignments `handleStatusChange` (XP path)** — wrap awardPoints in try/catch so a transient XP-service failure doesn't crash the completion path. XP is non-fatal — the assignment is already marked completed by the mutation.
- **Assignments `handleBulkCreate`** — bulk create from SmartScan / chat could fail mid-loop, leaving partial data with no feedback. Now counts failures and toasts a clear "saved N of M" message.
- **AnonymizationToggle `handleAnonymize`** — moved `setLoading(false)` into a finally and added a double-submit guard (was previously unreachable if the catch block itself threw).
- **Dashboard + StudyAssistant `pollAiJob`** — wrapped the polling tick in try/catch. A transient poll error was producing an unhandled promise rejection AND silently stopping polling, leaving the user staring at a stuck progress bar even though the underlying job was still running on the server. Now retries with a slightly longer 1.5s delay.
- **NotificationSettingsPanel `requestPerm`** — explicit guard for browsers without the Notifications API and try/catch around `Notification.requestPermission`.
- **useNotifications `sendPush` + `checkAndNotify` last_checked write** — defensive try/catch around the Notification constructor (some embedded webviews accept the permission check but throw on construct) and the bookkeeping `secureEntity` update.

### Polish (web)
- **SmartTodoList** — the "Generated Xm ago" stamp on the dashboard's AI plan card was computed at render time and never re-rendered. Added a 60s tick so the relative time stays accurate without a full re-fetch.
- **Dashboard Refresh button** — added `aria-label` + `title` so the icon-only variant on small screens isn't a screen-reader dead spot.

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
