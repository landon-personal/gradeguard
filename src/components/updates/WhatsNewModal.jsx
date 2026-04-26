import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Plus, Sparkles, Users, X } from "lucide-react";

const updates = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Friends got a big upgrade",
    description: "Add friends, view each other's assignments and tests, and quickly copy useful work into your own planner."
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Academic-only chat",
    description: "Friends can now message each other inside the app, with moderation to keep conversations focused on school."
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Smarter study help",
    description: "The AI plan is more personalized, with better guidance, mood-aware suggestions, and stronger study support."
  },
  {
    icon: <Plus className="h-5 w-5" />,
    title: "Faster everyday flow",
    description: "Quick Add, cleaner empty states, and smoother page updates make it faster to stay organized."
  }
];

export default function WhatsNewModal({ onDismiss, onExploreFriends }) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-4">
        <motion.button
          type="button"
          aria-label="Close updates"
          onClick={onDismiss}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-md max-h-[calc(100vh-24px)] overflow-y-auto rounded-[24px] border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-indigo-500/12 via-violet-500/8 to-sky-400/8" />
...
          <div className="relative p-4 md:p-5">
            <div className="max-w-md pr-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                <Sparkles className="h-3 w-3" />
                What’s New
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900 md:text-xl">
                New since Quiz Competition
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Friends got the biggest upgrade, plus a few smoother planning improvements.
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3.5 py-3 text-sm text-indigo-900">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Friends is now a study hub</h3>
                  <p className="mt-0.5 leading-5 text-indigo-900/80">
                    Add friends, compare work, copy assignments and tests, and keep school conversations in one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {updates.map(({ icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold leading-5 text-slate-900">{title}</h4>
                      <p className="mt-0.5 text-sm leading-5 text-slate-600">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onDismiss} className="rounded-xl">
                Got it
              </Button>
              <Button onClick={onExploreFriends} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Check out Friends
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}