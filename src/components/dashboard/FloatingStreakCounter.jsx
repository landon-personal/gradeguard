import { useMemo, useState, useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { calcStreak } from "../gamification/streakUtils";
import { useQuery } from "@tanstack/react-query";
import { secureEntity } from "@/lib/secureEntities";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function FloatingStreakCounter({ userEmail }) {
  const [hovered, setHovered] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments-streak', userEmail],
    queryFn: () => secureEntity("Assignment").filter({ user_email: userEmail }, '-updated_date', 200),
    enabled: !!userEmail,
    staleTime: 60000,
  });

  const streak = useMemo(() => calcStreak(assignments), [assignments]);
  const prevStreakRef = useRef(streak);

  // Confetti on milestone streaks (7, 14, 30, 50, 100)
  useEffect(() => {
    const milestones = [7, 14, 30, 50, 100];
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (streak > prev && milestones.includes(streak)) {
      confetti({ particleCount: 80, spread: 70, origin: { x: 0.9, y: 0.95 }, colors: ["#fb923c", "#f59e0b", "#ef4444", "#8b5cf6"] });
    }
  }, [streak]);

  const message =
    streak >= 30 ? "Legendary! 🏆" :
    streak >= 14 ? "On fire! 🔥" :
    streak >= 7  ? "Great week!" :
    streak >= 3  ? "Building momentum!" :
    streak === 0 ? "Complete an assignment to start!" :
    "Keep it up!";

  const isActive = streak > 0;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`
        @keyframes streakGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            style={{
              background: isActive ? "rgba(255,237,213,0.95)" : "rgba(245,245,245,0.95)",
              backdropFilter: "blur(12px)",
              border: isActive ? "1px solid rgba(251,146,60,0.4)" : "1px solid rgba(200,200,200,0.4)",
            }}
          >
            <div className={`text-2xl font-bold ${isActive ? "text-orange-600" : "text-gray-400"}`}>
              {streak}
            </div>
            <div>
              <div className={`text-sm font-semibold ${isActive ? "text-orange-500" : "text-gray-400"}`}>
                day streak
              </div>
              <div className={`text-xs ${isActive ? "text-orange-400" : "text-gray-400"}`}>
                {message}
              </div>
            </div>
            {isActive && (
              <div className="flex gap-1 ml-1">
                {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-orange-400"
                    style={{ opacity: 0.4 + (i / Math.min(streak, 7)) * 0.6 }}
                  />
                ))}
                {streak > 7 && <span className="text-xs text-orange-400 ml-0.5">+{streak - 7}</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 rounded-2xl px-3 py-2.5 shadow-lg cursor-default select-none"
        style={{
          background: isActive
            ? "linear-gradient(135deg, #fb923c, #f59e0b, #ef4444, #fb923c)"
            : "rgba(240,240,240,0.85)",
          backgroundSize: isActive ? "300% 300%" : undefined,
          animation: isActive ? "streakGradient 8s ease infinite" : undefined,
          backdropFilter: "blur(12px)",
          border: isActive ? "1px solid rgba(251,146,60,0.5)" : "1px solid rgba(200,200,200,0.5)",
          boxShadow: isActive ? "0 4px 20px rgba(251,146,60,0.35)" : "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Flame className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
        <span className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-400"}`}>
          {streak}
        </span>
      </motion.div>
    </div>
  );
}