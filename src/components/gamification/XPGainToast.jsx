import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Sparkles, Zap } from "lucide-react";

const particles = [0, 1, 2, 3, 4, 5, 6, 7];

export default function XPGainToast({ message }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.92 }}
          className="fixed right-5 top-5 z-[99999] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-emerald-200/80 bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(16,185,129,0.22)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-emerald-200/50 via-lime-100/35 to-sky-100/20" />
          {particles.map((particle) => (
            <motion.div
              key={particle}
              className="absolute left-12 top-11 h-2.5 w-2.5 rounded-full bg-emerald-300/80"
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.4, 1, 0.6],
                x: Math.cos((particle / particles.length) * Math.PI * 2) * 58,
                y: Math.sin((particle / particles.length) * Math.PI * 2) * 24,
              }}
              transition={{ duration: 0.9, delay: 0.06 * particle }}
            />
          ))}

          <div className="relative flex items-center gap-4">
            <motion.div
              className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-xl shadow-emerald-500/25"
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/30" />
              <Zap className="h-6 w-6" />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <Sparkles className="h-3 w-3" /> XP boost
              </div>
              <p className="mt-2 text-xl font-black text-gray-900">{message}</p>
              <p className="text-sm text-gray-500">Nice work — your progress just moved up.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}