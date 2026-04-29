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
