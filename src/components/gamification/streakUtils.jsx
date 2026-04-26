import { subDays, startOfDay } from "date-fns";

export function calcStreak(assignments) {
  let count = 0;
  const today = startOfDay(new Date());

  const completedDays = new Set(
    assignments
      .filter(a => a.status === "completed" && a.updated_date)
      .map(a => startOfDay(new Date(a.updated_date)).toDateString())
  );

  // Start from today; if today has no activity, start from yesterday (streak still alive)
  const todayStr = today.toDateString();
  const yesterdayStr = subDays(today, 1).toDateString();
  const startOffset = completedDays.has(todayStr) ? 0 : completedDays.has(yesterdayStr) ? 1 : null;

  if (startOffset === null) return 0;

  for (let i = startOffset; i < 365; i++) {
    const dayStr = subDays(today, i).toDateString();
    if (completedDays.has(dayStr)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}