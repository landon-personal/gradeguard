import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { haptic } from "../utils/haptics";

const urgencyColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const rankGradients = [
  "from-red-500 to-orange-400",
  "from-orange-500 to-amber-400",
  "from-amber-500 to-yellow-400",
  "from-blue-500 to-indigo-400",
  "from-indigo-500 to-purple-400",
  "from-gray-400 to-gray-500"
];

export default function TodoItemCard({ item, rank, onComplete, onQuiz }) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    haptic.success();
    setCompleting(true);
    await onComplete();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: 20 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(99,102,241,0.10)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex items-start p-3 gap-3">
        {/* Rank badge */}
        <div className={`flex-shrink-0 w-7 h-7 bg-gradient-to-br ${rankGradients[rank - 1] || rankGradients[5]} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
              {item.type === "test_study" ? `Study for ${item.assignment_name}` : item.assignment_name}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0 hover:bg-transparent">{item.subject}</Badge>
            {item.urgency_level && (
              <Badge className={`text-xs border shrink-0 ${urgencyColors[item.urgency_level?.toLowerCase()] || urgencyColors.medium}`}>
                {item.urgency_level}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {item.suggested_time_today} min
            </span>
            {item.type === "test_study" && onQuiz && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { haptic.light(); onQuiz(); }}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ClipboardList className="w-3 h-3" />
                Quiz
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { haptic.light(); setExpanded(!expanded); }}
              className="flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Why?
              <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                <ChevronRight className="w-3 h-3" />
              </motion.span>
            </motion.button>
          </div>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-gray-500 mt-2 bg-indigo-50 rounded-lg p-3 leading-relaxed border border-indigo-100"
            >
              {item.priority_reason}
            </motion.p>
          )}
        </div>

        {/* Complete button */}
        <motion.button
          onClick={handleComplete}
          disabled={completing}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8, rotate: 10 }}
          animate={completing ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : {}}
          transition={{ type: "spring", stiffness: 400 }}
          className={`flex-shrink-0 p-1 rounded-full transition-colors ${
            completing
              ? 'text-green-500'
              : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
          }`}
          title="Mark as done"
        >
          <CheckCircle2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}