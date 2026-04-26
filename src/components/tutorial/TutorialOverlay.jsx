import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

const steps = [
  {
    emoji: "👋",
    title: "Welcome to GradeGuard",
    description: "This quick tour is interactive, so you can jump straight into the part of the app you want to try first.",
  },
  {
    emoji: "📚",
    title: "Add assignments fast",
    description: "Use manual entry, AI chat, or a photo to log homework quickly and keep your planner current.",
    page: "Assignments",
    query: "?new=1",
    ctaLabel: "Open Assignments",
  },
  {
    emoji: "🧪",
    title: "Track tests clearly",
    description: "Save upcoming exams and quizzes so the app can build a smarter study plan around your deadlines.",
    page: "Tests",
    query: "?new=1",
    ctaLabel: "Open Tests",
  },
  {
    emoji: "🤖",
    title: "Get guided AI help",
    description: "The Study Assistant coaches you with hints, practice, and study tools instead of just giving away answers.",
    page: "StudyAssistant",
    ctaLabel: "Open Study Assistant",
  },
  {
    emoji: "🏆",
    title: "Watch your progress grow",
    description: "Assignments turn into XP, badges, streaks, and leaderboard progress so the work feels rewarding as you go.",
    page: "Achievements",
    ctaLabel: "View Achievements",
  },
  {
    emoji: "📊",
    title: "Your dashboard stays focused",
    description: "Every day you get a personalized plan, progress snapshots, and quick next steps based on your actual workload.",
    page: "Dashboard",
    ctaLabel: "Go to Dashboard",
  },
];

export default function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && !isLast) setStep((value) => value + 1);
      if (event.key === "ArrowLeft" && step > 0) setStep((value) => value - 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLast, onClose, step]);

  const jumpToStepPage = () => {
    if (!current.page) return;
    window.location.href = `${createPageUrl(current.page)}${current.query || ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -18 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-indigo-500/14 via-violet-500/10 to-sky-400/8" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" />
                Interactive tour
              </div>
              <button onClick={onClose} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                Skip tour
              </button>
            </div>

            <div className="mt-5 flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-indigo-600" : "w-2 bg-gray-200"}`}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="text-5xl">{current.emoji}</div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{current.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{current.description}</p>
            </div>

            {current.ctaLabel && (
              <button
                onClick={jumpToStepPage}
                className="mt-5 w-full rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left transition-colors hover:bg-indigo-100"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Try it now</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-indigo-900">{current.ctaLabel}</span>
                  <ChevronRight className="h-4 w-4 text-indigo-500" />
                </div>
              </button>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((value) => value - 1)}
                disabled={step === 0}
                className="text-gray-500"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>

              {isLast ? (
                <Button onClick={onClose} className="bg-indigo-600 px-6 text-white hover:bg-indigo-700">
                  Finish tour
                </Button>
              ) : (
                <Button onClick={() => setStep((value) => value + 1)} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}