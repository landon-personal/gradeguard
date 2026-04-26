import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];

export function getLevel(points) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function getLevelProgress(points) {
  const level = getLevel(points);
  const current = LEVEL_THRESHOLDS[level - 1] || 0;
  const next = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = next === current ? 100 : ((points - current) / (next - current)) * 100;
  return { level, current: points - current, needed: next - current, progress: Math.min(progress, 100) };
}

const LEVEL_NAMES = ["Novice", "Learner", "Student", "Scholar", "Achiever", "Expert", "Master", "Elite", "Champion", "Legend", "Grandmaster"];

export default function XPBar({ totalPoints }) {
  const { level, current, needed, progress } = getLevelProgress(totalPoints || 0);
  const levelName = LEVEL_NAMES[level - 1] || "Grandmaster";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-5 text-white shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_35%)]" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg">
            <motion.div
              className="absolute inset-1 rounded-xl border border-yellow-200/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <Zap className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-100">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              Progress tracker
            </div>
            <div className="mt-1 text-xl font-bold">Level {level} · {levelName}</div>
            <div className="text-sm text-indigo-100/90">{totalPoints || 0} XP total</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/80">Next level</div>
          <div className="mt-1 text-lg font-bold text-white">{needed - current} XP left</div>
          <div className="text-xs text-indigo-100/80">{current} / {needed} in this level</div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-indigo-100/85">
          <span>Level progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="relative h-3 rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-y-0 right-0 w-12 bg-white/35 blur-sm"
              animate={{ x: [40, -10, 40] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}