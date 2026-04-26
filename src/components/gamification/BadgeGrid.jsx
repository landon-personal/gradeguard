import { BADGES } from "./BadgeDefinitions";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function BadgeGrid({ earnedBadgeIds = [] }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Badges</h3>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {BADGES.map((badge, i) => {
          const earned = earnedBadgeIds.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-1.5 group relative"
              title={badge.description}
            >
              <motion.div
                whileHover={earned ? { scale: 1.08, y: -2 } : undefined}
                animate={earned ? { y: [0, -2, 0] } : undefined}
                transition={earned ? { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 } : undefined}
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm transition-all
                  ${earned
                    ? `bg-gradient-to-br ${badge.color} shadow-lg`
                    : "bg-gray-100 grayscale opacity-40"
                  }`}
              >
                {earned && <div className="absolute inset-0 rounded-2xl ring-2 ring-white/40 ring-offset-2 ring-offset-transparent" />}
                {earned ? badge.emoji : <Lock className="w-4 h-4 text-gray-400" />}
              </motion.div>
              <span className={`text-[10px] text-center leading-tight font-medium ${earned ? "text-gray-700" : "text-gray-400"}`}>
                {badge.name}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                {badge.description}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}