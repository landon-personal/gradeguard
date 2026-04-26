import { Zap, Target, Flame, Clock } from "lucide-react";
import { POINTS_PER_COMPLETION, BONUS_HARD, BONUS_MEDIUM, BONUS_EARLY } from "./BadgeDefinitions";

export default function PointsBreakdown() {
  const rules = [
    { icon: <Target className="w-4 h-4 text-indigo-500" />, label: "Complete an assignment", points: `+${POINTS_PER_COMPLETION} XP`, note: "base reward" },
    { icon: <Zap className="w-4 h-4 text-red-500" />, label: "Hard difficulty bonus", points: `+${BONUS_HARD} XP`, note: "per hard assignment" },
    { icon: <Zap className="w-4 h-4 text-yellow-500" />, label: "Medium difficulty bonus", points: `+${BONUS_MEDIUM} XP`, note: "per medium assignment" },
    { icon: <Clock className="w-4 h-4 text-green-500" />, label: "Early completion bonus", points: `+${BONUS_EARLY} XP`, note: "before due date" },
    { icon: <Flame className="w-4 h-4 text-orange-500" />, label: "Streak multiplier", points: "+10%", note: "per streak day, max +50%" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-indigo-500" /> How You Earn XP
      </h3>
      <div className="space-y-2.5">
        {rules.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 mt-0.5">{r.icon}</div>
            <span className="text-gray-700 flex-1">{r.label}</span>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-indigo-600">{r.points}</span>
              <span className="text-gray-400 text-xs block">{r.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}