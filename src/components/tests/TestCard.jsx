import { motion } from "framer-motion";
import { FlaskConical, Calendar, Pencil, Trash2, CheckCircle2, ClipboardList } from "lucide-react";
import { haptic } from "../utils/haptics";
import { differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";

const DIFFICULTY_COLORS = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700"
};

export default function TestCard({ test, onEdit, onDelete, onMarkDone, onQuiz }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [y, m, d] = test.test_date.split('-').map(Number);
  const testDay = new Date(y, m - 1, d);
  const daysUntil = differenceInDays(testDay, today);

  const urgencyColor =
    daysUntil < 0 ? "border-l-gray-300" :
    daysUntil === 0 ? "border-l-red-500" :
    daysUntil <= 2 ? "border-l-red-400" :
    daysUntil <= 5 ? "border-l-yellow-400" :
    "border-l-purple-400";

  const urgencyLabel =
    daysUntil < 0 ? "Passed" :
    daysUntil === 0 ? "Today!" :
    daysUntil === 1 ? "Tomorrow!" :
    `${daysUntil} days away`;

  const urgencyBadgeColor =
    daysUntil < 0 ? "bg-gray-100 text-gray-500" :
    daysUntil <= 1 ? "bg-red-100 text-red-700" :
    daysUntil <= 5 ? "bg-yellow-100 text-yellow-700" :
    "bg-purple-100 text-purple-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(139,92,246,0.12)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-white rounded-xl border border-gray-100 border-l-4 ${urgencyColor} shadow-sm p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">{test.name}</h3>
              {test.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[test.difficulty]}`}>
                  {test.difficulty}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyBadgeColor}`}>
                {urgencyLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
              <span className="font-medium text-purple-600">{test.subject}</span>
              <span>·</span>
              <Calendar className="w-3 h-3" />
              <span>{test.test_date}</span>
            </div>
            {test.topics && (
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-600">Topics: </span>{test.topics}
              </p>
            )}

            {test.notes && (
              <p className="text-xs text-gray-400 mt-1">{test.notes}</p>
            )}
            {onQuiz && test.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { haptic.light(); onQuiz(test); }}
                className="mt-3 h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Practice Quiz
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {[
            { onClick: () => { haptic.success(); onMarkDone(test); }, icon: <CheckCircle2 className="w-4 h-4" />, hover: "hover:text-green-500 hover:bg-green-50", title: "Mark as done" },
            { onClick: () => { haptic.light(); onEdit(test); }, icon: <Pencil className="w-4 h-4" />, hover: "hover:text-indigo-500 hover:bg-indigo-50" },
            { onClick: () => { haptic.medium(); onDelete(test.id); }, icon: <Trash2 className="w-4 h-4" />, hover: "hover:text-red-500 hover:bg-red-50" },
          ].map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={btn.onClick}
              title={btn.title}
              className={`p-1.5 rounded-lg text-gray-300 transition-colors ${btn.hover}`}
            >
              {btn.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}