import { useMemo } from "react";
import { Flame } from "lucide-react";
import { calcStreak } from "../gamification/streakUtils";

export default function StreakBadge({ assignments }) {
  const streak = useMemo(() => calcStreak(assignments), [assignments]);

  const message =
    streak >= 30 ? "Legendary! 🏆" :
    streak >= 14 ? "On fire! 🔥" :
    streak >= 7  ? "Great week!" :
    streak >= 3  ? "Building momentum!" :
    "Keep it up!";

  if (streak === 0) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm w-full">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl shrink-0">
          <Flame className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-400">0</span>
            <span className="text-sm font-semibold text-gray-400">day streak</span>
          </div>
          <p className="text-xs text-gray-400">Complete an assignment to start!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl px-5 py-3.5 shadow-sm w-full">
      <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl shrink-0">
        <Flame className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-orange-600">{streak}</span>
          <span className="text-sm font-semibold text-orange-500">day streak</span>
        </div>
        <p className="text-xs text-orange-400">{message}</p>
      </div>
      <div className="ml-auto flex gap-1">
        {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-400"
            style={{ opacity: 0.4 + (i / Math.min(streak, 7)) * 0.6 }}
          />
        ))}
        {streak > 7 && (
          <span className="text-xs text-orange-400 ml-1">+{streak - 7}</span>
        )}
      </div>
    </div>
  );
}