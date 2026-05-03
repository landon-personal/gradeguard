# Changelog

All notable changes to the GradeGuard desktop app are tracked here. The web app at [gradeguard.org](https://gradeguard.org) is built and deployed separately via Base44.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/).

---

## ❌ Rejected features (do not re-add)

Features that have been built and reverted by the boss. **Future shifts must NOT re-add these, in any form.** If a similar idea seems useful, pick something else from the Feature Playbook instead.

- **AI Essay Outliner** — reverted 2026-04-29.
  - **What it was:** a `<EssayOutliner>` component in StudyAssistant that, given a topic + thesis + essay type + grade level, generated a complete structured outline (title, thesis, 3 hook ideas, intro roadmap, 3–4 body paragraphs each with topic sentence + supporting points + evidence ideas + transitions, optional counterargument, conclusion sketch, writing tips). Surfaced via a Writing Tools card on the empty StudyAssistant screen, a SuggestionChip, a bottom-bar pill, and an "Outline this essay" deep-link from any assignment whose name/notes matched essay-shaped keywords (`essay|paper|report|composition|thesis|dbq|frq|argument|persuasive|narrative|analysis|critique`).
  - **Why rejected:** Landon flagged that some people view essay outlining as cheating. Even though the prompt says "Outline only — the student does the writing," generating thesis statements, topic sentences, evidence ideas, and counterarguments crosses the line for a study app pursuing CMS school verification. The perception alone is disqualifying.
  - **Do not re-add as:** "essay scaffolder", "thesis helper", "paper planner", "writing brainstormer", "argument mapper", "counterargument finder", "outline this paper" link, an `?tool=essay` deep-link, an `essay_outline` study tool type, or any AI feature that produces thesis statements / topic sentences / paragraph plans for student-written essays from a topic prompt. Generic Socratic "ask me questions about your essay" chat is fine; *generating outline content* is not.

---

## [Unreleased] — 2026-05-03 12:19 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — QuickCapture v2: Test mode + touch-friendly date pills + smart test detection 🧪⏱️

Three coordinated upgrades to the QuickCaptureCard shipped two shifts ago. Closes prior shift's #81 backlog: "QuickCapture due-date presets", "QuickCapture Test variant", and "Touch-friendly subtask management" cousin.

- **Entity-type toggle (Assignment | Test)** — small segmented control at the top-right of the form. Test mode posts to `secureEntity("Test").create({ name, subject, test_date, status: "upcoming", share_with_friends: true })` instead of the assignment shape, invalidates the `["tests"]` query prefix instead of `["assignments"]`, deep-links the "Open full form →" link to `/Tests?new=1`. Same 3 fields, just remapped. Header icon + Submit button recolor by mode (rose for test, indigo for assignment) so the destination is unambiguous at a glance.
- **Date preset pills** — 4 touch-friendly pills below the inputs: `Today`, `Tomorrow`, `Friday` (next upcoming Friday — if today IS Friday, returns next week's Friday so the pill always means "the upcoming Friday"), `+1wk`. Highlights whichever pill matches the current date. Manual date input via the native picker still works and de-highlights all pills. The native iOS / Android date picker is fiddly on touch — a 1-tap pill is dramatically faster for the common cases.
- **Smart test detection** — when name matches `/test|quiz|exam|midterm|final|assessment/i` while in Assignment mode, surface a one-tap "🔔 Looks like a test — switch?" nudge above the action row. Tapping "Switch to Test" flips the mode + dismisses; tapping ✕ dismisses without switching. Won't re-prompt in the same session (`didAutoSwitch` latch) so a student who deliberately wrote "Quiz Prep" as a homework assignment isn't pestered.
- **Why a student notices it:** the universal capture flow now covers BOTH things students log on the dashboard — assignments AND tests — without leaving the Quick Capture surface. On phones, tapping "Friday" beats wrestling with the native date picker. And typing a test-shaped name no longer requires backing out to /Tests.
  - feat: eaf68ea · https://github.com/landon-personal/gradeguardnewsync/commit/eaf68ea

### Fixed (web) — `SubjectDetailModal` snooze auto-expiry didn't refresh row treatment while modal was open

- **`src/components/dashboard/SubjectDetailModal.jsx`** — closes prior shift's #81 backlog. `useSubjectDetails` derives a per-row `_snoozed` flag via `isAssignmentSnoozed` (localStorage-backed) inside a `useMemo` keyed on `[subject, assignments, tests]`. When a snooze auto-expired while the modal was open — no event fires for time-based expiry — the assignments reference stayed stable until React Query refetched, so the modal kept rendering the amber snoozed treatment + sorting the row to the bottom even after it should have flipped back to active.
- Same shape as the prior shift's `NotificationBell` fix: parent component now bumps a `snoozeTick` on the `gg-assignment-snooze-changed` CustomEvent + cross-tab `storage` event + 60s tick, threaded into the `useMemo` deps. Interval / listeners only attach while the modal is open to avoid burning a `setInterval` on every dashboard subject swatch render.
  - fix: d0decf1 · https://github.com/landon-personal/gradeguardnewsync/commit/d0decf1

### Fixed (web) — `AssignmentSubtasks` hover-only buttons unreachable on touch devices

- **`src/components/assignments/AssignmentSubtasks.jsx`** + **`tailwind.config.js`** — closes prior shift's #80/#81 "Touch-device subtask management" backlog. Subtasks v3 added 4 hover-only buttons per row (drag handle, Clock+, Pencil rename, X remove) all gated behind `opacity-0 group-hover:opacity-100`. On phones / tablets — where many CMS students study during the school day — the row would render but only the toggle worked. No way to rename a typo, remove a step, or add a time estimate without an external mouse.
- Adds a tailwind `coarse:` variant via `addVariant` — `@media (hover: none) and (pointer: coarse)` — and tags the four button classes with `coarse:opacity-100`. On touch the buttons are now permanently visible; on hover-capable devices the existing hover-to-reveal UX is unchanged so the row stays clean.
  - fix: f04a645 · https://github.com/landon-personal/gradeguardnewsync/commit/f04a645

### Fixed (web) — `AssignmentCard` snooze auto-expiry didn't flip card back without an event

- **`src/components/assignments/AssignmentCard.jsx`** — closes prior shift's #81 backlog. Card tracks `snoozedUntil` in local state, refreshed only on the `gg-assignment-snooze-changed` CustomEvent + cross-tab `storage` event. When a snooze expired purely by time passing — no event fires for time-based expiry — the card kept rendering the snoozed treatment until either /Assignments re-rendered (~60s React Query tick) or an unrelated remount.
- Add a self-arming `setTimeout` that fires at the exact wake-up time (`loadSnooze().until - Date.now() + 250ms grace`) and re-runs the same refresh that the events use. Capped at 24h to avoid `setTimeout`-overflow on long snoozes; the next event-driven refresh re-arms closer to expiry. Cleared on unmount.
  - fix: f0666d7 · https://github.com/landon-personal/gradeguardnewsync/commit/f0666d7

---

## [Unreleased] — 2026-05-03 08:08 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Quick Capture: 3-field inline assignment add on the dashboard ⚡

- **`src/components/dashboard/QuickCaptureCard.jsx`** (new) + **`src/pages/Dashboard.jsx`** — a collapsed-by-default card sits between the dashboard hero and the AI plan section. Tapping the "Quick add" pill expands a single-row form: name + subject + due date + Add button. Posts the same `secureEntity("Assignment").create({ ..., user_email, status: "pending", share_with_friends: true })` the full /Assignments form does, but skips the 5 optional fields (difficulty, weight, time_estimate, notes, recurrence) — those stay editable on /Assignments later for students who want them.
- **Stays expanded after save** so a student copying a list off a planner can capture multiple assignments without re-tapping. Re-focuses the name field after each successful save.
- **Why a student notices it:** the dominant "log what just got assigned in class" flow drops from "navigate to /Assignments → click + → fill 8-field modal → submit" to "tap pill → 3 inputs → Add." The full form is one tap away via the "Need difficulty / weight / notes? Open full form →" link below the inputs. Default sane values (status=pending, share_with_friends=true, due_date=tomorrow) so the lightest-possible form still produces a row that downstream surfaces (Workload, AI plan, EstimatedWorkload) treat normally.
- **Cache invalidation** uses prefix-only `queryClient.invalidateQueries({ queryKey: ["assignments"] })` so every cache shape (`['assignments']`, `['assignments', userEmail]`, `['assignments-streak', ...]`, `['assignments-focus', ...]`) refreshes — same pattern /Assignments uses.
  - feat: 34cb3d0 · https://github.com/landon-personal/gradeguardnewsync/commit/34cb3d0

### Added (web) — Subtask "X min left" chip on dashboard cards ⏱️

- **`src/components/dashboard/TodoItemCard.jsx`** + **`src/components/dashboard/TodaysFocusCard.jsx`** + **`src/lib/assignmentSubtasks.js`** — closes prior shift's "what I didn't get to" #2. Both dashboard chips already showed step-count progress (`ListChecks 3/5 ✓`), but a student watching those rows had no way to see how much actual time was left without expanding the panel. New `remainingMinutesFor(assignmentId)` lib export sums `mins` across UNCHECKED items; both cards display "45 min left" / "1h 30m left" next to the existing count chip when (a) the assignment has any mins-tagged steps and (b) the panel isn't 100% complete. Reuses the same cross-tab + storage event listener already in place — no extra subscriptions.
  - feat: 4e29e87 · https://github.com/landon-personal/gradeguardnewsync/commit/4e29e87

### Fixed (web) — `SubjectDetailModal` mixed snoozed + active rows in the same date order

- **`src/components/dashboard/SubjectDetailModal.jsx`** — closes prior shift's "what I didn't get to" #6. The previous shift made snoozed rows visually distinct (amber treatment + leading 💤) but they still sorted by due date alongside active rows. A student with 3 Math assignments — 1 active due Wed, 2 snoozed until Friday — would see the snoozed rows at the bottom but only because they happened to be due later. A snoozed row that was *overdue today* still floated to the top with the same visual weight as an active overdue row. Sort snoozed-last as a primary key, due-date as secondary, so the active stack always reads top-down regardless of when the snoozed rows were originally due.
  - fix: f74a6d8 · https://github.com/landon-personal/gradeguardnewsync/commit/f74a6d8

### Fixed (web) — `NotificationBell` red-dot lagged ~60s after snooze toggle

- **`src/components/notifications/NotificationBell.jsx`** — the bell filters snoozed assignments out of its upcoming-count, but the underlying `useQuery` has `staleTime=60000` and the bell never listened for the `gg-assignment-snooze-changed` CustomEvent. Snoozing an assignment via `AssignmentSnoozeButton` (or letting one auto-wake) didn't change the assignments query data — only the localStorage snooze state — so the bell kept showing the red dot until the next 60s refetch tick or an unrelated re-render. Added the same snoozeTick listener pattern Dashboard / EstimatedWorkload / QuickWinsCard already use: bump on the local CustomEvent + cross-tab `storage` event + 60s tick. Now the dot updates instantly on every snooze toggle.
  - fix: 225238e · https://github.com/landon-personal/gradeguardnewsync/commit/225238e

### Fixed (web) — `FloatingPomodoro` shortcuts fired through Radix consumers

- **`src/components/layout/FloatingPomodoro.jsx`** — the global P / Space handler bailed when `e.target` was an `INPUT` / `TEXTAREA` / contentEditable, but didn't check `e.defaultPrevented`. Pressing P inside an open Radix `Select` to type-ahead (e.g. "P" jumps to "Physical Education" in the new QuickCaptureCard subject picker) also toggled the FloatingPomodoro panel; Space-to-confirm-selection in any Radix `Select` also started/stopped the timer. Same fix shape Tests/Assignments adopted last shift: bail on `e.defaultPrevented` so Radix's own `preventDefault` skips the global handler.
  - fix: 8450b0b · https://github.com/landon-personal/gradeguardnewsync/commit/8450b0b

---

## [Unreleased] — 2026-05-03 06:10 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subtasks v3: inline rename + per-step time estimates ✏️⏱️

- **`src/lib/assignmentSubtasks.js`** + **`src/components/assignments/AssignmentSubtasks.jsx`** — closes prior shift's "what I didn't get to" #1 (inline rename) and #2 (per-step time estimate). Two coordinated upgrades to the per-assignment Subtasks panel:
  - **Inline rename** — pencil button on row hover swaps the label for an `<input>`. Enter / blur saves through `renameSubtask`, Esc cancels, empty input reverts (the explicit ✕ remains the way to delete a step). Wires up the `renameSubtask` lib export which has been built since Subtasks v2 but never surfaced in the UI. Drag-to-reorder is auto-disabled while a row is being edited so a stray drag doesn't interrupt typing.
  - **Per-step time estimate** — small Clock pill on each row. When set: shows `⏰ 15 min`, tap to edit / clear. When unset: tap a hover-only "+ time" affordance to open an inline preset picker (5/10/15/20/30/45/60 + custom). Stored as an optional `mins` field on each subtask item; `sanitizeItems` round-trips it; missing/invalid values are absent (not null). New lib exports: `setSubtaskMinutes(assignmentId, sid, mins|null)`, `totalMinutesFor(assignmentId)`, `MAX_SUBTASK_MINS=600`.
  - **Header surfaces the total** — when any step has a `mins` value, the panel header shows `Steps · ~45 min left` (or `~1h 30m` total once everything's done). Lets a student see at a glance "this whole assignment is 90 min of work, and 45 of that is left" so a Pomodoro session can be planned around it.
  - **Why a student notices it:** typo'd a step? Hover → pencil → fix it inline. Want to plan a 30-min focus session? Glance at the panel header. The subtask checklist becomes a real planning tool that tells you how much time is left, not just how many checkboxes.
  - feat: ad44cd0 · https://github.com/landon-personal/gradeguardnewsync/commit/ad44cd0
  - polish: af2ed0f · https://github.com/landon-personal/gradeguardnewsync/commit/af2ed0f

### Fixed (web) — `window.location.href` SPA-internal nav causing full reload (4 places)

A sweep that closes out the same family of bug the prior two shifts have been picking off (QuickWinsCard / TodaysFocusCard `<a href>` switches). Four more places forced a full page reload to hop to in-SPA routes:

- **`src/components/layout/CommandPalette.jsx`** — Cmd+K → "Privacy policy" / "Security & trust center" did `window.location.href = "/privacy"` / `"/security"`. Both routes are part of `App.jsx`'s SPA route table, so every Cmd+K hop tore down React Query, focus-timer state, etc. `useNavigate` was already imported. Switched to `navigate(...)`. Logout still uses `window.location.href` — that's the actual cross-domain redirect.
  - fix: 447b9a2 · https://github.com/landon-personal/gradeguardnewsync/commit/447b9a2
- **`src/Layout.jsx`** — two paths: (a) `handleDismissWhatsNew(targetPage)` (the "What's New?" modal CTA buttons) used `window.location.href = createPageUrl(...)` and (b) the FriendMessage live-subscribe toast's onClick (jumping to `/Friends?connectionId=…&tab=messages`) did the same. Both now use `navigate()`. Cross-domain logout / session-expiry redirects intentionally kept as full reloads.
  - fix: ffab4fc · https://github.com/landon-personal/gradeguardnewsync/commit/ffab4fc
- **`src/components/tutorial/TutorialOverlay.jsx`** — the interactive tour's "Try it now" CTA on every step (steps 2-6 each link to `/Assignments?new=1`, `/Tests?new=1`, `/StudyAssistant`, `/Achievements`, `/Dashboard`) used `window.location.href`. Worse than just a wasted reload: the reload tore down the tutorial overlay's parent component, so the next time the overlay reopened, the tour state was reset to step 1. Switched to `navigate()` + explicit `onClose()` so the overlay closes cleanly when the student jumps into a feature.
  - fix: 997a7d4 · https://github.com/landon-personal/gradeguardnewsync/commit/997a7d4
- **`src/lib/PageNotFound.jsx`** — the 404 page's "Go Home" button used `window.location.href = '/'`. The 404 is the worst place to force a reload because it discards the React Query auth fetch we just did to figure out whether to show the "Admin Note" branch. Switched to `navigate('/')`.
  - fix: 4b5a076 · https://github.com/landon-personal/gradeguardnewsync/commit/4b5a076

### Fixed (web) — `Friends` URL-param hydration didn't react to in-SPA nav (regression-followup)

- **`src/pages/Friends.jsx`** — the page's URL-param hydration `useEffect` was empty-deps, reading `window.location.search` exactly once on mount. Pre-shift this was OK because the Layout friend-message toast did `window.location.href` (full reload remounted Friends). The Layout fix in this shift switched that toast to `navigate()`, which means a student already on `/Friends` who taps a "new message" toast now triggers a same-component `location.search` change — and the empty-deps effect didn't pick it up. Fix: `useLocation` + `[location.search]` dep so the effect re-runs on every same-tab nav. Same shape `Assignments.jsx` and `Tests.jsx` already use for their own deep-link params.
  - fix: b1b426f · https://github.com/landon-personal/gradeguardnewsync/commit/b1b426f

### Chore (web) — consolidate `Assignments` URL-param consumption into a single replaceState

- **`src/pages/Assignments.jsx`** — the deep-link `useEffect` handled four params (`new=1`, `q`, `filter=overdue`, `subject`) but issued up to three separate `window.history.replaceState` calls per nav. Functionally a no-op for routing, but each replaceState shows up as a separate entry in DevTools' history view, making the back-stack noisier. `Tests.jsx` already had the consolidated single-replaceState shape.
  - chore: b5239fc · https://github.com/landon-personal/gradeguardnewsync/commit/b5239fc

---

## [Unreleased] — 2026-05-03 04:26 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subtasks bundle: drag-to-reorder + "mark complete?" prompt + dashboard progress chip ✅

- **`src/lib/assignmentSubtasks.js`** + **`src/components/assignments/AssignmentSubtasks.jsx`** + **`src/components/assignments/AssignmentCard.jsx`** + **`src/pages/FocusTimer.jsx`** + **`src/components/dashboard/TodoItemCard.jsx`** + **`src/components/dashboard/TodaysFocusCard.jsx`** — closes prior shift's "what I didn't get to" #12 (mark-complete prompt), #13 (dashboard subtask progress), #14 (drag-reorder). Three coordinated improvements to the per-assignment Subtasks feature shipped two shifts ago:
  - **Drag-to-reorder steps** via `@hello-pangea/dnd` (already a dep). Drag handle (`GripVertical`) renders only on row hover and only when there's >1 step (pointless for a 1-item "list"). Reorder writes through the same `persist()` path that fires the cross-tab `gg-assignment-subtasks-changed` CustomEvent so the new order shows up in another open tab without a remount. New lib export `reorderSubtasks(id, fromIndex, toIndex)` does the splice + persist.
  - **"Mark this assignment as completed?" prompt** appears above the steps list when all steps are done AND total ≥ 2 AND the parent card wired up an `onAllDone` handler. Yes / Not yet — "Not yet" dismisses for the session (re-renders won't flash it again). On AssignmentCard, `onAllDone → onStatusChange(id, 'completed')` so the existing `/Assignments` mutation pipeline does the persistence + optimistic cache update + toast. On FocusTimer, `onAllDone → handleAssignmentAllDone` which optimistically clears `selectedAssignment`, fires `secureEntity('Assignment').update(id, { status: 'completed' })`, invalidates the focus-page assignments query, and rolls back `selectedAssignment` on failure. Lets a student finish the last step from inside a Pomodoro and mark the assignment complete without navigating to `/Assignments`.
  - **Subtask progress chip** on `TodoItemCard` (the dashboard's prioritized "do this next" rows) and `TodaysFocusCard` (the dashboard's most-urgent banner): small `ListChecks 2/5 ✓` chip when subtasks exist for the row's assignment. Emerald + ✓ at 100%, indigo otherwise. Both listen for `gg-assignment-subtasks-changed` + the native `storage` event so a tick from `/Assignments` or `/FocusTimer` updates the dashboard chip live without a remount. Skipped for `test_study` rows (their `source_id` maps to a test, not an assignment).
- **Why a student notices it:** subtasks become a real planning tool instead of a static list. They can sequence the "easy starter" step to the top, the dashboard surfaces "you're 3/5 done on Algebra HW" without expanding anything, and finishing the last step inside a focus session offers a one-tap completion instead of yet another navigation.
  - feat: 19158e4 · https://github.com/landon-personal/gradeguardnewsync/commit/19158e4
  - feat: a416e78 · https://github.com/landon-personal/gradeguardnewsync/commit/a416e78

### Added (web) — Per-subject Class Notes surfaced inside FocusTimer mid-session 📒

- **`src/components/dashboard/SubjectNotesInline.jsx`** (new) + **`src/pages/FocusTimer.jsx`** — closes prior shift's "what I didn't get to" #11. Per-subject Quick Notes (the scratchpad shipped two shifts ago — formulas, vocab, "what the teacher said") were only viewable inside `SubjectDetailModal` from the dashboard. A student studying Math who wanted to glance at their Math notes had to navigate away from the focus timer. Now a compact view-only viewer renders below the Subtasks panel whenever an assignment / test with a `subject` is selected and `mode === "work"`. Auto-hides when there's no saved note for the subject. Listens for the existing `gg-subject-notes-changed` CustomEvent + the native `storage` event so a save in another open `SubjectDetailModal` surfaces here without a remount. Editing is intentionally not duplicated — `SubjectDetailModal` owns the canonical editor (autosave + clear + character counter + saved-flash); two save paths on the same data is a footgun.
  - feat: 38d5c5f · https://github.com/landon-personal/gradeguardnewsync/commit/38d5c5f

### Added (web) — `WorkloadForecast` bar heights now use `time_estimate`

- **`src/components/dashboard/WorkloadForecast.jsx`** — closes prior shift's "what I didn't get to" #6. The 14-day forecast was scoring 1.0 per assignment + 0.5 if `weight === "perform"` + 0.3 if `difficulty === "hard"` — flat per-item, never reading `time_estimate`. Now that the prior shift exposed `time_estimate` as a 1-tap inline pill on `AssignmentCard` (instead of a buried form field), real student-supplied minutes drive the forecast: base load = `time_estimate / 30` (so 30 min = 1.0, 60 min = 2.0, 15 min = 0.5), falling back to the prior flat 1.0 when no estimate exists. Calibrated to the existing `bandFor` thresholds so a single 60-min assignment now correctly crosses into "moderate" instead of staying "light", and a 120-min assignment crosses into "heavy". Modifiers (`perform` / `hard`) still bump on top — a hard 60-min essay deserves more headroom than an easy 60-min reading. No change to test load (no `prep_time_estimate` field on Test yet).
  - feat: 19fddea · https://github.com/landon-personal/gradeguardnewsync/commit/19fddea

### Fixed (web) — `Assignments`/`Tests` ESC handler closed the form even when Radix swallowed the key

- **`src/pages/Assignments.jsx`** + **`src/pages/Tests.jsx`** — closes prior shift's "what I didn't get to" #17. Both pages had global window keydown handlers that fired `setShowForm(false)` on every Escape regardless of (a) whether the form was open, (b) whether a Radix `AlertDialog` / `Select` / `Dialog` had already handled the key. Radix usually stops propagation, but for `AlertDialog` confirmation flows and some custom Popover content the keystroke can bubble through with `defaultPrevented` set. Result: pressing Esc inside an open Radix dialog could simultaneously close that dialog AND close the assignment/test form behind it. Two guards: bail on `e.defaultPrevented` and only act when `showFormRef.current` is truthy.
  - fix: 56871f8 · https://github.com/landon-personal/gradeguardnewsync/commit/56871f8

### Fixed (web) — `AssignmentSnoozeButton` 60s tick ran on backgrounded tabs

- **`src/components/assignments/AssignmentSnoozeButton.jsx`** — closes prior shift's "what I didn't get to" #3. The auto-expire tick fired regardless of `document.hidden` — modern browsers throttle to 1 min minimum so the cost was small, but a backgrounded tab still woke up every minute to do nothing useful. Refactored to start the interval only when visible, stop it on `visibilitychange → hidden`, and re-derive the snooze state on every `visibilitychange → visible` so a snooze that wakes up while the tab is hidden auto-clears the instant it returns to the foreground (instead of waiting up to a minute for the next tick).
  - fix: 56871f8 · https://github.com/landon-personal/gradeguardnewsync/commit/56871f8

### Fixed (web) — `SubjectDetailModal` showed snoozed pending assignments without any indicator

- **`src/components/dashboard/SubjectDetailModal.jsx`** — closes prior shift's "what I didn't get to" #5. The per-subject detail modal lists every pending assignment for that subject (it's the "all the work for this subject" view, by design includes snoozed). But snoozed rows rendered with the same urgency tint as active ones — overdue snoozed showed in rose with the "(2d late)" warning, due-today snoozed showed in amber. A student who snoozed a row to "deal with it Wednesday" reopened the modal and saw the same nag they were trying to escape. Each pending row now reads `isAssignmentSnoozed(a.id)` into `_snoozed` and renders the snoozed treatment (amber-50/60 background + 75% opacity + leading 💤 emoji + amber day-label, no AlertTriangle, no "(Nd late)" suffix).
  - fix: d24637a · https://github.com/landon-personal/gradeguardnewsync/commit/d24637a

### Fixed (web) — `AdminDashboard.handleSubmit` had no double-submit guard

- **`src/pages/AdminDashboard.jsx`** — closes prior shift's "what I didn't get to" #14. Submit button was correctly disabled while `createMutation`/`updateMutation` was pending, but pressing Enter inside any form input fires `<form onSubmit>` regardless of button state. Two quick Enters before the first response landed could create two schools (or fire two updates and trigger a spurious "school code already in use" error). Added `if (createMutation.isPending || updateMutation.isPending) return;` at the top of `handleSubmit`.
  - fix: 9c5bcc6 · https://github.com/landon-personal/gradeguardnewsync/commit/9c5bcc6

---

## [Unreleased] — 2026-05-03 02:11 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Quick Wins dashboard card ⚡

- **`src/components/dashboard/QuickWinsCard.jsx`** (new) + **`src/pages/Dashboard.jsx`** — a new dashboard card that surfaces small (≤ 30 min `time_estimate`) pending assignments due in the next 7 days, sorted shortest-first then by urgency. Renders up to three rows, each with subject pill, time pill ("15 min"), due-in pill, and a one-tap **Start** button that deep-links into `/FocusTimer?assignmentId=…` with the assignment preselected.
- **Why a student notices it:** answers the "I have 20 minutes between class and practice — what can I knock out?" question. `EstimatedWorkload` already gives totals (4.2 hrs due today). `WorkloadForecast` already gives the 14-day grid. Neither tells the student *which specific tiny task to do right now*. Quick Wins fills that gap and removes the decision-paralysis tax of scrolling /Assignments looking for the smallest thing to bite off.
- **Snooze-aware:** filters out anything `isAssignmentSnoozed(a.id)` returns true for, and re-derives on the `gg-assignment-snooze-changed` CustomEvent + cross-tab `storage` event + a 60-second tick. Same posture as `EstimatedWorkload` / `Dashboard` — an auto-expiring snooze pops the row back into the picker without a reload. Dashboard also passes `visibleAssignments` (already snooze-filtered) so the in-component check is belt-and-suspenders.
- **Auto-hide:** card returns null when there are zero matching candidates (no estimates in range, or every short assignment is snoozed/completed/due >7d), so it doesn't add empty real estate to the dashboard for students who haven't filled in `time_estimate` yet. Dashboard also gates the wrapper on `pendingAssignments.length > 0` so it never renders for fresh-account students.
- **Layout:** sits just under `EstimatedWorkload` and above `DeadlineCalendar` — natural progression from "how much do I have left?" → "what's the easiest thing to do right now?".
  - feat: 14df043 · https://github.com/landon-personal/gradeguardnewsync/commit/14df043

### Fixed (web) — `StudyAssistant.sendMessage` had no double-submit guard

- **`src/pages/StudyAssistant.jsx`** — the Send button was disabled while `loading`, but `handleKeyDown` (Enter-to-send), `SuggestionChips`, `EmptyChat.onStartChat`, and the file-attach completion path all called `sendMessage` directly without checking `loading`. Hitting Enter mid-await (or tapping a suggestion chip while the previous reply was still streaming) fired a second `InvokeLLM` request that overlapped the first and overwrote the messages list. Added `if (loading) return;` at the top of `sendMessage` mirroring the guards already in `generateFlashcards` / `generateQuiz` / `AIAssignmentChat.send`.
  - fix: 9f3260d · https://github.com/landon-personal/gradeguardnewsync/commit/9f3260d

### Fixed (web) — `AssignmentCard` inline grade-entry silently rejected invalid input

- **`src/components/assignments/AssignmentCard.jsx`** — `GradeEntry.handleSave` parsed the draft via `gradeToPercent`. If it returned `null` (anything that isn't a known letter or a 0–100 number — e.g. `K`, `200%`, `A++`), the function bailed with a no-op early return: the popover stayed open, the input stayed unchanged, and the student had no signal that Save was rejected. Felt like a broken Save button. Added inline error state (`aria-invalid` + red border + small "Use a letter (A, B+) or 0–100" hint under the field) that surfaces on the failed Save and clears as soon as the student edits the input or hits ✕/Escape. Refocuses the input so the next keystroke updates the same field.
  - fix: 76adcfa · https://github.com/landon-personal/gradeguardnewsync/commit/76adcfa

### Fixed (web) — duplicate dead `CommandPalette.jsx` and dead Cmd+K listener in Layout

- **`src/components/common/CommandPalette.jsx`** (deleted) — there were two `CommandPalette.jsx` files (`components/common/` and `components/layout/`). Only `components/layout/CommandPalette` was imported by `Layout.jsx`; the `common/` copy was orphan from a prior refactor. Removed.
  - chore: 9b2ac66 · https://github.com/landon-personal/gradeguardnewsync/commit/9b2ac66
- **`src/Layout.jsx`** + **`src/components/layout/CommandPalette.jsx`** — Layout had its own `useEffect` that registered a global `Cmd+K` / `?` keydown listener and toggled local `paletteOpen` / `shortcutsOpen` state. Neither piece of state was ever read or passed into `<CommandPalette>`. The actual palette opens because `CommandPalette` registers its *own* keydown listener for the same keys — so Layout's listener was a duplicate that toggled dead state. Removed the dead listener + state. Also added a `Focus Timer` entry to the palette's "Go to" group — `/FocusTimer` was missing from the global navigation set, so Cmd+K could not jump to it.
  - fix: 2e37abb · https://github.com/landon-personal/gradeguardnewsync/commit/2e37abb

### Chore (web) — drop dead `redirectIfSchoolSubdomain` helper inside `Onboarding.handleAuth`

- **`src/pages/Onboarding.jsx`** — the helper was defined as a closure inside the `try` block of `handleAuth` but never called. The login path that needed school-subdomain redirection inlined its own (slightly different) logic instead. 13 lines of dead code, removed.
  - chore: 60bf512 · https://github.com/landon-personal/gradeguardnewsync/commit/60bf512

### Fixed (web) — dashboard cards used `<a href>` for internal nav (full page reload)

- **`src/components/dashboard/QuickWinsCard.jsx`** + **`src/components/dashboard/TodaysFocusCard.jsx`** — both cards rendered their "All" / "Go to Assignments/Tests" links as `<a href={createPageUrl(...)}>` instead of react-router `<Link to={...}>`. Tapping either fired a full page reload, blowing away React Query caches, focus-timer state, and any in-progress modals. Switched to `<Link>` so the click is a SPA route change.
  - polish: 4a9260e · https://github.com/landon-personal/gradeguardnewsync/commit/4a9260e
  - fix: e7daf7e · https://github.com/landon-personal/gradeguardnewsync/commit/e7daf7e

---

## [Unreleased] — 2026-05-03 00:10 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Assignment Snooze 💤

- **`src/lib/assignmentSnooze.js`** (new) + **`src/components/assignments/AssignmentSnoozeButton.jsx`** (new) + **`src/components/assignments/AssignmentCard.jsx`** + **`src/pages/Assignments.jsx`** + **`src/pages/Dashboard.jsx`** + **`src/components/notifications/useNotifications.jsx`** + **`src/components/notifications/NotificationBell.jsx`** + **`src/components/dashboard/SubjectGoalsStrip.jsx`** — Gmail-style snooze on a per-assignment basis. Lets a student park an assignment they aren't ready to look at right now (mid-week project that's not due until Friday, the lit-circle book that just sat down a list, anything that clutters their list and makes them feel guilty) without deleting it or marking it `in_progress` they're not actually working on. Snoozed assignments come back automatically once the snooze expires.
- **What changed:**
  - New `AssignmentSnoozeButton` next to the time-estimate row on every active `AssignmentCard`. Idle state: a thin "Snooze" trigger with a Clock icon. Tap → dropdown with four presets: **Later today (+3h)**, **Tomorrow morning** (next-day 7am local — students mean "before school", not literally +24h), **In 2 days**, **Next Monday**.
  - Picked state: the trigger swaps to an amber pill — `Snoozed until tomorrow 7:00 AM · wake` — that toasts "Snoozed until …" on creation. Tapping `wake` clears the snooze and toasts "Snooze cleared — back on the list".
  - The card itself dims slightly with an amber-50 background when snoozed (status of completed still wins for visual hierarchy).
  - `/Assignments` adds a new `💤 N snoozed · view` filter chip alongside Due-today / Overdue. Default behavior: snoozed pending rows are hidden from the Pending grid; tapping the chip toggles them back in (still styled dimmed by the card). Active counts in the page header (`N pending · M completed`) reflect the filtered list. Drag-to-reorder still works — saved IDs hidden by snooze stay in `manualOrder` so toggling visibility doesn't drop them.
  - Dashboard treats snoozed assignments as not-currently-on-my-plate: `pendingAssignments`, `overdue`, the "Pending" header stat, the AI study plan signature/regeneration, `TodaysFocusCard`, `EstimatedWorkload`, and `WorkloadForecast` all skip snoozed rows. Auto-recovers when the snooze expires (60-second tick re-derives the visible set without a page reload).
  - Notification system honors snooze: `NotificationBell`'s red-dot upcomingCount and `useNotifications`'s push-reminder loop both filter snoozed out so the snooze isn't undermined by an OS push or a header badge for the parked item.
  - `SubjectGoalsStrip` Suggest button skips snoozed when picking the lowest-pct subject's first pending assignment, so a student who snoozed everything in a behind-on-Math subject doesn't get the snoozed row dropped into a focus session.
- **Storage:** `localStorage` keyed by assignment id (`gg_assignment_snooze_<id>` → `{ until: ISO, ts: ISO }`). Same defensive read/write posture as `assignmentSubtasks.js` and `testPrepChecklist.js` — Safari Private mode / sandboxed iframes throw on every storage call; those throws fall through to "not snoozed" rather than crashing. Auto-expires on read: any entry whose `until` has passed is removed and treated as not snoozed. CMS posture: client-side only, no PII, never sent off-device.
- **Cleanup:** `Assignments.deleteMutation.onSuccess` now also calls `clearSnooze(id)` so a deleted assignment's snooze entry doesn't orphan (matches the `clearSubtasks` cleanup pattern shipped alongside subtasks).
- **Cross-tab + same-tab sync:** dispatches `gg-assignment-snooze-changed` CustomEvent on every change + listens for the native `storage` event keyed by `gg_assignment_snooze_*`. Two open `/Assignments` tabs stay coherent — snoozing a row in one tab dims it and updates the chip count in the other. Same posture as `assignmentSubtasks`.
- **Auto-wake:** `AssignmentCard`, `AssignmentSnoozeButton`, `/Assignments`, and `Dashboard` each tick once a minute (and on the cross-tab event) to re-derive snooze state, so a snooze that expires while a tab is open pops the assignment back into view without a refresh.
- **Why a student notices it:** the assignment list stops being a guilt-pile of things they're avoiding. "I'll deal with this Wednesday" becomes a one-tap action that actually hides the row, doesn't pretend the student is working on it, and re-surfaces it automatically. The Pending / Overdue / Due-today counts and the AI plan also stop nagging about the parked item, which is what makes the snooze feel real instead of cosmetic.
  - feat: e4736cd · https://github.com/landon-personal/gradeguardnewsync/commit/e4736cd

### Fixed (web) — `AssignmentCard` inline grade-entry pill was defined but never rendered

- **`src/components/assignments/AssignmentCard.jsx`** + **`src/pages/Assignments.jsx`** — the `GradeEntry` sub-component (the "Add grade" / "B+ · A" pill that opens an inline input) and the `onGradeUpdate` prop have existed in `AssignmentCard` since the file was first added, but the JSX never rendered the component and `/Assignments` never passed an `onGradeUpdate` callback. Result: the only way to record a grade on a completed assignment was to tap the Pencil icon → reopen the entire AssignmentForm modal → fill in `Grade Received` → Save. The inline-on-card UX was 80% finished and stuck in a drawer.
  - Rendered `GradeEntry` next to the status select on completed cards. Validates input via `gradeToPercent` (already existed), shows the colored letter pill on save.
  - Added `handleGradeUpdate` on `/Assignments` that optimistically updates the React Query cache (so `GradeStats`, `GradeGoalCalculator`, `SubjectGradeGoalsStrip` recompute live) and persists via `updateMutation`. Wired into all three `AssignmentCard` callsites (manual-order draggable, default grid, completed grid).
  - fix: 33ba953 · https://github.com/landon-personal/gradeguardnewsync/commit/33ba953

### Fixed (web) — Notifications fired for snoozed assignments

- **`src/components/notifications/NotificationBell.jsx`** + **`src/components/notifications/useNotifications.jsx`** — `NotificationBell`'s red-dot upcomingCount and `useNotifications`'s push-reminder loop both treated snoozed assignments as still-active. A student who snoozed an assignment was still nagged about it via the bell counter and a system-level push when the reminder window hit, defeating the entire point of the snooze. Both now filter out anything where `isAssignmentSnoozed(a.id)` is true; the dot/push come back automatically when the snooze expires.
  - fix: 41fa671 · https://github.com/landon-personal/gradeguardnewsync/commit/41fa671

### Fixed (web) — `SubjectGoalsStrip` Suggest could pick a snoozed assignment

- **`src/components/dashboard/SubjectGoalsStrip.jsx`** — the Suggest button (rendered when at least one subject is under its weekly minutes goal) finds the most-behind subject's first non-completed assignment and hands it to the parent for a focus-session deep-link. The lookup didn't filter snoozed, so a student who'd snoozed everything in their behind-on-Math subject would still get a snoozed row dropped into a focus session. Filter snoozed out so Suggest either finds a real candidate or falls through to the "no pending {subject} assignments" toast the parent already handles.
  - fix: 4a611ac · https://github.com/landon-personal/gradeguardnewsync/commit/4a611ac

### Fixed (web) — `FocusTimer` picker dropdown listed snoozed assignments

- **`src/pages/FocusTimer.jsx`** — the assignment-picker dropdown rendered every non-completed assignment regardless of snooze state, so a student who'd parked an assignment via Snooze still saw it as a pickable option in `/FocusTimer`. The deep-link path (`/FocusTimer?assignmentId=xxx`) is intentionally left alone — if the student explicitly clicked into a focus session for a snoozed assignment, honoring that beats refusing to load it. The picker dropdown filters snoozed out (with a guard so the currently-selected assignment is kept even when snoozed, so the picker doesn't seem to forget the active selection mid-session). Same minute-tick + cross-tab event listener pattern as `Dashboard` / `/Assignments` / `AssignmentSnoozeButton` so the picker re-derives without a page reload when a snooze auto-expires.
  - fix: 51dab00 · https://github.com/landon-personal/gradeguardnewsync/commit/51dab00

---

## [Unreleased] — 2026-05-02 22:16 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Inline assignment time estimates + Estimated Workload card ⏳

- **`src/components/assignments/AssignmentTimeEstimate.jsx`** (new) + **`src/components/assignments/AssignmentCard.jsx`** + **`src/components/dashboard/EstimatedWorkload.jsx`** (new) + **`src/pages/Dashboard.jsx`** — the Assignment entity has had a `time_estimate` field since launch, but the only way to set it was buried inside the `+ New Assignment` form, and the only place it was ever read was inside the AI study-plan prompt. From the student's perspective, time estimates were ghost data — invisible on the cards, invisible on the dashboard, no rollup, no nudges.
- **What changed:**
  - The read-only "~30 min" badge on `AssignmentCard` is now an editable inline pill. Tap it → an indigo popover row appears with one-tap presets (10 / 15 / 20 / 30 / 45 / 60 / 90 / 120), a custom-minutes number input, a "Clear" button when an estimate is already set, and an ✕ to close. Save fires `secureEntity("Assignment").update({ time_estimate })` and flows through the existing `handleAttachmentUpdate` optimistic React Query cache update on `/Assignments` so the dashboard rolls up the new value immediately, no refetch needed. Hidden on completed assignments.
  - Empty state shows `+ Add estimate` as a thin underline trigger instead of nothing — students who have never used the field at all now have a tap-target on every card.
  - The same `mountedRef` + try/catch/finally posture as `saveNote` and `AssignmentAttachment.handleFileChange` so a card that unmounts mid-save (filter change, status flip to completed, delete from another card) doesn't warn-on-unmounted.
- **New `EstimatedWorkload` dashboard card:** sits between the existing `WorkloadForecast` (14-day load grid) and `DeadlineCalendar`. Shows three bands — **Today**, **Next 3 days**, **Next 7 days** — each with the total estimated hours/minutes from `time_estimate` across pending assignments due in that window, plus the item count and a fill bar normalized to the busiest band. When an assignment is due today *without* an estimate, an amber pill appears at the bottom: "N assignments due today have no estimate yet — Add →" linking to `/Assignments` so students can fill it in. Auto-hides if there are zero pending in the next 7 days; the missing-estimate pill is intentionally scoped to today-only because wider missing counts get noisy.
- **Hours formatter:** `<60min` shows as `45 min`; 1–9.9 hrs shows one decimal (`2.5 hrs`); ≥10 hrs rounds to whole hours. Caps at 600 minutes per assignment to keep the storage shape sane.
- **Why a student notices it:** time estimates stop being an invisible form field and become a one-tap pill on every card. The dashboard card turns "I have a vague pile of homework" into "I have ~2.5 hours of work due today, ~6 hours by Friday" — a real number students can budget against. The amber missing-estimate nudge closes the loop: setting the estimate is cheap, the dashboard demands it, and the AI study plan prompt already consumes the field, so even infrequent estimates make the auto-generated plan more accurate.
  - feat: 8d7d7fe · https://github.com/landon-personal/gradeguardnewsync/commit/8d7d7fe

### Fixed (web) — `Dashboard` AI plan crashed when an assignment or test had no date

- **`src/pages/Dashboard.jsx`** — `generateAIPlan` mapped `pendingAssignments.map(a => a.due_date.split('-'))` and `activeTests.map(t => t.test_date.split('-'))` with no null guard. `pendingAssignments` filters by `status !== 'completed'` only, and `activeTests` intentionally keeps NaN-day rows (undated tests) so they still render on the dashboard — feeding either of those into the plan crashed the entire generation on `Cannot read properties of null (reading 'split')`. Filter both lists before the map: require a string that splits into three finite numbers. The AI can't prioritize an item with no date anyway, so dropping them from the prompt context is the right call.
  - fix: 15cf560 · https://github.com/landon-personal/gradeguardnewsync/commit/15cf560

### Fixed (web) — `new Notification(...)` could throw on iOS Safari and embedded WebViews

- **`src/components/layout/FloatingPomodoro.jsx`** + **`src/components/dashboard/PomodoroWidget.jsx`** + **`src/components/notifications/useNotifications.jsx`** — three callsites instantiated `new Notification(...)` after only checking `Notification.permission === "granted"`. iOS Safari and some embedded WebViews expose the global and report `granted` (because the host app granted it) but throw a TypeError on the constructor itself. The throw was unguarded in all three places:
  - **FloatingPomodoro:** thrown inside the `setSecondsLeft` updater inside `setInterval`, at the moment the timer hit 0 — the worst possible time for an unhandled exception.
  - **PomodoroWidget.fireNotification:** same setInterval-updater path, and the throw also killed the `toast.success` fallback that should have shown even when the OS push didn't fire.
  - **useNotifications.sendPush:** synchronous helper called from the per-tick reminder loop — one un-pushable item aborted the rest of that tick's reminders.
  Wrapped all three in try/catch matching the `FocusTimer.maybeNotify` posture that already existed.
  - fix: 548965e · https://github.com/landon-personal/gradeguardnewsync/commit/548965e

---

## [Unreleased] — 2026-05-02 20:15 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Assignment Subtasks ✅

- **`src/lib/assignmentSubtasks.js`** (new) + **`src/components/assignments/AssignmentSubtasks.jsx`** (new) + **`src/components/assignments/AssignmentCard.jsx`** + **`src/pages/Assignments.jsx`** + **`src/pages/FocusTimer.jsx`** — students currently get one assignment row with one notes textarea. Real-world assignments are usually multi-step ("Read chapters 3–5, answer the 4 questions, write a summary," "Lab report sections 1–3," "Worksheet pp. 5–12 odd problems"). They live in the student's head with no progress visible. Add a per-assignment subtasks checklist so a big assignment becomes a small list of steps with a progress bar.
- **What changed:**
  - New checklist UI inside every active `AssignmentCard`. Empty assignments show a thin `+ Break into steps` trigger so cards stay uncluttered until engaged. Once a step exists, the full panel appears: `ListChecks` header with an "X / Y" counter, a 1.5px progress bar (indigo while in progress, emerald + "All steps done!" + ✓ at 100%), the steps as toggle rows, and an `+ Add a step` row at the bottom.
  - Adding a step keeps the input open + refocused so a student can rip off several steps in a row top-to-bottom; Esc / blur with empty draft closes the row. Up to 12 steps per assignment, 80-char ceiling per label.
  - Hover-only ✕ on each row removes that step (both the row and any "done" mark for it). All transitions use the same Framer `AnimatePresence` height-collapse pattern as `TestPrepChecklist` for consistency.
  - Hidden on completed assignments (the steps were a means to an end). Storage stays so an un-complete brings them back.
  - Wired into `FocusTimer` too: when a student selects an assignment to focus on, the same subtasks panel renders below the focus pill so they can tick off steps without leaving the timer view. Hidden during breaks and when a test is the active context.
- **Storage:** `localStorage` map keyed by assignment id (`gg_assignment_subtasks_<id>` → `{ items: [{ sid, label, done, ts }], ts }`). Same defensive read/write posture as `testPrepChecklist.js` — Safari Private mode and sandboxed iframes throw on every storage call; those throws fall through to "no items" rather than crashing the card. Sanitized on every read so a corrupted blob is dropped silently. CMS posture: client-side only, never sent to AI, never sent to the server. Student-typed step labels never leave the device.
- **Cleanup:** `Assignments.deleteMutation.onSuccess` now calls `clearSubtasks(id)` so a deleted assignment's steps don't orphan in storage. Same shape as `Tests.deleteMutation` clearing confidence / reflection / prep-checklist / deck-mastery on delete.
- **Cross-tab + same-tab sync:** dispatches `gg-assignment-subtasks-changed` CustomEvent on every write; listens for that + the native `storage` event on the per-id key. Two open `/Assignments` tabs stay coherent — toggling a step in one shows up immediately in the other. Same pattern `TestPrepChecklist` uses.
- **Why a student notices it:** turns "Read chapters 3-5 and answer questions" from a vague heavy block into a 3-step list with visible progress. A student can crack open one chapter, tick the step, and feel forward motion instead of staring at the same single uncrossed assignment for three days. The FocusTimer wiring closes the loop — they can break the work down, start a focus session, and tick steps off as they actually finish them, all in one screen.
  - feat: ca22b69 · https://github.com/landon-personal/gradeguardnewsync/commit/ca22b69
  - feat: 027c519 · https://github.com/landon-personal/gradeguardnewsync/commit/027c519

---

## [Unreleased] — 2026-05-02 18:13 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subject Quick Notes scratchpad 📒

- **`src/lib/subjectNotes.js`** (new) + **`src/components/dashboard/SubjectDetailModal.jsx`** + **`src/components/dashboard/GradeTrends.jsx`** — students juggle mental notes per class (formulas the teacher emphasized, vocab to review, "remember to bring graph paper") and currently stash them in scattered places — paper, the phone Notes app, sticky notes. Add a per-subject scratchpad inside the existing `SubjectDetailModal` so the notes live right where the subject's data already does.
- **What changed:** new "Add note" / "Notes" pill in the modal header next to the existing Goal pill (amber when notes exist). Clicking reveals a 4-row textarea section pre-expanded when the modal opens; saves on blur with a transient "Saved" indicator + last-saved timestamp; Esc reverts the draft. 800-char ceiling per subject keeps the storage shape sane. Per-row "+ Note" / "Notes" pill on every `GradeTrends` row deep-links into the modal with `defaultView="notes"` so a student capturing a 5-second thought is one tap from a focused editor.
- **Storage:** localStorage map keyed by normalized subject name (`gg_subject_notes` → `{ "<subject>": { text, updatedAt } }`). Same posture as `subjectGoals.js` / `subjectColors.js`. Sanitizes control chars on read, dispatches `gg-subject-notes-changed` on save, exposes `SUBJECT_NOTES_STORAGE_KEY` for cross-tab `storage` listeners. CMS posture: client-side only, never sent to AI, never sent to the server. Copy explicitly says "this device only · never sent to AI" so the privacy boundary is visible.
- **Cross-tab + same-tab sync:** the modal listens for `SUBJECT_NOTES_CHANGED_EVENT` (same-tab) and `storage` events on the storage key (cross-tab) — refreshes the saved snapshot, only updates the local draft when the editor is closed so a cross-tab save can't clobber unsaved typing. `GradeTrends` carries its own `notesTick` listener so the per-row pill flips amber the instant a save lands anywhere.
- **Why a student notices it:** a class scratchpad is something they currently can't do anywhere in the app. Open SubjectDetailModal for Spanish, jot "irregular preterite — venir, querer, hacer," close. Open it next week and the note is right there next to the grade trend. The tap-from-dashboard surface (GradeTrends row pill) makes capture cheap enough that students will actually use it.
  - feat: a6cc916 · https://github.com/landon-personal/gradeguardnewsync/commit/a6cc916
  - feat: d8cbc63 · https://github.com/landon-personal/gradeguardnewsync/commit/d8cbc63

### Fixed (web) — `NotificationPermission` button never showed its in-flight state

- **`src/components/notifications/NotificationPermission.jsx`** — `setRequesting` was declared but never called. The button's `disabled={requesting || !hasNotificationsApi}` and `{requesting ? "Asking your browser…" : ...}` branches therefore never activated. A student tapping "Enable Notifications" twice in quick succession got two parallel `Notification.requestPermission()` calls (most browsers de-dupe at the platform level so the second is a no-op, but the UI showed no in-flight feedback either way — and on a slow permissions UI the second click could land before the first finished). Set `requesting=true` at the top of the handler, clear in `finally`. Also added a top-of-handler bail (`if (requesting) return`) so the visual disable can't be bypassed by a fast tapper.
  - fix: fe070e0 · https://github.com/landon-personal/gradeguardnewsync/commit/fe070e0

### Fixed (web) — `CMSCompliance` copy-indicator timer races between back-to-back clicks

- **`src/pages/CMSCompliance.jsx`** — `copyText` schedules an unguarded `setTimeout(...2000)` on every call. A user copying field A, then field B 1 second later, fired the first timer at the 2s mark and blanked the (still-active) B indicator early. Also fired `setCopiedField(null)` on an unmounted component if the page was left during the 2s window. Mirror the `AdminDashboard.copyCode` pattern that already exists: store the latest timer in `copyTimerRef`, clear before re-arming, clean up on unmount.
  - fix: e0323e2 · https://github.com/landon-personal/gradeguardnewsync/commit/e0323e2

---

## [Unreleased] — 2026-05-02 14:05 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Student-added custom prep items per test ✨

- **`src/lib/testPrepChecklist.js`** + **`src/components/tests/TestPrepChecklist.jsx`** + **`src/components/tests/TestCard.jsx`** — the 5 fixed checklist items (topics / notes / flashcards / practice / sleep) cover the common case but miss subject-specific prep. A vocab-heavy Spanish test wants "Review vocab list" but doesn't need "practice problems"; a chem test wants "Memorize polyatomic ions"; a history paper wants "Re-read primary source X." Until this shift the list was prescriptive, not personal.
- **What changed:** new "Add your own" trigger at the bottom of every test's prep checklist opens an inline input row. Enter saves, Esc cancels, blur saves. Custom items render below the fixed 5 with a Sparkles icon (vs. fixed items' lucide icons) and an X button on hover to delete. Up to 8 custom items per test (caps card height + storage size); 60-char label limit. "Maxed out at 8 custom items" copy replaces the trigger when the cap lands.
- **Storage shape additive + backward-compatible:** existing `gg_test_prep_check_<testId>` blobs without a `custom` field still load fine. New shape adds `custom: [{cid, label, ts}]` and lets `done` hold both fixed indices (0..PREP_TOTAL-1) and custom cids (CUSTOM_BASE = 1000+). `sanitizeDone` cross-references the loaded custom cids so an orphan id from a deleted custom item gets silently dropped on the next read; `removeCustomItem` also strips the cid from `done` proactively so the counter reflects the deletion immediately.
- **`progressFor` returns dynamic total** = PREP_TOTAL + custom.length. `TestCard`'s "2/5" badge becomes "2/7" automatically once a student adds two items; the dashboard's `NextTestCountdown` banner picks up the same total because it embeds the same component with the same lib.
- **Why a student notices it:** the canned 5 items aren't the right list for every class. A vocab-heavy language class doesn't need 'practice problems' but does need 'review vocab list'. Without student-added items the checklist felt prescriptive; now it's a real per-test plan that survives reloads, syncs cross-tab, and shows up in the dashboard countdown banner the same way the fixed items do.
  - feat: 5bd0c91 · https://github.com/landon-personal/gradeguardnewsync/commit/5bd0c91

### Fixed (web) — `/Tests` past-tests grade averages were silently broken

- **`src/components/tests/TestGradeStats.jsx`** (new) + **`src/pages/Tests.jsx`** — closes prior shift backlog (12:05 UTC #2). The Past / Completed section rendered `<GradeStats assignments={tests} />`, but `subjectGradeStats` only counts items with a `grade_received` field — and Test entities don't have one. Test grades live in the testReflection localStorage blob (`gradePct`). So the panel always returned null and the "Grade Averages" card never appeared on `/Tests` no matter how many test grades a student had logged from the dashboard's reflection prompt.
- **What changed:** new `TestGradeStats` component reads each past test's reflection blob, aggregates per subject, renders the same chip layout as the assignment-side `GradeStats`. Adds a subject-color dot at the leading edge of each chip (matches how `/Assignments` renders subject color elsewhere) and changes the header subline from "from graded assignments" to "from logged reflections" since the source-of-truth is different. Returns null when no past test has a logged grade — no half-empty header.
- **Listeners:** `gg-test-reflection-changed` (same-tab) + `storage` events on `gg_test_reflection_*` keys so a grade entered via the Dashboard's `TestReflectionCard` immediately flows into the `/Tests` row without remount.
- **Why this matters:** students were entering test grades into the post-test reflection prompt and getting zero aggregation surface for them — a small but real gap. This is a surface-only wire-up of data students were already entering; no new entry surface, no schema change.
  - fix: 645185b · https://github.com/landon-personal/gradeguardnewsync/commit/645185b

### Fixed (web) — `focusGoal` cross-tab + same-tab listener gap

- **`src/lib/focusGoal.js`** + **`src/components/dashboard/WeeklyFocusGoalMini.jsx`** + **`src/pages/FocusTimer.jsx`** — closes prior shift backlog (12:05 UTC #4). `saveGoal()` was writing to localStorage but never dispatching a same-tab CustomEvent, and no surface that read the goal listened for the cross-tab `storage` event either. So a student editing their weekly focus goal on `/FocusTimer` in tab A saw the `WeeklyFocusGoalMini` on `/Dashboard` in tab B keep showing the OLD goal in its denominator until reload (e.g. saved 200, mini still showing "45 / 100 min").
- Same shape as the prior shift's `GradeGoalCalculator` cross-tab listener fix — the dispatch existed, the listener didn't.
- Three-part fix: `focusGoal.js` dispatches `gg-focus-goal-changed` from `saveGoal()` and exports `FOCUS_GOAL_STORAGE_KEY` + `FOCUS_GOAL_CHANGED_EVENT` constants so listeners don't string-literal the key. `WeeklyFocusGoalMini.jsx`'s existing storage-event listener (already bumping on focus-session writes) was extended to also bump on the goal key + the same-tab CustomEvent. `FocusTimer.jsx` got its own listener that reads `loadFocusGoal()` into the page's `weeklyGoal` state, skipping `setGoalDraft` when the inline editor is open so a cross-tab save can't clobber what the student is mid-typing.
  - fix: b48682d · https://github.com/landon-personal/gradeguardnewsync/commit/b48682d

### Hygiene (web)

- **`src/components/assignments/AIAssignmentChat.jsx`** — drop two unused exception bindings flagged by lint (`parseErr`, `e`). Folded into the TestGradeStats commit since the file change was a one-token cleanup (`catch (parseErr) {` → `catch {`). Cleaner than carrying the lint-warning noise into next shift's diff.

---

## [Unreleased] — 2026-05-02 12:05 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Per-test prep checklist on `/Tests` row detail 📝

- **`src/components/tests/TestCard.jsx`** — closes prior shift backlog (10:15 UTC #2). Until now the `TestPrepChecklist` only embedded inside the dashboard's `NextTestCountdown` banner — students who navigated to `/Tests` had to bounce back to `/Dashboard` to tick off prep items.
- **What changed:** new `Checklist` toggle button alongside the existing `Prep plan` button on every upcoming test card. Button label includes a live `2/5` progress badge so the student gets glanceable progress without expanding. Color flips emerald when 5/5 lands.
- **Same shared component, same per-test storage key (`gg_test_prep_check_<testId>`)** — toggling an item from the `/Tests` row immediately reflects on the `/Dashboard` countdown banner (and vice versa) via the existing same-tab `gg-test-prep-check-changed` event + cross-tab `storage` listener.
- **Disclosure-only render keeps card height unchanged when collapsed**, addressing the prior shift's "TestCard is already vertically dense" note — the badge gives glanceable progress; the full checklist only renders on demand.
- **Indigo palette** instead of an alarmist rose — a test 3 weeks out with 0/5 ticked shouldn't render mostly red. Matches the dashboard's neutral-progress palette while preserving the emerald flip when the checklist is fully done.
  - feat: 35f98b9 · https://github.com/landon-personal/gradeguardnewsync/commit/35f98b9
  - polish: 5439dff · https://github.com/landon-personal/gradeguardnewsync/commit/5439dff

### Fixed (web) — `GradeGoalCalculator` cross-tab + same-tab `Saved` pill staleness

- **`src/components/assignments/GradeGoalCalculator.jsx`** — closes prior shift backlog (10:15 UTC #4). The calculator dispatched `gg-subject-goal-changed` on save but didn't *listen* for the same event, so a student with the calculator open in tab A who saved a goal for the same subject in tab B's calculator (or via any other surface) saw a stale `Saved` pill and stale target slider until manual reload.
- **Why:** mirror the listener pattern `SubjectGradeGoalsStrip` and `NextTestCountdown` already use — same-tab CustomEvent + cross-tab native `storage` event, both filtered to the row's (email, subject) pair.
  - fix: d32c437 · https://github.com/landon-personal/gradeguardnewsync/commit/d32c437

### Fixed (web) — Dashboard `handleCompleteFromTodo` actually reverts on save failure

- **`src/pages/Dashboard.jsx`** — `handleCompleteFromTodo` captured 6 prior-state snapshots (`prevTodoList`, `prevAssignmentsCache`, `prevTestsCache`, `prevSignature`, `prevSessionPlan`, `prevSessionSig`) at the top of the handler, then never read any of them — the catch block only invalidated react-query and showed a toast.
- **Why this matters:** a student who tapped Done on a SmartTodo item, hit the network mid-save (or had the server reject), saw "Couldn't save your progress" but the item *stayed removed from their AI plan locally* and from the sessionStorage cache. Only a hard reload + cache-miss would resurrect it.
- **Same shape as the 04-14 ConfirmDialog regression** caught last shift: state captured for revert, revert never wired up. Fix wires up all 6 snapshots in the catch block, including session-storage restore (with `removeItem` when the prior value was null so we don't write the literal string `'null'`).
- **Also drops dead `xpToast` / `pendingBadges` state** declared but never read in `Dashboard.jsx` (lint warnings since the gamification refactor — those are wired up correctly on `/Assignments`, just dead on `/Dashboard`).
  - fix: 7f4f7c8 · https://github.com/landon-personal/gradeguardnewsync/commit/7f4f7c8

---

## [Unreleased] — 2026-05-02 10:15 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Grade-goal context line in `NextTestCountdown` 🏆

- **`src/components/dashboard/NextTestCountdown.jsx`** + **`src/pages/Dashboard.jsx`** — closes prior shift backlog (08:06 UTC #1). The dashboard's at-the-top countdown banner had no link between test prep and the saved subject grade goals shipped in the prior shift cycle. A student prepping for a Bio test that contributes to their saved A-in-Bio goal saw zero acknowledgement of that connection in the banner.
- **What changed:** when the active test's `subject` matches a saved grade goal, the banner renders a Trophy-iconed line below the prep/reflect controls: "Counts toward your **A** goal in Bio · now B+" with the same Locked in / On track / Stretch / Out of reach feasibility chip the `SubjectGradeGoalsStrip` and `WeeklyRecapModal` use. Tap → `/Assignments` to edit. Renders in **both** upcoming-test and post-test reflect modes — in reflect mode, the just-landed test grade has already moved feasibility, so surfacing the chip in the same breath as the reflection prompt makes the movement legible.
- **Reuses `computeGoalRows`** from `src/lib/subjectGradeGoals.js` so all three grade-goal surfaces (banner, dashboard strip, weekly recap) compute identical feasibility tags from the same inputs. No chance of a "Locked in" chip on the banner disagreeing with a "Stretch" chip on the strip beneath it.
- **Translucent chip palette:** `SubjectGradeGoalsStrip` uses `bg-emerald-50` chips against the neutral page background — that wouldn't read against the banner's saturated warm/emerald gradient. New `bannerGoalChip` mapper uses `bg-emerald-400/30 text-white border-emerald-200/60` style overlays that read against any of the prep tone bands or the reflect-mode emerald palette.
- **Listeners:** new `goalsTick` state listens for `gg-subject-goal-changed` (same-tab) + `gg_subject_goal_*` storage events (cross-tab). A goal saved from `/Assignments` flips the banner chip without remount.
- **Why a student notices it:** the highest-glanced surface on the dashboard — the at-the-top countdown banner — now ties two committed-goal flows together. A student looking at "Bio in 3 days" who set "I want an A in Bio" three weeks ago now sees "Counts toward your A goal in Bio · now B+ · On track" right under the prep checklist. The test stops feeling like an isolated event and starts feeling like a pivot point on a saved trajectory.
  - feat: 2c9056b · https://github.com/landon-personal/gradeguardnewsync/commit/2c9056b

### Added (web) — "What's next" tips panel on the final onboarding step ✨

- **`src/pages/Onboarding.jsx`** — closes prior shift backlog (08:06 UTC #7). A brand-new student finishing onboarding lands on `/Dashboard` with no breadcrumb to the higher-leverage features behind it: subject grade goals (`GradeGoalCalculator` on `/Assignments`), the AI Study Assistant's quiz + flashcard tools, and the assignment/test-driven study plan generator. Until they wandered in by accident, those features were invisible.
- **What changed:** new indigo "Once you're in" tips panel renders below the last question (above the Finish Setup button) with three items: (1) add assignments + tests so the plan can rebuild, (2) **set a subject grade goal** once a few graded assignments land — pins to dashboard with a live feasibility chip, (3) use the Study Assistant for quizzes / summaries / flashcards.
- **Why specifically grade goals:** the prior shift's `f83a5a4` added a discoverability tip inside the `GradeGoalCalculator` panel — but that tip only reaches students who've already visited `/Assignments`. A brand-new account hasn't. The onboarding nudge closes that gap.
  - feat: 3118277 · https://github.com/landon-personal/gradeguardnewsync/commit/3118277

### Fixed (web) — `/Assignments` was silently un-deletable for ~3 weeks (since 2026-04-14)

- **`src/pages/Assignments.jsx`** — **concrete user-visible regression.** The trash icon on every assignment card silently did **nothing**. Tapping it ran `onDelete(assignment.id) → handleDeleteRequest(id) → setDeleteConfirm(id)` but no `<ConfirmDialog>` was rendered in the page tree, so `deleteConfirm` flipped state and the user saw zero modal. Assignments could not be deleted from the UI at all.
- **Root cause:** April-14 commit `484c836` introduced the `deleteConfirm`/`handleDeleteConfirm` flow, imported `ConfirmDialog`, and re-pointed `AssignmentCard`'s `onDelete` from the direct-mutate to `handleDeleteRequest`. But that commit never rendered the actual `<ConfirmDialog>` — and the `ConfirmDialog` import was later dropped during cleanup — so the click chain dead-ended in unread state for almost three weeks. The prior shift's ref-guard fix on `handleDeleteConfirm` (commit `6b8a98a`) was hardening a function nothing was calling.
- **Why this didn't surface in lint:** `handleDeleteConfirm` showed as an unused-vars warning the whole time but the file already has 9 other unused-vars warnings (XP toast, pending badges, several mutation-undo prevs) so it blended into the noise.
- **Fix:** re-import `ConfirmDialog`, render it at the bottom of the page tree mirroring the exact shape `Tests.jsx` already uses. `Tests.jsx` and `AdminDashboard.jsx` were unaffected — only `/Assignments` was broken.
  - fix: 5167843 · https://github.com/landon-personal/gradeguardnewsync/commit/5167843

---

## [Unreleased] — 2026-05-02 08:06 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Per-test prep checklist in `NextTestCountdown` 📋

- **`src/lib/testPrepChecklist.js`** (new) + **`src/components/tests/TestPrepChecklist.jsx`** (new) + **`src/components/dashboard/NextTestCountdown.jsx`** + **`src/pages/Tests.jsx`** — until this shift the dashboard's at-the-top countdown banner could tell a student "Bio test in 3 days" + display the daily-target progress bar, but had no surface to let them mentally check off the classic prep tasks ("did I review my notes? have I done practice problems? am I going to sleep early enough?"). The lower-on-page `TestStudyPlan` owns the per-day prescription, but it's date-keyed — there was no place to mark "I read my class notes once" in a way that survived reloads.
- **What changed:** the banner now embeds a 5-item checklist below the existing `TestConfidenceRater` panel, visible only when `days >= 0 && days <= 7` (matches the active prep window — earlier than that the lower-on-page `TestStudyPlan` already owns the prescription, and a 5-item tick sheet two weeks out feels like premature pressure). Items: Reviewed all topics · Read class notes · Reviewed flashcards · Did practice problems · Got 8+ hrs sleep. Each tap toggles + persists to `localStorage` keyed by `gg_test_prep_check_<testId>`. Progress bar above the rows recolors from purple → emerald and the header swaps to "You're prepped!" when all 5 are checked.
- **Storage shape:** `{ done: number[], ts: ISO string }`. Same defensive read/write posture as `testReflection` / `testConfidence` — Safari Private mode and sandboxed iframes throw on every storage call; those throws fall through to "no items checked" rather than crashing the banner. `gg-test-prep-check-changed` CustomEvent + cross-tab `storage` listener keeps the embedded UI in sync if the same student has the test open in /Tests in another tab.
- **Cleanup on test delete:** `Tests.jsx`'s delete mutation now calls `clearPrepChecklist(id)` alongside the existing `clearConfidence` / `clearReflection` / `clearTestPlanOffset` / `clearDeckMastery` cleanup so deleted tests don't leak orphan storage entries.
- **Why a student notices it:** the banner gains a tactile commitment dimension. A student looking at "Bio in 3 days" can now tap "Reviewed flashcards" once they're done, watch the progress bar climb to 60%, see the green pill at all-5-done. First in-banner surface for self-tracked prep — the existing `TestStudyPlan` and `TestConfidenceRater` are about the *what to do* and *how it feels*, this is the *did I do it*.
  - feat: ea5bb53 · https://github.com/landon-personal/gradeguardnewsync/commit/ea5bb53

### Improved (web) — `GradeGoalCalculator` discoverability nudge

- **`src/components/assignments/GradeGoalCalculator.jsx`** — closes prior shift backlog item #1 (06:13 UTC — "Goal text in onboarding"). First-time users opening the calculator on `/Assignments` had no breadcrumb that the new goal-saving feature even existed; you had to find the per-row Save button to discover it. New indigo tip line at the bottom of the expanded panel reads "Save a target to pin it on your Dashboard with a live feasibility chip" with a Target icon, sitting above the existing privacy footer in gray.
  - feat: f83a5a4 · https://github.com/landon-personal/gradeguardnewsync/commit/f83a5a4

### Fixed (web) — `MiniGames` MemoryMatch + TermGuesser replace `window.location.reload()` with replay-key state

- **`src/components/assistant/MiniGames.jsx`** — closes prior shift backlog item #7 (06:13 UTC — "Try Another / Play Again calls window.location.reload()"). Tapping "Play Again" on a finished MemoryMatch board or "Try Another" on a finished TermGuesser hard-reloaded the entire page — throwing away React Query cache, scroll position, the StudyAssistant route the student was on, and any intentional dashboard state in other tabs (the storage event still fires across tabs). Heavy hammer for a "play another round" interaction.
- **Fix:** add a `replayKey` state to each game; the LLM-generation effect's deps switch from `[]` (mount-only) to `[replayKey]` so a Play Again bump re-fires the LLM call without re-firing on parent rerenders. A state-reset block at the top of the effect wipes board / term / guess state so the new round starts clean. The mount-vs-rerender contract from the prior shift's fix (`8db39d4`) is preserved: skipping `tests` from the deps still prevents a parent rerender (fresh array reference) from burning quota or resetting the in-progress game.
  - fix: 7959c20 · https://github.com/landon-personal/gradeguardnewsync/commit/7959c20

### Fixed (web) — `FocusTimer` captures `document.title` at session start, not at mount

- **`src/pages/FocusTimer.jsx`** — exact same root cause as the FloatingPomodoro fix in `8174312` and the PomodoroWidget fix in `ba3e670`. `useRef(document.title)` ran during the FocusTimer render — synchronously, before Layout's title-effect for `/FocusTimer` had a chance to set "Focus Timer | GradeGuard". So a `/Dashboard → /FocusTimer` navigation captured "Dashboard | GradeGuard"; later when the student stopped the timer (or unmounted the page), the wrong title got restored.
- **Fix:** capture in the title-update effect when `running` first flips on, with the same `originalTitleRef.current === null` gate. Cleared after restore so a back-to-back start re-captures cleanly. Unmount cleanup gates on a non-null ref so a plain navigation away (no session ever started) doesn't restore "".
- **Refactor follow-up:** the first version of the fix put capture+restore in a cleanup that re-ran on every `secondsLeft` tick. Each tick caused two `document.title` writes (cleanup restored, effect re-set). Split into two effects: a per-tick write effect with `[running, secondsLeft, modeConfig.label]`, and a capture/restore effect with `[running]`. One write per tick on the happy path.
  - fix: 234ee34 · https://github.com/landon-personal/gradeguardnewsync/commit/234ee34
  - refactor: ff2e35a · https://github.com/landon-personal/gradeguardnewsync/commit/ff2e35a

### Fixed (web) — `TestPrepChecklist` + `TestCardReflection` re-hydrate when `testId` prop changes

- **`src/components/tests/TestPrepChecklist.jsx`** + **`src/components/tests/TestCardReflection.jsx`** — both components used `useState(() => loadX(testId))` for their initial state, but the lazy initializer only runs on mount. When a parent reuses the same component instance with a different `testId` prop, the prior test's state visually carries over until the next save/storage event nudges it.
- **Concrete repro paths:** `TestCardReflection` is embedded in `NextTestCountdown`'s reflect-mode banner, which picks the most-recent unreflected past test; once reflected, the banner re-picks the next unreflected test, the same component sees a new testId. `TestPrepChecklist` is embedded in `NextTestCountdown`'s upcoming-mode banner — when the soonest test passes and the next one becomes the active target, same problem.
- **Fix:** add a `[testId]` effect that calls `setX(loadX(testId))` on prop change. For `TestCardReflection` also resets editing/draft state so a half-typed grade % doesn't leak from one test to the next. Same shape `TestConfidenceRater` already uses for its own load-on-testId-change effect.
  - fix: 6a54cae · https://github.com/landon-personal/gradeguardnewsync/commit/6a54cae
  - fix: 105c2bf · https://github.com/landon-personal/gradeguardnewsync/commit/105c2bf

---

## [Unreleased] — 2026-05-02 06:13 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Goal-achievement celebration on `SubjectGradeGoalsStrip` 🎯

- **`src/lib/subjectGradeGoals.js`** + **`src/components/dashboard/SubjectGradeGoalsStrip.jsx`** — directly closes the prior shift backlog item ("Goal achievement celebration … no celebration moment when a saved goal flips to Locked in"). The new feature shipped at 2026-05-02 04:06 UTC let students pin a target letter per subject + see a feasibility chip, but flipping from Stretch → Locked in had zero payoff.
- **What changed:** `subjectGradeGoals.js` now persists a per-goal `celebratedAt` ISO stamp alongside `targetIdx` / `remaining`. New `markGoalCelebrated(email, subject)` + `clearGoalCelebration(email, subject)` helpers. `saveSubjectGoal` resets `celebratedAt = null` so re-saving a target lets the new bar earn fresh confetti when locked.
- **`SubjectGradeGoalsStrip` celebration effect:** detects rows where `tag === "locked"` AND the persisted `celebratedAt` is null AND the in-memory dedupe ref doesn't already hold the subject. For those subjects: stamp `celebratedAt`, fire one `canvas-confetti` volley (110 particles, emerald/teal/indigo/amber palette, top-center origin), and surface an animated `Just hit your goal!` pill (gradient emerald→teal, Sparkles icon) in the row for 6 seconds. The persisted stamp is the source of truth across reloads — the in-memory ref is just an extra guard for fast within-mount data shifts before the localStorage write propagates back through the `gg-subject-goal-changed` listener.
- **Dip-and-relock:** if a row that was previously celebrated drops back below locked (e.g., a poor grade lands and pushes feasibility to "stretch"), the effect quietly clears `celebratedAt`. Next time the student climbs back to locked, fresh confetti fires.
- **Re-save dedupe:** the `gg-subject-goal-changed` and `storage` listeners now also drop the subject from the in-memory ref so a NEW goal for the same subject (e.g., student bumps target from B+ to A) gets a fresh confetti moment if it's already locked-in. Without this, the in-memory ref would block a same-mount re-celebration even after `saveSubjectGoal` reset `celebratedAt: null` in storage.
- **Why a student notices it:** the strip now closes the loop that was missing on first ship. A student picks "I want an A in Math" → grades land → feasibility chip says "Stretch" → another grade lands → chip flips to "Locked in" → top-of-screen confetti volley + a green pill on the Math row says "Just hit your goal!" The commitment dimension now has a payoff dimension. First confetti moment in the goal-tracking flow at all.
  - feat: d225f5f · https://github.com/landon-personal/gradeguardnewsync/commit/d225f5f
  - fix: 87ee37f · https://github.com/landon-personal/gradeguardnewsync/commit/87ee37f

### Added (web) — Saved grade goals strip in `WeeklyRecapModal` 🎯

- **`src/components/dashboard/WeeklyRecapModal.jsx`** + **`src/lib/subjectGradeGoals.js`** — closes the prior shift backlog item #1 ("Per-subject grade goal could surface in WeeklyRecapModal"). The Sunday recap modal already surfaced focus minutes / intention rate / focus-minute subject goals / top subjects / coming up — but ignored the new grade-goal feature entirely. A weekly recap is the perfect surface for a feasibility readout because the full week of new grades has just landed.
- **What changed:** new `gradeGoalRows` memo on the modal pulls `loadAllSubjectGoals(userEmail)` + the assignment list and runs them through a shared `computeGoalRows` helper extracted from `SubjectGradeGoalsStrip`. New "Grade goal progress" section with a Trophy icon header sits between "Focus minute goals this week" (renamed from the now-ambiguous "Subject goals this week") and "Where your week went" — the modal now reads top-to-bottom as: stats grid → intention completion → distraction patterns → focus-minute goals → grade goals → top subjects → coming up. Each section is independently null-gated so a fresh-account modal stays compact.
- **Each row:** subject color dot, name, current letter / pct → target letter, feasibility chip ("Locked in" / "On track" / "Stretch" / "Out of reach"). Hover gives the same `requiredText` tooltip the calculator + dashboard strip use ("Need ~83% on next 4 assignments"). Sort is stable: most-attention-needed first → alpha within tier.
- **Shared `computeGoalRows` helper** lives in `src/lib/subjectGradeGoals.js`. The dashboard strip was refactored to call it too — so both surfaces are guaranteed to compute identical feasibility tags from the same inputs. `gradeUtils` is injected as a `helpers` object instead of imported at the lib level so the lib stays free of cross-deps; the two callers already had gradeUtils imported anyway.
- **Why a student notices it:** the Sunday recap is the modal a student actually reads for "how was my week?" Until now the recap could say "you completed 7 assignments" without ever showing whether those completions moved the needle on their committed grade goal. Now: a row per saved goal, with the chip live-recomputed against this week's grades. A student who set "A in Bio" in October and completed 4 Bio assignments this week sees whether those 4 grades pushed them from "Stretch" to "On track" right in the recap.
  - feat: a933d8c · https://github.com/landon-personal/gradeguardnewsync/commit/a933d8c

### Fixed (web) — `BadgeUnlockToast` pins `onDone` in a ref so parent rerenders don't restart the dismiss timer

- **`src/components/gamification/BadgeUnlockToast.jsx`** — the dismiss-timer effect had `[onDone]` as its dependency array. The lone caller (`pages/Assignments.jsx:386`) passes `onDone` as an inline arrow (`onDone={() => setPendingBadges(prev => prev.slice(1))}`), so every parent rerender hands the toast a fresh function reference, the effect re-runs, the cleanup clears the in-flight 3.6s timer, and a NEW 3.6s timer starts. Concrete repro: student unlocks a badge while a useQuery for assignments is also running its 60s refetch → the refetch completes mid-toast → parent rerenders → toast timer resets → toast stays visible an extra 3.6s. With multiple refetches landing in sequence (notification poll, focus-history bump, etc.), the badge could stay onscreen indefinitely.
- **Fix:** pin the latest `onDone` in a `useRef` updated by an effect, then make the timer effect mount-only `[]` and read `onDoneRef.current()` from the ref. Same well-trodden React pattern other long-lived timers in this codebase use (FloatingStreakCounter, NextTestCountdown's `clockTick` rollover, etc.). The toast now reliably dismisses 3.6s after first paint regardless of how many times the parent rerenders mid-window.
  - fix: 14897cd · https://github.com/landon-personal/gradeguardnewsync/commit/14897cd

---

## [Unreleased] — 2026-05-02 04:06 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Persisted subject grade goals + glanceable Dashboard strip 🎯

- **`src/lib/subjectGradeGoals.js`** (new) + **`src/components/assignments/GradeGoalCalculator.jsx`** + **`src/components/dashboard/SubjectGradeGoalsStrip.jsx`** (new) + **`src/pages/Dashboard.jsx`** — until this shift, the GradeGoalCalculator on `/Assignments` stored target letter and remaining-assignment count in React state only. Every parent rerender (or page reload) reset both back to the auto-derived next-letter-up + pending-count defaults — so a student couldn't actually "set" a goal across sessions, and there was no glanceable surface anywhere else in the app to track those goals as new grades landed.
- **What changed:** the calculator now persists each row's (target, remaining) pair to `localStorage` keyed by `(user_email, subject)` under `gg_subject_goal_<email>__<subject>`. Each row restores the saved picks on mount, shows a "Saved" pill + "Update goal" / "Clear" controls, and dispatches `gg-subject-goal-changed` so a new dashboard strip refreshes without remount. Same defensive read/write posture as `testReflection` / `testConfidence` — Safari Private mode and sandboxed iframes fall through to "no goal" rather than crashing the calculator.
- **New `SubjectGradeGoalsStrip` on the Dashboard** (between `SubjectGoalsStrip` and `WorkloadForecast`, wired with a `gg-subject-goal-changed` + cross-tab `storage` listener) auto-hides until at least one goal is saved. Each row shows: subject color dot, name, current letter / pct, target letter, and a feasibility chip (`Locked in` / `On track` / `Stretch` / `Out of reach`) computed live from the same `requiredAverage` + `feasibility` helpers the calculator uses. Tap "Edit" → `/Assignments` to manage goals. Sort order: most-attention-needed first (out of reach → stretch → unknown → on track → locked in), alpha within tier so order is stable across renders.
- **Why a student notices it:** before this shift, the GradeGoalCalculator was a one-shot calculation panel — open, tweak target, see required average, close, forget. There was no commitment dimension. Now a student picks "I want an A in Math by end of term" once, hits Save, and that goal follows them around the app: it's pinned on the Dashboard's main scroll surface with a live feasibility badge that updates every time a new assignment grade lands. The same calculator on `/Assignments` shows the saved pill so they know they've committed to it.
  - feat: 95ab57b · https://github.com/landon-personal/gradeguardnewsync/commit/95ab57b

### Fixed (web) — `FlashcardViewer.handleMark` clears pending step-timer before queuing auto-advance

- **`src/components/assistant/FlashcardViewer.jsx`** — line 149 set `stepTimerRef.current = setTimeout(...)` without first clearing the prior timer. A fast double-mark on "mastered" (or marking "mastered" while `goTo`'s 50ms flip-reset timer was still queued) overwrote the ref's id without clearing the previous timer — leaking it until component unmount. Tiny leak; not user-visible. Closes the FlashcardViewer item from the prior shift's backlog (2026-05-02 02:08 UTC).
  - fix: 072d270 · https://github.com/landon-personal/gradeguardnewsync/commit/072d270

### Fixed (web) — `Tests.handleDeleteConfirm` ref-guards against fast double-tap on AlertDialog confirm

- **`src/pages/Tests.jsx`** — a very fast double-click on the AlertDialog confirm button could fire `deleteMutation.mutate(deleteConfirm)` twice with the same id (the `useCallback` memo deps haven't re-evaluated yet between the two clicks, so `deleteConfirm` still holds the same id; `setDeleteConfirm(null)` is async). The second mutation hit a 404 silently. AlertDialog usually focus-traps — narrowing the window — but a `useRef` flag wired through the mutation's `onSettled` callback closes it cleanly without depending on focus behavior. Closes the Tests double-click race item from the prior shift's backlog.
  - fix: b3f3b39 · https://github.com/landon-personal/gradeguardnewsync/commit/b3f3b39

### Fixed (web) — `Assignments.handleDeleteConfirm` ref-guards against fast double-tap

- **`src/pages/Assignments.jsx`** — exact same root cause as the Tests fix above. Confirm-dialog double-tap fires `deleteMutation.mutate` twice; second hits a 404 silently. Aligns Assignments with the same ref-guard shape Tests now uses (in-flight ref set on click, released via the mutation's `onSettled`).
  - fix: 6b8a98a · https://github.com/landon-personal/gradeguardnewsync/commit/6b8a98a

### Fixed (web) — `MiniGames` LightningRound / MemoryMatch / HiddenTerm lock LLM calls to mount-only

- **`src/components/assistant/MiniGames.jsx`** — all three games had `useEffect` deps `[tests]` guarding their `InvokeLLM` call. Any parent rerender that handed in a fresh `tests` array reference (no upstream memoization in the modal that hosts the games) would re-fire the LLM call — burning quota AND resetting the in-progress game state (questions/score for LightningRound, shuffled pairs for MemoryMatch, the hidden term for HiddenTerm). Switch all three to `[]` (mount-only) with eslint-disable + a comment explaining the contract. The questions / pairs / term aren't going to update mid-game anyway, so this is the right contract. Closes the LightningRound regen item flagged 4+ shifts running, with the same fix applied to the other two games.
  - fix: 8db39d4 · https://github.com/landon-personal/gradeguardnewsync/commit/8db39d4

### Chore (web) — `TodaysFocusCard` strips 40 trailing blank lines

- **`src/components/dashboard/TodaysFocusCard.jsx`** — cosmetic. The file just had a tall block of blank lines between the return statement and the closing function brace. No behavior change.
  - chore: f3a57e0 · https://github.com/landon-personal/gradeguardnewsync/commit/f3a57e0

---

## [Unreleased] — 2026-05-02 02:08 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subject filter chips on the `/Achievements` test outcome timeline 🎯

- **`src/components/gamification/TestOutcomeTimeline.jsx`** — the chronological reflection journal panel on `/Achievements` now slices by subject. Above the distribution bar, when 2+ subjects have logged reflections, a horizontally-scrolling chip row renders an "All" pill plus one chip per subject (subject color dot + name + count badge). Tap a chip and the header strip (`X tests logged · avg outcome · solid+ count`), the stacked outcome distribution bar, and the 12-row timeline all recompute against just that subject's reflections.
- **Why a student notices it:** until now the timeline was a passive scrolling journal. The all-subjects view answers "how is the year going?" but a student who just bombed a History test wants to see "is this a streak or a one-off?" — and that requires filtering to History alone. With 8 reflections across 3 subjects, tapping Math collapses the panel to 5 Math entries, the distribution bar redraws to Math's spread, and the avg-outcome chip recomputes. The data was already loaded; it just wasn't slice-able. New for student exploration.
- **Implementation notes:** the per-subject reflection set is computed once in a memo (`subjectCounts`) and the active-filter slice runs in a downstream memo, so a chip tap is a pure derived re-render — no re-walk of localStorage. The chip row hides itself with only one named subject (a single chip alongside "All" is just clutter). When the active subject's last reflection is deleted between renders, an effect drops the filter back to "All" so the panel can never get stuck on an empty slice. Header counter switches from `N tests reflected` → `N of M` while filtered so a student knows the slice is active. Empty-subject rows (test deleted server-side, reflection blob orphaned) are excluded from the chip row but still appear under "All" — same posture the panel already used for "Unknown test" rows.
  - feat: 58c1d66 · https://github.com/landon-personal/gradeguardnewsync/commit/58c1d66

### Fixed (web) — `FloatingPomodoro` snapshots `document.title` at start, not at mount

- **`src/components/layout/FloatingPomodoro.jsx`** — the global floating widget snapshotted `document.title` at mount via `useRef(document.title)`. But `Layout.jsx:74` updates `document.title` on every route change, so the mount-time snapshot was the title of whatever page the user happened to land on FIRST when the FloatingPomodoro mounted. Every subsequent reset (or unmount) restored the title to that stale page name regardless of where the student actually was.
- Concrete repro: student lands on /Dashboard (title becomes "Dashboard | GradeGuard", FloatingPomodoro mounts and captures it), navigates to /Tests (title becomes "Tests & Exams | GradeGuard"), opens the floating timer, starts a Focus, then hits Reset. Title goes back to "Dashboard | GradeGuard" — wrong page.
- Fix: capture the title in `start()` right before the first override (`originalTitleRef.current === null` guard so a second start within the same session doesn't overwrite the original capture with our own pomodoro string), and clear the ref to `null` after restore so the next session starts fresh. New `restoreTitle()` helper centralizes the read-and-clear pattern.
  - fix: 8174312 · https://github.com/landon-personal/gradeguardnewsync/commit/8174312

### Fixed (web) — `Friends` sendMessageMutation onError handles undefined `error.message`

- **`src/pages/Friends.jsx`** — the message-send mutation's onError read `error.message` directly with no optional chain and no fallback. A rejection from a non-Error throw (or an Error with no `.message`) toasted the literal string `undefined` to the student. Same hardening pattern shipped recently for `addFriendMutation` on this file (commit `29d5d5e`) — `sendMessageMutation` was missed.
- Also stops painting the persistent "Message blocked: …" warning panel above the input for non-moderation errors. The blocked-warning panel now only renders when the server actually returned a moderation reason in `response.data.reason` or `response.data.error`. A generic network timeout reads as a transient toast only — no stuck red panel reading "Message blocked: Message took too long to send" when the server never blocked anything.
  - fix: 003705e · https://github.com/landon-personal/gradeguardnewsync/commit/003705e

### Fixed (web) — `PomodoroWidget` (Dashboard) snapshots title at first override, not at mount

- **`src/components/dashboard/PomodoroWidget.jsx`** — same root cause as the FloatingPomodoro fix above. The Dashboard's collapsible Pomodoro widget captured `document.title` at mount, but PomodoroWidget remounts each time the user navigates to /Dashboard, and at that moment `document.title` still holds the previous page's title (the Layout title-effect for the new page hasn't run yet — useRef initial values run synchronously during render, useEffect fires after commit). On a /Tests → /Dashboard navigation, the widget captured `Tests & Exams | GradeGuard`; a later reset on Dashboard restored to that title.
- Fix: capture in the title-update effect when `running` first flips on, with the same `originalTitleRef.current === null` gate as FloatingPomodoro. The else branch (running false, not active) clears the ref after restore so a back-to-back start re-captures the now-correct page title. Unmount cleanup also gates on the ref being non-null so it doesn't restore a never-captured title to "" on plain navigation away from /Dashboard.
  - fix: ba3e670 · https://github.com/landon-personal/gradeguardnewsync/commit/ba3e670

### Fixed (web) — `useNotifications` `inFlightRef` now released via try/finally

- **`src/components/notifications/useNotifications.jsx`** — `checkAndNotify` set `inFlightRef.current = true` near the top to gate against duplicate fires during a refetch storm, and reset it to `false` at the very bottom. Anywhere in between (an unexpected throw in the assignments/tests filter chain, a malformed date going through `parseLocalDate` → `differenceInDays`, a synchronous throw from `secureEntity` itself before its own try/catch) propagated to the upstream `.catch(() => {})` in the useEffect and left the ref stuck at `true` for the rest of the session. Every later run hits the inFlight gate at the top and bails — silently disabling notifications.
- Wraps the body in try/finally so the gate always releases regardless of where a throw happens. Same pattern other long-lived async handlers in this codebase use (Tests/Assignments mutations, the AI handlers in StudyAssistant, etc.). No behavioral change on the happy path.
  - fix: 99de4bc · https://github.com/landon-personal/gradeguardnewsync/commit/99de4bc

---

## [Unreleased] — 2026-05-02 00:17 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Post-test reflection prompt in `NextTestCountdown` 🎯

- **`src/components/dashboard/NextTestCountdown.jsx`** — closes prior shift backlog flagged **5+ shifts running** ("Reflection in `NextTestCountdown` for tests that just happened"). The dashboard's at-the-top banner used to vanish entirely once `differenceInDays(test_date, today) < 0` for every upcoming test in its 14-day window. A student who took their last test on Friday and opened the dashboard Saturday saw nothing where the countdown banner used to be — even if they hadn't logged how the test went yet.
- Now: when there's no upcoming test in the 14-day window AND there's an unreflected past test in the last 7 days, the banner falls back to a "How did it go?" reflection prompt for that test. Most-recent past test wins (closest to 0 from below). Distinct emerald gradient (`from-emerald-500 to-teal-600`) instead of the warm prep palette so a student instantly registers the shift from "prep urgency" → "retrospective" without reading the headline. New banner header shows `N DAYS AGO` (or `1 DAY AGO`) in the same big-numeric tile pattern as the countdown days, and embeds the existing `TestCardReflection` picker — same lib + storage shape (`gg_test_reflection_<testId>`) the dashboard's `TestReflectionCard` and the `/Tests` page rows already use.
- **Live re-evaluation:** new `reflectTick` state listens for `gg-test-reflection-changed` (same-tab) and `storage` events on `gg_test_reflection_*` keys (cross-tab). When the student saves a reflection from the embedded picker (or from any other surface — dashboard card, /Tests row, /Achievements timeline view), the `target` memo re-runs: now the just-reflected test fails the `if (loadReflection(t.id)) continue` skip-check, the banner naturally transitions to the next upcoming test (if one's now in range) or hides entirely. No remount, no flash.
- **Why upcoming wins outright:** when a student has a test next week, prep beats retrospect on the at-the-top hero spot. The lower-on-page `TestReflectionCard` still surfaces unreflected past tests up to 14 days back as a separate list — the banner is the *single most important task right now* surface, not a catch-up list.
- **Why a student notices it:** the banner is the dashboard's most-glanced surface. Until now it had a one-way data flow — prompt prep, then disappear. Now it closes the loop: "Bio in 3 days" → "0 TODAY" → "1 DAY AGO — how did it go?" → tap a chip → next test takes the slot. A student who's just walked out of their last test of the week opens the dashboard and the first thing they see asks for a reflection while it's fresh, instead of forgetting until the dashboard's TestReflectionCard nudges them days later.
  - feat: 527874c · https://github.com/landon-personal/gradeguardnewsync/commit/527874c

### Fixed (web) — `addFriendMutation` onError tolerates errors with no message

- **`src/pages/Friends.jsx`** — every other `onError` handler in this file used the `error?.message || "Couldn't ... Please try again."` fallback pattern. `addFriendMutation` alone read `error.message` directly without the optional-chain guard. The mutationFn's own thrown errors (`new Error("Friend code not found.")`) were always fine, but an unexpected non-Error throw from the upstream `secureEntity("StudentProfile").filter` (network glitch, sandbox SecurityError, etc.) — or any Error with no `.message` — would have toasted `undefined` to the student. Aligns the file with itself; no behavioral change on the happy / known-error paths.
  - fix: 29d5d5e · https://github.com/landon-personal/gradeguardnewsync/commit/29d5d5e

---

## [Unreleased] — 2026-05-01 22:27 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test outcome timeline panel on `/Achievements` 🎯

- **`src/components/gamification/TestOutcomeTimeline.jsx`** (new, ~210 lines) + **`src/pages/Achievements.jsx`** — `/Achievements` now surfaces test reflection data for the first time. New panel between `PersonalBests` and the Leaderboard renders the student's chronological test-outcome journal: every saved reflection, joined to the test name + subject color, ordered newest-first. Three sections gated by sample size:
  - **Header strip (always when 1+ reflections):** count of reflections logged, average outcome label (Bombed → Aced), count or % of "Solid+" outcomes (4 or 5 — the "this went well" cluster).
  - **Stacked outcome distribution bar (>= 3 reflections):** five-segment horizontal bar with each outcome's share by raw count, plus an emoji+count legend underneath. Below 3 samples a single "Bombed" pinning 100% of the bar would mislead, so the bar only kicks in once there's enough to read against.
  - **Chronological timeline (newest first, capped at 12 rows):** subject color dot, test name, subject + relative date ("today" / "3 days ago" / "last week" / "Apr 12"), optional grade %, outcome chip ([💀 Bombed] / [😬 Struggled] / [😐 Okay] / [🙂 Solid] / [🎉 Aced]). 13th+ entry shows a quiet "X more reflections in your record" footer so a power-user student knows the panel isn't truncating data, just the visible window.
- **Different from existing surfaces:** `TestReflectionCard` (Dashboard) is a *prompt* surface for unrated past tests in the last 14 days plus a calibration-insight strip. `PersonalBests` extracts lifetime *records* (longest streak, biggest test climb). `GradeTrends` shows numeric grade-over-time. None of them showed the actual *story* of every test outcome — the journal of how the year is going, in order, with the optional grade % the student attached. First time `/Achievements` reads `gg_test_reflection_*` localStorage at all.
- **Loading:** new `['tests-all', userEmail]` queryKey on `/Achievements` fetches every test (not just upcoming) — distinct from the Dashboard's `['tests', userEmail]` (which filters to upcoming-only) so the two surfaces don't fight over cache. The timeline joins test ids to names + subjects via this fetched list; reflections whose test was deleted server-side render as "Unknown test" so a stale localStorage entry doesn't disappear from the journal silently.
- **Live refresh:** listens for `gg-test-reflection-changed` (same-tab) and `storage` events on `gg_test_reflection_*` keys (cross-tab) so a student logging a reflection from the Dashboard or `/Tests` sees the timeline update without remount.
- **Auto-hides** until the first reflection lands — `/Achievements` already has a sparse empty state for brand-new accounts via PersonalBests gating; piling on a "no test reflections yet" tile would just be noise.
- **Why a student notices it:** `/Achievements` is the "how am I doing" page, but until now it captured streaks + XP + flashcard progress without surfacing test outcomes — the actual end-of-the-year question every student cares about. A student with 8 logged reflections opens `/Achievements` and sees their full test journal at a glance, including which tests they aced and which ones tanked, in the same panel.
  - feat: a5ecb23 · https://github.com/landon-personal/gradeguardnewsync/commit/a5ecb23

### Fixed (web) — Test delete now clears reflection + study-plan offset localStorage

- **`src/pages/Tests.jsx`** + **`src/lib/testStudyPlan.js`** — `Tests.deleteMutation` already cleaned up `gg_test_confidence_<id>` + the flashcard mastery deck on delete. Two newer per-test localStorage keys had been added since but missed the cleanup pass: `gg_test_reflection_<id>` (post-test outcome rating) and `gg_test_study_plan_offset_<id>` (per-test +5/−5 daily target tweak). Both leaked silently when a student deleted a test. Functionally harmless on its own, but the new `TestOutcomeTimeline` walks every reflection key in localStorage, so deleted tests reappeared in the journal as "Unknown test" rows because the entity was gone but the reflection blob was still there. Adds a `clearOffset()` helper to `testStudyPlan.js` (`clearReflection` already existed in `testReflection.js`) and wires both into the deleteMutation onSuccess path next to the existing cleanup calls.
  - fix: fec5800 · https://github.com/landon-personal/gradeguardnewsync/commit/fec5800

### Fixed (web) — `StudySchedule` surfaces a "From yesterday" banner when the schedule crosses midnight

- **`src/components/dashboard/StudySchedule.jsx`** — closes prior shift backlog (20:11 UTC #3). The schedule prompt embeds today's wall-date string at generation time (`Today's date: 2026-05-01`), and the LLM writes blocks with phrasing like "tonight" / "right after school" / "before bed" — all relative to the moment of generation. A student who generated a schedule at 11:55 PM, then opened the dashboard the next morning, was acting on yesterday's plan with no visible signal.
- Stamps the schedule's local-date key into state at `setSchedule` time. Self-rescheduling `clockTick` at next local midnight bumps state when the wall date rolls (so a student who left the dashboard open across midnight sees the staleness immediately, not after the next interaction). When `scheduleDateKey !== today's localDateKey`, an amber "From yesterday" banner with a "Refresh for today" button renders in-place above the daily tip — one-tap regenerate without scrolling up to the header Refresh. Banner hides while `loading` so the UI doesn't flash the warning during the rebuild itself.
  - fix: 5b7e086 · https://github.com/landon-personal/gradeguardnewsync/commit/5b7e086

---

## [Unreleased] — 2026-05-01 20:11 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Distraction insights strip in `WeeklyRecapModal` 🎯

- **`src/components/dashboard/WeeklyRecapModal.jsx`** — closes prior shift backlog (18:26 UTC #1, "WeeklyRecapModal pulls Mon–Sun aggregates but ignores the optional distractions field entirely"). The Sunday recap modal already loads `gg_focus_sessions_<date>` for Mon–Sun and runs through it twice (focus minutes + intention completion). It was ignoring `s.distractions` entirely. Adds a sibling `previousWeekRange()` helper + a separate `lastWeekFocusSessions` memo so the new strip can show a vs-last-week trend chip with the same ±2 deadband `DeepWorkInsights` already uses (a 1–2 distraction noise swing reads as "Steady" rather than a misleading +1 trend).
- Strip lives between the intention-completion strip and the subject-goals strip, so the modal now reads top-to-bottom as: stats grid → intention completion → distraction patterns → subject goals → top subjects → coming up. Each section is independently null-gated so a fresh-account modal stays compact.
- **Auto-hides** when (a) no work sessions logged this week (no signal at all) or (b) zero distractions across both this AND last week (feature unused → showing "0 distractions, no trend" would be noise). The trend chip itself only renders when last week had any data so a brand-new account can't see a misleading "+0 vs nothing" pill.
- Headline: `X distraction(s) this week` with a sub-line `N of M sessions ran clean (P%)`. Mirrors the `DeepWorkInsights` clean-session % semantics so both cards agree on what "clean" means (a session with no logged taps).
- **Why a student notices it:** the Sunday recap is the modal a student actually *reads* for "how was my week?" The previous version surfaced focus minutes, intention pct, subject goals, top subjects, coming-up — all the *output* dimensions. Distractions are an *input* dimension (how present was I?), and seeing it next to the output gives the week a fuller picture. A student seeing "62 min, 78% intention pct, 4 distractions (down 5 from last week)" gets a different story than just the output stats.
  - feat: a351ddc · https://github.com/landon-personal/gradeguardnewsync/commit/a351ddc

### Added (web) — Clean focus streak tile in `PersonalBests` on `/Achievements` 🎯

- **`src/components/gamification/PersonalBests.jsx`** — closes prior shift backlog (18:26 UTC #2 distraction streak surface + #4 promote distraction insight to /Achievements, in the same commit). 7th personal-best tile: longest run of consecutive calendar days where the student had at least one focus session AND every session ran with zero logged distractions. Days with no focus session at all break the streak — "I didn't study" isn't the same record as "I studied and stayed focused", so the empty-day-counts-as-clean shortcut is intentionally rejected.
- **Gating:** only renders when the student has logged at least one distraction tap somewhere in their 365-day window. Otherwise the record is meaningless ("every day with a session" is "clean" by default when the feature was never engaged with) and the tile would mislead. A student who *has* logged distractions but never strung even one clean day surfaces "0 days · run a focus session with no distractions tapped" as a call-to-action — the tile still earns its grid slot.
- **Adjacency check** requires both endpoints of a streak day to actually be clean days. So a 4-clean / 1-noisy / 3-clean week reads as a 4-day record, not 7. Walks oldest → newest using a Set of `YYYY-MM-DD` keys so calendar-day exactness doesn't get warped by DST or the user's local timezone offset.
- **Why a student notices it:** first time the gamification page reads the `gg_focus_sessions_*` distraction field at all. PersonalBests is the dashboard's "all-time records" panel — the rest of the tiles (longest streak, most focus / day, best week, Pomodoros / day, biggest test climb, cards mastered) are what a student naturally tries to top each week. The clean-streak tile gives the distraction tap-counter feature a first-class lifetime record to chase, alongside the existing intra-window insights on `DeepWorkInsights`.
  - feat: 3acd611 · https://github.com/landon-personal/gradeguardnewsync/commit/3acd611

### Fixed (web) — Same-card double-tap no longer self-matches in `MemoryMatch`

- **`src/components/assistant/MiniGames.jsx`** — `handleFlip`'s bail-out only checked `matched.has(idx) || flipped.size >= 2`. A user double-tapping the same card on the second flip slipped through (`flipped.size` was still 1 because adding a value already in the Set is a no-op), the timeout ran with `first === idx`, and the trivially-true `pairs[first].pair === pairs[idx].pair` comparison marked the card as matched on its own — score and progress counter both advanced as if a real pair had been found, and the card stayed face-up. Adds `flipped.has(idx)` to the guard so second-tap-same-card is a no-op. Found via the bug-hunting playbook on a deliberate read of game state machines.
  - fix: 56bc665 · https://github.com/landon-personal/gradeguardnewsync/commit/56bc665

### Fixed (web) — `AIProgressBar` no longer resets to step 0 on parent re-render in uncontrolled mode

- **`src/components/ai/AIProgressBar.jsx`** — the effect dep was the raw `statuses` array. A caller passing an inline-literal (`statuses={["A","B","C"]}`) gives a fresh reference every render, so the effect re-ran on every parent commit, `setInternalActiveIndex(0)` reset the bar, and the interval restarted — the visible progress would snap back to "Sending request" mid-animation each time the parent committed. Re-keys on `statuses.length` instead. The inner loop's only structural read is `Math.min(index + 1, statuses.length - 1)`, so length is the load-bearing dimension; label-only edits stop resetting the bar (the right tradeoff for uncontrolled mode — controlled mode handles streaming labels via `activeIndex`). No current caller actually trips this (TestForm, AssignmentForm, MiniGames callers all use the default DEFAULT_STATUSES module constant; SmartTodoList and StudyAssistant use controlled mode), but a future caller passing custom inline statuses without `activeIndex` would have hit it silently.
  - fix: 835377a · https://github.com/landon-personal/gradeguardnewsync/commit/835377a

---

## [Unreleased] — 2026-05-01 18:26 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — `DeepWorkInsights` card on `/FocusTimer` 🎯

- **`src/components/dashboard/DeepWorkInsights.jsx`** (new, ~210 lines) + **`src/pages/FocusTimer.jsx`** — closes the explicit setup line in the 08:13 UTC shift's distraction tap-counter feature ("Sets up future surfaces (e.g., 'you get distracted most around 8 PM' in TimeOfDayFocusPattern) once enough data lands"). The optional in-session distraction tap-counter (shipped 08:13 UTC) was a write-only feature — every other surface that read distractions was per-session (the today's-sessions header pill, the focus-history modal row badges). No surface aggregated *across* sessions to surface patterns. Now `DeepWorkInsights` lives on /FocusTimer right under `TimeOfDayFocusPattern`. Trailing 4-week window (tighter than `TimeOfDayFocusPattern`'s 12 weeks because behavior + environment shifts faster than focus rhythm). Auto-hides when the student has never engaged with the feature (zero distractions in the window) so a fresh-start student doesn't see clutter.
- Surfaces:
  - **Headline insight:** "You logged X distractions this week, compared to Y last week. They cluster around 7 PM on Wednesdays." Single sentence, scannable. Day suffix only fires when the peak day has ≥3 distractions in the window so a single noisy session doesn't pin a weekday.
  - **Three stat cards:** total distractions across 4 weeks (amber), clean-session % (sessions with no logged distractions, emerald), and a vs-last-week trend chip (green when down, rose when up, gray "Steady" inside a ±2 deadband so a 1-2 distraction noise swing doesn't read as a trend).
  - **Hour-of-day distraction strip:** 5 AM → 11 PM band, parallel to `TimeOfDayFocusPattern`'s focus-minute strip directly above. Bars are amber (distraction) instead of indigo (focus) so the two charts read as a contrasting pair — a student instantly sees that their peak focus hour and peak distraction hour overlap (or, more usefully, *don't*).
- **Why a student notices it:** previously tracking distractions paid off only inside an individual session ("I tapped 5 times today, oof"). The accumulated value — "Wednesday evenings are a black hole, schedule something else then" — was hidden. First aggregate surface for the distraction dimension. Sets up a future "distraction streak" surface (consecutive days with zero logged distractions) once enough data lands.
- `loadFocusHistory()` updated to pass `distractions` through into the 12-week history list (was previously dropped). Sessions without logged taps still store nothing — the missing field is intentionally distinct from a 0 — but for aggregation purposes the loader treats missing as 0.
  - feat: f75ad05 · https://github.com/landon-personal/gradeguardnewsync/commit/f75ad05

### Polish (web) — Per-day distraction count in `FocusSessionHistoryModal` group header

- **`src/components/dashboard/FocusSessionHistoryModal.jsx`** — the day-grouped session log already showed per-row distraction badges + "X focus min" in the day header, but a rolled-up "this day had N distractions" was hidden until the student manually scanned each row. Adds a small amber bell pill next to the focus-min summary on any day where work sessions had any logged distractions, with a tooltip ("3 distractions logged on Wednesday"). Days with no distractions stay visually unchanged so days where the feature wasn't engaged with don't pick up new chrome.
  - polish: 5db03e0 · https://github.com/landon-personal/gradeguardnewsync/commit/5db03e0

---

## [Unreleased] — 2026-05-01 16:16 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Per-subject reflection breakdown in `TestReflectionCard` 🎯

- **`src/components/dashboard/TestReflectionCard.jsx`** + **`src/lib/testReflection.js`** — closes prior shift backlog (14:02 UTC #2, 12:29 UTC #2, 10:04 UTC #5, flagged 4 shifts running). Once a student has 2+ saved test reflections (across any subjects), the card grows a "By subject" section under the calibration insight strip. Each row shows the subject's color dot, a chronological emoji strip of the last 5 outcomes (oldest → newest left to right), and an avg-outcome chip (Bombed → Aced) tinted by the matching outcome tone. When a subject has 3+ reflections that ALSO had a pre-test confidence rating, the row picks up a per-subject calibration hint ("underrates self" / "overrates self") — same family as the existing aggregate insight, but actionable on a subject-by-subject basis (a student might be well-calibrated for English but consistently overrate Math).
- **New helper `subjectReflectionBreakdown(tests, reflectionMap, getConfidence)`** in `testReflection.js` — pure derivation, no I/O, takes the loaded maps + a confidence accessor so the React layer stays in charge of when to recompute. Sorted: most-reflected subjects first, alpha for ties so order is stable across re-renders.
- **Why a student notices it:** different signal from `GradeTrends`, which shows numeric trends (a 95% or a 70%). This captures qualitative *experience* (felt 'aced' vs. 'bombed'). A student can ace a 70%-by-curve and feel they aced it, or get 95% by luck and feel they barely passed. Outcome rating tells that story; raw score doesn't. First time the dashboard has any subject-level outcome surface at all.
  - feat: 323e611 · https://github.com/landon-personal/gradeguardnewsync/commit/323e611

### Fixed (web) — Three more midnight-rollover surfaces

Same pattern shipped across ~15 dashboard components in prior shifts: a date is captured at top of render but the surface never re-renders on its own at the wall-clock boundary. Each one applies the same self-rescheduling `clockTick` + `setTimeout` to next local midnight pattern.

- **`src/pages/Achievements.jsx`** — closes prior shift backlog (14:02 UTC #7). Page-level streak (`calcStreak(assignments)`) ran at top of render and captured `startOfDay(new Date())` internally; a student who left /Achievements open across midnight saw yesterday's streak number until assignments refetched. The hero stats (Day Streak / Total XP / etc.) are visually loud — vanity surfaces are the obvious failure mode for not refreshing. fix: 9b84816 · https://github.com/landon-personal/gradeguardnewsync/commit/9b84816
- **`src/pages/Tests.jsx`** — `today` was captured at top of render but the page never re-rendered on its own. A student whose test had `test_date = today` saw it stay in `upcomingTests` instead of flipping into `pastTests` at midnight. fix: 04f2dda · https://github.com/landon-personal/gradeguardnewsync/commit/04f2dda
- **`src/pages/Assignments.jsx`** — `dueTodayCount` and `overdueCount` (rendered as the "Due today · N" filter chip + matching search filter) captured `todayStr` at top of render. A student leaving /Assignments open across midnight saw yesterday's "Due today" pill until something else triggered a re-render. fix: 3c031d6 · https://github.com/landon-personal/gradeguardnewsync/commit/3c031d6
- **`src/pages/FocusTimer.jsx`** — `sessionsToday` was seeded from `gg_focus_sessions_<today>` at mount and never re-read at the wall-clock boundary. A student leaving /FocusTimer open as midnight crossed saw yesterday's session count + this-week minutes display stay pinned until a new session landed. The timeout payload now also pulls a fresh `loadTodaySessions()` for the new day's bucket; downstream memos (`focusHistory`, `weekMinutes`, per-day pace, goal-met badge) re-derive naturally. fix: 3b6a5f3 · https://github.com/landon-personal/gradeguardnewsync/commit/3b6a5f3

---

## [Unreleased] — 2026-05-01 14:02 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test reflection grade % merged into `GradeTrends` per-subject trendline 🎯

- **`src/lib/testReflection.js`** + **`src/lib/gradeUtils.js`** + **`src/components/dashboard/GradeTrends.jsx`** + **`src/components/dashboard/SubjectDetailModal.jsx`** — closes prior shift backlog (12:29 UTC #1, 10:04 UTC #1, flagged 2 shifts running). Until now a logged post-test reflection's optional `gradePct` was write-only — TestReflectionCard / TestCardReflection both stored it in `gg_test_reflection_<testId>`, but no surface read it. A Math student who logged "🎉 Aced · 92%" on a test saw the emoji on the reflection card, but the per-subject `GradeTrends` sparkline ignored the score entirely.
- **New `loadAllReflections()`** in `testReflection.js` walks every `gg_test_reflection_*` localStorage key and returns a `{testId -> reflection}` map. Defensive per-key parse so one corrupt blob doesn't drop the rest.
- **`subjectGradeTrends(assignments, tests, reflections)`** now optionally merges reflection grades into each subject's chronological entry list. A reflection with a numeric `gradePct` becomes a real data point alongside Assignment grades — same percentage scale, ordered by `test_date` (falling back to the reflection's `ts`). Reflections with `null` gradePct are skipped — they still drive the calibration insight but have no percent to plot. Each entry is now tagged `kind: "assignment" | "test"` so callers can render them differently.
- **`GradeTrends`** seeds reflections via `loadAllReflections` + listens for `gg-test-reflection-changed` (same-tab) and the native `storage` event (cross-tab) so a fresh reflection re-renders the sparkline without a remount. Test points render as hollow rings (vs. filled dots for assignments); the panel footer now reads "graded assignments + logged test scores · hollow dots = test reflections."
- **`SubjectDetailModal`** picks up the same hollow-ring treatment in the larger sparkline, and the "Recent scores" list now tags test rows with a small purple `TEST` chip — so a 92% from a reflection isn't conflated with a 92% on an assignment.
- **Why a student notices it:** the trendline is the dashboard's most-glanced grade signal. A student crushing tests but no recent assignments saw "Steady" on Math even when their predictions + reflections had been climbing for weeks; now the test grade is part of the trend that drives the "Trending up / steady / down" badge. Closes the loop on the entire test reflection feature shipped 2 shifts ago.
  - feat: 1fd3ccc · https://github.com/landon-personal/gradeguardnewsync/commit/1fd3ccc

### Added (web) — Stale-subject pruning in `SubjectManagerModal` 🗂️

- **`src/components/dashboard/SubjectManagerModal.jsx`** — closes prior shift backlog (12:29 UTC #4, flagged 4+ shifts running). A student who graduated from "AP Bio" silently kept its weekly goal + color override forever; a custom-typed class abandoned 6 months ago lingered as a ghost row. Now the modal surfaces these and offers one-tap cleanup. A subject is "stale" if it has a saved goal / color override / or a custom-only row AND no assignment / test references it in the past 90 days. Each stale row gets a small amber `Stale` chip; the modal shows an amber summary strip above the list ("3 stale classes · no activity in 90+ days") with a one-tap "Clear stale" button that drops the goal + color override + custom-only membership for every stale row at once. Subjects with live work in the window are never touched. Single bulk-clean pattern preserves the existing per-row Trash icon for selective custom-only removal.
- New helpers: `lastActivityMs(subject)` walks both assignments + tests for the most recent `due_date` / `updated_date` / `created_date` / `test_date` matching the subject; cutoff is `now - 90d`. `hasColorOverride(subject)` (defensive try/catch around `listSubjectColorOverrides`) so a Safari Private Mode read failure doesn't take the modal down. `isCustomOnly` refactored to a pure helper `isCustomOnlyOf` so the bulk-clean handler can call it without closing over render state.
- **Why a student notices it:** the per-subject color + weekly goal feature has been growing for ~10 shifts; this is the first surface that lets a student *prune* old data, not just edit it. The amber strip is silent for a fresh-account student (no stale rows to surface) so it doesn't add visual weight to a clean modal.
  - feat: 1066165 · https://github.com/landon-personal/gradeguardnewsync/commit/1066165

### Fixed (web) — `SubjectGoalsStrip` refresh on session-recorded + at midnight rollover

- **`src/components/dashboard/SubjectGoalsStrip.jsx`** — the strip wired into `Dashboard.jsx` between `WeeklyFocusGoalMini` and `WorkloadForecast` had two staleness windows: (1) the Dashboard parent does NOT bump `refreshKey`, so a Pomodoro logged from the floating widget (or on /FocusTimer in another tab) didn't push the strip's "X / Y min" counts on /Dashboard — the memo only re-ran on assignments / tests prop changes; (2) `thisWeekMinutesBySubject` is Sunday-anchored, so a student leaving the dashboard open across Saturday → Sunday saw last week's minutes pinned to "this week" because the memo had no `clockTick` dep. The /FocusTimer copy was fine (it bumps `refreshKey` on `sessionsToday.length`). Fix is internal so the component is robust regardless of how the parent passes refreshKey: `gg-focus-session-recorded` (same-tab) + native `storage` event (cross-tab) listeners + self-rescheduling `setTimeout` at next local midnight. Same shape `SubjectEffortIndex` / `SubjectFocusHeatmap` / `WeeklyFocusGoalMini` already use after their respective fixes.
  - fix: fb8a4b8 · https://github.com/landon-personal/gradeguardnewsync/commit/fb8a4b8

### Fixed (web) — `GradeTrends` inline goal chip refreshes on session write + at midnight

- **`src/components/dashboard/GradeTrends.jsx`** — the `X / Y min` goal chip rendered next to each subject row read from `thisWeekMinutesBySubject` inside a memo keyed only on `[assignments, tests]`. A focus session does NOT mutate the assignments / tests query data — it writes to `gg_focus_sessions_<date>` localStorage. So a Pomodoro logged on /FocusTimer or via the floating widget never pushed the chip on /Dashboard until a hard refetch (the prior comment claimed "a fresh Pomodoro pushes the bar" — that was incorrect). Same shape `SubjectGoalsStrip` / `SubjectEffortIndex` / `WeeklyFocusGoalMini` already use: `gg-focus-session-recorded` listener (same-tab) + native `storage` event (cross-tab) + self-rescheduling `setTimeout` at next local midnight for Sunday-anchored week rollover.
  - fix: ef3ddf5 · https://github.com/landon-personal/gradeguardnewsync/commit/ef3ddf5

### Fixed (web) — Dashboard passes full `tests` (not `activeTests`) to `GradeTrends`

- **`src/pages/Dashboard.jsx`** — caught while auditing the new test-reflection merge: `activeTests` filters to `days >= 0` (today + future), which is correct for `NextTestCountdown` / `TestReadinessPanel` / etc. but WRONG for the new reflection merge in `subjectGradeTrends` — reflections are by definition logged for tests that already happened. Without this fix, a student logging "🎉 Aced · 92%" couldn't see that grade in the trendline because the test was filtered out before reaching the merge loop. `SubjectDetailModal` still filters tests internally for its "Upcoming tests" section (`t._daysLeft >= 0`); `weekBySubject`'s `Study: <test>` resolver benefits from seeing past-dated rows when matching session.assignment → subject. The Dashboard's tests query already filters to status=`upcoming`, so this only widens the prop to include past-dated rows the student hasn't marked completed — exactly the rows reflections are written for.
  - fix: 6ba073c · https://github.com/landon-personal/gradeguardnewsync/commit/6ba073c

### Fixed (web) — `CompletionHeatmap` 16-week grid midnight rollover on `/Achievements`

- **`src/components/gamification/CompletionHeatmap.jsx`** — `today = startOfDay(new Date())` was computed during render outside any memo / effect, and the `days` memo depended on it. Without a clockTick trigger, no render fires at midnight, so a student who left /Achievements open across the boundary saw yesterday's column still rendered as "today" + the oldest column not falling out of the 16-week window until the assignments query happened to refetch. Same self-rescheduling `setTimeout` to next local midnight + wrapped `today` in `useMemo([clockTick])`. Same family as the rollover fixes shipped on `FloatingStreakCounter` / `StudyHistoryInsights` / `NextTestCountdown` / `WorkloadForecast` / `WeeklyFocusGoalMini` / `DailyGoalsCard` / `MoodCheckIn` / `DailyCheckout` / `ProgressCharts` / `TestReadinessPanel` / `SubjectFocusHeatmap` / `SubjectEffortIndex` / `SmartTodoList` / `SubjectGoalsStrip` / `GradeTrends`.
  - fix: afc0332 · https://github.com/landon-personal/gradeguardnewsync/commit/afc0332

### Hygiene (web) — drop 3 unused `eslint-disable` directives

- **`src/components/dashboard/SubjectManagerModal.jsx`** / **`src/components/assistant/FlashcardViewer.jsx`** / **`src/components/dashboard/SubjectDetailModal.jsx`** — `npx eslint .` flagged "Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')" on three useMemo / useEffect deps blocks where the deps had since been adjusted. Removed the directives; `npm run lint` stays clean.
  - chore: 0e9aa3a · https://github.com/landon-personal/gradeguardnewsync/commit/0e9aa3a
  - chore: ef278d0 · https://github.com/landon-personal/gradeguardnewsync/commit/ef278d0

---

## [Unreleased] — 2026-05-01 12:29 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Inline test reflection on past Test rows in `/Tests` 🎯

- **`src/components/tests/TestCardReflection.jsx`** (new, ~210 lines) + **`src/components/tests/TestCard.jsx`** — surfaces the saved post-test reflection (outcome chip + optional grade %, e.g. `🎉 Aced · 92%`) directly on past-test rows on `/Tests`, plus a compact "Reflect on this test" CTA on past rows that don't have one yet. Tapping the CTA expands an inline 5-button picker (Bombed → Aced) + grade % input — same lib + storage shape (`gg_test_reflection_<testId>`) as the dashboard `TestReflectionCard` so a reflection saved on either surface immediately propagates to the other via `gg-test-reflection-changed` (same-tab) + native `storage` event (cross-tab). Pencil icon on the saved chip re-opens the picker so a misclick is recoverable. **Why a student notices it:** the Tests page is where students go to *revisit* a test conceptually (review topics, look at past performance) — it's the natural reflection touchpoint, not just the dashboard prompt window. Students who missed the dashboard's 14-day pending-prompt window can still log a reflection any time. Closes prior shift backlog (10:04 UTC #2 — surface reflection trend on the Test row in `/Tests`).
  - feat: e4066f3 · https://github.com/landon-personal/gradeguardnewsync/commit/e4066f3

### Added (web) — Today's study-plan target + progress strip inside `NextTestCountdown` 🎯

- **`src/components/dashboard/NextTestCountdown.jsx`** + **`src/lib/testStudyPlan.js`** + **`src/components/dashboard/TestStudyPlan.jsx`** — adds a compact "Today's plan" strip inside the countdown banner showing today's prescribed study minutes (e.g. `40 / 60 min`) for the soonest test, with a progress bar that fills as `Study: <test name>` Pomodoros land. Extracted `dailyTargetFor` / `baseMinutesForDays` / `confidenceMultiplier` from `TestStudyPlan.jsx` into `lib/testStudyPlan.js` as the single source of truth so the two surfaces never disagree if the curve is tuned later. Live-refreshes on focus session writes (cross-tab via `storage`, same-tab via `gg-focus-session-recorded`), confidence rating changes (`gg-test-confidence-changed`), and per-test offset bumps (`gg-test-study-plan-offset-changed`). Bar turns emerald with a checkmark once today's target is hit. Hidden on test-day itself (no prescription on the day of) and when target rounds to 0 (e.g. confidence-5 student with a heavy negative offset). **Why a student notices it:** the countdown banner is the dashboard's most-glanced surface — putting today's number there means the prescription answers the natural follow-up question ("…ok, so what should I actually do today?") inline. Closes prior shift backlog (8:13 UTC #3 — TestStudyPlan inside NextTestCountdown).
  - feat: 88d3e9d · https://github.com/landon-personal/gradeguardnewsync/commit/88d3e9d

### Added (web) — Distraction tap-counter on the floating PomodoroTimer widget 🔔

- **`src/components/dashboard/PomodoroTimer.jsx`** — plumbs the in-session distraction tap-counter (already on the FocusTimer page) into the floating widget so a Pomodoro started from the floating control captures the same quality dimension. Pill is visible only mid-work-session, taps increment a state counter, the value is stamped onto the `gg_focus_sessions_<date>` row at `advance(true)` only when nonzero (same convention as the page version — missing field stays distinct from explicit 0). Counter resets on `advance` / `handleReset` / `handleModeSwitch` so a fresh work block always starts at 0. `recordFocusSession` now accepts a `distractions` arg; `FocusSessionHistoryModal` already reads the field for both writers, so the existing per-row distraction pill + 14-day total in the modal header pick up the floating-widget rows automatically. Closes prior shift backlog (8:13 UTC #2 — distraction tap-counter on floating PomodoroTimer).
  - feat: beb71e2 · https://github.com/landon-personal/gradeguardnewsync/commit/beb71e2

### Fixed (web) — `StudyHistoryInsights` 12-week heatmap midnight rollover

- **`src/components/dashboard/StudyHistoryInsights.jsx`** — the 12-week activity grid (`buildHeatmap`), current `streak`, `bestDay`, and `subjectStats` (top subjects last 30 days) all derived from `new Date()` / `Date.now()` inside `useMemo`s that didn't track wall time — a student leaving the dashboard open across midnight saw yesterday's grid frozen until the next session landed. Same midnight-rollover pattern previously fixed on `FloatingStreakCounter`, `NextTestCountdown`, `WorkloadForecast`, `WeeklyFocusGoalMini`, `DailyGoalsCard`, `MoodCheckIn`, `DailyCheckout`, `ProgressCharts`, `TestReadinessPanel`, `SubjectFocusHeatmap`, `SubjectEffortIndex`. Added the standard `clockTick` state + self-rescheduling `setTimeout` to next-midnight, included in each affected memo's deps. Closes prior shift backlog (10:04 UTC #3).
  - fix: 75bf83d · https://github.com/landon-personal/gradeguardnewsync/commit/75bf83d

### Fixed (web) — `StudySessionTimer` re-init on `durationMinutes` prop change

- **`src/components/dashboard/StudySessionTimer.jsx`** — closes prior shift backlog (02:08 UTC #4). Component lazy-init'd `timeLeft` from `durationMinutes` once at mount and never picked up later prop changes, so a parent re-render with a new `suggested_time_today` (AI plan refresh changes the recommended minutes for an open todo) silently kept the original countdown value. Added a `useEffect` that re-syncs `timeLeft` when `totalSeconds` changes, gated to `(!running && !done)` so a started session is never yanked and a finished badge isn't reset back into a fresh countdown.
  - fix: 5edd2e4 · https://github.com/landon-personal/gradeguardnewsync/commit/5edd2e4

### Hygiene (web) — `eslint no-undef` enabled + `MoodCheckIn` trailing-blank cleanup

- **`eslint.config.js`** — turned on `no-undef`. Closes prior shift backlog (8:13 UTC #7, flagged 5 shifts running). A few shifts back a missing icon import for `Target` slipped through both lint and build because the rule wasn't on. `globals.browser` already covers window/document/localStorage/etc, and React 17+ JSX runtime means the component identifier doesn't need React in scope. Verified zero new errors across the codebase — only the pre-existing unused-vars warnings remain.
  - chore: d5dbf66 · https://github.com/landon-personal/gradeguardnewsync/commit/d5dbf66
- **`src/components/dashboard/MoodCheckIn.jsx`** — stripped 47 trailing blank lines (file dropped 160 → 113 lines, no behavior change). Flagged 3+ shifts running.
  - chore: bundled into beb71e2 above.

---

## [Unreleased] — 2026-05-01 10:04 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test reflection card + personal-calibration insight on Dashboard 🎯

- **`src/lib/testReflection.js`** (new) + **`src/components/dashboard/TestReflectionCard.jsx`** (new, ~270 lines) — closes the prediction loop on the existing `TestReadinessPanel` confidence ratings. After a `test_date` passes, the dashboard surfaces a "How did *[test name]* go?" card. The student picks one of five outcomes (💀 Bombed → 🎉 Aced) and optionally fills in a grade %. Stored at `gg_test_reflection_<testId>` (pure localStorage, same defensive read/write posture as `testConfidence` / focus sessions). The reflection scale (1=Bombed → 5=Aced) is intentionally aligned 1:1 with `CONFIDENCE_LEVELS` (1=Lost → 5=Ready) so a direct `(actual − predicted)` subtraction is meaningful — that's the substrate for the calibration insight below.
- **Calibration insight strip** — once 3+ samples land where both a pre-test confidence rating *and* a post-test reflection exist, the card surfaces a single sentence describing the student's bias: under ±0.5 step is "your pre-test ratings track reality closely — trust your gut" (emerald), positive = "you tend to underrate yourself by ~N steps — when you feel Shaky you usually do better" (indigo), negative = "you tend to overrate yourself — start prep one day earlier next time" (rose). 3-sample threshold avoids a single-instance noise narrative; the message is metacognitive coaching, not a number on a scoreboard.
- **`src/pages/Dashboard.jsx`** — wired between `TestStudyPlan` and `ProgressCharts` (`fadeUp(0.349)`). Receives full `tests` (NOT `activeTests`, which filters out past-dated rows — those are exactly the rows we surface). Card auto-hides when there's no pending prompt AND no insight yet, so brand-new accounts see nothing.
- **Surface controls so it doesn't get annoying** — pending prompts cap at 3 at a time (a student returning from a long break isn't faced with a wall), and each row has a compact "X" dismiss button that drops the prompt for the session (still re-promptable on next mount). 14-day reflection window matches `WorkloadForecast` so a student doesn't get nagged about a test from a month ago they've forgotten.
- **Why a student notices it:** the dashboard had been growing on the *prediction* side (`TestReadinessPanel`, `TestStudyPlan`, `NextTestCountdown`) but had nothing on the *reality-check* side. A student rates themselves "Solid" → studies → takes the test → reality is "Aced" or "Bombed" — but the app never asked. Now it does, and after a few tests it tells them whether their gut is calibrated. First time GradeGuard learns from outcomes.
  - feat: dc001bb · https://github.com/landon-personal/gradeguardnewsync/commit/dc001bb

### Fixed (web) — `SubjectFocusHeatmap` / `SubjectEffortIndex` / `ProgressCharts` / `TestReadinessPanel` midnight rollover

- **`src/components/dashboard/SubjectFocusHeatmap.jsx`** — `useMemo([assignments, tests])` captured `today = new Date()` on first mount, so two things went stale: (1) a student who left the dashboard open past midnight saw `days[]` (the X-axis) frozen at yesterday's 30-day window — a session logged on the new day landed outside the displayed range entirely; and (2) today's column lagged until the dashboard re-fetched assignments/tests, since that was the only `useMemo` trigger. `GradeTrends` and `TestStudyPlan` already update live on `gg-focus-session-recorded`; this card stayed frozen. Added a self-rescheduling `clockTick` `setTimeout` at next local midnight + the same `gg-focus-session-recorded` CustomEvent listener (plus the native `storage` event for `gg_focus_sessions_*` keys) so today's cell intensity bumps the moment a session lands.
  - fix: e320ddc · https://github.com/landon-personal/gradeguardnewsync/commit/e320ddc
- **`src/components/dashboard/SubjectEffortIndex.jsx`** — same exact pair of bugs as the heatmap above (rolling 7-day window + no live refresh on session writes). Same self-rescheduling `clockTick` + `gg-focus-session-recorded` + native `storage` listener pair so the band/strip and `weekMinutesBySubject` re-derive the moment a Pomodoro lands.
  - fix: b26380e · https://github.com/landon-personal/gradeguardnewsync/commit/b26380e
- **`src/components/dashboard/ProgressCharts.jsx`** — `useMemo([assignments])` computed `subDays(new Date(), 6-i)` once at first mount, so the 7-day completion-bar X-axis stayed frozen at yesterday's window across midnight. A completion logged on the new day landed under yesterday's day-of-week label (e.g. counted as "Thu" when it was actually Friday) and today's column showed yesterday's count. Same `clockTick` scheduler.
  - fix: 72ecdb2 · https://github.com/landon-personal/gradeguardnewsync/commit/72ecdb2
- **`src/components/dashboard/TestReadinessPanel.jsx`** — `useMemo([tests])` captured `today` on first mount, so a student who left the dashboard open across midnight saw "TMRW" badges stay frozen at "TMRW" instead of flipping to "TODAY", and "TODAY" rows didn't disappear when the `test_date` became yesterday. Same `clockTick` pattern. Now the "next 14 days" filter and per-row day count both follow the wall clock without waiting for `tests` to refetch.
  - fix: d6ebb07 · https://github.com/landon-personal/gradeguardnewsync/commit/d6ebb07

---

## [Unreleased] — 2026-05-01 08:13 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — In-session distraction tap-counter on `/FocusTimer` 🔔

- **`src/pages/FocusTimer.jsx`** — closes prior shift's "what I didn't get to" #4 (Distraction tracker during a Pomodoro). A small "I got distracted" pill is now visible only while a work session is running (`mode === "work" && running`). Each tap increments an in-session counter; the count is then stamped onto the `gg_focus_sessions_<date>` row at `handleComplete` alongside `minutes` / `intention` / `assignment`. Pill state shows "I got distracted" before the first tap and "{N} distraction{s} so far" after — same amber color tokens as the matched-pair badge in the history modal so a student instantly recognizes the dimension. Counter resets on `switchMode`, `handleReset`, and `handleComplete` so a fresh work session always starts at 0; mid-session reload also clears it (the value is behavioral, not load-bearing — first time GradeGuard collects it at all). Only persisted for work sessions and only when at least one tap landed (a row's missing `distractions` field stays distinct from a recorded 0 — that "feature wasn't used" vs. "session had zero distractions" distinction matters for any future analytics layer that backfills).
- **`src/pages/FocusTimer.jsx`** — the Today's-sessions header pill now also surfaces a small "🔔 N" amber badge next to the focus-session count, summing distractions across today's work sessions. Tooltip explains the source so a student isn't confused by a number floating next to the session count.
- **`src/components/dashboard/FocusSessionHistoryModal.jsx`** — every row in the 14-day chronological log now reads the optional `distractions` field through the existing `loadAllSessions` walker and renders an inline "🔔 N" amber pill below the time/duration line when nonzero. Rows with zero distractions render unchanged so the historical log isn't visually cluttered for sessions where the feature wasn't used. The modal header summary picks up an aggregate "X distractions logged" suffix when the 14-day total is nonzero.
- **Why a student notices it:** previously a Pomodoro was a binary "you completed a 25-min session" event. The distraction counter adds a *quality* dimension to the session — a student crushing 4 sessions in a row but tapping 12 distractions can see they're not in deep work and adjust their environment. First Pomodoro habit-builder feature in the app that surfaces session quality, not just minutes. Sets up future surfaces (e.g., "you get distracted most around 8 PM" in `TimeOfDayFocusPattern`) once enough data lands.
  - feat: 3b6f031 · https://github.com/landon-personal/gradeguardnewsync/commit/3b6f031

### Added (web) — `TestStudyPlan` per-test +5/−5 daily target overrides

- **`src/lib/testStudyPlan.js`** (new) + **`src/components/dashboard/TestStudyPlan.jsx`** — closes prior shift's "what I didn't get to" #2. The auto-curve (15→25→45→60 min scaled by 1.6×–0.4× confidence multiplier) is opinionated; a power-user might want to override (e.g., "I always do 60 min for Bio regardless of where the curve says"). Each row now has compact `−` / `+` buttons that step the target by 5 min. Offset is per-test, persisted to `gg_test_study_plan_offset_<testId>` localStorage; zero values are removed (no sentinel keys for students who revert back to default). Final target = `max(0, autoCurve + offset)` so a negative offset that drops a row below 0 hides the row via the existing `target>0` visibility gate. Override badge ("+15" / "−10") shows next to the target only when nonzero, so the auto-curve case stays visually clean. Down button disables when next step would go below 0; up button caps at +240 min. Save dispatches a `gg-test-study-plan-offset-changed` CustomEvent; the row listens (plus the native `storage` event for cross-tab) so the change is reflected immediately.
  - feat: 1a1447e · https://github.com/landon-personal/gradeguardnewsync/commit/1a1447e

### Fixed (web) — `NextTestCountdown` / `WorkloadForecast` / `WeeklyFocusGoalMini` midnight-rollover

- **`src/components/dashboard/NextTestCountdown.jsx`** — `useMemo([tests])` captured `today` on first mount. A student who left the dashboard open across midnight saw the "1 DAY" badge stay "1 DAY" instead of flipping to "TODAY" until the tests array changed (which won't happen at the boundary). Added the same self-rescheduling `clockTick` `setTimeout` pattern shipped on `FloatingStreakCounter` / `DailyGoalsCard` / `MoodCheckIn` / `DailyCheckout`, keyed into the existing memo's deps so the recompute picks up the new wall date.
- **`src/components/dashboard/WorkloadForecast.jsx`** — `useMemo([assignments, tests])` builds its 14-day forecast around `startOfDay(new Date())` on first mount; same midnight-staleness as above. Today's column stayed pinned to yesterday's date and the forecast didn't slide forward by one day. Same `clockTick` pattern.
- **`src/components/dashboard/WeeklyFocusGoalMini.jsx`** — `useMemo([])` ran once at mount and never updated, so the this-week minutes total never refreshed *at all*: not at midnight, not when a Pomodoro landed. Patched both: same `clockTick` scheduler at next midnight, plus a `gg-focus-session-recorded` listener (dispatched by both `FocusTimer.handleComplete` and `PomodoroTimer.recordFocusSession`) so the strip refreshes the moment a session completes anywhere in the app instead of waiting for nav-away-and-back. Cross-tab writes covered by the native `storage` event listener. Closes part of prior shift #55 backlog #4.
  - fix: 3a56fac · https://github.com/landon-personal/gradeguardnewsync/commit/3a56fac

### Fixed (web) — `Friends` `sendMessage` `Promise.race` timeout never cleared

- **`src/pages/Friends.jsx`** — closes prior shift #56 backlog item #5. The inner `setTimeout(reject, 12000)` inside the race fired regardless of whether the actual API call already resolved, leaking the timer + an `UnhandledPromiseRejection` per send (the late rejection is a no-op for the consumer that's already received the success value, but the timer's closure still ticks and the discarded rejection still hits the unhandled-rejection log). Now captured the timer id at creation and `clearTimeout` in a `try/finally` around the race so both branches release the timer cleanly.
  - fix: 2e8ccfa · https://github.com/landon-personal/gradeguardnewsync/commit/2e8ccfa

---

## [Unreleased] — 2026-05-01 06:26 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Today's test prep plan card on Dashboard 🎯

- **`src/components/dashboard/TestStudyPlan.jsx`** (new, ~270 lines) — for the soonest 3 upcoming tests in the next 14 days, the dashboard now shows an auto-generated daily study-minute target per test plus today's progress. No setup required: target minutes derive from a calibrated curve scaled by the existing per-test confidence rating. **Curve:** 15 min/day at 8–14 days out → 25 min at 4–7 days → 45 min at 2–3 days → 60 min the day before. **Confidence multiplier:** 1.6× for *Lost*, 1.3× *Shaky*, 1.0× *Okay* / unrated, 0.7× *Solid*, 0.4× *Ready*. Round to nearest 5 minutes. Target hits zero on test day itself so the card doesn't prescribe last-day cramming. Today's progress walks `gg_focus_sessions_<today>` for sessions tagged `Study: <test name>` — the exact wrapper `FocusTimer.handleComplete` already writes when a student picks a test — so a student who clicks the in-row "Start" deep-link, completes one Pomodoro, and returns sees the bar move with no bookkeeping. Per-test row shows: subject color dot, test name, "in N days", today's `done / target`, progress bar in subject color, and a `Start →` link to `/FocusTimer?testId=<id>`. Header shows aggregate `total done / total target` plus a `Done ✓` badge when every row hit its target. Auto-hides when no test in 14d has a >0 target (test day itself, or rated 5/5 with >7d left).
- **`src/pages/Dashboard.jsx`** — wired between `TestReadinessPanel` and `ProgressCharts` (`fadeUp(0.347)`). Shares `activeTests` so no extra fetch.
- **Live refresh on session writes** — both writers (`PomodoroTimer.recordFocusSession` for the floating widget, `FocusTimer.handleComplete` for the dedicated page) now dispatch a `gg-focus-session-recorded` CustomEvent. `TestStudyPlan` listens (plus the native `storage` event for cross-tab writes) and bumps a `refreshTick`, so today's progress bar updates the moment a Pomodoro completes — no remount needed. Prior behavior would have lagged until navigation.
- **Live refresh on confidence changes** — `recordConfidence` (in `src/lib/testConfidence.js`) now dispatches `gg-test-confidence-changed`. `TestStudyPlan` listens and re-runs the per-test confidence read, so a student rating a test "Lost" inline from `TestReadinessPanel` or `NextTestCountdown` immediately sees the daily target jump 1.6× without waiting for a remount.
- **Why a student notices it:** the dashboard had a `NextTestCountdown` ("you have a test in 5 days") and a `TestReadinessPanel` ("rate how prepared you feel") but no surface that answered the actual question — *what should I do today?* This card closes the loop with an opinionated answer: here's how many minutes, here's how close you are, click here to start. First time GradeGuard prescribes a daily test-prep number at all.
  - feat: 197a8f2 · https://github.com/landon-personal/gradeguardnewsync/commit/197a8f2
  - feat: 596f65b · https://github.com/landon-personal/gradeguardnewsync/commit/596f65b
  - feat: cc16b20 · https://github.com/landon-personal/gradeguardnewsync/commit/cc16b20

### Added (web) — `1` / `2` / `3` / `R` keyboard shortcuts on `/FocusTimer`

- **`src/pages/FocusTimer.jsx`** — the page already bound `Space` to start/pause but the mode tabs and reset button were mouse-only. Add `1` = Focus, `2` = Short break, `3` = Long break, `R` = Reset to the existing `keydown` listener — same `e.target === document.body` gate so typing in the intention input or length editor doesn't fire the shortcuts, plus a `metaKey/ctrlKey/altKey` skip so browser jump-to-tab and OS shortcuts keep working. The bindings flow through refs so the listener can register once with `[]` deps and still call into the live `switchMode` / `handleReset` closures (mirror of the `Tests.jsx` `N`-binding pattern).
- **`src/components/common/KeyboardShortcutsModal.jsx`** — list the new bindings under a renamed "Focus Timer page" section. The prior section title ("when floating Pomodoro open") was incorrect — `Space` worked on the dedicated page too.
  - feat: c40309f · https://github.com/landon-personal/gradeguardnewsync/commit/c40309f

### Fixed (web) — `DailyGoalsCard` 7-day strip + today's checkmark went stale at midnight

- **`src/components/dashboard/DailyGoalsCard.jsx`** — `useMemo([])` captured `today` on first mount. A student who left the dashboard open overnight crossed midnight with `todayKey` still pointing at yesterday's history bucket — toggling a goal would write to yesterday's entry and the 7-day visualization would render with stale day labels. Same midnight-staleness pattern that was patched on `SmartTodoList` and `FloatingStreakCounter` recently. Add the same self-rescheduling `clockTick` `setTimeout` that fires at the next local midnight, and key both `last7` and `todayKey` to it so they recompute exactly once at the boundary without a polling `setInterval`.
  - fix: 1898880 · https://github.com/landon-personal/gradeguardnewsync/commit/1898880

### Fixed (web) — `MoodCheckIn` picker stayed locked on yesterday's choice past midnight

- **`src/components/dashboard/MoodCheckIn.jsx`** — same midnight-staleness pattern. The component read the saved-mood blob in a `useEffect` keyed only on `userEmail`, so a student who picked a mood at 11 PM and left the dashboard open crossed midnight with `selected/confirmed` state pinned to yesterday's choice — the picker was greyed out with yesterday's emoji highlighted while today's actual mood went unrecorded. Add the `clockTick` scheduler at the next local midnight and re-run the saved-mood read against the new `toDateString()`. Also explicitly clear local state on the no-match branch and on a missing saved blob so fresh days reset cleanly.
  - fix: add2150 · https://github.com/landon-personal/gradeguardnewsync/commit/add2150

### Fixed (web) — `DailyCheckout` visibility gate + day keys went stale at 4 PM and midnight

- **`src/components/dashboard/DailyCheckout.jsx`** — `useMemo([])` captured `today` on first mount, breaking three things at once: (1) `todayKey`/`yesterdayKey` kept yesterday's date past midnight so the saved-checkout read missed today's actual key, (2) `isEvening` / `isMorning` gated on a stale `getHours()` so the card never appeared when 4 PM rolled around with the dashboard already open and stayed in "evening" mode well into the next morning, and (3) the assignments-completed-today filter compared `updated.toDateString() === today.toDateString()` against yesterday's date so completions on the new day didn't count. Add the same `clockTick` scheduler the streak counter uses, scheduled at the next 4 PM or midnight boundary (whichever comes first), and key `today` to it. The existing `useMemo` chain re-derives both date keys on the next tick.
  - fix: 13df9e2 · https://github.com/landon-personal/gradeguardnewsync/commit/13df9e2

---

## [Unreleased] — 2026-05-01 04:05 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Hour-of-day + day-of-week focus pattern card on `/FocusTimer` ⏰

- **`src/components/dashboard/TimeOfDayFocusPattern.jsx`** (new, ~170 lines) — `StudyHistoryInsights` already exposes a 12-week heatmap, streak, and top subjects, but the student couldn't answer "*when* do I actually focus?" — there was no time-of-day surface anywhere in the app. The new card buckets every work-mode session in the existing 12-week `focusHistory` array (the same `loadFocusHistory()` walk `FocusTimer.jsx` already builds) by `completedAt` hour and day-of-week, then renders two compact bar strips: hours 5 AM → 11 PM (most real student sessions land in that band) and Sun → Sat. The hour bars are gray-100 when zero minutes, indigo-200 when populated, and indigo-600 for the contiguous peak band. Peak detection grows the band to neighboring hours that hit ≥70% of the peak (capped at 3 hours wide), so "I always study between 3 and 5 PM" shows as a single shaded range instead of pinning to a single hour. Same logic for the strongest day. Headline above the bars: "*You focus most around 3–5 PM, and your strongest day is Tuesday.*" Auto-hides when there's no session data so brand-new accounts don't see a zeroed strip.
- **`src/pages/FocusTimer.jsx`** — wired immediately after `<StudyHistoryInsights />` so the analytics stack flows top-to-bottom: 12-week heatmap → time-of-day pattern. Shares `focusHistory` so there's no extra localStorage walk.
- **Why a student notices it:** the dashboard had been growing on the *what* axis (which subjects, which days, how many minutes) but had nothing on the *when* axis. Once a student sees "your strongest day is Sunday," they can plan harder material there. First time GradeGuard has surfaced this dimension at all.
  - feat: 2c0bff4 · https://github.com/landon-personal/gradeguardnewsync/commit/2c0bff4

### Fixed (web) — `FloatingStreakCounter` at-risk gate was stale until something else re-rendered

- **`src/components/dashboard/FloatingStreakCounter.jsx`** — last shift's at-risk activation fix gated the warning on `new Date().getHours() >= 18` inside a `useMemo` keyed on `[streak, assignments]`. That works fine for a student opening the dashboard at 7 PM (the memo's first run picks up the gate), but a student who has the dashboard open at 5:59 PM with an at-risk streak would never see the warning fire — the wall clock crossing 6 PM doesn't trigger a re-render, so the memo keeps its stale `isAtRisk = false`. New `clockTick` state + a self-rescheduling `setTimeout` that fires exactly at the next 6 PM boundary (or local midnight, whichever comes first) bumps the tick and forces the memo to recompute. The timer is added to the memo's deps so the re-run actually picks up the new wall time. Cleared on unmount.
  - fix: 2e4e042 · https://github.com/landon-personal/gradeguardnewsync/commit/2e4e042

---

## [Unreleased] — 2026-05-01 02:08 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — 30-day per-subject focus heatmap on Dashboard 📅

- **`src/components/dashboard/SubjectFocusHeatmap.jsx`** (new, ~250 lines) — until now, per-subject focus visibility on the dashboard was a 7-day sparkline + total inside `SubjectEffortIndex`. A student couldn't easily spot "I always study Bio on Sundays" or "I haven't touched Spanish in 2 weeks" — those patterns need a wider window AND a 2D layout. The new heatmap reads 30 days of `gg_focus_sessions_<date>` (work-mode only, same fallback shape as `SubjectEffortIndex` / `FocusSessionHistoryModal`), resolves each session's subject via assignments + `Study: <test>` wrappers → tests, and renders a grid: rows = subjects (sorted by 30-day total minutes desc), columns = 30 days (oldest left → today right). Cells are colored with the subject's stable palette color (`subjectColor`) so the heatmap matches every other per-subject surface in the app. Intensity scales through 5 alpha bands keyed to Pomodoro cadence: <10 min, 10–24, 25–49, 50–89, 90+ min. DOW letters (S M T W T F S) above each column; first-of-month columns show the month abbreviation instead so a student can locate "two weeks ago" at a glance. Today's column gets an indigo border ring. Hover/focus on a cell surfaces a single bottom-row callout with subject + date + minutes (single row keeps layout from jumping vs. floating tooltips on each cell). Cells are real `<button>` elements so the heatmap is keyboard-focusable. Untagged minutes (sessions without an assignment context) are not shown as a row but are surfaced in the header's total summary so the student knows how much time isn't bucketed.
- **`src/pages/Dashboard.jsx`** — plumbed between `SubjectEffortIndex` and `TestReadinessPanel` (`fadeUp(0.343)`) so the subject-focus stack reads top-to-bottom: weekly strip → 7-day effort vs. grade → 30-day heatmap → test readiness. Auto-hides empty (`totalMinutes === 0`) so brand-new accounts don't see a zeroed grid.
- **Why a student notices it:** a brand-new visualization. Two weeks of "I've been studying Math every other day" or "I haven't logged a session for AP Bio since the 12th" suddenly become obvious from the shape of the grid. Subject-color matching across every dashboard surface is the existing North Star and this heatmap fits straight into it.
  - feat: 812b61d · https://github.com/landon-personal/gradeguardnewsync/commit/812b61d

### Added (web) — `SubjectManagerModal` search filter for power-user lists 🔎

- **`src/components/dashboard/SubjectManagerModal.jsx`** — closes prior shift's "what I didn't get to" #6 (modal scrolled fine but no search/filter for a student with 12+ subjects). The input auto-shows once the subject list reaches 8 entries (sweet spot from the prior note) so a 4-subject student doesn't see clutter. Substring match against the lowercase subject name; clear button inside the input. Empty-result state ("No classes match \"X\".") replaces the row list when the filter zeroes out so the student doesn't think the modal silently dropped their classes. Search resets to empty whenever the modal reopens — same lifecycle as the customSubjects state — so a stale filter from a prior open doesn't hide rows the student is now expecting to see.
  - feat: 6d630f5 · https://github.com/landon-personal/gradeguardnewsync/commit/6d630f5

### Fixed (web) — `FloatingStreakCounter` "at risk" UI was wired but never triggered 🔥

- **`src/components/dashboard/FloatingStreakCounter.jsx`** — the component had a full at-risk visual treatment (red gradient + pulse keyframes + "Streak at risk!" tooltip + small `!` badge), but `isAtRisk` was hardcoded `false` so none of it could ever fire. Streaks would silently die at midnight without ever surfacing the "you still have time today" signal that's the whole point of having an at-risk state. Now `isAtRisk` derives from the same data the streak itself uses: streak ≥ 1, no completion today (re-derive from the assignments array `calcStreak` reads), AND it's at least 6pm local. The 6pm gate keeps the warning from nagging students all day; by evening, "you haven't done anything today" is actually actionable. No change to the visual treatment — keyframes / colors / tooltip copy were already in place, just gated behind a dead constant.
  - fix: 65693cc · https://github.com/landon-personal/gradeguardnewsync/commit/65693cc

### Fixed (web) — `SmartTodoList` feedback bucket goes stale at midnight

- **`src/components/dashboard/SmartTodoList.jsx`** — closes prior shift's "what I didn't get to" #9. The component built `todayKey` from `new Date()` on every render but read it only once in the useState lazy initializer. A student who leaves /Dashboard open overnight crosses midnight with the feedback state still set to yesterday's bucket (`confirmed: true`) — so today's prompt never re-appears, and any write goes to today's NEW key while the visible UI shows yesterday's confirmation copy ("Got it — I'll push you harder next time!"). Edge case but real for tab-leavers. Add a useEffect that compares the current todayKey to the last-loaded one (tracked in a ref so unrelated re-renders inside the same day don't refire). When they diverge — i.e. the date has rolled — re-read localStorage with the fresh key and reset feedback / confirmed to match. The ref pattern keeps the effect from looping on the self-induced setState calls.
  - fix: 6076d45 · https://github.com/landon-personal/gradeguardnewsync/commit/6076d45

---

## [Unreleased] — 2026-05-01 00:11 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Focus session log: chronological view of the past 14 days with per-row delete + Undo 📜

- **`src/components/dashboard/FocusSessionHistoryModal.jsx`** (new, ~290 lines) — there was no chronological surface for the student's focus sessions. Aggregate views existed (today's-strip dot count, 12-week heatmap, weekly recap, per-subject minutes) but a student couldn't say "wait, that 25-min session yesterday was while I was making coffee, let me delete it" or "did I really do 4 sessions on Tuesday or am I misremembering?" The new modal walks `gg_focus_sessions_<date>` for the past 14 days, flattens to `{date, idx, mode, minutes, assignment, completedAt}`, sorts newest-first, and groups by date with `Today` / `Yesterday` / relative weekday labels. Each row shows: mode badge (Focus / Short break / Long break with matching icon), subject color dot + name (resolved from assignments + tests so the row matches the color the rest of the app shows for that subject; `Study: <test>` wrappers unwrap to the test's subject), time-of-day, duration, and a Trash icon (visible on row hover). Filter chips at the top: "Focus only" (default) / "Include breaks". Header summary: total session count + total focus minutes across the 14-day window.
- **Per-row delete with idx-targeted rewrite + Undo:** delete rewrites that day's bucket without the deleted row. `idx` is the row's original position within that day's array (passed through from the loader) so duplicate `completedAt` millisecond timestamps don't ambiguate the delete target. The 5s sonner toast surfaces an Undo action that restores the row at the same index — best-effort: if other rows have been deleted in the meantime, the row is appended at the end so data isn't lost.
- **`src/pages/FocusTimer.jsx`** — wired via a small `<History />` "View log" button in the "Today's sessions" header (the natural surface — the student is already looking at session counts there). The modal's `onChanged` callback fires `setSessionsToday(loadTodaySessions())` which gives a fresh array reference, which re-derives `focusHistory` (memo dep), which re-aggregates the weekly goal bar, the per-subject SubjectGoalsStrip, and the today's-dots strip — so the deletion's effect is visible everywhere on the page immediately.
- **Why a student notices it:** flagged in the broad "feature playbook" examples (chronological log of activity). First time GradeGuard surfaces the raw session list — every other view aggregates. Students who accidentally let a Pomodoro run while distracted now have a way to clean up their stats; students who forget what they did this week have a chronological audit trail.
  - feat: dec48ef · https://github.com/landon-personal/gradeguardnewsync/commit/dec48ef

### Polish (web) — `SubjectGoalsStrip` capitalize-first display fallback

- **`src/components/dashboard/SubjectGoalsStrip.jsx`** — closes prior shift's "what I didn't get to" #5. A goal set under "math" with NO current Math assignments / tests / focus sessions resolved to display="math" (lowercase) because the `displayBy` map only learns casings from byWeek + assignments + tests. Fresh-start students typing in their plan before adding any work would see lowercase rows. Now the fallback capitalizes the first letter so "math" displays as "Math" — matching how the rest of the app cases subjects on entry.
- **`src/components/dashboard/TestReadinessPanel.jsx`** — drop the stale "PomodoroWidget" reference from the mountedRef-pattern comment. (PomodoroWidget.jsx is dead code, has been flagged for boss-eyeball deletion 8 shifts in a row — the live floating widget is `PomodoroTimer.jsx`. Comment cleanup only; no behavior change.)
  - polish: d5a6636 · https://github.com/landon-personal/gradeguardnewsync/commit/d5a6636

### Fixed (web) — 🚨 `MiniGames.MemoryMatch` was unwinnable (pair-match check compared group-id vs array index)

- **`src/components/assistant/MiniGames.jsx`** — the Memory Match mini-game's pair-match check after the player flipped two cards was `pairs[first].pair === idx` — comparing the first card's pair-group-id (an even number 0,2,4… assigned at shuffle-build time, shared across both halves of a pair) against the array index of the second clicked card. Only matched by coincidence when the shuffle happened to land a card with pair-id N at array index N. Effectively the game never registered a successful match. Fix: compare both cards' pair-ids (`pairs[first].pair === pairs[idx].pair`). Both halves of a pair share the same group id by construction, so this is the correct equality.
  - fix: 21d6657 · https://github.com/landon-personal/gradeguardnewsync/commit/21d6657

### Fixed (web) — `AIAssignmentChat` success-path `setMessages` was missing the `mountedRef` guard

- **`src/components/assignments/AIAssignmentChat.jsx`** — the catch block already guarded `setMessages` with `if (!mountedRef.current) return` and the `setLoading(false)` finally was guarded too, but the success path's three `setMessages` calls (JSON-parse-error fallback message, `ASSIGNMENTS_READY`-marker `displayReply`, no-marker reply) were unguarded. The multi-second `InvokeLLM` await is exactly the window in which the parent modal can close (Esc / click-outside / "Cancel"). Each unguarded call would fire setState on an unmounted component when that happens. Three call sites guarded.
  - fix: f053dd7 · https://github.com/landon-personal/gradeguardnewsync/commit/f053dd7

---

## [Unreleased] — 2026-04-30 22:15 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — `SubjectManagerModal`: bulk hub for color + weekly goal across every class 🎨🎯

- **`src/components/dashboard/SubjectManagerModal.jsx`** (new, ~280 lines) — closes the prior shift's "what I didn't get to" #5. Until now the only way to set a subject color or weekly study goal was to open `SubjectDetailModal` for that subject (which requires the subject to already exist in the student's assignments / tests / focus history). A brand-new class — say a student adds AP Chemistry to their schedule before the first homework — had no entry point to pre-color or pre-goal it. Now the Dashboard surfaces a "Manage subjects" pill above `SubjectEffortIndex` that opens a single modal listing every subject the student has touched (assignments + tests + saved goals + saved color overrides + custom-typed names) with inline color palette + weekly minute goal editor + 4 quick-set chips (60/90/120/180 min). An "Add a class" input at the top of the modal lets the student type a subject name (e.g. "AP Chemistry"), which gets stored under `gg_custom_subjects` and shown with a Custom badge + Trash icon. Custom entries auto-disappear from the modal once any real assignment / test references them — the rest of the app's subject discovery already covers them. Removing a custom row clears any color override / goal at the same time so the subject doesn't linger as a ghost row.
- **`src/pages/Dashboard.jsx`** — wires the trigger pill (right-aligned, just above `SubjectEffortIndex`) and the modal itself.
- **`src/lib/subjectColors.js`** — adds a `listSubjectColorOverrides()` helper alongside the existing list/get/set/clear API. The modal needs to enumerate every subject the student has set a color for but no longer has live assignments / tests for; doing this via the lib (instead of peeking at the `gg_subject_color_overrides` localStorage key directly) means any future change to the storage shape can't silently desync the modal.
  - feat: 346edd7 · https://github.com/landon-personal/gradeguardnewsync/commit/346edd7
  - refactor (lib): 27f450d · https://github.com/landon-personal/gradeguardnewsync/commit/27f450d

### Added (web) — Floating `PomodoroTimer` length presets 🍅

- **`src/components/dashboard/PomodoroTimer.jsx`** + **`src/lib/pomodoroLengths.js`** — closes the prior shift's "what I didn't get to" #6 (also flagged 2 shifts in a row). The dedicated `/FocusTimer` page got 5 1-tap presets 3 shifts ago (Sprint 15/3 / Classic 25/5 / Long 30/5 / Deep 50/10 / Marathon 90/15), but the floating widget on /Dashboard / /Assignments / /Tests had no in-widget editor — a student wanting to flip from Classic to Deep had to navigate to /FocusTimer, expand the editor, save. Now a small "Lengths 25/5/15" pill in the panel toggles a 5-chip picker; tapping a chip calls `savePomodoroLengths` (same path the page editor uses). The widget's existing `LENGTHS_CHANGED_EVENT` listener hot-reloads its lengths state, and when idle (not running, `secondsLeft === prior mode total`) the listener also snaps `secondsLeft` to the new mode total — so the visible countdown updates immediately without waiting for a mode switch. Picker is hidden / disabled while the timer is running so a misclick can't truncate a session.
- **`LENGTH_PRESETS`** + **`matchingPreset(lengths)`** are now exported from `src/lib/pomodoroLengths.js` so the page editor and the floating widget never drift on preset shapes or labels — single source of truth alongside the other Pomodoro length configuration. `src/pages/FocusTimer.jsx` now imports `LENGTH_PRESETS` from the lib instead of defining a local copy.
  - feat: b1fa694 · https://github.com/landon-personal/gradeguardnewsync/commit/b1fa694

### Added (web) — `SubjectGoalsStrip` "blew past" state 🔥

- **`src/components/dashboard/SubjectGoalsStrip.jsx`** — closes the prior shift's "what I didn't get to" #4. The strip's progress bar was capped at 100% even when minutes were 200% of goal, so a student crushing their target saw the same fully-filled bar as one who just hit it. Now: **(a)** top-right "🔥 +33%" amber pill on the card when `overPct > 0`, **(b)** a small amber-tinted sliver layered over the right-end of the 100%-fill bar (width = `min(30, overPct/4)` percent of the bar so it scales with overage but never dominates), **(c)** drop the trailing 🎉 once the badge is showing — the badge already signals celebration and double emoji read as cluttered. `overPct` capped at 999% so a fluke 30-min goal + 8-hour study day doesn't render a 4-digit pill.
  - feat: 9a211d4 · https://github.com/landon-personal/gradeguardnewsync/commit/9a211d4

---

## [Unreleased] — 2026-04-30 20:01 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Fixed (web) — 🚨 `SubjectDetailModal` crashed on open (missing `Target` lucide import)

- **`src/components/dashboard/SubjectDetailModal.jsx`** — the goal pill in the modal's `DialogTitle` (line 302) referenced `<Target />` but `Target` was never added to the lucide-react import block when the per-subject weekly goals feature shipped 2 shifts ago in `cc98dee`. Every student who tapped a row in `GradeTrends` / `SubjectEffortIndex` would have hit a React `Element type is invalid: expected a string... but got: undefined` crash on the modal open path. Fix: added `Target` to the imports.
- **Why this slipped lint + build:** the project's eslint config has `react/jsx-uses-vars: "error"` (which marks imported vars as used) but no `no-undef` rule, so a JSX-referenced *undefined* var fails neither `npm run lint` nor `npm run build` (Vite's `logLevel: "error"` swallows the JSX warning). Caught by a sibling sweep that compares `<Target />` usages across `src/components` + `src/pages` against each file's lucide-react import block.
  - fix: 3b0c665 · https://github.com/landon-personal/gradeguardnewsync/commit/3b0c665

### Added (web) — `SubjectGoalsStrip` on the Dashboard 🎯

- **`src/pages/Dashboard.jsx`** — flagged in the prior shift's "what I didn't get to" #4. The strip shipped on /FocusTimer last shift, but the Dashboard's WeeklyFocusGoalMini sits next to where the strip naturally fits, and a student opening the homepage had no per-subject lag signal until they navigated to the focus page. Wired the existing `SubjectGoalsStrip` between `WeeklyFocusGoalMini` and `WorkloadForecast` so the focus-goal stack is contiguous (mini-bar → per-subject strip → forecast). Suggest deep-links to `/FocusTimer?assignmentId=<id>` (uses the URL preselect path the timer page already honors), with a graceful fallback that still navigates to /FocusTimer + toasts a hint when the most-behind subject has no pending assignment. Renders nothing when no subject goals are set, so a student who hasn't engaged with the per-subject goals feature never sees the strip — same gate the FocusTimer copy of the strip uses.
  - feat: 4829331 · https://github.com/landon-personal/gradeguardnewsync/commit/4829331

### Added (web) — Inline "Set goal" / progress chip on every `GradeTrends` row 🎯

- **`src/components/dashboard/GradeTrends.jsx`** + **`src/components/dashboard/SubjectDetailModal.jsx`** — flagged in the prior shift's "what I didn't get to" #3. A student looking at GradeTrends and seeing Math at 78% had to: open the modal → click "Set goal" → type a number / pick a preset → save. Three taps for a goal-set flow. Now each row has a `Target` chip next to the trend badge:
  - **No goal set:** a subtle "Set goal" pill (gains indigo on hover). Tapping it deep-links into the SubjectDetailModal pre-expanded on the goal editor.
  - **Goal set, in progress:** "45/90 min" indigo pill. Same deep-link, lets the student adjust mid-week.
  - **Goal hit:** "120/90 min" emerald pill. Same deep-link, lets the student raise the bar.
- **Plumbing:** SubjectDetailModal accepts a new `defaultView` prop (`"trend"` | `"goal"`, default `"trend"`); the `useEffect` that resets the goal-editor expand state on subject change honors this so a deep-linked open lands in the editor, not the trend view. GradeTrends's outer row converted from `<button>` to `role="button" div` so the inner Goal chip can be a real `<button>` (nested `<button>` is invalid HTML and would have broken the click target on some browsers); keyboard activation (Enter / Space) preserved. The chip uses `stopPropagation` so the row's click handler doesn't fire when the student taps the chip directly. `weekBySubject` memoized off assignments + tests so a fresh Pomodoro updates the bar without re-deriving subjects.
  - feat: ac23c37 · https://github.com/landon-personal/gradeguardnewsync/commit/ac23c37

### Added (web) — Floating `PomodoroTimer` hot-reloads lengths from `/FocusTimer` editor

- **`src/lib/pomodoroLengths.js`** + **`src/components/dashboard/PomodoroTimer.jsx`** — flagged in the prior shift's "what I didn't get to" #6. A student who saved new lengths on /FocusTimer (e.g. picked the Deep 50/10 preset) and nav-aways back to /Dashboard saw the OLD durations on the floating widget until a hard reload, because the widget read `gg_pomodoro_lengths` once at mount.
- **Fix:** `saveLengths` / `resetLengths` now dispatch a `gg-pomodoro-lengths-changed` `CustomEvent` for same-tab listeners (the native `storage` event only fires across tabs, so a same-tab subscriber needed a separate channel; exported as `LENGTHS_CHANGED_EVENT`). The widget subscribes to both `storage` (cross-tab) and the new CustomEvent (same-tab). On change: `setLengths` to the fresh value, and **if the widget is idle** (not running AND `secondsLeft === prior mode total`) also snap `secondsLeft` to the new mode total so the visible countdown reflects the new preference. A paused or running mid-session is left alone — surprising a student by truncating their 50-min run is worse than waiting until the next mode-switch. Refs (`runningRef` / `modeRef` / `secondsLeftRef` / `lengthsRef`) keep the listener body's reads pinned to current values without re-binding on every tick — same shape the AudioContext + interval refs already use.
  - feat: 4d0a928 · https://github.com/landon-personal/gradeguardnewsync/commit/4d0a928

---

## [Unreleased] — 2026-04-30 18:12 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — `SubjectGoalsStrip` on the FocusTimer page + per-subject goal-hit toast 🎯

- **`src/components/dashboard/SubjectGoalsStrip.jsx`** (new, ~110 lines) — compact horizontal pill row, one card per subject with a goal set. Each card: subject-color dot + name + thin progress bar (subject hex fill, emerald + 🎉 once goal hit) + `45 / 90 min` count, sorted most-behind first. Renders nothing if no goals are set, so a student who hasn't engaged with the per-subject goals feature shipped 2 shifts ago never sees the strip. The "Suggest" button (only when 1+ subject still under goal) picks the lowest-pct subject's first non-completed assignment and hands it to the parent via `onPickAssignment(assignment, label)`. Subject lookup is normalized + display-cased (the goal store uses normalized keys, the focus-session aggregate uses display-cased subject names — the strip walks both byWeek + assignments + tests to build the normalized→display map so a goal set under "math" resolves to "Math" if any current assignment / test has that case).
- **`src/pages/FocusTimer.jsx`** — strip slotted between the timer ring and the Reset/Play/Pick controls, so a student opens /FocusTimer and immediately sees which subject is lagging on the week's plan. Suggest hands the chosen assignment to `setSelectedAssignment` + closes the picker + toasts the pick; graceful fallback (toasts a hint + opens the picker) when no pending assignment exists for the subject. Plus a per-subject goal-hit `useEffect` that fires a one-time-per-(subject, ISO week) toast via the new localStorage seen-gate — matches the global Weekly Focus Goal toast that already fires on this page. Also: the tests query is no longer gated on `?testId` so the strip + `thisWeekMinutesBySubject` can resolve `Study: <test>` tagged sessions to the right subject.
- **`src/lib/subjectGoals.js`** — adds `currentWeekKey()` (Sunday-anchored ISO date matching the rest of the app's week math), `hasSeenSubjectGoalHit` / `markSubjectGoalHit` (`gg_subject_goal_hits` localStorage gate; old week buckets are pruned on each mark so the blob never grows unbounded for a long-time user).
- **Why a student notices it:** flagged in the prior shift's "what I didn't get to" — the per-subject weekly goals shipped 2 shifts ago surfaced on the dashboard SubjectEffortIndex / WeeklyRecapModal, but the FocusTimer page (where the student actually picks what to study) had no signal about which subject was lagging. Now they see the strip every time they open /FocusTimer, can one-tap "Suggest" to load the most-behind subject's assignment, and get a per-subject celebration toast when they finally cross a goal. Closes 3 backlog items in one feature.
  - feat: e0427d4 · https://github.com/landon-personal/gradeguardnewsync/commit/e0427d4

### Fixed (web) — 🚨 Floating `PomodoroTimer` didn't write `gg_focus_sessions_` rows (critical data divergence)

- **`src/components/dashboard/PomodoroTimer.jsx`** — flagged as 🚨 in the prior shift's "what I didn't get to" and explicitly *not fixed* that shift because of double-count concerns. Before this commit, a student who only used the floating widget on /Dashboard / /Assignments / /Tests had ZERO data visible in: today's strip on /FocusTimer, the 12-week heatmap, `WeeklyRecapModal`, `WeeklyFocusGoalMini`'s progress bar, `DailyCheckout`'s "X min today" end-of-day prompt, `SubjectEffortIndex` per-subject minutes, `PersonalBests` records, and the per-subject weekly goals + new `SubjectGoalsStrip`. Effectively half the focus engagement surface was dead for a non-trivial slice of the student base. Fix: the natural-completion path (timer running out, NOT the explicit Skip button) now appends a row to `gg_focus_sessions_<localdate>` matching the schema `FocusTimer.handleComplete` writes — `{ mode, minutes, assignment, completedAt }`, with mode keys translated `'work'` / `'shortBreak'` / `'longBreak'` → `'work'` / `'short'` / `'long'` to match what every reader filters on. `localDateKey(new Date())` (NOT UTC) so the writer matches the FocusTimer fix from a few shifts ago. `activeTask.name` carries through as the assignment tag so the per-subject weekly goal feature can attribute the session to a subject. `advance()` now takes a `persist` flag — `handleSkip` passes `false` so an explicit skip-last-30-seconds doesn't fake a complete-session row. Safari Private Mode / quota errors swallowed silently.
- **`src/Layout.jsx`** — floating `PomodoroTimer` hidden when `currentPageName === "FocusTimer"`. Both timers writing to `gg_focus_sessions_<date>` in parallel would double-count; visually they collide on the same screen anyway. Cleaner separation: the floating widget is for OTHER pages (Dashboard / Assignments / Tests), the page version is for the dedicated /FocusTimer surface.
  - fix: 9c28e89 · https://github.com/landon-personal/gradeguardnewsync/commit/9c28e89

### Added (web) — Subject color dots on `GradeTrends` + active-task pill in floating Pomodoro

- **`src/components/dashboard/GradeTrends.jsx`** — flagged in the prior shifts' subject-color "more surfaces" backlog. Each subject row now leads with a 2px subject-color dot (matches AssignmentCard / TestCard / SubjectEffortIndex / DeadlineCalendar). The grade-letter color stays as-is — that's an A/B/C/D/F signal, distinct from subject identity.
- **`src/components/dashboard/PomodoroTimer.jsx`** — same subject-color extension. The active-task pill in the expanded panel (the small "📖 Math homework" tile under the assignment selector) was hard-coded to the mode color (indigo for work). Now tints to the task's subject color: `subjectColor(activeTask.subject)` provides the `hex` and `soft` background, plus a leading dot. Falls back to the mode color when the assignment has no subject set so a generic Pomodoro still has a sensible look.
- **Why:** GradeTrends was the only major dashboard panel left without subject color dots, and the floating Pomodoro's active-task pill was the most obvious mid-session subject-recognition surface still using mode-only color. A student running a Math session sees the same green that surfaces Math everywhere else in the app.
  - fix+feat: bc520bc · https://github.com/landon-personal/gradeguardnewsync/commit/bc520bc

### Fixed (web) — `AdminDashboard.copyCode` setTimeout had no cleanup

- **`src/pages/AdminDashboard.jsx`** — flagged in the prior shift's "what I didn't get to". `copyCode`'s `setTimeout(() => setCopiedCode(null), 2000)` had no cleanup; admin nav-aways within the 2s "copied!" window fired setState on the unmounted page. Also: back-to-back copies of different codes had racing `setCopiedCode(null)` timeouts that wiped the indicator early. Now cached in `copyTimerRef` + cleared on unmount AND on each new copy. Same shape as `PickForMeButton.confettiTimerRef` from a few shifts ago.
  - fix: bc520bc

### Fixed (web) — `AssignmentAttachment` mountedRef gap

- **`src/components/assignments/AssignmentAttachment.jsx`** — file upload (`Core.UploadFile`) + assignment update is multi-second; the parent `AssignmentCard` unmounts when filters change, status flips to completed, or the assignment gets deleted from another card. Without this guard, `setUploading(false)` / `setRemoving(false)` in the finally + `onUpdate` (parent setState) all fire on unmounted components. Standard `mountedRef` pattern: post-await `setState` only when still mounted, `toast.error` skipped on unmount.
  - fix: ea7e7ee · https://github.com/landon-personal/gradeguardnewsync/commit/ea7e7ee

---

## [Unreleased] — 2026-04-30 16:14 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Per-subject weekly study minute goals 🎯

- **`src/lib/subjectGoals.js`** (new, ~140 lines) — single source of truth for the student's per-subject minute targets. `getSubjectGoal` / `setSubjectGoal` / `clearSubjectGoal` / `listSubjectGoals` API. `thisWeekMinutesBySubject({ assignments, tests })` walks Sun → today through `gg_focus_sessions_<date>` keys, resolves each session's `assignment` tag → subject the same way SubjectEffortIndex / WeeklyRecapModal do (assignment name lookup; "Study: <test>" unwrap; untagged → "Other"), and returns `{ [subject]: minutes }`. `subjectWeeklyProgress(subject, byWeekMap)` returns `{ minutes, goal, pct, hit }` — `pct` capped at 100 for progress-bar rendering, `hit` is `minutes >= goal` so a student who blew past gets the celebration even when pct clamps. Range 15–900 min/week, default 90 min (~3.5 Pomodoros). Stored under `gg_subject_goals` as `{ "<normalized subject>": <minutes> }`. Honors per-session `minutes` stamp from the configurable-Pomodoro-length feature, with a 25-min fallback for legacy rows. Pure client-side, no PII.
- **`src/components/dashboard/SubjectEffortIndex.jsx`** — every subject row is now clickable (Enter/Space too) and opens a `SubjectDetailModal` with the same trend sparkline GradeTrends shows. When a goal is set, the row gets a second thin progress bar under the band bar: a `Target` icon + per-subject hex fill + `45 / 90 min` count (emerald + bold once hit). Also: the panel was still aggregating focus minutes as `count × 25` despite the configurable-length feature stamping per-session `minutes`; now uses each session's actual length so a student doing 50-min blocks sees their real weekly total. Footer copy updated from "25 min per session" to "Tap a subject row to open details · set a weekly goal · log time from Pomodoros".
- **`src/components/dashboard/SubjectDetailModal.jsx`** — title row gets a `Target` pill on the right that shows current week minutes / goal (or "Set goal" when none). Tapping it expands an editor: number input (clamps 15-900), 5 preset chips (60 / 90 / 120 / 180 / 240 min), Save (Enter), Clear, and a live progress preview using the subject's color (emerald + "Goal hit 🎉" when crossed). Editor draft is reset every time a new subject opens — previous subject's draft never leaks. Same auto-refresh `forceTick` pattern the color picker uses, so saving a goal updates the panel pill immediately without closing the modal.
- **`src/components/dashboard/WeeklyRecapModal.jsx`** — when 1+ subjects have a goal set, the recap renders a new "Subject goals this week" section above "Where your week went". Each row shows a subject-color dot + name + per-subject progress bar + `45/90 min` count, sorted by completion pct desc. Goal-hit rows fill emerald and bold the count. Drops the "Other" bucket since a tagless Pomodoro can't be attributed to a class. Also fixed an aggregate-correctness bug in this same file: focus minutes were computed via `FOCUS_MODE_MINUTES[s.mode]` (hardcoded 25/5/15), now respects the per-session `minutes` field.
- **Why a student notices it:** the Weekly Focus Goal feature shipped 4 shifts ago tracked one global target across all subjects ("100 min this week"). But a student trying to drag up their lowest grade needs *per-class* discipline — "I want 90 min on Math + 60 min on Science this week," not a flat budget. Now the goal lives next to the per-subject focus rhythm strip the student already looks at to pick where to spend a Pomodoro, the Sunday recap shows which class goals landed and which drifted, and the SubjectDetailModal turns into a one-stop "what's my plan for this class" hub (color override + weekly goal + grade trend + pending list, all one tap from the dashboard).
  - feat: cc98dee · https://github.com/landon-personal/gradeguardnewsync/commit/cc98dee

### Added (web) — Pomodoro length preset chips on the FocusTimer editor

- **`src/pages/FocusTimer.jsx`** — flagged in the prior shift's "what I didn't get to". The configurable-length editor previously only took raw minute inputs; a student who didn't already know what 50/10 felt like vs. classic 25/5 had no jumpstart. Added 5 1-tap preset chips above the inline inputs: **Sprint 15/3** / **Classic 25/5** / **Long 30/5** / **Deep 50/10** / **Marathon 90/15**. Tapping a chip fills the draft fields (work / short / long); the student still hits Save to commit so a misclick can't silently retime their setup. The active preset chip lights up indigo when the draft matches.
- **`src/components/common/KeyboardShortcutsModal.jsx`** — also flagged in the prior shift's "what I didn't get to". The `?` cheat-sheet didn't mention the timer-length editor's keyboard shortcuts. Added a new section: **Custom timer lengths editor** → Enter saves, Esc cancels.
  - feat: 3a60c98 · https://github.com/landon-personal/gradeguardnewsync/commit/3a60c98

### Fixed (web) — `DailyCheckout` + `WeeklyFocusGoalMini` still hardcoded 25-min sessions

- **`src/components/dashboard/DailyCheckout.jsx`** — `readFocusMinutesForDate` was summing `FOCUS_MODE_MINUTES[s.mode]` (literal `{ work: 25, short: 5, long: 15 }`) per session row. After the configurable-Pomodoro-length feature shipped, students doing 50-min sessions saw the end-of-day "you focused for X min today" prompt under-report (50-min session counted as 25). Now reads the per-session `minutes` field with the legacy 25-min fallback for rows written pre-feature. Same fix the prior shift applied to PersonalBests.computeFocusBests / FocusTimer.loadFocusHistory; this file was missed in that sweep.
- **`src/components/dashboard/WeeklyFocusGoalMini.jsx`** — same shape. `loadRecentFocusHistory` was stamping `minutes: FOCUS_WORK_MINUTES` (literal 25) onto every history row, so the Dashboard's Weekly Focus Goal bar capped at `count × 25` even for a student doing 50-min Deep sessions. Now uses `s.minutes` when present, falls back to 25.
  - fix: 82a9ca4 · https://github.com/landon-personal/gradeguardnewsync/commit/82a9ca4

### Fixed (web) — `NotificationSettingsPanel` save/requestPerm awaits could fire setState post-unmount

- **`src/components/notifications/NotificationSettingsPanel.jsx`** — the popover lives inside the bell-icon dropdown and is freely dismissable (Esc, click outside, parent unmount). `save()` calls `onClose()` in the success path which unmounts the popover, then `setSaving(false)` in finally fires on the unmounted component. `requestPerm()` has the same shape: `await Notification.requestPermission()` followed by `setPermStatus` / `setPushEnabled` / `setRequestingPerm`. Both now go through a `mountedRef` gate. toast.error stays as-is (toasts are global, safe post-unmount).
  - fix: 82a9ca4 · https://github.com/landon-personal/gradeguardnewsync/commit/82a9ca4

### Fixed (web) — `FlaggedMessagesPanel.handleBulkAction` mountedRef + early-break

- **`src/components/admin/FlaggedMessagesPanel.jsx`** — bulk-status update on a school-sized flagged-messages list is a 5–20s sequential await loop (one `onAdminWrite` per id). Admin can switch tabs / leave AdminDashboard mid-loop. Without the guard: `setSelectedIds(new Set())`, `toast.error`, and `setBulkProcessing(false)` all fired on the unmounted panel. Added `mountedRef` (init true, false on unmount), checked before each setState after the await; the loop also checks at the top of every iteration so it stops issuing requests once the panel is gone.
  - fix: ce29093 · https://github.com/landon-personal/gradeguardnewsync/commit/ce29093

---

## [Unreleased] — 2026-04-30 14:07 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Configurable Pomodoro / break timer lengths ⏱️

- **`src/lib/pomodoroLengths.js`** (new) — single source of truth for the student's preferred work / short-break / long-break minutes. `loadLengths` / `saveLengths` / `resetLengths` / `isCustomized` API; `LENGTH_RANGES` clamps at `work: 5–90`, `short: 1–30`, `long: 5–60`; `DEFAULT_LENGTHS = {work: 25, short: 5, long: 15}`. localStorage key `gg_pomodoro_lengths`. Corrupted entries clamp back to defaults so a bad save can't render an unusable timer. Pure client-side, no PII.
- **`src/pages/FocusTimer.jsx`** — new collapsible editor under the mode tabs: a pill summary (`Settings2` icon + "25 / 5 / 15 min" + an indigo "custom" badge once edited) expands to three inline number inputs with subject-color dots, a "Reset to default" button, and a Save/Cancel bar. Enter saves, Escape cancels. The whole `MODES` map is now memoized off the lengths state, so the ring/clock/mode tabs update live. Mid-session edits *clamp* `secondsLeft` to the new mode total — without the clamp, shrinking a 50-min session to 25 mid-run leaves `secondsLeft (1800) > totalSeconds (1500)`, sending the SVG ring's `strokeDashoffset` negative and rendering the ring fully drawn / inverted. When idle, the clock snaps to the new duration. The "X min of focused study today" summary now sums per-session minutes instead of multiplying count × 25 (legacy rows fall back to 25), and each new completed session stamps `minutes` onto the localStorage row so `loadFocusHistory` and `PersonalBests.computeFocusBests` keep historical aggregates correct after a length change.
- **`src/components/dashboard/PomodoroTimer.jsx`** (the dashboard floating widget) — durations come from `loadLengths()` at mount; `MODE_META` is now keyed by `lengthKey` (`work` / `short` / `long`) so the same shared library powers both the dedicated FocusTimer page and the floating dashboard widget. A student who sets 50/10/15 on the FocusTimer page sees the floating widget honour the same timings on next page load.
- **Why a student notices it:** flagged in 3 prior shifts' "what I didn't get to" backlog. The classic Pomodoro 25/5/15 isn't right for everyone — students who do 50/10 deep work blocks, or younger students who want shorter 15/5 sessions, were forced to ignore the built-in timer or use a separate app. Now the timer adapts to how *they* study, and the existing weekly-goal / heatmap / personal-bests panels all aggregate accurately against whichever lengths they prefer.
  - feat: 895b5e6 + 5905357

### Added (web) — Subject Color System extended to 5 more surfaces 🎨

- **`src/components/assignments/AssignmentCard.jsx`** — the subject `Badge` on every assignment card now leads with a 2px subject-color dot, and the badge border is tinted in the same hue. A student scrolling /Assignments now sees Math cards / Science cards / History cards distinguished by color in addition to the subject text.
- **`src/components/tests/TestCard.jsx`** — the subject label on every test card gets a 2px dot before it, and the label text colour switches from the hard-coded purple-600 to the subject's hashed hex. Tests stay visually distinct from assignments via their existing `FlaskConical` icon and red urgency badges.
- **`src/components/dashboard/StudySchedule.jsx`** — each AI-generated study-block's subject sub-line gets a 1.5px dot. The Dashboard's daily plan now inherits the same subject visuals as the rest of the app so the student can scan "OK, two Math blocks plus one Science block today" without reading every label.
- **`src/pages/Assignments.jsx` + `src/pages/Tests.jsx`** — the Subject filter dropdown's `SelectItem`s each get a leading 2px swatch. A student picking "Math" from a 12-option dropdown now sees the same color they see on every Math card / Math test, so the dropdown reads as colour-keyed rather than a flat list.
- **Why a student notices it:** the prior shift wired subject colors into 6 dashboard panels and added the override picker on SubjectDetailModal. This shift extends the same palette to the surfaces a student actually spends time on — the assignment + test card lists they look at multiple times a day, plus the filters they tap to slice them. The "What I didn't get to" of last shift was explicit: WorkloadForecast / GradeTrends / StudySchedule / Tests.jsx / Assignments.jsx / Layout. WorkloadForecast was deliberately skipped — its bars are already dense enough that adding subject dots would crowd them. The other four are wired in this shift.
  - feat: f92eee5

### Added (web) — `PersonalBests` tiles deep-link to relevant pages

- **`src/components/gamification/PersonalBests.jsx`** — 5 of the 6 record tiles are now `<Link>` to where the underlying data lives: **Most focus / day**, **Best week**, **Pomodoros / day** → /FocusTimer (the 12-week heatmap), **Biggest test climb** → /Tests, **Cards mastered** → /StudyAssistant. Longest streak intentionally stays non-clickable since the heatmap that visualizes it lives on /Achievements (the same page the panel sits on — no point linking to itself). Linked tiles get a small `ArrowUpRight` in the header that lights up indigo on hover, plus a soft border + shadow lift so the affordance reads as clickable.
- **`computeFocusBests`** — now uses the per-session `minutes` field stamped onto each focus session row by the configurable-length feature above. Legacy rows missing the field fall back to 25 (`FOCUS_WORK_MINUTES_FALLBACK`). So a student who's been doing 50-min sessions for a week sees their best week record correctly reflect that.
- **Why a student notices it:** flagged in the prior shift's "what I didn't get to". The Personal Bests panel had been a leaderboard of records you couldn't act on — you'd see "Most focus / day · 75 min" and have to navigate manually if you wanted to compare against today. Now tapping the tile drops you into the page where the record makes sense and where you can try to top it.
  - feat: 338bf96

### Fixed (web) — 2 backlog `mountedRef` gaps shipped together

- **`src/components/dashboard/WeeklySummaryButton.jsx`** — invokes the `weeklySummaryEmail` Base44 function (5–10s on a slow network); the student can navigate Dashboard → Tests / close the desktop app while the request is in flight. Without the guard, `setError` / `setSent` / `setLoading` plus the close-timer's `setOpen` / `setSent` / `setRecipientEmail` / `setRecipientName` all fired on the unmounted button. Standard `mountedRef` gate added on every post-await state set.
- **`src/pages/StudyRooms.jsx`** — three unguarded async paths: `handleCreate` (StudyRoom.create), `handleJoin` (`studyRoomLookup` find_by_code + optional join), and the invite-deep-link `useEffect`'s `joinFromInvite` (find_by_invite + optional join). Each is 1–3s and the page is freely back-navigable mid-call (closing the create form, hitting browser back). Page-level `mountedRef` + post-await gates added; `finally` only fires `setCreating(false)` / `setJoining(false)` when still mounted. Same shape as the dozen other LLM/network handlers guarded across recent shifts.
  - fix: 739b696

---

## [Unreleased] — 2026-04-30 12:18 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subject Color System: stable per-subject palette across the whole app 🎨

- **`src/lib/subjectColors.js`** (new, ~130 lines) — single source of truth for the per-subject color a student sees everywhere in the app. `subjectColor(name)` returns `{ name, hex, soft, text, ring }` from a 12-color palette via djb2 hash of the normalized subject name (lowercase, trimmed) — same algorithm flashcardMastery uses for card identity, kept consistent so future code can reason about hash collisions across both systems. Stable across page reloads, devices, and accounts. Returns hex values (not Tailwind class strings) so the caller passes them straight to inline `style` — sidesteps Tailwind PurgeCSS *and* works for student-defined override colors.
- **Per-student overrides** stored under `gg_subject_color_overrides` as `{ "<normalized subject>": <palette index> }`. `setSubjectColor` / `clearSubjectColor` / `currentPaletteIndex` round out the API. All localStorage reads/writes are wrapped in try/catch — Safari Private Mode / quota errors never crash a page that asks for a subject color.
- **Color picker on `SubjectDetailModal`** — title now shows a small swatch button next to the subject name. Tap to expand a 12-color picker; click any swatch to set; "Reset" clears the override and reverts to the hashed default. Copy underneath: "Same color shows up everywhere this subject appears — calendar, focus index, today's focus card." So a student who hates the color Math hashed to can pick green, and the change propagates the next time each surface mounts.
- **Wired into 6 surfaces:**
  - `SubjectEffortIndex` — 2.5px subject-color dot prefixes the row name.
  - `TodaysFocusCard` — the subject pill gets a leading 1.5px swatch dot.
  - `TestReadinessPanel` — each test row's subject sub-line gets a 2px dot.
  - `DeadlineCalendar` — assignment dots are now per-subject (one dot per unique subject on the day, capped at 3 to avoid visual explosion); tooltip's BookOpen icons inherit the subject color too. Tests stay red so test-vs-assignment cue is preserved.
  - `WeeklyRecapModal` "Where your week went" rows — bullets are now per-subject color instead of a single indigo.
  - `SubjectDetailModal` — title swatch + the color picker UI itself.
- **Privacy** — pure client-side, no new network, no PII off-device. `gg_subject_color_overrides` is a `{ subject_name: int }` map; subject names already live unencrypted in `Assignment.subject` / `Test.subject` so this isn't widening any surface.
- **Why a student notices it:** the app had a wave of subject-aware features ship over the past 2 days (SubjectEffortIndex, TestReadinessPanel, SubjectDetailModal, NextTestCountdown, WorkloadForecast). Each picked its own one-off color story — usually plain indigo dots or no color at all — so a student looking at "Math" on the dashboard had no visual handle on it across panels. Now every Math surface uses the same hashed color, every Science surface uses a different one, and the SubjectDetailModal lets the student override if the auto-pick clashes. A 13-year-old can recognize their classes at a glance the way a calendar app like Google Calendar lets them recognize their groups. Multi-shift backlog item — flagged 4+ shifts, finally shipped.
  - feat: 1f32360 + beaf827

### Added (web) — `SubjectEffortIndex` per-subject 7-day sparkline strip

- **`src/components/dashboard/SubjectEffortIndex.jsx`** — each subject row now has a small 7-bar strip on the right showing minutes per day across the past 7 days, oldest → today. Bars are rendered in the subject's color (faded for past days, full opacity for today). A row that's "75 min · Solid" was previously opaque on rhythm — was that 75 min crammed Mon morning, or 25 min × 3 spread Tue/Thu/Sat? Now visible at a glance. Bar height scales against the subject's own busiest day (not panel-wide max) so a low-minutes subject still shows its rhythm clearly.
- `loadRecentSessions` now returns `{ sessions: [{assignment, dayIdx}], dayLabels: [...]}` so the per-subject strip can accumulate minutes per day in a fixed-length array. dayIdx 0 = oldest in window, WINDOW_DAYS-1 = today.
- **Why a student notices it:** flagged in 4 prior shifts' "What I didn't get to" backlog. Closes the daily-vs-weekly view gap in this panel — the subject row now shows both the totals and the rhythm.
  - feat: 1f32360

### Added (web) — `WeeklyRecapModal` per-subject intention completion breakdown

- **`src/components/dashboard/WeeklyRecapModal.jsx`** — under the existing "X% of sessions hit their goal" headline, when 2+ subjects each have 2+ rated intention sessions in the week, render a small breakdown: `Math   90% · 4` / `History  40% · 5` etc. Resolves session.assignment → subject the same way SubjectEffortIndex does (assignment-name lookup, "Study: <test>" unwrap, untagged → "Other" — and Other is dropped from the breakdown since a plain Pomodoro with an intention has nothing actionable per-subject).
- Each row uses the new subject color dot for visual consistency with the rest of the recap.
- **Why a student notices it:** flagged in 3 prior shifts' "What I didn't get to" backlog. The headline pct ("70% hit their goal") flattens out signal — a student averaging 70% across all subjects might have 90% on Math but 40% on the class they're trying to avoid. The breakdown surfaces *which* subject's plans actually landed and which drifted, so the student knows where to redirect the following week.
  - feat: 26200c2

### Fixed (web) — 3 backlog mountedRef gaps shipped together

- **`src/pages/Friends.jsx`** — the friend-code-generation effect (`secureEntity("StudentProfile").update(profile.id, { friend_code: newCode })`) had no unmount guard. A student navigating off `/Friends` during the 1-3s update + invalidate window fired `setFriendCodeReady(true)` (catch branch) on the unmounted page. Real bug, very narrow window — flagged in the prior shift. Added `let cancelled = false` + cleanup to skip both the `invalidateQueries` and the catch's `setFriendCodeReady`.
- **`src/components/dashboard/PickForMeButton.jsx`** — the 60ms confetti `setTimeout` after `openModal()` was unguarded. A double-click that opened the modal then immediately closed it (or any unmount in the 60ms window) still dispatched the canvas-confetti draw to a body-attached canvas no one was looking at. Mostly cosmetic but the unguarded timer was sloppy. Added `confettiTimerRef` cleared in the openModal handler (so a back-to-back re-open replaces, not stacks) and on unmount.
- **`src/components/admin/AnonymizationToggle.jsx`** — admin-only `anonymizeSchoolStudents` server function touches every student row in the school; on a real CMS-sized roster that's a multi-second call. Admin can switch tabs / leave AdminDashboard mid-call. Without the guard, `setResult` / `setLoading(false)` / `toast.success` / `onComplete` fired on the unmounted toggle. Standard `mountedRef` gate added on every `setState` after the await and in the finally. Same shape as the dozen other LLM/network handlers guarded across recent shifts.
  - fix: 48e9414

---

## [Unreleased] — 2026-04-30 10:18 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Personal Bests panel on the Achievements page 🏆

- **`src/components/gamification/PersonalBests.jsx`** (new, ~250 lines) — six-tile grid that turns running totals into personal records the student can try to top. Tiles: **Longest streak** (different from the current streak — walks completed-assignment days for the longest consecutive run, with the date the run ended), **Most focus / day** (largest single-day Pomodoro-minute total over the past 365 days), **Best week** (largest Mon-Sun ISO-week focus-minute total), **Pomodoros / day** (most work blocks completed in one day — separates "marathon two-hour day" from "drip-feed five short blocks"), **Biggest test climb** (max-after-min within any single test's confidence-rating sequence — a test that went 1 → 4 has a +3 climb), **Cards mastered** (highest mastered-count across any single flashcard deck). Each tile is a small gradient icon + the record + a "set on Apr 28" / "Week of Apr 14" / "In one deck" sub-line so it feels like a real moment.
- **Empty state** — even with zero data the panel still renders with em-dash values and a per-tile "do X to unlock" hint ("Complete an assignment", "Run a Pomodoro session", "Mark a flashcard ✓ Got it") so a brand-new student sees what's possible.
- **All localStorage reads are Safari-Private-Mode safe** — every `localStorage.getItem` is wrapped in try/catch, every JSON.parse is wrapped, every key iteration is wrapped. The panel never crashes the Achievements page if storage is blocked.
- **`src/pages/Achievements.jsx`** — slot the panel right after the 16-week activity heatmap and before the Leaderboard, so the student sees their records on the way down the page.
- **Privacy** — pure client-side. No new network calls. Reads only from existing keys: `gg_focus_sessions_*`, `gg_test_confidence_*`, `gg_flashcard_mastery_*`. No PII off-device.
- **Why a student notices it:** the Achievements page was a stack of running totals (XP bar, completion heatmap, leaderboard, badges, subject progress). It showed *what you've earned* but nothing the student had personally set as a record they could try to beat. Personal Bests turns flat totals into "I had a 7-day streak in March, I'm at 4 today, can I get to 8?" — a 13-year-old's gamification brain wants to top their own records, not just pile up XP. The data was already being captured by 4 different features (focus, mastery, confidence, completion); this just surfaces it as the bests they actually are.
  - feat: 3ec193c

### Added (web) — Weekly Focus Goal mini-widget on the Dashboard 🎯

- **`src/components/dashboard/WeeklyFocusGoalMini.jsx`** (new) — slim one-line clickable card showing `Focus this week  ▓▓▓░░  45 / 100 min · 45%` with a thin gradient progress bar (indigo→violet under goal, emerald→teal once hit), the same per-day pace hint as the FocusTimer panel ("~12 min/day for the next 4 days" / "X min today gets you there" on the last day of the week), and a goal-met emerald + Trophy state when the student crosses the line. The whole row is a `<Link>` to `/FocusTimer` so a single tap takes them to where the goal is editable.
- **Reuses `loadGoal` / `thisWeekMinutes` / `daysLeftInWeek` from `src/lib/focusGoal.js`** — same single source of truth that powers the FocusTimer panel, so the two surfaces never drift. Self-contained `gg_focus_sessions_<date>` walker (the dashboard doesn't have to import FocusTimer just to check engagement).
- **Render gate** — only renders if the student has had at least one focus session in the past 14 days. Students who haven't started using FocusTimer yet shouldn't see a goal widget for a feature they don't use; matches the same "don't pollute the dashboard" pattern that NextTestCountdown / TestReadinessPanel / WorkloadForecast use.
- **`src/pages/Dashboard.jsx`** — slotted directly below the Mood / Daily Goals / Today's Focus row, above WorkloadForecast.
- **Why a student notices it:** flagged in the prior shift's "what I didn't get to" — the Weekly Focus Goal panel shipped two shifts ago lives in full on the FocusTimer page, but a student who's deep in their assignments + tests on the Dashboard had no way to see "where am I on this week's goal" without first clicking into FocusTimer. The goal is a real commitment — surfacing it on the homepage means they see their progress every time they open the app.
  - feat: f94073c

### Fixed (web) — `FocusTimer.TODAY_KEY` used UTC date but every reader walks local-date keys (real timezone bug)

- **`src/pages/FocusTimer.jsx`** — the writer side of `gg_focus_sessions_<date>` was `new Date().toISOString().slice(0, 10)` (UTC). Every reader walks via `localDateKey(d) = ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` (local time): `loadFocusHistory` in this same file, `WeeklyRecapModal.readFocusSessionsForRange`, `DailyCheckout.readFocusMinutesForDate`, `SubjectEffortIndex`, the new `WeeklyFocusGoalMini`, the new `PersonalBests`. For a US Eastern (UTC-5) student at 8pm local on April 30, the local date is April 30 but UTC is May 1 — the session saved under `gg_focus_sessions_2026-05-01` while every aggregate looked at `gg_focus_sessions_2026-04-30`. The session showed up in "Today's sessions" (which used the same TODAY_KEY for read+write so it stayed self-consistent) but immediately disappeared from the 12-week heatmap, the WeeklyRecap "% of sessions hit their goal" stat, the DailyCheckout end-of-day prompt, the SubjectEffortIndex per-subject minutes, and the two new widgets above — for ~5 hours every evening, until midnight UTC. Fix: TODAY_KEY now uses `localDateKey(new Date())`. Going forward writes and reads match. Old sessions saved under UTC-shifted keys still exist; they'll show up on the heatmap one day later than they actually happened, but naturally fall out of the 84-day window in 12 weeks.
  - fix: 7432dc2

### Fixed (web) — `AIAssignmentChat.SYSTEM_PROMPT` had a stale `TODAY` constant

- **`src/components/assignments/AIAssignmentChat.jsx`** — the `TODAY` constant was a module-level `new Date().toLocaleDateString(...)`, evaluated once when the file was first loaded. A student who opened the chat on Friday and left the tab open over the weekend (typical for a school laptop with the app pinned, or the Electron desktop app that's almost never quit) sent every subsequent message with the LLM still believing "today is Friday." When they then said "this is due Tuesday" or "this is due tomorrow," the LLM resolved the date relative to the stale Friday — so an assignment dated 4 days in the past landed silently on the dashboard already overdue. Fix: SYSTEM_PROMPT is now a template with a `__TODAY__` placeholder filled by `todayString()` at the moment `sendMessage` fires.
  - fix: c6798b3

### Fixed (web) — `RoomView` had no unmount guard for the quiz-gen LLM, the score-submit, or the initial DB load

- **`src/components/studyroom/RoomView.jsx`** — multiplayer-study-room screen had three unguarded async paths: (1) initial load (`secureEntity("StudyRoom").filter({id}).then(setRoom)` plus the StudyRoomResult fetch) — back-nav or `onLeave` mid-DB-roundtrip fired `setRoom`/`setResults`/`activateQuiz` on the unmounted component; (2) `handleStartQuiz` — host's "Start quiz" button fires an `InvokeLLM` for 8 multiple-choice questions plus a `secureEntity("StudyRoom").update`, the LLM round trip is 8-15s, host can leave the room mid-call and the catch's `toast.error` plus the finally's `setGenerating(false)` fired post-unmount; (3) `handleSubmit` — member's score-submit fires create + filter + optionally update. Standard `mountedRef` gate added (ref starts true, flipped false on unmount), every `setState` after every `await` guarded. Same shape as the prior shifts' guards.
  - fix: b765a0c

### Fixed (web) — `SharedNoteComposer` had no unmount guard for the file upload + the StudyRoomNote create

- **`src/components/studyroom/SharedNoteComposer.jsx`** — composer lives inside SharedNotesPanel inside RoomView. `handleFile` (multi-second `Core.UploadFile` for a PDF or image) and `handleSave` (`secureEntity("StudyRoomNote").create` network round-trip) both `setState`d after the await. Leaving the room mid-upload / mid-save fired setStates on the unmounted composer.
  - fix: e590ba6

---

## [Unreleased] — 2026-04-30 08:15 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Weekly Focus Goal panel on the FocusTimer page 🎯

- **`src/lib/focusGoal.js`** (new) — pure-localStorage helpers (`loadGoal`, `saveGoal`, `clampGoal`, `thisWeekMinutes`, `daysLeftInWeek`, `startOfWeek`) keyed by a single `gg_focus_weekly_goal_minutes` integer. Default goal 100 min/week (~4 Pomodoros). Clamped to 25–1500 so a corrupted localStorage value or a misclick can't set a 0-minute or 9999-minute goal. `thisWeekMinutes` accepts the same `{date, minutes, completedAt}` shape that `FocusTimer.loadFocusHistory()` produces — Sunday-anchored week boundary to match the heatmap. Same defensive Safari-Private-Mode pattern as `flashcardMastery` / `testConfidence` — every read/write is guarded so the page still renders if storage is blocked.
- **`src/pages/FocusTimer.jsx`** — new "Weekly focus goal" card slotted between Today's sessions and the Tip line. Shows `<minutes-this-week> / <goal> min this week` with a percentage badge on the right and a 2px gradient progress bar (indigo→violet under goal, emerald→teal once goal hit). Below: a per-day pace hint — "Y min to go · ~Z min/day across the next N days" — so a student behind on their goal sees exactly how much per day gets them across the line. On Saturday (last day of the week) the hint flips to "X min today gets you there". Once the goal is hit, a single `toast.success` fires (latched in a ref so it doesn't re-fire every re-render after) and the bar / number / icon flip emerald with a Trophy icon.
- **Inline edit** — a small Edit pencil in the panel header swaps the readout for a `<input type="number" min=25 max=1500 step=5>` plus Save/Cancel buttons. Enter saves, Escape cancels. Save round-trips through `clampGoal` so an out-of-range value clamps to 25 or 1500 instead of being rejected.
- **Privacy** — pure client-side. No new network calls, no server-side state, no PII off-device. Same posture as DailyCheckout / SessionIntentions / SubjectEffortIndex / TestConfidenceRater / FlashcardMastery.
- **Why a student notices it:** the FocusTimer page already showed today's session dots and a 12-week heatmap, but had no weekly cadence in between — students who set themselves a "study X hours this week" target had to count dots manually across 7 days. Now a target is one click to set, the bar fills as they go, the hint tells them what they need per day to hit it, and crossing the line gets a visible celebration. Connects daily focus sessions to a weekly goal that mirrors how students actually plan ("I want to do Y hours of math this week").
  - feat: a0bd50e

### Added (web) — KeyboardShortcutsModal now documents the shortcuts that actually exist ⌨️

- **`src/components/common/KeyboardShortcutsModal.jsx`** — the `?` help modal listed only `⌘K`, `?`, `Esc`, and `N`, but the app already had a bunch of unadvertised shortcuts. Added two new sections — **Flashcards** (Space/F flip, ←/→ step, G "Got it" after flip, R "Need review" after flip) and **Focus Timer (when floating Pomodoro open)** (Space start/pause). Also added the global **P** toggle for the floating Pomodoro to the Anywhere section. Now `?` is a real shortcuts cheat-sheet instead of a teaser.
  - feat: f608623

### Fixed (web) — `AssignmentCard.saveNote` had no unmount guard

- **`src/components/assignments/AssignmentCard.jsx`** — flagged in the prior shift's "what I didn't get to". The note-edit save fires `secureEntity("Assignment").update()` which is a multi-second round-trip, and the card unmounts in three realistic ways mid-await: the assignment gets deleted from another card, the parent's status / search / subject filter changes and the card scrolls out of the list, or the user taps the parent tab to switch. All three left `setSavingNote(false)` and `setEditingNote(false)` (and the catch-branch `setNoteDraft` + `toast.error`) firing on the unmounted card — the standard React warning + a tiny memory leak. Added the standard `mountedRef` gate before every `setState` after the await and in the finally block.
  - fix: aec8408

### Fixed (web) — `AssignmentAttachment.handleRemove` never set the `removing` state

- **`src/components/assignments/AssignmentAttachment.jsx`** — the component declared `const [removing, setRemoving] = useState(false)` and read `removing` in JSX (button `disabled={removing}` and the `Loader2` spinner), but `handleRemove` never called `setRemoving(true)` / `setRemoving(false)`. So clicking the X to detach a syllabus / notes file never showed the spinner, never disabled the button, and a fast double-click sent two `update(... attachment_url: null ...)` requests in flight. Added the standard `if (removing) return;` double-submit guard at the top, `setRemoving(true)` before the await, and `setRemoving(false)` in a new finally block.
  - fix: 801d5b2

### Perf (web) — `StudySchedule.jsx` `dataKey` re-stringified every render

- **`src/components/dashboard/StudySchedule.jsx`** — flagged in the prior shift's "what I didn't get to". The `dataKey` (used to detect when assignments / tests have changed and re-fire the schedule LLM call) was a `JSON.stringify` of every assignment field + every test field, computed unconditionally on every Dashboard render. While the student was typing into the adjustment textarea (which re-renders on every keystroke), this fired up to 60+ times in a row for a student with 30+ assignments — wasted work that showed up in profiling. Wrapped the JSON.stringify in `useMemo([assignments, tests])` so it only recomputes when the underlying data actually changes.
  - perf: eb48d5b

---

## [Unreleased] — 2026-04-30 06:20 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Flashcard Mastery Tracker: per-card "Got it" / "Need review" + Weak-cards filter 📇

- **`src/lib/flashcardMastery.js`** (new) — pure-localStorage helpers (`loadDeckMastery`, `recordCardMastery`, `clearCardMastery`, `clearDeckMastery`, `summarizeDeck`, `cardIdFor`) keyed per-deck by `gg_flashcard_mastery_<safe-deckname>`. Card identity within a deck is a stable djb2-style hash of (trimmed, lowercased) `front+back`, so a deck regenerated by the LLM with identical card content keeps mastery, while a deck regenerated with different content starts fresh for the new cards. Deck size capped at 200 entries (oldest-by-ts evicted) so a student grinding for a month can't blow out localStorage. Same defensive Safari-Private-Mode / corrupted-JSON pattern as `testConfidence` — every read/write is guarded, and a corrupted entry auto-clears instead of crashing the deck.
- **`src/components/assistant/FlashcardViewer.jsx`** (rewrite + extend) — after a student flips a card to the answer, two buttons appear at the card foot: a **rose/amber "↻ Need review"** and an **emerald "✓ Got it"**. Tapping the same status they already chose toggles it off (lets them undo a mismark without leaving the card). "Got it" auto-advances to the next card after a 220 ms beat; "Need review" stays put so they can flip back and re-read.
- **Header progress chip** — `X/N mastered (Y%)` on the right side of the deck title, reading directly off the per-deck mastery map. When all cards are mastered the chip flips to a celebratory "🎉 All mastered!" emerald state. A thin emerald-to-teal progress bar sits below the header and animates as the chip number changes — gives the deck a sense of forward motion that the chip number alone doesn't.
- **Color-coded pagination dots** — emerald = mastered, amber = review, gray = unseen, indigo with a ring = current. A glance at the dot strip tells the student where they are in the deck *and* which cards they've struggled with.
- **"Weak (N)" filter button** appears in the navigation bar once at least one card is marked AND not every card is mastered. Tapping it filters the deck to only cards marked `review` or unseen, so the student can drill what they don't know without scrolling past the easy ones. Auto-falls-back to "all" when the last weak card gets mastered (so the viewer doesn't render an empty state mid-flow).
- **G / R hotkeys** — gated to flipped state, so the student can't mark a card without looking at it. Mirror the buttons exactly. Existing ←/→ step + Space/F flip hotkeys are preserved.
- **All-mastered celebration row** — emerald banner at the bottom of the viewer with a "Reset progress" link, in case the student wants to drill the whole deck again. Resetting clears every card's mastery for the current deck only.
- **`src/pages/Tests.jsx`** — `deleteMutation.onSuccess` now also calls `clearDeckMastery(testName)` so deleting a test cleans up its flashcard mastery the same way it already cleans up its confidence-rating localStorage (looks the test up by id in the cached query data *before* invalidating, since the mastery key is name-based, not id-based).
- **Privacy** — pure client-side. No new network calls, no server-side state, no PII off-device. Card text never leaves the browser. Same posture as DailyCheckout / SessionIntentions / SubjectEffortIndex / TestConfidenceRater.
- **Why a student notices it:** the flashcard viewer was a one-pass tool — flip, click next, flip, click next. Closing the modal lost everything. A 13-year-old studying for a 30-card vocab quiz had to mentally track which 6 cards they were still rusty on, because the next time they re-opened the deck, every card looked the same. Now: every "Got it" stays got, every "Need review" comes back highlighted, and the "Weak (N)" button drops them straight into a focused drill on just the cards they're stuck on. The deck progresses from "scroll through 30 cards every time" to "mastered 24, drill the remaining 6" — much closer to how anyone actually studies flashcards.

### Fixed (web) — `StudyAssistant` had no unmount guard for any of its 4 long LLM/upload chains

- **`src/pages/StudyAssistant.jsx`** — `sendMessage`, `generateFlashcards`, `generateQuiz`, the post-quiz personalized-feedback follow-up, the `pollAiJob` recursive poller, and `handleFileAttach` all kick off multi-second awaits and then `setState` on the result. The chat-call alone routinely runs 5-15s. Navigating to another page during the call (back button, bottom-tab to /Friends, click a route in the side nav) unmounted the page but the awaits kept going — `setMessages`, `setLoading`, `setAiStatuses`, `setAiStageIndex`, `setAttachedFile` would all then fire on the unmounted component, throwing the standard React warning and leaking a tiny bit of memory. Added the standard `mountedRef` (ref starts true, flipped on unmount) gated before every `setState` after each await and in the finally block. Same shape as the `MiniGames` / `TestForm` / `VocabQuizFromNotes` guards from prior shifts.

### Fixed (web) — `SmartScanModal` had no unmount guard for the upload + LLM scan + clarify chains

- **`src/components/assignments/SmartScanModal.jsx`** — the agenda-scanner modal is dismissable mid-scan (X, Esc, click backdrop) and the upload + LLM extract chain easily takes 5-15s. The clarify step also fires another LLM call to parse fuzzy date phrases like "Friday" or "next week". Closing the modal during either await left `setImageUrl`, `setAssignments`, `setSelected`, `setStep`, `setClarifyingIndex` / `setClarifyingField` / `setClarifyingQuestion` / `setClarifyingAnswer`, `setLoadingClarify`, and the catch-branch `toast.error` calls running on the unmounted component. Same mountedRef shape as the StudyAssistant guards.

### Fixed (web) — `AIAssignmentChat`'s mountedRef was declared but didn't gate the LLM await chain

- **`src/components/assignments/AIAssignmentChat.jsx`** — the component already had `mountedRef` (declared for the readyTimerRef setTimeout that gates the post-flush `onClose` callback), but the actual `InvokeLLM` await chain had no gating — `setMessages` after the await, the catch-branch `setMessages`, and `setLoading` in finally all fired on unmount if the modal closed during the LLM call. Same shape as the StudyAssistant guards just shipped.

### Fixed (web) — `StudySchedule` had no unmount guard for its 8-15s schedule-generation LLM call

- **`src/components/dashboard/StudySchedule.jsx`** — the dashboard's StudySchedule card triggers an `InvokeLLM` call (with all the student's profile + assignments + tests + school hours stuffed into the prompt) that easily runs 8-15s. Navigating away from the dashboard while the call was in flight (clicking into /Assignments, /Tests, /StudyAssistant) unmounted the card but `setSchedule` / `setError` / `setLoading` / `setAdjusting` / `setHistory` / `setAdjustment` all ran on the unmount. Same mountedRef shape as the rest of the codebase.

### Fixed (web) — `PomodoroTimer.playAlarm` was leaking a fresh AudioContext on every Pomodoro completion

- **`src/components/dashboard/PomodoroTimer.jsx`** — `playAlarm` did `new AudioContext()` on every Pomodoro completion and never closed it. Chrome and Safari cap simultaneous AudioContexts at ~6, so a student running 4-5 work blocks back-to-back would silently lose the alarm sound for the rest of the page session — `new AudioContext()` just stops working at that point and the focus-session "session complete!" beep never plays. Switch to a single shared context held in a ref, recreated only if it has been closed, with proper cleanup on unmount. Also handle the `suspended` state browsers leave the context in after a page-hide (call `ctx.resume()` before scheduling the oscillators). FocusTimer's `playPing` already closes its context after the beep ends — only PomodoroTimer was leaking.

### Why
One real student-visible feature (Flashcard Mastery Tracker — per-card "Got it" / "Need review" with persistent localStorage state, color-coded progress signals across the chip / bar / pagination dots, a Weak-cards filter mode that drills only the unmastered cards, G/R hotkeys, all-mastered celebration with a Reset link, and clean cleanup on test-delete via the same path the existing testConfidence cleanup uses). Plus a tight bug-fix block: four more `mountedRef` guard misses (StudyAssistant — by far the largest, with 4 long LLM/upload chains; SmartScanModal upload+scan+clarify; the AIAssignmentChat LLM chain that had an unused mountedRef; StudySchedule schedule generation), and one actually-broken AudioContext leak in PomodoroTimer that silenced the focus-session alarm after ~6 sessions in a single page session.

---

## [Unreleased] — 2026-04-30 04:15 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test Readiness Panel: aggregate confidence across upcoming tests 🎯

- **`src/components/dashboard/TestReadinessPanel.jsx`** (new) — natural follow-on to the Test Confidence Tracker that shipped two shifts ago. The per-test rater on each TestCard (and the inline rater in the Dashboard's `NextTestCountdown` banner for the soonest test) was already capturing 1-5 readiness ratings into per-test localStorage. But a student preparing for 3-4 tests in the next 14 days had no way to see the whole slate at a glance — they had to navigate to `/Tests`, scroll through their list, and read each card's rater individually.
- **What the panel surfaces** — the soonest 14 days of non-completed tests, sorted by days-until. Each row: a days-until tile (`0 TODAY` / `1 TMRW` / `N DAYS`), the test name + subject, plus on the right side the confidence chip (😰/🤔/😐/🙂/💪 with color band), a 6-bar mini-trend strip when there are 2+ ratings, and a delta arrow (Up/Down/Steady from previous rating). Tests without a rating get a "Tap to rate" pill in purple instead.
- **Inline rate / update** — clicking a row expands it to a 5-button rater (the same `CONFIDENCE_LEVELS` shape as the per-test rater for visual consistency). A rating fires `recordConfidence(testId, value)` from `src/lib/testConfidence.js` (the single source of truth), updates the local state map so the row's chip + trend strip refresh instantly, and auto-collapses after a brief celebration animation. The student never has to leave the dashboard. Same `mountedRef` + `collapseTimerRef` pattern as `TestConfidenceRater` — celebration timer cleared on unmount so we don't `setState` after the dashboard navigates away mid-rating.
- **Smart callout** above the rows — names the single highest-leverage action: an unrated test in the next 7 days ("X is in 3 days — a quick readiness check helps you spot weak spots"), a stuck-low rating ≤ 2 in the next 7 days ("Confidence on X is still shaky — try a different practice mode"), a celebrate-improvement signal ("Confidence on X is climbing — keep going"), or an aggregate fall-through ("Average readiness across N rated tests: X.X/5"). Same priority-sort pattern `WorkloadForecast` and `SubjectEffortIndex` use.
- **Render gate** — auto-hides when there are < 2 upcoming tests in the 14-day window. Below 2, `NextTestCountdown` already shows the same data inline at the top of the dashboard for the single test; surfacing it twice would just be visual duplication. With 0 tests, nothing renders.
- **`src/pages/Dashboard.jsx`** — wired between `SubjectEffortIndex` and `ProgressCharts`, threading the same `activeTests` prop the rest of the dashboard already has.
- **Privacy** — pure client-side derivation. No new network calls, no new server-side state, no PII off-device. Same posture as DailyCheckout / SessionIntentions / SubjectEffortIndex / TestConfidenceRater. All localStorage reads guarded for Safari Private mode / sandboxed iframes via the existing `loadConfidence` helper.
- **Why a student notices it:** the Test Confidence Tracker that shipped on 04-30 02:30 UTC answered the *per-test* feeling-question ("Am I getting more prepared for THIS test?"). But a 13-year-old with a Math quiz on Wednesday, a History test on Thursday, and a Science test next Tuesday had no across-tests view — and that's exactly the slate where readiness needs visible attention. The panel turns "I have three tests coming up" from background dread into a structured triage: which one's most overdue for a check-in, which one's still rated 1/5 with three days to go, which one's actually trending up.

### Fixed (web) — `MiniGames`: setState-after-unmount on slow LLM responses

- **`src/components/assistant/MiniGames.jsx`** — flagged in the prior shift's "What I didn't get to". `LightningRound`, `MemoryMatch`, and `TermGuesser` all kick off an `InvokeLLM` generate-questions / pairs / term call from a `useEffect` and then `setState` on the result. A slow LLM response combined with a quick `StudyAssistant` tab switch (or any parent-level unmount of the active-game container) produced a `setState`-on-unmounted-component warning + tiny memory leak. Added a `mountedRef` that flips false on unmount, with `setState` calls gated after every `await` and in the `finally` block. Same pattern `AIAssignmentChat` / `TestConfidenceRater` already use. Identical shape across all three games.

### Fixed (web) — `PomodoroWidget`: Start after a finished session was a no-op

- **`src/components/dashboard/PomodoroWidget.jsx`** — once a Pomodoro counted down to 0, `secondsLeft` sat at 0 with `running=false` and `notifiedRef.current=true`. Clicking Start re-armed the interval, which immediately fired its `prev <= 1` branch (set `running=false`, skip the notification because `notifiedRef` was already true) and bailed — student saw the timer briefly run and stop with no progress and no "Session complete!" toast on the next round. The escape hatches (`Reset`, `Switch mode`, `Preset`) all already cleared both, but the most natural action — clicking Start again — produced nothing. `handleStartPause` now restores the mode's full duration and clears `notifiedRef` when the user starts from a fully-decremented state. Pause behavior is unchanged.

### Fixed (web) — `AssignmentForm` + `VocabQuizFromNotes` + `TestForm` AI handlers had no unmount guard

- **`src/components/assignments/AssignmentForm.jsx`** — `handleAISuggest` fires `InvokeLLM` from a button click in a dismissable modal. Closing the form (Cancel / Esc / Submit) while the call was in-flight left `setForm` + `setAiSuggested` + the catch-branch `toast.error` running on an unmounted component. Added the standard `mountedRef` guard.
- **`src/components/assistant/VocabQuizFromNotes.jsx`** — same pattern in `handleGenerate`. The StudyAssistant tool surface can be navigated away mid-generation; `setCards` / `setError` / `setGenerating` could fire post-unmount.
- **`src/components/tests/TestForm.jsx`** — same pattern in `handleAISuggest`. Closing the test-form modal mid-call left the same state-after-unmount tail.
- All three follow the `MiniGames` fix's shape: ref starts true, flipped false on unmount, gated before every `setState` after the await + in the `finally`.

### Why
One real student-visible feature (Test Readiness Panel — the missing across-tests view that turns the per-test confidence ratings the prior shift's TestConfidenceRater is already capturing into a triage surface on the dashboard, with a smart callout that names the single highest-leverage next action and inline rate-or-update so the student never leaves the page). Plus a tight bug-fix block: the `MiniGames` setState-after-unmount that was flagged in the prior shift's "What I didn't get to" backlog, an actually-broken Pomodoro Start-after-end no-op (caught while auditing the existing dashboard timers), and three more LLM-handler unmount guards in form modals (`AssignmentForm`, `VocabQuizFromNotes`, `TestForm`) — same pattern, three more callsites.

---

## [Unreleased] — 2026-04-30 02:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test Confidence Tracker: per-test "How prepared do you feel?" 💪

- **`src/lib/testConfidence.js`** (new) — pure-localStorage helpers (`loadConfidence`, `recordConfidence`, `clearConfidence`, `latestRating`, `previousRating`, `ratedToday`) keyed by `gg_test_confidence_<testId>`. Stores a chronological array `{ rating: 1..5, ts: ISO }` capped at 30 entries so a student rating compulsively for a month-out test can't blow out localStorage. Same defensive Safari-Private-Mode / corrupted-JSON pattern as `MoodCheckIn` / focus sessions — every read/write is guarded, and corrupted entries auto-clear instead of crashing the page.
- **`src/components/tests/TestConfidenceRater.jsx`** (new) — 5-button picker (😰 Lost · 🤔 Shaky · 😐 Okay · 🙂 Solid · 💪 Ready) that flips between an empty-state prompt and a compact display of the latest rating (color-banded chip: rose → amber → yellow → lime → emerald). After 2+ ratings, surfaces a tiny vertical-bar trend strip showing the last up to 8 entries with the most-recent ringed in purple, plus a delta arrow ("Up 1 from last" / "Down 2 from last" / "Steady"). "Rate again" / "Update" link reopens the picker any time. Tailwind-JIT-friendly explicit class lists per tone so the build picks them up.
- **Wired into `src/components/tests/TestCard.jsx`** — renders below the action-buttons row (Prep plan / Flashcards / Practice Quiz) for every non-completed, future-dated test. Same `showPrepToggle` gate the Prep Timeline uses, so completed/past tests don't show a stale "How prepared do you feel?" prompt.
- **Wired into `src/components/dashboard/NextTestCountdown.jsx`** — the urgent-test banner on the Dashboard hero now has a compact confidence rater inline. Means a student can rate readiness for the closest test without leaving the dashboard. Reuses the same component in `compact` mode for a single source of truth on the rendering.
- **Cleanup on delete** — `src/pages/Tests.jsx` `deleteMutation.onSuccess` now calls `clearConfidence(id)` so deleted tests don't leave orphan localStorage entries behind.
- **Privacy** — pure client-side. No new network calls, no server-side state, no PII off-device. Same posture as DailyCheckout / SessionIntentions / SubjectEffortIndex / DailyGoalsCard.
- **Why a student notices it:** the Test Prep Timeline shipped earlier today tells a student *what to do* for an upcoming test. Flashcards / Practice Quiz tell them *the content*. But neither answers the actual feeling-question that drives test anxiety: *"Am I getting more prepared, or just spinning my wheels?"* A 13-year-old who rated themselves 1 ("Lost") on Monday, 2 ("Shaky") on Wednesday, and 4 ("Solid") on Friday now has visible proof that the prep work moved the needle — the trend strip shows it, the delta arrow names it. Conversely, a student who's been "studying" all week but is still rating 2/5 has a different signal: time spent ≠ readiness, and they need to switch tactics (different mode of practice, ask for help, reschedule the test). Felt-readiness was the missing measurable.

### Fixed (web) — `Onboarding.handleSchoolCodeNext` had no loading guard

- **`src/pages/Onboarding.jsx`** — flagged in the prior shift's "What I didn't get to". Spam-clicking Continue on a slow connection could fire multiple parallel `secureEntity("School").filter(...)` calls. Added `checkingSchool` state with a top-of-handler bail (`if (checkingSchool) return;`) and a visible "Checking…" label on the disabled button. Same pattern shipped on the Tests / Assignments / Onboarding-auth handlers in prior shifts.

### Fixed (web) — `FriendChatPanel` failed send burned the 3-second cooldown

- **`src/components/friends/FriendChatPanel.jsx`** + **`src/pages/Friends.jsx`** — flagged in the prior shift's "What I didn't get to". `lastSentRef.current = now` was set BEFORE awaiting `onSend()`, so a network failure (or the existing 12-second `Promise.race` reject in `sendMessageMutation`) consumed the cooldown even though no message went out — student then had to wait 3 seconds before retrying despite seeing an error toast. Now: snapshot the prior `lastSentRef`, set the new value, `await Promise.resolve(onSend())`, revert on rejection. Parent's `onSend` now returns `sendMessageMutation.mutateAsync(...)` so the rejection actually propagates back to the rate-limit logic.

### Fixed (web) — `FlaggedMessagesPanel.handleSelectAll` could clear the wrong selection

- **`src/components/admin/FlaggedMessagesPanel.jsx`** — flagged in the prior shift's "What I didn't get to". `prev.size === newIds.length ? clear : selectAll` compared counts, not membership. If the visible-messages set changed between clicks (filter toggle from "all" → "new" or status-tab switch) and the count happened to match, "Select all" silently cleared the prior selection instead of selecting the now-visible rows. Compare via `newIds.every(id => prev.has(id))` instead.

### Fixed (web) — Default notification reminders never fired the "Due today" branch

- **`src/components/notifications/useNotifications.jsx`** + **`NotificationBell.jsx`** + **`NotificationSettingsPanel.jsx`** — `useNotifications` had a clear "Due today: X" / "Test today: X" title branch but the default fallback for `remind_days_before` was `[1]` (1 day before), so any student who hadn't manually toggled the "Same day" option in `NotificationSettingsPanel` never received day-of reminders — the most useful one. Default to `[0, 1]` everywhere it appears so new accounts and accounts that haven't customized get both same-day and 1-day-before pushes by default. Existing customized settings are unaffected.

### Fixed (web) — `useNotifications` race window let duplicate pushes fire

- **`src/components/notifications/useNotifications.jsx`** — `assignments` and `tests` change identity any time the React Query cache invalidates; the effect re-runs on each identity change. Between when the local check `last_checked === todayStr` passes and when the server-side PATCH actually lands, multiple concurrent runs could all pass the gate and fire the same notifications (visible to a student as their phone buzzing 2-3 times for the same item). Added `inFlightRef` + `firedTodayRef` so same-mount duplicates are gated even before the server write propagates back to the React Query cache.

### Fixed (web) — `AssignmentCard.noteDraft` was stuck on the value at first mount

- **`src/components/assignments/AssignmentCard.jsx`** — `useState(assignment.notes)` only seeds once. If the parent re-rendered with an updated note (other tab edit, focused refetch, optimistic-update rollback), the read-mode `<p>` updated but the textarea draft didn't. Opening the editor showed stale text, and saving would silently overwrite the newer server value. Sync `noteDraft` to `assignment.notes` whenever it changes — but only when not actively editing, so a query refetch mid-edit doesn't blow away in-progress typing.

### Fixed (web) — `TestConfidenceRater` celebration timer leaked on unmount

- **`src/components/tests/TestConfidenceRater.jsx`** — caught in the same shift the feature was shipped. The 1.1s `setTimeout(setJustRated(null), 1100)` after a successful rating wasn't tracked, so navigating away (or deleting the test) during that window fired `setState` on the unmounted component. Mirror into a ref + clear on unmount, same pattern the codebase uses elsewhere (`PomodoroWidget`, `InviteLinkButton`, `WeeklySummaryButton`, `AIAssignmentChat`).

### Why
One real student-visible feature (Test Confidence Tracker — per-test 1-5 self-rating with trend-strip + delta arrow, surfaced both inline on every TestCard and in the Dashboard's NextTestCountdown banner, and cleaned up cleanly when tests are deleted). Plus a tight bug-fix block: three of the four flagged items from the immediate-prior shift's "What I didn't get to" list (school-code loading guard, FriendChatPanel cooldown burn, FlaggedMessagesPanel select-all bug), one CMS-relevant default-correctness fix (notification reminders never firing same-day), one race-condition fix (duplicate notifications during query refetch storms), one stale-state fix (AssignmentCard note draft), and one self-caught regression (the new Confidence Rater's own setTimeout leak).

---

## [Unreleased] — 2026-04-30 00:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Session Intentions: a metacognitive bookend on every Pomodoro 🎯

- **`src/pages/FocusTimer.jsx`** — added a one-line "Goal for this session (optional) — e.g. 'finish problems 1–10'" input that renders above Today's Sessions whenever `mode === "work"` and the timer is not running. Capped at 120 chars with a clear button. While the timer runs, the input is replaced by a read-only chip pinning the intention so the student keeps the goal in view without being able to edit mid-session.
- **Post-session reflection modal** — when a work session completes WITH an intention set, a modal surfaces the intention back at the student and asks "Did you finish what you set out to do?" with three buttons: Yes (emerald), Partly (amber), Not yet (rose). Closing without rating ("skipped") still saves the session but doesn't count toward stats. The auto-switch to break is deferred until the modal is dismissed; without an intention, the existing auto-switch fires immediately as before.
- **Storage** — extended the existing `gg_focus_sessions_<date>` localStorage shape with optional `intention: string` and `outcome: "yes"|"partly"|"no"|"skipped"` fields. Older sessions read back as before (other readers — `StudyHistoryInsights`, `WeeklyRecapModal`'s minutes/days math, `SubjectEffortIndex` — only consume `mode`/`minutes`/`subject`/`completedAt`/`date`, so the new fields are inert noise to them). No new keys, no schema migration.
- **`src/components/dashboard/WeeklyRecapModal.jsx`** — surfaces an "X% of sessions hit their goal" stat row when there are 2+ rated sessions in the current Mon-Sun week. Yes = full credit, Partly = half credit, No = zero. "Skipped" outcomes don't count either way (rating intent matters — a skipped reflection is data we don't have, not data that says "no"). Hidden entirely below 2 rated sessions to avoid noise on light weeks.
- **Privacy**: pure client-side, no new network, no PII off-device, all reads/writes guarded for Safari Private Mode / sandboxed iframes via the existing `loadTodaySessions` / `saveTodaySessions` helpers. Same posture as `WorkloadForecast` / `SubjectEffortIndex` / `DailyCheckout`.
- **Why a student notices it:** the Pomodoro habit was already paying off — sessions get logged, the heatmap shows consistency, the new SubjectEffortIndex shows class-level imbalance. But every individual 25-min block was a black box: the student sat down with no goal at the start and walked away with no judgment at the end. Adding intention + reflection turns each session into a small commitment-and-honesty loop. Over a week, the recap stat answers the question students rarely ask themselves out loud: "I'm putting in the time — but how much of it actually moves the thing I sat down to move?" Finishing 80% of intended sessions is a meaningfully different signal than just logging hours.

### Fixed (web) — MiniGames silent LLM failure misdiagnosed as 'No tests' / 'Game Over'

- **`src/components/assistant/MiniGames.jsx`** — `LightningRound`, `MemoryMatch`, and `TermGuesser` all wrapped their `InvokeLLM` call in a `try/catch` that either swallowed the error entirely (MemoryMatch) or set `gameOver=true` (LightningRound, TermGuesser). When the AI call actually failed (network, rate limit, bad JSON), the student saw misleading copy: `"No tests available!"` (suggesting they should add tests), `"Game Over! Final Score: 0"` (suggesting they finished a game they never got to play), or `"Game Over! The answer was: "` with an empty term (visibly broken). Added a `loadError` state to each game and a clear error UI: `"Couldn't build this round / pick a term — check your connection and try again"` with a Close button. The legitimate empty-tests fallback ("No tests available!") is preserved as a separate path so a student with zero tests still gets the correct nudge to add some.

### Fixed (web) — `NotificationSettingsPanel.requestingPerm` state read but never set

- **`src/components/notifications/NotificationSettingsPanel.jsx`** — the Enable Browser Notifications button bound `disabled={requestingPerm}` and showed `"Asking your browser…"` while it was true — but `setRequestingPerm` was never called, so the UI stayed at the static label and the user could spam-click. Each click fires `Notification.requestPermission()`; once the browser's permission dialog is up, additional calls either no-op (Chrome) or queue another dialog the user has to dismiss (some other browsers). Added the missing `setRequestingPerm(true)/false` around the request plus a top-of-handler bail when already requesting.

### Fixed (web) — FocusTimer Space could start the next session behind the reflection modal

- **`src/pages/FocusTimer.jsx`** — once the new reflection modal landed, the existing Spacebar-to-start/pause listener (registered with `[]` deps and only checking `target === document.body`) could still fire while the modal was open, setting `running=true` and starting the next work session beneath the modal. Mirrored `pendingReflection` into a ref so the listener sees the live value without re-registering, then early-returned when the modal is up. Same pattern used for `showFormRef` in Tests/Assignments after the prior N-key bug.

### Why
One real student-visible feature (Session Intentions — the missing metacognitive bookend on Pomodoro: a one-liner goal at the start of each work session, a 3-button self-rating at the end, and an "intention completion %" stat that surfaces in the Sunday recap when there are enough rated sessions to be meaningful). Plus a tight bug-fix block: a UX-misdiagnosis bug across all three StudyAssistant MiniGames where a network failure on the LLM call was rendered as "Game Over" or "No tests available", a broken loading-state on the Enable Notifications button that let users spam permission prompts, and a Spacebar-bypasses-modal bug introduced by the new feature itself (caught and patched in the same shift).

---

## [Unreleased] — 2026-04-29 22:00 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subject Effort vs Grade card: surface classes getting cold focus time 📊

- **`src/components/dashboard/SubjectEffortIndex.jsx`** — new dashboard surface that closes the loop between the data the student already has on their dashboard (their grades per class, via `subjectGradeStats(assignments)`) and the data the focus timer was already producing on their device (per-day `gg_focus_sessions_<date>` localStorage entries with the picked assignment's name on each work session). The dashboard had a heatmap of *when* they studied (`StudyHistoryInsights`) and a leaderboard-of-grades (`GradeTrends`), but nothing connecting *what they studied* to *what their grade is*. A 13-year-old who's been pouring focus minutes into Math while their History grade slips never sees that imbalance until the report card.
- **Mapping** — for each work-mode session in the past 7 days, the assignment-name tag on the session matches back to an `Assignment.subject` (or `"Study: <test name>"` matches back to a `Test.subject` for FocusTimer testId deep-links). Untagged sessions (no picker selection) bucket as `"Other"`. 25 min per work session via `FOCUS_MODE_MINUTES.work` in `FocusTimer.jsx`.
- **Layout** — sorted with the lowest-graded subject on top so the rebalance signal is the first row in the eye-line. Each row: subject name + grade letter/% (color-coded via existing `gradeColor`) on the left, a colored progress bar (cold rose → light amber → solid indigo → deep emerald) sized by minutes, and the formatted minutes + band tag on the right.
- **Smart callout** above the rows surfaces the highest-leverage action: lowest-grade class with <15 min this week + grade <85% = warn ("X is your lowest grade right now — and it's gotten the least focus time this week. A 25-min session today would change that."); one subject hogging >70% of the week's focus while another sits cold = warn ("Most of your focus this week went to X. Try sliding one session toward Y."); zero focus this week = info nudge; otherwise = good ("Focus time is spread across your classes — nice balance this week.").
- **`src/pages/Dashboard.jsx`** — wired between `GradeTrends` and `ProgressCharts`, threading the same `assignments` + `activeTests` props the rest of the dashboard already has.
- **Privacy**: pure client-side derivation. No new network, no new storage, no PII off-device — same posture as `WorkloadForecast` / `GradeTrends` / `SubjectDetailModal`. Auto-hides for brand-new accounts (no completed grades AND no focus sessions in the past 7 days). All localStorage reads guarded for Safari Private Mode / sandboxed iframes.
- **Why a student notices it:** the Pomodoro habit was already paying off — sessions get logged silently and the heatmap proves consistency. But "I studied a lot this week" and "I studied the *right* things this week" are different questions. This card makes the second one visible: the class you're worst at being the class you avoided is the most common procrastination shape, and surfacing it next to the grade trend is what makes the next 25-min session a Pomodoro on History instead of yet another one on the class you already feel good about.

### Fixed (web) — Orphaned inline note editor on AssignmentCard had no UI to enter edit mode

- **`src/components/assignments/AssignmentCard.jsx`** — the component had `editingNote`, `noteDraft`, and `savingNote` state hooks, a complete `saveNote` async handler (with double-submit guard, secureEntity update, error rollback, and the previously-shipped finally-block fix), and a `handleNoteKeyDown` for Enter-to-save / Esc-to-cancel — but no UI ever flipped `editingNote` to `true`. The notes paragraph rendered as a plain non-clickable `<p>` and there was no "Add a note" affordance on assignments without notes. Prior shifts had patched the saveNote handler thinking it was reachable; in fact it was completely dead code from an in-progress feature that had never been finished. Now: the existing notes turn into a clickable button (subtle hover state) that flips to a textarea + Save/Cancel buttons, and assignments without notes get an "+ Add a note" link beneath the status select. Disabled-state propagated through the textarea + buttons during the save round-trip.

### Fixed (web) — Tests + Assignments N-key shortcut wiped editing state mid-form

- **`src/pages/Tests.jsx`**, **`src/pages/Assignments.jsx`** — the page-level `keydown` handler fired `setEditingTest(null)` (resp. `setEditingAssignment(null)`) and `setShowForm(true)` on every "N" / "n" press outside an input/textarea/contentEditable — *including while the form modal was already open and the student was mid-edit*. The form would silently re-mount as a *new* test/assignment, wiping whatever they'd typed. Mirror `showForm` into a ref (the listener is registered once with `[]` deps so a normal closure-capture would be stale forever) and early-return the N branch when the form is open. Esc still closes either way.

### Fixed (web) — `TodaysFocusCard` could render literal "Due in NaN days"

- **`src/components/dashboard/TodaysFocusCard.jsx`** — items missing or with an unparseable `due_date` / `test_date` ran through `parseLocalDate` → `NaN` `Date`, `differenceInDays` → `NaN`, urgency score → `NaN`. The sort comparator (`b.urgency - a.urgency`) returns `NaN` for those rows, which `Array.prototype.sort` treats as `0` — so a NaN-urgency row could occasionally land at the top, where `daysLabel` rendered as the literal string `"Due in NaN days"` (because `NaN < 0`, `NaN === 0`, and `NaN === 1` all coerce to `false`). Same shape as the timezone / NaN-date bugs that prior shifts cleaned up on `Dashboard.activeTests`, `/Tests` upcoming partition, `PerformanceInsights.urgentTests`, and `SchoolAnalytics`. Drop items without a parseable date before scoring; the global Assignments / Tests pages still render those rows so the student can spot and fix the missing date.

### Why
One real student-visible feature (Subject Effort vs Grade — the missing dashboard surface that connects the focus-timer data the dashboard was already producing to the grade data the dashboard was already showing, with a smart rebalance callout that names a specific subject the student should put their next session into), a long-overdue UX patch (the AssignmentCard inline note editor had every state hook and handler in place but no UI to trigger them — students could read existing notes but couldn't edit them or add new ones from the card; prior bug-fix shifts had patched a saveNote handler nobody could actually call), and a tight bug-fix block on three orthogonal classes: a **page-level keyboard-shortcut closure bug** that wiped form state mid-edit on the two heaviest CRUD pages, and a **NaN-date rendering bug** in TodaysFocusCard that could surface literal "Due in NaN days" copy if a missing-date row won the unstable urgency sort.

---

## [Unreleased] — 2026-04-29 20:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Daily Check-out card: end-of-day reflection + tomorrow's priority 🌙

- **`src/components/dashboard/DailyCheckout.jsx`** — new dashboard card that captures the end-of-day reflection loop the dashboard didn't have. The Sunday `WeeklyRecapModal` covered the once-a-week arc; the *daily* "what's tomorrow about" intention fell into the gap between today and next Sunday.
- **Visibility rules** — self-hides when not relevant to avoid being a permanent dashboard tax. Renders if any of: it's after 4pm local, OR the student has already wrapped at least one assignment today, OR a check-out already exists for today (so they can edit), OR (mornings only) yesterday has a check-out whose priority should surface before they leave for school.
- **Card body** — three-stat snapshot (items done today, focus minutes today, today's mood — pulling from existing `gg_focus_sessions_<date>` and `gg_mood_<email>` keys, no new schema), then a form: "Tomorrow's #1 priority" + optional "What went well today?". Once saved, collapses to two pill-style summary rows + an Edit button.
- **Morning surface** — if the student didn't fully check out yet today but did yesterday, the card collapses to a single sunrise banner showing yesterday-evening's priority — first thing they see in the morning matches the intention they set the night before. Closes the daily loop.
- **Privacy** — localStorage-only (`gg_checkout_<email>_YYYY-MM-DD`). No network, no PII off-device. Same posture as `MoodCheckIn` / `DailyGoalsCard` / focus sessions. All reads/writes guarded for Safari Private / sandboxed iframes.
- **`src/pages/Dashboard.jsx`** — wired the card in below `ProgressCharts`, above the Weekly Summary entry point, so it sits in the natural "end of dashboard reading flow" position.
- **Why a student notices it:** the dashboard had no end-of-day surface. Sunday recap is great for the longer arc; daily intention-setting is the simplest behavioral lever the dashboard didn't have. A 13-year-old who writes "Finish bio lab" tonight and sees it again at 7am tomorrow is running on yesterday's prefrontal cortex instead of today's groggy one.

### Fixed (web) — Onboarding sign-in / sign-up swallowed Safari Private Mode storage error

- **`src/pages/Onboarding.jsx`** — login + admin-signup + student-signup all did `localStorage.setItem("gg_auth_token", ...)` + `localStorage.setItem("gg_user_email", ...)` directly after a successful authenticate call. In Safari Private Browsing or a sandboxed iframe (school-portal preview, etc.) those throw synchronously, the surrounding try/catch caught it, and the user saw a generic "Something went wrong. Please try again." — implying the password was wrong when in fact the auth itself succeeded; only persistence was blocked. Wrapped all three setItem-pairs in a `persistAuth(token, email)` helper that surfaces a clear, actionable message: "This browser is blocking storage (Safari Private Browsing or a sandboxed iframe). Please open GradeGuard in a regular tab to sign in." The student now knows the actual problem and how to fix it instead of believing their credentials are bad.

### Fixed (web) — Tests + Assignments + Onboarding form handlers missing double-submit guard on Enter-key

A pattern audit across the form-submission paths. The Submit *button* was disabled via `isLoading` / `isPending`, but native form-Enter and `onKeyDown={e => e.key === "Enter" && ...}` handlers bypassed the disabled state until the React render cycle completed — a student typing fast and pressing Enter twice could fire two parallel mutations.

- **`src/pages/Tests.jsx`** — `handleSubmit` now early-returns on `createMutation.isPending || updateMutation.isPending` before calling `mutate(...)`. Without the guard, two parallel `Test.create` requests could land, leaving a duplicate row.
- **`src/pages/Assignments.jsx`** — same fix on `handleSubmit`. Same shape, same risk (duplicate `Assignment.create` rows).
- **`src/pages/Onboarding.jsx`** — `handleAuth` early-returns on `authLoading`. The password input's Enter handler could fire two parallel `authenticateUser` calls, both eating the same password attempt against the server's per-account rate limiter; on signup the two parallel `signup` calls could race on the create.
- **`src/components/assignments/AssignmentCard.jsx`** — `saveNote` early-returns on `savingNote`. Wired to both the Save button click and an Enter-key handler — without the guard, Enter-mashing could fire two parallel `Assignment.update(notes)` calls and (in flaky-network cases) regress the displayed note to the first response if the second errored. Same guard pattern used in `SharedNoteComposer` / `RoomView` / `WeeklySummaryButton`.

### Why
One real student-visible feature (Daily Check-out — the missing daily reflection card that sets tomorrow's intention tonight and surfaces it in the morning, closing the daily loop the Sunday WeeklyRecapModal couldn't reach), one real auth UX bug (Safari Private Mode misdiagnosed as bad credentials — particularly bad for a CMS-verified school app where staff demo it from sandboxed admin portals), and a tight pattern-audit fix block that closed the last few async form handlers missing double-submit guards on the Enter key path.

---

## [Unreleased] — 2026-04-29 18:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Subject Detail modal: tap a class in GradeTrends for the full picture 🔎

- **`src/components/dashboard/SubjectDetailModal.jsx`** — new focused single-class drill-down. Tapping a row in the dashboard's `GradeTrends` panel used to deep-link out to `/Assignments?subject=X` and yank the student off the dashboard. Now it opens an inline modal that aggregates everything about that one class on one screen: large grade letter + average, the trend badge + a bigger sparkline (last 8 graded), four stat chips (Highest score, Lowest score, Pending count, Overdue count — Lowest goes rose if <70%, Overdue goes rose if >0), the 3 most recent scores (with each score colored to its letter grade), the next 3 upcoming tests for that class (rose-tinted rows with relative-day labels — "Today", "Tomorrow", "Tue", "Apr 30"), the next 5 pending assignments (overdue → today → upcoming, with overdue/today rows tinted rose/amber and an "Nd late" callout for overdue), and quick-action buttons that route to `/Assignments?subject=` and `/Tests?subject=`. Empty-state copy ("Nothing on the radar for X right now") when the class is fully cleared.
- **`src/components/dashboard/GradeTrends.jsx`** — rows are now `<button type="button">`s that open the modal instead of `<Link>`s that navigate. Footer copy updated to "Tap a subject for the full picture · trends compare your recent half to your prior half." Now also accepts a `tests` prop and threads it into the modal.
- **`src/pages/Dashboard.jsx`** — passes `activeTests` to `GradeTrends` so the modal can surface upcoming tests for the tapped subject (previously GradeTrends only consumed `assignments`).
- **Privacy**: pure client-side derivation from already-fetched arrays. No new network, no new storage, no PII leaves the browser. Same posture as `WorkloadForecast` / `GradeTrends` / `TestPrepTimeline`.
- **Why a student notices it:** the dashboard is hub-and-spoke — `GradeTrends` for momentum, `WorkloadForecast` for crunch, `DeadlineCalendar` for the month, `TestCard` for one test. Drilling into ONE class meant tapping a row, losing the dashboard, landing on a filtered list, then tapping back. The modal collapses "what's actually happening with my Math grade" into a single-tap focused view: scores, momentum, what's pending, what's coming, with one-click escapes to the filtered list pages when the student wants the long-form view. Pairs naturally with the existing GradeTrends sort order (down-trending classes surface first, you tap, you see what's pending and what's coming, you act).

### Why
One real student-visible feature (Subject Detail modal — turning the existing GradeTrends rows into a focused single-class deep-dive instead of a deep-link, threading tests through so it can show what's coming up too). No bug-fix block this shift — recent shifts have audited the codebase pretty thoroughly (timezone off-by-ones, unguarded `localStorage` reads, mutation `onError` handlers, double-submit guards on hot paths) and the patterns I scanned today (mutation handlers, `setLoading` wrappers, `setInterval` closures, `setTimeout` cleanups across `BadgeUnlockToast`, `FriendChatPanel`, `PomodoroWidget`, `FocusTimer`, `SmartScanModal`, `VocabQuizFromNotes`, `Achievements`, `AdminDashboard`) all came up clean. Time recovered went into adding the empty/edge states to the modal (no-radar copy, lowest-score color band, overdue/today row tinting, relative-day labels) instead of inventing a second feature.

---

## [Unreleased] — 2026-04-29 16:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Test Prep Timeline inline on every TestCard 📅

- **`src/lib/testPrep.js`** — new pure helper `buildPrepTimeline(test, today)` that returns a date-by-date study schedule from today to the test day. Phases (`groundwork → firstPass → targeted → recall → practice → finalReview → testDay`) are mapped per-day from the days-until-test offset, with the **test's `difficulty` shifting heavier phases earlier for hard tests and compressing for easy ones**. Each entry carries a one-line student-facing tip ("Skim every topic once. Mark anything that feels fuzzy."), a calibrated suggested duration in minutes, and an intensity band (light · focused · heavy) for the visual bar. Shows up to 10 days ending on the test; if the test is more than 10 days out, today is rendered as an anchor row above the visible window with a "earlier days are optional warm-up" note. Also exports `totalPrepMinutes(timeline)` for the header.
- **`src/components/tests/TestPrepTimeline.jsx`** — the visual. Renders the day list as a vertical strip — date column on the left (Today / Tomorrow / "Tue Apr 30"), a small intensity bar (emerald → amber → rose) in the middle, and the phase label + tip + minute count + intensity tag on the right. Today's row gets a white card with an indigo ring so it pops. Each phase has its own lucide icon (Layers, ListChecks, BrainCog, Repeat, Clipboard, Moon, Sparkles).
- **`src/components/tests/TestCard.jsx`** — wired in. The card now exposes a third action button next to "Flashcards" / "Practice Quiz" — a purple **"Prep plan ▾"** toggle that expands the timeline inline. Only renders for non-completed, future-dated tests (so it's hidden for "no date set" / past / completed rows where it'd be meaningless).
- **Privacy**: pure client-side derivation. No network. No storage. No PII. Only fields used: `test.test_date`, `test.difficulty`. Same posture as `WorkloadForecast` / `GradeTrends`.
- **Why a student notices it:** the existing test surfaces (`/Tests` upcoming list, `NextTestCountdown`, the AI quiz / flashcard generators) tell a 13-year-old *that* a test is coming and offer ways to drill the content. None tell them *what to do today, then tomorrow, then the day after that*. "Spread it out" is what teachers preach and almost no kid actually does — surfacing a real schedule, calibrated to the test's difficulty, makes spaced practice the path of least resistance instead of cramming the night before. Pairs naturally with the existing Practice Quiz / Flashcards buttons (later-phase days literally name them in the tip — "Quiz yourself on flashcards").

### Fixed (web) — `RoomView` "Submit Quiz" button never showed the Saving… spinner; `setSubmitted` ran on failure

- **`src/components/studyroom/RoomView.jsx`** — the submit handler had a `submitting` state declared, the button rendered `submitting ? "Saving…" : "Submit Quiz"` and disabled itself with `submitting`, but `setSubmitting(true)` was **never called anywhere** in the file. So clicking Submit was instant-silent, no feedback, while the network round-trip + leaderboard refetch ran. On a slow connection a kid would tap the button two or three times. Compounded by `setSubmitted(true)` running BEFORE the await, so if the network round-trip failed the score wasn't saved but the UI was already in the "submitted" state — no recourse to retry. Now: `setSubmitting(true)` at start, `setSubmitted(true)` only after the create resolves, `setSubmitting(false)` in `finally`. The double-submit guard at the top now also gates on `submitting`.

### Fixed (web) — Early-completion XP bonus + counter never fired for US-timezone students

- **`src/components/gamification/BadgeDefinitions.jsx`**, **`src/components/gamification/useGamification.jsx`** — both checked `new Date() < new Date(assignment.due_date)` to decide if a completion was "early" and worth the +8 XP `BONUS_EARLY` and the `early_completions` stat tick. `new Date("2026-04-29")` parses as UTC midnight, which in EDT/EST is 2026-04-28 20:00 local — so the "early" threshold was effectively *8pm the day BEFORE the due date* for US students. A student turning a paper in 9am the day it's due **never** got early credit; one finishing at 9pm the night before barely got it. Same family of timezone off-by-one bugs the prior shifts cleaned up on `/Assignments`, `/Tests`, `SchoolAnalytics`, `StudentList`, and `Dashboard.activeTests`. Now uses `parseLocalDate` + a `Number.isFinite` guard so the threshold is local midnight of the due date.

### Fixed (web) — `GradeStats` rendered a literal "undefined" subject row for assignments missing a subject

- **`src/lib/gradeUtils.js`** — `subjectGradeStats` keyed `bySubject[a.subject]`. Older entities (or assignments imported via the natural-language Add path before subject-clarification was solid) can have `subject === null`. JS coerces that to the string `"undefined"`, so the `Grade Averages` panel rendered a row literally labeled "undefined" with the student's avg+letter. Bucketed under `"Other"` instead, matching what `subjectGradeTrends` already did. Display-only; no data shape change.

### Why
One real student-visible feature (Test Prep Timeline — the missing "what should I actually do each day before this test?" surface, calibrated by difficulty, surfaced inline on every future-dated TestCard) and a tight bug-fix block clustering on three real classes: a **dead-state UX bug** (RoomView's never-set `submitting` state hid feedback on the most-tapped quiz-battle button), a **gamification timezone off-by-one** that quietly disabled the early-completion XP bonus for the entire US student base, and a **legacy-data display glitch** (literal "undefined" subject row in GradeStats).

---

## [Unreleased] — 2026-04-29 14:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — 14-day Workload Forecast strip on Dashboard 📊

- **`src/components/dashboard/WorkloadForecast.jsx`** — new compact panel that drops between the Mood/DailyGoals/TodaysFocus row and `DeadlineCalendar`. Shows the next 14 days as a horizontal bar-strip — each day a colored intensity column (light → moderate → heavy → packed) with the day-of-week letter, day number, and the count of items due. Today gets an indigo ring + indigo number to anchor the eye.
- **Smart one-line callout** above the strip — when at least one day in the forecast hits the *heavy* or *packed* band, the callout warns: `"Wednesday looks packed — 4 items due"` / `"Tomorrow looks heavy — 3 items due"`. When there's no crunch, it instead surfaces the longest 3+ day light run as a get-ahead window: `"Friday starts a 4-day light run — good time to get ahead"`. Fills both stress-states (warning vs. opportunity) without being naggy.
- **Load model** is intentionally calibrated for a middle/high schooler — assignments are 1.0 (+0.5 if `weight === "perform"`, +0.3 if `difficulty === "hard"`), tests are 2.0 (+0.5 if `difficulty === "hard"`). One big perform-grade paper alone reads as "moderate"; two assignments + a hard test reads as "packed". Bands: <1.5 light · <3 moderate · <4.5 heavy · ≥4.5 packed.
- **Auto-hides** when there's literally nothing on the next 14 days — empty state already lives elsewhere on the dashboard.
- **Privacy**: pure client-side derivation from the already-fetched `assignments` + `activeTests` arrays. No new network, no new storage, no PII. Tooltips render via the native `title` attribute (no rendered list of names) — screenshot of the dashboard never includes assignment names beyond what's already in `DeadlineCalendar`.
- **Why a student notices it:** the existing `DeadlineCalendar` is a month overview — great for "what's due when", terrible for "is next week going to crush me?". The 14-day strip makes the *density* visible at a glance, with the callout doing the cognitive work of spotting the worst day. Closes a real gap between "Today's Focus" (just the one most urgent item) and the month calendar (everything, all at once).

### Fixed (web) — Tests with bad/missing `test_date` silently dropped from Dashboard `activeTests`

- **`src/pages/Dashboard.jsx`** — `activeTests` filtered with `differenceInDays(parseLocalDate(t.test_date), today) >= 0`. `parseLocalDate` returns `Date(NaN)` on missing input → `differenceInDays` returns `NaN` → `NaN >= 0` is **false**. So any test whose date didn't parse vanished from EVERY dashboard surface that consumes `activeTests`: `NextTestCountdown`, `TodaysFocusCard`, `WeeklyRecapModal`, the new `WorkloadForecast`, the AI study-plan context — gone. Same shape as the bug fixed for the `/Tests` upcoming/past partition in an earlier shift. NaN-dates now pass through (rendered without a countdown by downstream components that already handle this case) so the student can spot and edit them.

### Fixed (web) — Timezone off-by-one in "Due today" / "Overdue" counts on /Assignments

- **`src/pages/Assignments.jsx`** — the header's `dueTodayCount` and `overdueCount` did `new Date(a.due_date)` followed by `.setHours(0,0,0,0)`. Looks safe, but `new Date("2026-04-29")` parses as UTC midnight; in EDT/EST that's 2026-04-28 20:00 local, and `.setHours(0,0,0,0)` zeroes to 2026-04-28 00:00 local — off by one day. Every US-timezone student saw their "Due today" count miscounted (today's items showing as overdue) and "Overdue" count inflated. Switched to `parseLocalDate` (which the rest of the codebase uses for the same reason) + guarded NaN dates.
- **`src/components/assistant/PerformanceInsights.jsx`** — same `new Date(t.test_date)` / `new Date(a.due_date)` bug in the "Suggested Study Sessions" panel that surfaces inside StudyAssistant. Today's test would render with a `daysLeft` of `-1` and get filtered out of the urgent list. Switched to `parseLocalDate` + `Number.isFinite` guard so the panel doesn't include rows with bad dates.

### Fixed (web) — Same timezone off-by-one in admin SchoolAnalytics + StudentList

- **`src/components/admin/SchoolAnalytics.jsx`** — both the school-wide `overdueCount` headline metric and the per-student "at risk" classifier (`>= 3 overdue` rule) used `new Date(a.due_date) < today`. Same EDT/EST off-by-one — kids whose only overdue item was actually due that same day would tip into the "at risk" cohort and trigger the red alert badge. Switched to a shared `isOverdue(a)` helper that uses `parseLocalDate` + guards null/NaN.
- **`src/components/admin/StudentList.jsx`** — the per-student `overdueCount` field that drives the "At Risk" badge had the same bug. Fixed identically.

### Fixed (web) — 2 unguarded `localStorage.getItem("gg_auth_token")` reads on admin surfaces

Continuation of the multi-shift Safari-Private-Mode auth-surface guard pass. These are the last two bare module-render reads of the auth token in the admin code paths.

- **`src/pages/AdminDashboard.jsx`** — bare `localStorage.getItem("gg_auth_token")` at component init. Throws synchronously in Safari Private / sandboxed iframes (e.g. an admin previewing the dashboard inside a CMS staff portal that frames it). Wrapped in try/catch.
- **`src/components/admin/AnonymizationToggle.jsx`** — same bare read; same fix. Also removed a duplicated `if (loading) return;` on the confirm path that was a no-op.

### Why
One real student-visible feature (Workload Forecast — the missing "is next week going to crush me?" surface, with a smart callout that does the cognitive work for the student) and a tight bug-fix block clustering on **one severity-bumped data-loss bug** (Dashboard's `activeTests` filter silently dropped tests with bad dates from every downstream surface — including the new feature itself, which is why I caught it), **four timezone off-by-one bugs** that miscounted overdue assignments in EDT/EST (two student-facing on /Assignments + StudyAssistant, two admin-facing that drove the "at risk" cohort calc), and the **last two unguarded `gg_auth_token` reads** on admin module-render paths. Auth-surface guard pass is essentially complete now — only the in-handler reads remain, which already short-circuit through their try/catch.

---

## [Unreleased] — 2026-04-29 12:30 UTC shift

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Grade trends sparkline panel on Dashboard 📈

- **`src/components/dashboard/GradeTrends.jsx`** — new compact panel that drops between `NextTestCountdown` / `DeadlineCalendar` and `ProgressCharts`. For each subject with at least one graded assignment, the row shows: subject name + current letter grade + average %, a colored badge ("Trending up +N", "Trending down -N", "Steady", or "Just getting started"), and a small SVG sparkline of the last up-to-8 graded assignments (chronological, with a labeled endpoint marker for the most recent score).
- **`src/lib/gradeUtils.js`** — added `subjectGradeTrends(assignments)`. Sorts each subject's graded entries chronologically (preferring `due_date`, falling back to `updated_date` / `created_date`) and derives a trend label by comparing the recent-half avg to the prior-half avg of the series. ≥+3 pts → up, ≤-3 → down, in between → steady, fewer than 3 graded → "new".
- **Sort order** — surfaces what needs the most attention first: trending-down subjects, then steady-but-below-80%, then trending-up, then steady high. Helps a kid spot a slipping class before scrolling past their A.
- **Click-to-filter** — each row is a `<Link>` to `/Assignments?subject=ENCODED_NAME`. The new `?subject=` query param on `Assignments.jsx` (and on `Tests.jsx` to keep the deep-link contract symmetric) snaps the existing subject `Select` filter on mount and strips itself from the URL like the existing `?new=1` / `?filter=overdue` params do. Closes the loop: see a subject trending down → tap → land on the filtered assignments list for that subject in one motion.
- **Privacy**: pure client-side derivation. No grades leave the browser. No new network. No new storage. No PII. Footer reinforces the CMS-verification posture.
- **Why a student notices it:** every existing grade surface (`GradeStats`, `ProgressCharts`, `GradeGoalCalculator`) is a *snapshot*. None of them tell a 13-year-old whether their grade is climbing or sliding — the most actionable piece of information for "should I worry about this class right now?". The trend badge collapses that into a 3-word read at a glance, and the sparkline makes it visual. Fills a real gap in the dashboard's grade story.

### Fixed (web) — Tests with bad/missing `test_date` silently disappeared from /Tests

- **`src/pages/Tests.jsx`** — the `upcomingTests` and `pastTests` filters both used `differenceInDays(parseLocalDate(t.test_date), today)` and compared against `>= 0` / `< 0`. `parseLocalDate` returns `Date(NaN)` on missing input → `differenceInDays` returns `NaN` → `NaN >= 0` and `NaN < 0` are both **false**. So any test row whose date didn't parse vanished from BOTH lists — student loses sight of it entirely. Now: tests with a non-parseable date land in `upcoming` (so the student can spot them and edit the date), only completed tests with a valid past date go into `past`. `TestCard.jsx` already renders a "No date set" badge for these.

### Fixed (web) — `AssignmentCard` rendered "Due in NaN days" for assignments with no due_date

- **`src/components/assignments/AssignmentCard.jsx`** — `dueDateText()` had no case for `Number.isNaN(daysUntilDue)`. Empty / missing `due_date` fell through to the default branch and rendered "Due in NaN days". Now returns "No due date set" when `due_date` is missing or unparseable.

### Fixed (web) — 7 unguarded `localStorage` reads/writes on Home + Onboarding

Continuation of the multi-shift Safari-Private-Mode auth-surface guard pass. These live on the **landing pages** — Home is the cross-domain login handoff target and the public marketing page; Onboarding handles the post-signup redirect. An unguarded synchronous `SecurityError` on any of these throws the entire `useEffect` and partially-mutates the URL, leaving the student stuck mid-handoff with no console to look at.

- **`src/pages/Home.jsx`** — guarded the two `removeItem`s in the `?logout=1` branch, the two `setItem`s in the `?gg_login=...` cross-domain handoff branch, the two `removeItem`s in the `else if (!profile?.user_email)` post-getStudentProfile branch, the two `removeItem`s in the `.catch(() => …)` handler, and the trailing `removeItem` in the stale-session fallback.
- **`src/pages/Onboarding.jsx`** — guarded the bare `setItem("gg_user_email", ggLogin)` plus the bare `getItem("gg_user_email")` in the post-onboarding redirect `useEffect`. (The 4 `setItem`s deeper in `handleAuthSubmit` are inside an outer try/catch already.)

### Fixed (web) — `CMSCompliance` doc-download button silently failed on server error

- **`src/pages/CMSCompliance.jsx`** — `downloadDoc()` had a `try {…} finally { setDownloading(null); }` block but **no `catch`**. If `base44.functions.invoke('generateCMSDocument', …)` rejected (network blip / server 500), the rejection propagated unhandled and the button just popped back to "Download" with no toast. Admin clicks it again and again, no docs ever come down. Added `catch` → `toast.error(…)`. Also added a `if (downloading) return;` double-click guard at the top.

### Fixed (web) — 2 `console.warn` calls leaked AIJob error objects to the production console

- **`src/pages/StudyAssistant.jsx`**, **`src/pages/Dashboard.jsx`** — both `pollAiJob` retry paths logged `console.warn("AIJob poll failed, retrying:", err)`. The `err` object's request `config` carries the API URL which embeds the student's email (`?user_email=...` style query params on the underlying base44 call). Every transient network blip on the AI Study Plan poll cadence dumped a student email into the production browser console. CMS-verification posture: the production console should never receive student-context URLs. Replaced both with `} catch {` so the err object isn't logged at all.

### Fixed (web) — `subjectGradeTrends` used wrong field name + suboptimal date

- **`src/lib/gradeUtils.js`** — initial draft of the helper used `a.title` for the sparkline tooltip; the `Assignment` entity actually uses `name`. Every tooltip would have rendered the literal string "Assignment" instead of the actual assignment title. Also changed the chronological-sort key from `updated_date || created_date || due_date` to `due_date || updated_date || created_date` — `updated_date` updates whenever the row is touched (e.g. when the grade is entered), so back-fill grading scrambled the sparkline order. `due_date` reflects when the work was actually owed, which is what a student means by "my grade trend over the term".

### Why
One real student-visible feature (Grade Trends panel — fills the missing "is my grade climbing or sliding?" surface, and is wired through to a one-click drill-down into the filtered Assignments page for that subject) and a tight bug-fix block clustering on three real classes: **two correctness bugs** that silently dropped data from view (NaN-date tests vanishing, `AssignmentCard` rendering "Due in NaN days"), **seven Safari-private-mode crash paths** on the landing surfaces (Home + Onboarding), one **silent-error UX trap** (`CMSCompliance` doc download), and **two CMS-verification PII leaks** (AIJob `console.warn` calls dumping request URLs with student email). Plus a self-caught regression on the new feature itself (wrong field name + wrong chrono key) before the panel even renders for a real student.

---

## [Unreleased] — 2026-04-29 (late-evening shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Reverted (web) — AI Essay Outliner ❌

Pulled the AI Essay Outliner that earlier shifts shipped (commits e322468, 1c9d108, 1db5ec0, 8c9e604, bb813f4, 686a3c7, 42df745 in `gradeguardnewsync`). Landon's call: even though the prompt explicitly said "Outline only — the student does the writing," generating the thesis, body-paragraph topic sentences, evidence ideas, and counterarguments crosses the line into "this is the essay" for the kind of school admin reviewing GradeGuard for CMS verification. The perception is the problem, not the prompt wording.

**Removed:**
- `src/components/assistant/EssayOutliner.jsx` (whole component)
- `StudyAssistant.jsx` integration: `EssayOutliner` import, `showEssayOutliner` state, `openEssayOutliner` + `generateEssayOutline` functions, `?tool=essay`/`?topic=` deep-link `useEffect`, the "Writing Tools" card on the empty state, two render branches (`showEssayOutliner` block + `studyTool.type === "essay_outline"` branch), the bottom-bar "Essay outline" pill, the unused `PenSquare` lucide import
- `SuggestionChips.jsx`: the `onEssayOutline` prop, the violet "Essay Outliner" chip, the unused `FileText` lucide import
- `AssignmentCard.jsx`: the `ESSAY_KEYWORDS` regex, the `looksLikeEssay()` helper, the "Outline this essay" deep-link, the unused `PenSquare` lucide import

**Future shifts: see the `❌ Rejected features (do not re-add)` section at the top of this file before adding any writing-help feature.**

### Added (web) — Grade Goal Calculator on /Assignments 🎯

- **`src/components/assignments/GradeGoalCalculator.jsx`** — collapsible per-subject panel that drops below `GradeStats` in the Completed section. For each subject with at least one graded assignment, a student picks a target letter (A+ through C) and a number of remaining assignments, and the panel computes the average they need on those remaining assignments to land at the target overall grade.
- **`src/lib/gradeUtils.js`** — added `requiredAverage(currentAvg, currentCount, remaining, targetPct)` (closed-form solve assuming equal weights) + `feasibility()` tagger + `TARGET_OPTIONS` table (97 / 93 / 90 / 87 / 83 / 80 / 77 / 73 — A+ through C).
- **Defaults that just work**: target = next letter band above current avg; remaining = autodetected pending-assignments count for that subject (clamped to ≥ 1, capped at 50).
- **Feasibility tag** — adapts to *each student's own ceiling*: derived from the top quartile of their past graded assignments. A 95% required avg might be "Stretch goal 💪" for a kid who's hit 98s, but "Out of reach this term" for a kid whose ceiling is 88. Other tags: "Already locked in 🔒" (required ≤ 0), "On track ✅" (required ≤ current avg).
- **Subjects sort worst-grade-first** — that's where goal-setting is the most useful intervention. The student doesn't have to scroll past their A subjects to find their C+.
- **Privacy**: pure client-side. No grades leave the browser. No new network, no new storage, no PII. Footer reinforces this for the CMS-verification posture: *"Calculated on this device — your grades never leave the browser."*
- **Why a student notices it:** every middle-and-high schooler with a target grade does this math in their head and gets it wrong, or asks a parent. Surfacing it inline next to GradeStats — with the answer already pre-computed for the natural defaults — turns a stressful pre-finals exercise into a one-glance decision. Also load-bearing for the "I'm freaking out about this class" anxiety pattern: showing "Stretch goal 💪" instead of a vague vibe lowers cortisol.

### Fixed (web) — 4 `setTimeout`s that could `setState` after unmount

Same ref-tracked-+-clearTimeout-on-unmount pattern the rest of the codebase uses. Each one fires setState; each one is reachable from a normal user flow (route change / panel close / game switch) within its window.

- **`src/pages/FocusTimer.jsx`** — the two 600ms auto-suggest-break / auto-resume-work setTimeouts in `handleComplete` were bare. Navigating away from `/FocusTimer` in the 600ms after a Pomodoro completes setStates `mode + secondsLeft + showPicker` on the unmounted page. Tracked in `autoSwitchTimerRef` + cleared on unmount + cleared before each new schedule so back-to-back completions don't stack timers.
- **`src/components/assistant/FlashcardViewer.jsx`** — `goTo()` fired a bare 50ms setTimeout that called `setIndex`. Closing the viewer mid-window setStates on unmount; rapid arrow-key navigation also stacked timers and could land on the wrong card.
- **`src/components/friends/FriendChatPanel.jsx`** — the 3-second rate-limit cooldown setTimeout was bare and called `setCooldown(false)`. Closing the chat panel during the cooldown window setStates on the unmounted component; tap-spamming Send also stacked timers.
- **`src/components/assistant/MiniGames.jsx`** (MemoryMatch) — the 600ms flip-back setTimeout called `setMatched + setFlipped`. Closing the game / switching game type during the 600ms window setStates on the unmounted component.

### Fixed (web) — 9 unguarded `localStorage` reads/writes across the auth + load-bearing surfaces

Continues the multi-shift CMS-verification "Safari private mode + sandboxed iframes" guard pass. Each unguarded read is a synchronous `SecurityError` on Safari Private (or a school-issued iPad in restricted profile mode). The page-mount ones white-screen the whole route; the in-handler ones surface a confusing `localStorage is not allowed` error toast instead of the existing 401 → redirect path.

- **`src/Layout.jsx`** — guarded the two `getItem` reads at the top of Layout (wraps every protected route — was the highest-impact crash path remaining), the two `removeItem` calls in the TOKEN_EXPIRED query branch, plus the four `removeItem` calls in the desktop + mobile header logout buttons.
- **`src/components/notifications/NotificationBell.jsx`** — the bare `getItem("gg_auth_token")` at component init. NotificationBell mounts in the header on every protected page.
- **`src/components/layout/CommandPalette.jsx`** — the two `removeItem` calls inside `handleLogout`.
- **`src/pages/StudyRooms.jsx`** — bare `getItem("gg_auth_token")` at component init.
- **`src/pages/Onboarding.jsx`** — bare `getItem` inside the post-onboarding cross-subdomain redirect; falls through to the same-domain `navigate()` path on throw rather than dropping the redirect entirely.
- **`src/pages/Home.jsx`** — both the `gg_user_email` + `gg_auth_token` reads that gate the auto-resume-session path, plus the two `removeItem` calls in the TOKEN_EXPIRED branch.
- **`src/pages/Friends.jsx`** — the bare `getItem` inside `sendMessageMutation` + the bare `removeItem` pair in the `getFriendSharedWork` TOKEN_EXPIRED branch.
- **`src/pages/Dashboard.jsx`** — the bare `getItem`/`setItem` on the tutorial-seen flag (first-load effect — would silently fail to persist + could throw inside the effect), the bare `getItem` on the AI-plan feedback key inside `generateAIPlan`, and the bare `getItem` on the auth token inside the `runStudyAssistantJob` invocation.
- **`src/pages/StudyAssistant.jsx`** — bare `getItem` on the auth token inside the `runStudyAssistantJob` invocation; mirrors the Dashboard fix.

### Why
One real student-visible feature (Grade Goal Calculator — answers the universal "what do I need on the rest of the term to get an A?" question inline next to GradeStats, with feasibility calibrated to each student's own ceiling) and a tight bug-fix block continuing two CMS-verification-relevant patterns: **four** ref-less setTimeouts that could fire setState on unmounted components (route change / panel close / game switch all within their windows), and **nine** unguarded `localStorage` reads/writes that throw on Safari Private — including the highest-impact remaining one (`Layout.jsx` itself, which white-screens every protected page on throw). The auth-surface guard pass is now substantially complete: no more bare `getItem("gg_auth_token")` on render paths anywhere in the student-facing code.

---

## [Unreleased] — 2026-04-29 (evening shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Sunday Weekly Recap modal 🎉

- **`src/components/dashboard/WeeklyRecapModal.jsx`** — a celebratory week-of-progress overview that auto-shows on Sundays once per week (per email + per Mon-of-week storage gate).
  - **Hero**: gradient header + confetti pop-on-reveal when the student has any work to celebrate ("Look at the week you just had 🎉").
  - **4-stat tile grid**: Assignments done, Tests completed, Focus time (formatted hr/min), Active days (out of 7). Each tile gets its own gradient accent.
  - **Top subjects this week**: blends completed assignment counts with Focus Timer minutes (focus minutes bucketed under "Focus time" so we never accidentally surface an assignment-name-shaped string as a subject).
  - **Coming up next 7 days**: max 5 items, with TODAY / TOMORROW / "in Nd" labels. Items in 0-1d render in rose-500, otherwise gray. Mixes assignments (📝) and tests (🧪).
  - **Empty state**: "A new week, a fresh start" with an inline encouragement line — no jarring "0 / 0 / 0".
  - **Footer**: explicit "Calculated on this device — nothing about your week was sent to a server." Reinforces the CMS-verification privacy posture.
- **Auto-show gate**: localStorage key `gg_weekly_recap_seen_<email>_<mondayKey>`. Reads/writes are guarded; Safari private mode silently no-ops the gate (modal would re-show, never crash).
- **Manual entry point**: a new "This week's recap" pill button rendered next to the existing "Email weekly summary" button on the Dashboard footer — lets students re-open the recap any day of the week.
- **Privacy**: pure client-side derivation. Reads existing assignments + tests from react-query cache + walks 7 days of `gg_focus_sessions_<date>` localStorage keys for focus minutes. No new network. No new storage other than the seen-gate. No PII.
- **Why a student notices it:** Sunday-evening reflection is a known habit-formation lever. The AI Study Plan is *forward-looking* (what to do tomorrow); the Weekly Recap is *backward-looking* ("you actually did 6 hours of focus this week"). It closes a positive-feedback loop the dashboard didn't have. From the multi-shift "What I didn't get to" backlog (flagged 2026-04-28 22:20 UTC and again 2026-04-29 04:06 UTC).

### Fixed (web) — Wired up the orphaned StudyHistoryInsights heatmap on /FocusTimer

The 12-week activity heatmap + streak + top-subjects panel that the 2026-04-28 evening shift report claimed was shipped on `/FocusTimer` was actually **dead code on production**. `grep -rn StudyHistoryInsights src/` returned only the file that defined the component — zero callers. Students never saw the panel since the day it was written.

- **`src/pages/FocusTimer.jsx`** — imported `StudyHistoryInsights` and mounted it at the bottom of the page below today's sessions strip.
- Added `loadFocusHistory()` helper that walks the past 84 days of `gg_focus_sessions_<date>` localStorage keys (the actual storage shape used by the timer, which is per-day-keyed) and converts to the `{date, minutes, subject, completedAt}` flat list `StudyHistoryInsights` expects. Counts only `mode === "work"` — break sessions don't add to study minutes.
- Per-day Safari-private-mode / quota throws are swallowed so partial history still renders for the days that loaded successfully.

### Fixed (web) — 5 unguarded `localStorage` reads in the load-bearing auth surface

Highest-impact crash class on production: a synchronous `SecurityError` from `localStorage.getItem` (Safari private mode + sandboxed iframes) at app mount **white-screens the whole app** instead of falling through to the existing "no session → redirect Home" path. The 2026-04-29 06:15 UTC shift report explicitly flagged `AuthGuard.jsx` as a known potential crash path; this clears the cluster.

- **`src/hooks/useGGAuth.js`** — guarded the initial state lazy reads + the storage-event handler reads behind a `safeGet()` helper.
- **`src/components/AuthGuard.jsx`** — guarded the two `getItem` reads at the top of `useAuth` (runs on every protected page mount) plus the two `removeItem` calls inside the `TOKEN_EXPIRED` branch.
- **`src/lib/secureEntities.js`** — guarded `getToken()` (called on every `secureEntity().list/filter/create/update/delete`) plus the two `removeItem` calls in `handleExpired`. If the localStorage access throws, the call falls back to an unauthenticated request → server returns 401 → the existing TOKEN_EXPIRED branch redirects to login. Clean degradation.

### Fixed (web) — 4 bare `setTimeout`s that could `setState` after unmount

Same ref-tracked-+-clearTimeout-on-unmount pattern the rest of the codebase uses (PomodoroWidget / InviteLinkButton / WeeklySummaryButton / AIAssignmentChat after prior shifts).

- **`src/components/gamification/BadgeUnlockToast.jsx`** — the inner `setTimeout(onDone, 450)` inside the exit-animation handoff was not tracked. Route change during the 450ms exit window fires `onDone` on a dead handle, advancing the badge queue past the unmount and dropping pending unlock animations on the next mount.
- **`src/components/assistant/EssayOutliner.jsx`** — `handleCopy` fired a bare `setTimeout(setCopied(false), 1500)`. Closing the outliner mid-window setStates on unmount; clicking Copy twice in 1.5s also leaked timers and could clear the new "Copied!" state prematurely.
- **`src/pages/Assignments.jsx`** — `handleStatusChange` fired bare setTimeouts for both the XP toast clear (2.5s) and the extension nudge (1.5s). Page-level unmount on navigation away from `/Assignments` leaked the timers. Multiple completes within the window also collided. Both now ref-tracked + cleared on unmount.

### Why
One real student-visible feature (Sunday Weekly Recap modal — Sunday-evening reflection lever pulled from the multi-shift backlog), one shipped-but-orphaned ship made real (StudyHistoryInsights heatmap finally rendering on `/FocusTimer`), and a tight cluster of two crash/UX bug classes: the Safari-private-mode auth-surface white-screen path (highest-impact, explicitly flagged in prior shift report) and four ref-less setTimeouts that could fire setState on unmounted components. Both bug classes were called out in prior reports as known follow-ups.

---

## [Unreleased] — 2026-04-29 (late-afternoon shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — "Pick one for me" decision helper on AI Study Plan 🎲

- **`src/components/dashboard/PickForMeButton.jsx`** — small pill button that drops above the to-do cards whenever there are 2+ items. Tap it and a focused spotlight modal reveals exactly ONE task to start on right now, with a plain-English "why this one" line and the original `priority_reason` from the AI plan.
- **Re-roll** picks a different item (deterministic per session — uses a per-item hash + seed counter so re-rolls cycle through the top tier instead of repeating).
- **Start with this** dismisses the modal; if the parent supplies an `onStart` prop it's called with the picked item, otherwise it dispatches the existing `gg:start-focus` event so the floating Pomodoro spins up at the default preset.
- A tiny indigo/purple confetti pop fires on reveal — feels like a delightful nudge, not another button to grind through.
- Wired into **`SmartTodoList.jsx`** between the daily-tip card and the to-do items, only when `sortedItems.length >= 2`.
- **Privacy:** zero new network. Picker is pure client-side scoring. No PII, no AI call.
- **Why:** the most common reason students bounce off a long AI plan is decision paralysis — five "High" tasks feels worse than no plan. Collapsing the choice to one task with a tiny serotonin hit is a known activation-energy hack, and it's the smallest possible UI surface that delivers it.

### Fixed (web) — 4 unguarded storage reads/writes that crashed the dashboard in Safari private mode

- **`src/pages/Dashboard.jsx`** — `sessionStorage.getItem("gg_ai_plan_sig")` inside the auto-replan effect threw in sandboxed iframes / private mode, killing the whole effect (so the Dashboard's "data changed → regenerate plan" loop silently broke). Now wrapped.
- **`src/pages/Dashboard.jsx`** — `sessionStorage.setItem` of the generated plan + signature lived inside the outer `try/catch` of `generateAIPlan`. A quota or private-mode error showed the student a misleading "Couldn't generate your study plan" toast despite the plan being already in `setTodoList`. Wrapped the cache writes in their own try/catch so they fail silently.
- **`src/components/dashboard/MoodCheckIn.jsx`** — the mount-time `localStorage.getItem` was unguarded; in Safari private mode the throw bubbled up and crashed the secondary row of the Dashboard.
- **`src/pages/Friends.jsx`** — `localStorage.getItem` for the message-draft restore + `removeItem` after a successful send — same Safari private-mode footgun. Now guarded both reads + the post-send cleanup.

### Fixed (web) — 3 `toISOString().split("T")[0]` date drift bugs in eastern timezones

When a student is in GMT+ timezones (AU, NZ, Asia), local midnight is already the previous day in UTC, so `.toISOString().split("T")[0]` returns yesterday's date string. Three places had this footgun:

- **`src/components/notifications/useNotifications.jsx`** — `last_checked` drifted vs `todayStr`, so reminder pushes could re-fire after a day was already marked checked, or skip a day entirely.
- **`src/components/dashboard/StudySchedule.jsx`** — the AI prompt's `Today's date:` line was wrong by a day for late-evening users, shifting their schedule.
- **`src/components/assignments/SmartScanModal.jsx`** — when a student scans a planner at night and it says "due Friday", the LLM's reference date was last week's Friday. The clarifying-answer date-parse prompt had the same bug.

All three now build YYYY-MM-DD from local `getFullYear/Month/Date` — same pattern Dashboard.jsx already uses for its plan-feedback storage key.

### Why
One real student-visible feature (Pick one for me — combats decision paralysis on long AI plans) and a clustered fix sweep on two CMS-verification-relevant footguns: silent crashes in Safari private mode (any school-issued iPad in restricted profile mode) and date drift for non-US timezones (any non-North-American school deployment). Both classes of bug fail silently — the user never sees an error, just gets a slightly wrong app — which is exactly the kind of bug that's hardest to catch from telemetry.

---

## [Unreleased] — 2026-04-29 (early-afternoon shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Drag-to-reorder pending assignments ✋

- **`src/pages/Assignments.jsx`** — new "Manual (drag to reorder)" sort option. When selected, the pending grid drops to a single column with a `<GripVertical />` drag handle on each card; reordering immediately persists to `localStorage` under `gg_assignment_order_<email>`.
- The order is restored on next visit; if a saved order exists, the page boots into manual sort so the student's chosen order is respected.
- Items hidden by the active filter/search are preserved at the tail of the saved order, so reordering only the visible subset doesn't drop them on filter clear.
- Completed items always render in due-soon order regardless of sort — the manual queue is for active work.
- Persistence is best-effort; Safari private mode / quota throws are swallowed silently. No PII; never leaves the browser.
- **Why:** has been on the "What I didn't get to" list for 3+ consecutive shifts. `@hello-pangea/dnd` was already in deps with zero usages — finally putting it to work. Students can now pin "essay due Friday" to the top instead of letting due-date sort bury it under a Monday quiz.

### Added (web) — NextTestCountdown banner on Dashboard ⏳

- **`src/components/dashboard/NextTestCountdown.jsx`** — compact gradient banner that surfaces the soonest non-completed test if it falls within the next 14 days.
  - Color shifts warmer as the date gets closer: indigo → amber → orange → red. A test in 1 day visually reads urgent in a way a calendar dot doesn't.
  - Day label switches between TODAY / TOMORROW / N DAYS for natural language at a glance.
  - Includes test name, subject, topics (truncated for narrow screens), and a "Study with AI" link straight into the existing StudyAssistant quiz tool for that test.
  - Renders only when there's an upcoming test within the window — otherwise nothing.
- **Mounted on the Dashboard** between the AI plan and the Today's Wins block (`fadeUp(0.18)`), where it's the first thing a student sees after the hero.
- **Privacy:** fully derived from already-fetched test rows; no new network, no new storage, no PII.
- **Why:** also from "What I didn't get to" — the deadline calendar is dense and multi-event; this is single-test, big-number psychological urgency. Tests have a different cognitive weight than assignments and deserve a distinct surface.

### Fixed (web) — 3 quiet UX bugs

- **`src/pages/Assignments.jsx`** — completed-list pagination was a no-op. The render mapped the full `completed` array instead of the computed `visibleCompleted` slice, so clicking "Load more" bumped a counter that nothing read; every completed assignment was on screen the entire time. Heavy-completer accounts ate the layout cost (and DOM work) of rendering hundreds of cards. Now respects the slice.
- **`src/components/studyroom/InviteLinkButton.jsx`** — clipboard fallback branch fired a bare `setTimeout(setDone(false), 1800)` instead of using the existing `doneTimerRef`-backed `armDoneTimer` helper, so a second click during the 1.8 s window leaked a timer and could `setState` after unmount. Both branches now go through `armDoneTimer`.
- **`src/pages/Tests.jsx`** — `handleMarkDone` optimistically flipped a test to `completed` but had no rollback path. If the server write failed, the card stayed visually completed until the next refetch — student thinks they marked it done, server still has it pending, GradeGuard's reminders keep firing. Snapshots the prior status and restores it from a per-call `onError`.

### Hygiene (web) — 11 `console.error` scrubs + Home session-toast cleanup

- Continuing the prior shift's CMS-verification pass: removed `console.error("X failed:", err)` calls from 11 student-facing files. Each call already has a `toast.error()` for the user; the console line is pure dev noise that ships error objects (potentially carrying request URLs with student email) to the browser console. Files: `useNotifications.jsx`, `NotificationSettingsPanel.jsx`, `useGamification.jsx`, `MiniGames.jsx`, `EssayOutliner.jsx`, `VocabQuizFromNotes.jsx`, `TestForm.jsx`, `AssignmentForm.jsx`, `SmartScanModal.jsx` (3 paths), `AssignmentAttachment.jsx` (2 paths), `RoomView.jsx` (2 paths), `StudyAssistant.jsx` (quiz-result save).
- Left intact: `ErrorBoundary` (debug context is the whole point), `AuthContext` (auth bug-hunting needs it), admin panel files (admin sees these consoles intentionally).
- **`src/pages/Home.jsx`** — the session-expired toast was a bare 500 ms `setTimeout` inside the mount effect with no cleanup path. Tracked the timer + cleared it in the existing cleanup function so navigating away mid-window doesn't fire a "Your session expired" toast on the page the user just landed on (flagged in the 2026-04-29 00:15 UTC shift report).

### Why
Two real student-visible features (drag-to-reorder + NextTestCountdown), both pulled directly from the "What I didn't get to" backlog the prior three shifts left. The bug-fix block clusters on three actually-misleading UX bugs (broken pagination, leaked timer, lost rollback) — not just defensive try/catch wrappers. Hygiene continues the CMS-verification quiet-down on `console.error` so the production console stops leaking error objects with student-context URLs.

---

## [Unreleased] — 2026-04-29 (mid-morning shift)

Pushed straight to the new web canonical (`landon-personal/gradeguardnewsync`, auto-syncs to gradeguard.org). No new desktop installer cut for these.

### Added (web) — Calendar export (.ics) for assignments + tests 📅

- **`src/lib/calendarExport.js`** — RFC 5545 iCalendar generator. Builds a `VCALENDAR` with one `VEVENT` per pending assignment (📝 prefix) and per upcoming test (🧪 prefix) as all-day events, plus a `VALARM` reminder 1 day before assignments / 2 days before tests. Properly escapes commas, semicolons, newlines, backslashes, folds long SUMMARY/DESCRIPTION lines at 75 octets. Skips completed items and rows missing the date.
- **`src/components/common/CalendarExportButton.jsx`** — drop-in button that turns the .ics into a `Blob`, programmatically clicks a download anchor, defers `URL.revokeObjectURL` so Safari has time to grab the file, and toasts the count of exported items (or an "info" toast if nothing's eligible).
- **Mounted on three surfaces:**
  - **Dashboard** — re-attaches the previously orphaned `DeadlineCalendar` component (it lived in `src/components/dashboard/` but was never imported anywhere) underneath an "Upcoming deadlines / Export" row, only when the user has at least one pending item.
  - **Assignments page header** — small `Export` button, scoped to assignments only.
  - **Tests page header** — same, scoped to tests only.
- **Privacy:** the `.ics` is generated entirely client-side. No assignment or test text leaves the browser. No external service involved. Safe under the CMS data-handling rules.
- **Why:** students who use Google / Apple / Outlook Calendar can now ingest their GradeGuard workload in one click instead of typing it in twice. The reminder alarms inside the file mean the student gets a heads-up the day before an assignment and two days before a test even when GradeGuard isn't open. Recurring-value: once a student imports it, the entries stay in their calendar even if they don't open the app for a week.

### Removed (web) — duplicate "Today's Wins" block on Dashboard

- The Dashboard rendered the same Today's Wins section twice (once at `fadeUp(0.22)`, again at `fadeUp(0.32)`). Kept the first; the second slot now hosts the Deadline Calendar + Export button row.

### Fixed (web) — Safari private-mode storage / blob crashes

Seven unprotected localStorage / blob writes that would throw in Safari private browsing or hit storage quota.

- **`src/Layout.jsx`** — cross-domain auth handoff (`gg_login` / `gg_token` URL params → `localStorage.setItem`) now wrapped in try/catch so a private-mode window falls back to the regular sign-in instead of crashing on first paint.
- **`src/pages/FocusTimer.jsx`** — `saveTodaySessions()` wrapped; private mode keeps the in-memory list intact instead of throwing inside the timer-completion path.
- **`src/components/dashboard/FloatingStreakCounter.jsx`** — both the `gg_streak_celebrated_*` getItem and setItem are now guarded; the milestone confetti effect can no longer crash the floating widget.
- **`src/components/dashboard/PomodoroTimer.jsx`** — `gg_pomodoro_muted` getItem (in initial useState) + setItem (in toggleMute) wrapped.
- **`src/pages/Friends.jsx`** — friend-message draft persistence (typing + onSend) wrapped in try/catch; drafts are best-effort.
- **`src/components/assistant/EssayOutliner.jsx`** — `handleExport` now appends/removes the anchor from the body, defers `URL.revokeObjectURL` by 1 s, and wraps the whole thing in try/catch with a fallback toast pointing students at the Copy button.
- **`src/components/assistant/FlashcardViewer.jsx`** — same Safari fix on the flashcard `.txt` export path.
- **`src/pages/ChromeExtension.jsx`** — extension `.zip` builder now appends/removes the anchor + defers revoke, adds a double-submit guard, surfaces a toast on failure, and `resizeIcon` rejects on `img.onerror` so a non-image response can't hang the download forever.

### Fixed (web) — `PomodoroWidget` no longer ambushes students with a permission prompt

- **`src/components/dashboard/PomodoroWidget.jsx`** — clicking Start in default Notification permission state used to silently call `Notification.requestPermission()`, surprising students mid-flow and converting most into a "denied" decision (which then permanently broke the session-complete notification). The `fireNotification` helper already toast-falls-back when permission isn't granted, so removing the auto-request preserves the working notification path. Permission is still solicited deliberately from `NotificationSettingsPanel` / onboarding.
- **`src/components/layout/FloatingPomodoro.jsx`** — wrapped its own `Notification.requestPermission()` (kept here because the floating panel is opt-in) in try/catch + `.catch(() => {})` so synchronous-throwing browsers and rejected promises can't bubble out as unhandled rejections.

### Why
Headline ship is calendar export — a recurring-value feature that closes a gap students have repeatedly hit ("how do I get this into my phone calendar?") and touches Dashboard, Assignments, and Tests in one go. The hygiene block clusters on Safari private-mode crashes and Notification API misuse — both quiet failure modes that bite real students with no signal in the dev console.

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
