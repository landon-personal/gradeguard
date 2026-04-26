import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";

const burstDots = [0, 1, 2, 3, 4, 5, 6, 7];

export default function BadgeUnlockToast({ badge, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 450);
    }, 3600);

    return () => clearTimeout(timer);
  }, [onDone]);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -34, scale: 0.92 }}
          style={{ position: "fixed", top: 24, left: "50%", translateX: "-50%", zIndex: 99999 }}
          className="relative min-w-[320px] overflow-hidden rounded-[30px] border border-yellow-200/90 bg-white/95 px-6 py-5 shadow-[0_28px_90px_rgba(234,179,8,0.26)] backdrop-blur-2xl -translate-x-1/2"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-yellow-200/60 via-orange-100/45 to-pink-100/35" />
          <motion.div
            className="absolute inset-y-0 left-[-30%] w-24 bg-white/30 blur-2xl"
            animate={{ x: [0, 320, 0], opacity: [0, 0.55, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          {burstDots.map((dot) => (
            <motion.div
              key={dot}
              className="absolute h-2.5 w-2.5 rounded-full bg-yellow-300/80"
              style={{ top: 38, left: "50%" }}
              initial={{ opacity: 0, scale: 0.35, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.35, 1, 0.7],
                x: Math.cos((dot / burstDots.length) * Math.PI * 2) * 78,
                y: Math.sin((dot / burstDots.length) * Math.PI * 2) * 30,
              }}
              transition={{ duration: 1.2, delay: 0.1 + dot * 0.03 }}
            />
          ))}

          <div className="relative flex items-center gap-4">
            <motion.div
              className={`relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br ${badge.color} text-3xl shadow-xl shadow-yellow-500/20`}
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 0.85, ease: "easeInOut" }}
            >
              <div className="absolute inset-1 rounded-[20px] border border-white/35" />
              <motion.div
                className="absolute inset-[-6px] rounded-[28px] border border-yellow-300/45"
                animate={{ scale: [0.92, 1.08], opacity: [0.7, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
              />
              {badge.emoji}
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-700">
                <Sparkles className="h-3 w-3" /> Badge unlocked
              </div>
              <div className="mt-2 text-xl font-black text-gray-900">{badge.name}</div>
              <div className="text-sm text-gray-500">{badge.description}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-yellow-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.1, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}