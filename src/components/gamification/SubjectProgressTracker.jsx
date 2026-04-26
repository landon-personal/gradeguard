import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const SUBJECT_COLORS = {
  "Math": { bar: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  "Science": { bar: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
  "English": { bar: "from-purple-500 to-violet-600", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
  "History": { bar: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  "Foreign Language": { bar: "from-pink-500 to-rose-600", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100" },
  "Art": { bar: "from-fuchsia-500 to-purple-600", bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-100" },
  "Computer Science": { bar: "from-cyan-500 to-sky-600", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100" },
};

const DEFAULT_COLOR = { bar: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" };

// Mastery tiers
function getMastery(completed) {
  if (completed >= 20) return { label: "Master", emoji: "🏆", color: "text-yellow-600" };
  if (completed >= 10) return { label: "Expert", emoji: "⭐", color: "text-indigo-600" };
  if (completed >= 5) return { label: "Proficient", emoji: "📈", color: "text-green-600" };
  if (completed >= 2) return { label: "Learning", emoji: "📖", color: "text-blue-600" };
  return { label: "Beginner", emoji: "🌱", color: "text-gray-500" };
}

export default function SubjectProgressTracker({ assignments }) {
  const subjectStats = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      const subj = a.subject || "Other";
      if (!map[subj]) map[subj] = { total: 0, completed: 0, hard: 0, totalTime: 0 };
      map[subj].total++;
      if (a.status === "completed") {
        map[subj].completed++;
        if (a.difficulty === "hard") map[subj].hard++;
      }
      if (a.time_estimate) map[subj].totalTime += a.time_estimate;
    }
    return Object.entries(map)
      .map(([subject, data]) => ({
        subject,
        ...data,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        mastery: getMastery(data.completed),
      }))
      .sort((a, b) => b.completed - a.completed);
  }, [assignments]);

  if (subjectStats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No subject data yet. Complete assignments to track progress.
      </div>
    );
  }

  const maxCompleted = Math.max(...subjectStats.map(s => s.completed), 1);

  return (
    <div className="space-y-3">
      {subjectStats.map((subj, idx) => {
        const colors = SUBJECT_COLORS[subj.subject] || DEFAULT_COLOR;
        const barWidth = (subj.completed / maxCompleted) * 100;

        return (
          <motion.div
            key={subj.subject}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{subj.mastery.emoji}</span>
                <div>
                  <span className="font-semibold text-gray-800 text-sm">{subj.subject}</span>
                  <span className={`ml-2 text-xs font-medium ${subj.mastery.color}`}>{subj.mastery.label}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${colors.text}`}>{subj.completed}</span>
                <span className="text-xs text-gray-400">/{subj.total} done</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/70 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div
                className={`bg-gradient-to-r ${colors.bar} h-2 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
              />
            </div>

            {/* Stats row */}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{subj.completionRate}% completion</span>
              {subj.hard > 0 && <span>·  {subj.hard} hard ✓</span>}
              {subj.totalTime > 0 && <span>· ~{Math.round(subj.totalTime / 60)}h studied</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}