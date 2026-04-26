import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
{ emoji: "😴", label: "Tired", tone: "gentle" },
{ emoji: "😐", label: "Okay", tone: "balanced" },
{ emoji: "🙂", label: "Good", tone: "encouraging" },
{ emoji: "⚡", label: "Focused", tone: "intense" },
{ emoji: "🔥", label: "Pumped", tone: "energetic" }];


const STORAGE_KEY = "gg_mood_";

export default function MoodCheckIn({ userEmail, onMoodChange }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    const saved = localStorage.getItem(STORAGE_KEY + userEmail);
    if (saved) {
      const { mood, date } = JSON.parse(saved);
      if (date === new Date().toDateString()) {
        setSelected(mood);
        setConfirmed(true);
        onMoodChange?.(MOODS.find((m) => m.label === mood)?.tone || "balanced");
      }
    }
  }, [userEmail]);

  const handleSelect = (mood) => {
    setSelected(mood.label);
    setConfirmed(true);
    localStorage.setItem(STORAGE_KEY + userEmail, JSON.stringify({ mood: mood.label, date: new Date().toDateString() }));
    onMoodChange?.(mood.tone);
  };

  return (
    <div className="rounded-2xl p-4 h-full" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(99,102,241,0.07)" }}>
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">Mood Check-In</h3>
        <p className="text-xs text-gray-400">Set the tone for today’s study plan</p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 w-full">
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            onClick={() => handleSelect(mood)}
            className={`w-full rounded-xl border px-1.5 py-3 text-center transition-all ${
              selected === mood.label
                ? "bg-indigo-50 border-indigo-300 shadow-sm"
                : "bg-white/80 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/60"
            }`}
          >
            <div className="text-base">{mood.emoji}</div>
            <div className="text-[10px] font-medium text-gray-600 mt-1 leading-tight">{mood.label}</div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {confirmed && selected && (
          <motion.p
            key={selected}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-500 mt-3"
          >
            Today’s plan is tuned for a {selected.toLowerCase()} mood.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );















































}