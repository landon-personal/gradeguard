import { motion } from "framer-motion";
import { BookOpen, FlaskConical } from "lucide-react";
import { differenceInDays } from "date-fns";
import { parseLocalDate } from "../utils/dateUtils";

export default function TodaysFocusCard({ assignments, tests }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find most urgent item across assignments and tests
  const pending = assignments.filter((a) => a.status !== "completed");

  const scoredAssignments = pending.map((a) => {
    const days = differenceInDays(parseLocalDate(a.due_date), today);
    const diffScore = a.difficulty === "hard" ? 3 : a.difficulty === "medium" ? 2 : 1;
    const weightScore = a.weight === "perform" ? 3 : a.weight === "rehearse" ? 2 : 1;
    const urgency = (days <= 0 ? 100 : 10 / (days + 1)) + diffScore + weightScore;
    return { ...a, days, urgency, itemType: "assignment" };
  });

  const scoredTests = tests.
  filter((t) => t.status !== "completed").
  map((t) => {
    const days = differenceInDays(parseLocalDate(t.test_date), today);
    const diffScore = t.difficulty === "hard" ? 3 : t.difficulty === "medium" ? 2 : 1;
    const urgency = (days <= 0 ? 100 : 10 / (days + 1)) + diffScore + 2;
    return { ...t, days, urgency, itemType: "test" };
  });

  const all = [...scoredAssignments, ...scoredTests].sort((a, b) => b.urgency - a.urgency);
  const focus = all[0];

  if (!focus) return null;

  const isTest = focus.itemType === "test";
  const daysLabel = focus.days < 0 ?
  isTest
    ? `Passed ${Math.abs(focus.days)} day${Math.abs(focus.days) !== 1 ? "s" : ""} ago`
    : `${Math.abs(focus.days)} day${Math.abs(focus.days) !== 1 ? "s" : ""} overdue`
  : focus.days === 0 ?
  (isTest ? "Happening today" : "Due today") :
  `${isTest ? "In" : "Due in"} ${focus.days} day${focus.days !== 1 ? "s" : ""}`;

  const urgencyColor = focus.days <= 0 ?
  { bg: "from-red-500 to-rose-500", badge: "bg-red-100 text-red-700", shadow: "rgba(239,68,68,0.3)" } :
  focus.days <= 2 ?
  { bg: "from-amber-500 to-orange-500", badge: "bg-amber-100 text-amber-700", shadow: "rgba(245,158,11,0.3)" } :
  { bg: "from-indigo-500 to-purple-500", badge: "bg-indigo-100 text-indigo-700", shadow: "rgba(99,102,241,0.3)" };

  const Icon = isTest ? FlaskConical : BookOpen;

  return (
    <motion.div className="rounded-2xl p-4 h-full" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)", boxShadow: `0 8px 28px ${urgencyColor.shadow}` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Today’s Focus</h3>
          <p className="text-xs text-gray-400">Your most urgent next step</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${urgencyColor.bg} flex items-center justify-center text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyColor.badge}`}>{daysLabel}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-100 text-gray-500">
            {isTest ? "Test" : focus.subject || "Assignment"}
          </span>
        </div>
        <p className="text-base font-semibold text-gray-900 leading-snug">{focus.name}</p>
        <p className="text-sm text-gray-500 mt-2">
          {isTest ? "Best move: review this before your other tasks." : "Best move: knock this out before lower-priority work."}
        </p>
      </div>
    </motion.div>
  );








































}