import { addDays, endOfWeek, isWithinInterval, startOfWeek } from "date-fns";
import { parseLocalDate } from "@/components/utils/dateUtils";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

function matchesDateWindow(dateValue, query) {
  if (!dateValue) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = parseLocalDate(dateValue);

  if (query.includes("overdue")) return targetDate < today;
  if (query.includes("today")) return targetDate.getTime() === today.getTime();
  if (query.includes("tomorrow")) return targetDate.getTime() === addDays(today, 1).getTime();
  if (query.includes("this week")) {
    return isWithinInterval(targetDate, {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    });
  }
  if (query.includes("next week")) {
    const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    const nextWeekEnd = addDays(endOfWeek(today, { weekStartsOn: 1 }), 7);
    return isWithinInterval(targetDate, { start: nextWeekStart, end: nextWeekEnd });
  }

  return true;
}

function stripKeywords(query) {
  return query
    .replace(/\bin progress\b/g, " ")
    .replace(/\bdue\b/g, " ")
    .replace(/\bnext week\b/g, " ")
    .replace(/\bthis week\b/g, " ")
    .replace(/\btomorrow\b/g, " ")
    .replace(/\btoday\b/g, " ")
    .replace(/\boverdue\b/g, " ")
    .replace(/\bcompleted\b|\bdone\b|\bfinished\b/g, " ")
    .replace(/\bpending\b|\bupcoming\b/g, " ")
    .replace(/\beasy\b|\bmedium\b|\bhard\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesFreeText(haystack, cleanedQuery) {
  if (!cleanedQuery) return true;

  const terms = cleanedQuery.split(" ").filter(Boolean);
  return haystack.includes(cleanedQuery) || terms.every((term) => haystack.includes(term));
}

export function matchesAssignmentSearch(assignment, rawQuery) {
  const query = normalize(rawQuery);
  if (!query) return true;

  const haystack = normalize([
    assignment.name,
    assignment.subject,
    assignment.notes,
    assignment.difficulty,
    assignment.status,
  ].filter(Boolean).join(" "));

  if ((query.includes("completed") || query.includes("done") || query.includes("finished")) && assignment.status !== "completed") {
    return false;
  }

  if (query.includes("pending") && assignment.status !== "pending") return false;
  if (query.includes("in progress") && assignment.status !== "in_progress") return false;

  if (query.includes("easy") && assignment.difficulty !== "easy") return false;
  if (query.includes("medium") && assignment.difficulty !== "medium") return false;
  if (query.includes("hard") && assignment.difficulty !== "hard") return false;

  if (["overdue", "today", "tomorrow", "this week", "next week"].some((term) => query.includes(term))) {
    if (!matchesDateWindow(assignment.due_date, query)) return false;
  }

  return matchesFreeText(haystack, stripKeywords(query));
}

export function matchesTestSearch(test, rawQuery) {
  const query = normalize(rawQuery);
  if (!query) return true;

  const haystack = normalize([
    test.name,
    test.subject,
    test.topics,
    test.notes,
    test.difficulty,
    test.status,
  ].filter(Boolean).join(" "));

  if ((query.includes("completed") || query.includes("done") || query.includes("finished")) && test.status !== "completed") {
    return false;
  }

  if (query.includes("upcoming") && test.status !== "upcoming") return false;
  if (query.includes("easy") && test.difficulty !== "easy") return false;
  if (query.includes("medium") && test.difficulty !== "medium") return false;
  if (query.includes("hard") && test.difficulty !== "hard") return false;

  if (["today", "tomorrow", "this week", "next week"].some((term) => query.includes(term))) {
    if (!matchesDateWindow(test.test_date, query)) return false;
  }

  return matchesFreeText(haystack, stripKeywords(query));
}