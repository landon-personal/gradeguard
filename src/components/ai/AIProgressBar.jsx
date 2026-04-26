import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";

const DEFAULT_STATUSES = ["Sending request", "Waiting for AI", "Finishing response"];

export default function AIProgressBar({
  title = "AI is working...",
  subtitle = "This usually takes a few seconds.",
  statuses = DEFAULT_STATUSES,
  activeIndex,
  className = ""
}) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const isControlled = typeof activeIndex === "number";

  useEffect(() => {
    if (isControlled) return;
    setInternalActiveIndex(0);
    let index = 0;
    const interval = setInterval(() => {
      index = Math.min(index + 1, statuses.length - 1);
      setInternalActiveIndex(index);
    }, 1400);

    return () => clearInterval(interval);
  }, [title, subtitle, statuses, isControlled]);

  const currentIndex = isControlled ? activeIndex : internalActiveIndex;

  return (
    <div className={`allow-essential-motion rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 ${className}`}>
      <style>{`
        @keyframes aiStatusGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {statuses.map((status, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex && currentIndex < statuses.length;

          return (
            <div key={status} className="flex items-center gap-2 text-xs">
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="allow-spin w-3.5 h-3.5 text-indigo-500 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              )}
              <span className={isDone ? "text-emerald-700" : isActive ? "text-indigo-700 font-medium" : "text-gray-400"}>
                {status}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
        <div
          className="allow-ai-glow h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 opacity-90"
          style={{ animation: "aiStatusGlow 1.6s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}