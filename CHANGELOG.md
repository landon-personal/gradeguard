# Changelog

All notable changes to the GradeGuard desktop app are tracked here. The web app at [gradeguard.org](https://gradeguard.org) is built and deployed separately via Base44.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — 2026-04-29 (early shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Daily Goals card on the Dashboard 🎯

- **`src/components/dashboard/DailyGoalsCard.jsx`** + slotted into the Dashboard secondary row alongside Mood + Today's Focus (which becomes a 3-up grid on `lg+` screens).
  - Up to **3 personal daily goals** the student writes themselves — short text like "Read 20 minutes" or "Plan tomorrow." First-run shows 6 quick-pick suggestions (Read 20 minutes, Review flashcards, Plan tomorrow, 30 min focus session, No phone in bed, Stretch 5 minutes) plus a free-text input.
  - **7-day check-off strip** under each goal — today is interactive (tap to toggle done), the prior 6 days render read-only so the streak history stays honest.
  - **Per-goal streak counter** — once a goal hits a 2-day streak it gets a 🔥 Nd badge.
  - Tap a goal's text to edit it inline (Enter saves, Escape cancels, empty save deletes). Pencil icon on hover for discoverability.
  - Persisted to `localStorage` under `gg_daily_goals_<email>`. **Zero PII to the server**, history pruned to 90 days, quota / Safari-private-mode throws swallowed silently.
  - **Why:** complements the AI study plan (which tells students what to do for assignments / tests today) with a personal-habit layer that doesn't overlap. The AI plan is *reactive* to coursework; Daily Goals is *proactive*. Habit-formation feedback at a glance — "I'm 5 days into my 'review flashcards' streak" — is the right sister surface to the existing 12-week study heatmap shipped last shift.

### Added (web) — Background-tab notification when a focus session ends 🔔

- **`src/pages/FocusTimer.jsx`** — fires a native `Notification("Focus session complete", ...)` when a focus or break timer finishes AND the tab is hidden. Closes the loop on the chime that gets silenced when the tab is muted by the browser. Only triggers if `Notification.permission === "granted"` — the timer never *requests* permission itself, so the existing onboarding / `NotificationSettingsPanel` flow stays the single permission prompt point. Feature-detected against `"Notification" in window`, so Safari iOS / embedded webviews fail silently. Tagged `gg-focus-timer` so a second session doesn't stack a duplicate notification.
- **Why:** a real complaint pattern — students switch tabs to look something up, the timer expires, the tab title and chime are easy to miss, and the break / next-session never starts.

### Fixed (web) — unmount + skeleton-forever cleanups

- **`AIAssignmentChat.jsx`** — the 800 ms `setTimeout` after `ASSIGNMENTS_READY` (which calls `onAssignmentsFound` + `onClose`) had no ref / cleanup. If the modal unmounted during that window, the timer still ran the parent callback on a dead handle. Now stored in a `readyTimerRef`, plus a `mountedRef` short-circuit, plus a cleanup effect that clears the timer and calls `recognitionRef.current?.stop()` if the user closed mid-dictation.
- **`WeeklySummaryButton.jsx`** — the 2.5 s "Summary sent!" auto-close `setTimeout` had no ref / cleanup. Closing the modal manually before it elapsed and re-opening would still trigger a delayed `setRecipientEmail("")` + `setRecipientName("")` on the new instance. Stored in a `closeTimerRef`, cleared by both the new `closeModal` helper and an unmount cleanup.
- **`Achievements.jsx`** — gated the page on `(!profile || !stats)`, so a brand-new account with no `GamificationStats` record yet (it's seeded server-side on the first XP award) was stuck on the loading skeleton forever — visible after sign-up, completely opaque. Now distinguishes `statsLoading` from no-record-yet and renders a real empty state with a "Earn your first badge" nudge: a friendly copy block with the same gradient hero so the page never silently disappears.

### Hygiene (web)

- **8 stale unused imports cleaned up** via `npm run lint:fix` — `Layout.jsx` (`setLowPerformanceOverride`), `FloatingStreakCounter.jsx` (`startOfDay`), `NotificationPermission.jsx` (`toast`), `Dashboard.jsx` (`Timer`, `Play`, `DeadlineCalendar`), `StudyAssistant.jsx` (`VocabQuizFromNotes`), `StudyRooms.jsx` (`toast`). Pure linter cleanup, no behavior change.

### Why
The headline ship is the Daily Goals card. The two prior shifts shipped the Focus Timer (afternoon) and the Study History Insights (evening); a personal-goal layer is the natural third leg of that trio — habit formation over a longer horizon than the Pomodoro and a more intimate one than the AI plan. The background-tab notification + Achievements empty-state fix are both items called out in prior shift reports as outstanding follow-ups.

---

## [Unreleased] — 2026-04-28 (evening shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Study history insights for the Focus Timer 📈

- **`src/components/dashboard/StudyHistoryInsights.jsx`** + integrated into `src/pages/FocusTimer.jsx` below today's stats.
  - **12-week activity heatmap** — a GitHub-style 12 × 7 grid where each cell is a day, colored by the minutes studied (5 buckets: 0 / 1–15 / 16–30 / 31–60 / 60+). Hover any cell for the date + minutes. Month labels above the columns, weekday hints down the side, and a Less → More legend strip below.
  - **Three mini stats** below the grid: the student's current streak (consecutive days with at least one logged minute, with a 🔥 once it's ≥ 3), active days out of 84, and the best day in the past 12 weeks (e.g. "1h 45m · Apr 21").
  - **Top subjects · last 30 days** — horizontal bars showing the 5 subjects the student has spent the most minutes on, with session count and total time. If the student has never tagged a subject we surface a hint so they know subjects are even a thing they can fill in.
  - **Empty state** for first-time users — until the first focus session is logged, the panel shows a friendly "your grid will start filling in here" placeholder instead of a blank space.
  - All sourced from the existing `gg_focus_sessions` localStorage. **Zero new network, zero new storage, no PII.** Subjects stay on-device — the hint text reaffirms it.
  - **Why:** the existing 7-day mini bar chart told a student about their week. This is the longer arc — "I studied at all on 41 of the last 84 days, and I'm a 5-day streak in" is the kind of feedback that drives habit formation. It's the visual reflection layer the Focus Timer needed and a natural sister panel to the Pomodoro itself. The subject breakdown also closes a loop: subjects students were already typing into the timer now feed back into a meaningful summary.

### Fixed (web) — re-ports of prior shifts that regressed in the migration

- **`Dashboard.handleCompleteFromTodo`** — the optimistic-revert pattern from a prior shift was lost. The function applied an optimistic UI update across `setTodoList`, sessionStorage, and both `queryClient.setQueryData` caches, then awaited `secureEntity().update()` with NO try/catch. A failed save left the item visually completed but not persisted — the next refresh would resurrect it. Re-ported: snapshots prior state across all 6 surfaces (todoList, both react-query caches, the `prevSignatureRef`, and both sessionStorage entries), wraps the update in try/catch, reverts everything on throw, and toasts. XP award stays non-fatal — caught separately and logged.
- **`Dashboard.generateAIPlan`** — was back to try/finally only after the migration. A failed LLM call would bubble up uncaught, leave AIJob polling running (`stopAiJobPolling` never called on error), and show the user the empty "tap refresh" state with no error indicator and no refresh button visible until a `todoList` existed. Re-ported: catch sets `aiPlanError`, toasts, stops polling. Threaded `error` + `onRetry` props into `SmartTodoList`; its empty state now shows the error message + a Try-again button. Also guarded the success-path sessionStorage writes so a quota throw can't masquerade as an LLM failure.

### Fixed (web) — new for this shift

- **`Assignments.handleBulkCreate`** — the sequential `for/await` loop that created multiple parsed assignments (called from `SmartScanModal` and `AIAssignmentChat`) had NO try/catch. A single failed create — network blip, validation throw on one item — would bail the loop and silently lose every parsed assignment that came after, with no toast. Switched to `Promise.allSettled` and a status toast: full success, partial success ("3 of 5 saved"), or full failure. **Why:** SmartScan and AI Chat both intentionally produce batches — one bad item shouldn't punish the rest.
- **`Assignments.handleStatusChange`** — `await awardPoints(...)` was unguarded; if gamification threw, the error bubbled out of the click handler even though the assignment had already been saved by the mutation above. Wrapped in try/catch (XP/badges are non-fatal). Also guarded the `nudge_shown` `localStorage.getItem`/`setItem` against private-mode / quota throws.
- **`Dashboard.jsx` (`StudySchedule.jsx`)** — when a previous schedule was on screen and a Refresh / adjustment failed, the catch wrote `error` state but the error UI only rendered in the empty-state branch — so the failure was completely silent if the student had a schedule already. Added an inline error banner above the schedule with a Retry button. Also guarded `schedule.blocks.map` with `(... || [])` so a malformed LLM response can't crash the panel.
- **`SmartTodoList.jsx`** — the daily feedback `localStorage.getItem`/`setItem` for the "How's this plan?" bar were unguarded. Safari private mode / sandboxed iframes throw on access, which would crash the whole Dashboard render because this runs at component init. Wrapped reads in a helper, swallowed quota/private errors on the write.
- **`MoodCheckIn.jsx`** — the earlier fix wrapped `JSON.parse` in try/catch but the `localStorage.getItem` ABOVE it was still unguarded — Safari private mode raises SecurityError on the access itself. Wrapped the read so the effect bails cleanly instead of React silently swallowing the rejection (and the user's mood never restoring even when their saved entry is fine). Also wrapped the corrupt-entry `removeItem` in its own try/catch.
- **`usePerformanceMode.js` + `PerformanceToggle.jsx`** — `readOverride()` runs inside `useState`'s lazy initializer for the performance-mode hook, which means it executes during the very first render of the whole app via `Layout`. An uncaught localStorage throw would crash the initial mount with a blank screen on Safari private mode / locked-down school Chromebooks. Wrapped both reads (the hook's and the toggle's local copy) and the `setLowPerformanceOverride` writes; the change event still fires so in-memory subscribers stay in sync.

### Why
The headline ship is the Study History Insights — it turns the Focus Timer from "a Pomodoro tool" into "a Pomodoro tool that gives a student a visceral sense of their own consistency over the past three months." The bug fixes are a mix of two regressions surfaced from the repo migration (handleCompleteFromTodo + generateAIPlan, both previously fixed) and several new hardening passes around localStorage — Safari private mode and locked-down school Chromebooks were one access call away from crashing initial app mount, which would have looked like a totally inscrutable blank screen during a CMS demo.

---

## [Unreleased] — 2026-04-28 (afternoon shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Focus Timer ⏱️

- **`src/pages/FocusTimer.jsx`** — a brand-new dedicated page (route `/FocusTimer`) for Pomodoro-style focus sessions. Big SVG progress ring with mm:ss readout that updates `document.title` so it stays useful in a backgrounded tab. Focus and break modes with presets (15/25/45/50 min focus; 5/10/15 min break) plus 5–90 / 1–30 min sliders for custom durations. Auto-arms a break after a finished focus session so the next click is just "play."
- **Subject tagging:** optional free-text "What are you focusing on?" field (60 chars max). Stays on-device — never sent to the server. Pre-fillable via `?subject=...` query string.
- **Stats:** today's session count + total minutes, and a 7-day mini bar chart. All session history (date, minutes, subject) is stored in `localStorage` under `gg_focus_sessions`, capped at 60 days for storage hygiene. Today's log is browseable inline with a one-click clear.
- **Audio:** completion chime is generated in-browser via the Web Audio API (no asset, no network). Mute toggle, persisted in `gg_focus_prefs` along with last-used durations.
- **Discoverability:** new "Focus Timer" entry in the desktop nav overflow + mobile menu (with `Timer` icon); a tile in the StudyAssistant's "🛠 STUDY TOOLS" section; a chip in `SuggestionChips`; and a "Start a focus session on this →" deep-link on `TodaysFocusCard` that pre-fills the subject with the most-urgent assignment/test name.
- **Why:** Pomodoro is the technique the StudyAssistant has been *recommending* for months without giving students a way to actually do it. This is the missing first-party tool. Subject tagging means a student who studies 4×25 min on bio over the week can see that visually. All on-device, no PII, fits the CMS verification posture cleanly. Sister addition to last shift's Flashcards-from-notes tool — both ship at the same altitude (real student-facing tool, not a bug-fix).
- **Skip behavior:** the original draft logged a full session whenever Skip was pressed mid-run, which would have inflated today's totals with fake sessions. Now Skip ends the run without logging — sessions only land in the log if the timer naturally hits zero.

### Fixed (web)

- **`src/components/dashboard/MoodCheckIn.jsx`** — `JSON.parse` of `localStorage` was unguarded. A corrupt entry from an older build re-threw on every render and the whole dashboard card blank-screened. This had been fixed in a prior shift and regressed in the repo migration. Re-ported: try/catch with bad-key cleanup, plus a try/catch around `setItem` so private-mode / quota-exceeded doesn't crash the click handler. **Why:** the card is on every dashboard render — one bad localStorage write was load-bearing for the whole page.
- **`src/components/assignments/AssignmentAttachment.jsx`** — `handleFileChange` had `setUploading(true) → await UploadFile → await Assignment.update → setUploading(false)` with NO try/catch/finally. A failed upload (network blip, oversized file, server error) left the "Uploading…" state and the disabled button stuck forever — only a page reload recovered it. Same problem on `handleRemove`: silent failure with no toast. Now both wrap in try/catch/finally with sonner toasts and a `removing` state for the X button (with a spinner). Added a `disabled={removing}` so a double-tap can't double-fire the delete. **Why:** attachment is one of the most-clicked features after assignment-create — silent failures here are deeply confusing.
- **`src/components/assignments/AssignmentForm.jsx` + `src/components/tests/TestForm.jsx` — `handleAISuggest`** — both lost the try/catch + double-submit guard from prior shifts in the repo migration. A failed `InvokeLLM` would just throw out, leaving the AI Suggest button stuck on "..." forever and disabled. Now wrap in try/catch/finally with a toast + `if (aiLoading) return` guard. **Why:** another regression of a previously-shipped fix.
- **`src/components/assignments/SmartScanModal.jsx` — `handleFile` + `handleClarifySubmit`** — both lost their try/catch in the migration. The photo-of-an-agenda OCR flow would leave a student stuck on the "Reading your planner..." progress bar with no way out if the upload or LLM call failed. The clarifying flow would freeze with `loadingClarify=true` forever. Re-ported: `handleFile` falls back to the upload step on error and surfaces a red banner with the message; `handleClarifySubmit` toasts and resets. **Why:** SmartScan is the showcase onboarding flow for first-time users — if it dies silently, students give up on the app.
- **`src/components/assistant/FlashcardViewer.jsx` — `handleExport`** — used the raw `testName` (or, for Flashcards-from-notes, the user-typed deck title) directly as a filename. A title like "Bio / Ch.4" or "Gov: Unit 3" would either fail to download or, on some browsers, attempt to traverse a path. Sanitize against the OS-reserved set `[\\/:*?"<>|]` and clamp to 60 chars; fall back to "deck" if the name is empty. **Why:** the export is the only way to take a deck offline — it shouldn't choke on a punctuation character.

### Why
The Focus Timer is the headline ship — it gives students an actual tool for the technique the AI has been recommending all along, with stats that actually motivate (the 7-day bar chart is the addictive bit). The bug fixes are continued cleanup of regressions surfaced by the repo migration plus one new pre-existing bug in AssignmentAttachment that wasn't a regression.

---

## [Unreleased] — 2026-04-28 (mid-day shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Flashcards from your notes 🎴

- **`src/components/assistant/VocabQuizFromNotes.jsx`** — a new student-facing AI tool. Paste any block of class notes / textbook section / study guide text (40–8000 chars) into a textarea, optionally name the deck, pick the card count (5/10/15/20), and get back a ready-to-study flashcard set. Cards render in the existing `FlashcardViewer`, so flip / nav / export-to-.txt all just work. The LLM prompt forbids inventing facts not in the notes, varies card shape (terms, dates, formulas, cause/effect, key people), and uses LaTeX for math.
- **Why:** Students take notes during class but don't always have time to turn them into a study deck. This is the fastest path from "I have notes" to "I'm quizzing myself on them" — no test record required, works for non-premium too. Sister feature to last shift's Essay Outliner; finishes the "AI tools that work with arbitrary student-supplied text" trio (chat → outliner → flashcards).
- **Three entry points:**
  1. Empty-state "🛠 STUDY TOOLS" tile in the StudyAssistant (visible to all users — premium and not).
  2. "Flashcards from notes" chip in `SuggestionChips`, so premium users see it both above the chat input and on the empty state.
  3. Deep link: `/StudyAssistant?tool=notes-flashcards[&title=...&notes=...]`. Pre-fills the form, lets us link to it from anywhere later.
- **Premium vs. free behavior:** premium users get the AI-job progress bar (via `runTrackedStudyAssistantCall`); free users get a direct `InvokeLLM` call with a normal spinner. Same end result.
- **Safety / privacy:** notes are sent to the AI tutor only to build the deck — there's a privacy hint shown to the student. Nothing is persisted to the school's records. No PII is auto-attached (notes come from the student typing/pasting, not from the assignments DB).

### Fixed (web) — re-ports of prior shifts that regressed in the migration

The repo migration to `gradeguardnewsync` (2026-04-26) keeps surfacing prior fixes that didn't make it into the snapshot. Patched another batch:

- **`InviteLinkButton.handleInvite`** — `await navigator.clipboard.writeText(url)` had no try/catch in the navigator.share-absent fall-through, AND the "Copied" timer was a bare setTimeout with no ref/unmount cleanup. Both fixes existed pre-migration. Now: try/catch with a long-press hint on clipboard failure, timer ref + useEffect cleanup matching `FriendChatPanel` / `BadgeUnlockToast`. Also stop swallowing non-AbortError share failures silently.
- **`FriendCodeCard.copyCode`** — `navigator.clipboard.writeText` was called WITHOUT await, then `toast.success` fired synchronously regardless of whether the copy succeeded. The toast was lying to users on browsers/contexts where Clipboard API is unavailable. Now async with try/catch + long-press hint on failure.
- **`AdminDashboard.copyCode`** — same regression, same fix, for the school code copy in the admin tools.
- **`CMSCompliance.copyText`** — same regression, same fix, for the CMS Vendor Questionnaire answer-snippet copy buttons. Added missing `sonner` toast import.
- **`NotificationSettingsPanel.requestPerm`** — re-ported the explicit "browsers without the Notifications API" guard + try/catch around `Notification.requestPermission`. Treats unsupported browsers as a distinct state with a clear "your browser doesn't support push notifications" message rather than rendering an enable button that throws on click. Added a double-submit guard via `requestingPerm` so a slow OS prompt can't be triggered twice.

### Fixed (web) — new for this shift

- **`AnonymizationToggle.handleAnonymize`** — handler was `setLoading(true) → try/catch → setLoading(false)` (outside finally). If the catch block itself threw, loading state stuck on forever and the school admin couldn't retry the anonymization without a page reload. Now uses a proper try/finally + double-submit guard, and surfaces the result via `toast.success` / `toast.error` for parity with the rest of the app.
- **`TodoItemCard.handleComplete`** — set `completing` to true and awaited the parent's `onComplete` (Dashboard.handleCompleteFromTodo), but never reset on failure. The parent already reverts its cache, but the card's local state stayed true forever, leaving the check button stuck green-and-disabled. Now wraps the await in try/catch and resets `completing` on error, with a double-submit guard.
- **`NotificationPermission.requestPermission`** (onboarding) — was calling `Notification.requestPermission()` with no environment check and no try/catch. In embedded webviews / older browsers / locked-down school Chromebooks, the Notification constructor doesn't exist (TypeError on first click) and even where it does, the call can throw. Now: feature-detect once at module load with an explicit "Notifications not supported" state, wrap the await in try/catch/finally with toasts, double-submit guard, and a "Asking your browser…" loading label.
- **`Layout.jsx`** — incidentally lint-fixed a stray `motion` import (caught by `npm run lint`).

### Why
The Flashcards-from-notes tool covers a real student gap: turning class notes into a quizzable deck without manually authoring each card. It's the kind of thing that will get used the day before a quiz. The bug fixes are continued cleanup of regressions from the repo-migration snapshot — every shift seems to surface another batch.

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

### Fixed (web) — additional reliability
- **StudyAssistant `handleFileAttach`** — file-attach upload had no try/catch; a failed UploadFile left the attach button stuck on a spinner with no toast. Wrapped + double-attach guard.
- **BadgeUnlockToast nested fade-out timer** — the inner `setTimeout(onDone, 450)` for the exit animation wasn't cleared on unmount. Stored in a ref and cleared in the cleanup.
- **InviteLinkButton "Copied" timer** — same unmount/re-arm pattern as FriendChatPanel — centralized the timer in a ref with armDoneTimer() and a useEffect cleanup.
- **Tests `handleMarkDone`** — optimistic completion update had no revert on save failure (parity with the Dashboard `handleCompleteFromTodo` fix earlier this shift). Now snapshots the cache and restores it on mutation error.
- **Onboarding `handleAuth`** — moved `setAuthLoading(false)` into a finally (was previously unreachable if the catch block itself threw) and added a double-submit guard.
- **AdminDashboard `adminWrite`** — backend `adminWriteOperation` may return `{ error: "..." }` in a 200 response (matching the entityProxy TOKEN_EXPIRED pattern). Without checking, `useMutation` treated soft failures as successes — admin schools/anonymization toggles thought they saved when they hadn't. Now translates the error field into a thrown Error, and TOKEN_EXPIRED specifically clears storage and redirects to the session-expired flow (same shape as `secureEntities`).

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
