import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Lightbulb, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AIProgressBar from "@/components/ai/AIProgressBar";
import TodoItemCard from "./TodoItemCard";

const PAGE_SIZE = 5;

const FEEDBACK_OPTIONS = [
  { value: "too_easy", emoji: "😴", label: "Too easy" },
  { value: "just_right", emoji: "👍", label: "Just right" },
  { value: "too_much", emoji: "😅", label: "Too much" },
];

export default function SmartTodoList({ todoList, isLoading, onComplete, onQuiz, hideHeader, userEmail, onFeedback, aiStatuses, aiStageIndex }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const now = new Date();
  const todayKey = `gg_plan_feedback_${userEmail}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [feedback, setFeedback] = useState(() => localStorage.getItem(todayKey) || null);
  const [confirmed, setConfirmed] = useState(!!localStorage.getItem(todayKey));

  const handleFeedback = (value) => {
    setFeedback(value);
    setConfirmed(true);
    localStorage.setItem(todayKey, value);
    if (onFeedback) onFeedback(value);
  };
  if (isLoading) {
    return (
      <div className="space-y-4">
        <AIProgressBar
          title="Generating your study plan..."
          subtitle="AI is analyzing your assignments and priorities."
          statuses={aiStatuses || ["Preparing tasks", "Analyzing workload", "Generating plan", "Formatting plan"]}
          activeIndex={typeof aiStageIndex === "number" ? aiStageIndex : undefined}
        />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!todoList?.items?.length) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">✨</div>
        <h3 className="font-semibold text-gray-800 mb-1">Your study plan is getting ready</h3>
        <p className="text-sm text-gray-400">If it doesn’t appear in a moment, tap refresh.</p>
      </div>
    );
  }

  const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
  const sortedItems = [...todoList.items].sort(
    (a, b) => (urgencyOrder[a.urgency_level] ?? 1) - (urgencyOrder[b.urgency_level] ?? 1)
  );

  return (
    <div className="space-y-4">
      {/* Header — only shown when not inside the featured card */}
      {!hideHeader && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Your AI Study Plan</h2>
            <p className="text-xs text-gray-500">Personalized based on your study preferences</p>
          </div>
        </div>
      )}

      {/* Stale data indicator */}
      {todoList?.generated_at ? (
        <p className="text-[10px] text-gray-300 text-right">
          Generated {(() => {
            const mins = Math.round((Date.now() - new Date(todoList.generated_at).getTime()) / 60000);
            return mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
          })()}
        </p>
      ) : null}

      {/* Daily tip */}
      {todoList.daily_tip && (
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{todoList.daily_tip}</p>
        </div>
      )}

      {/* To-do items */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedItems.slice(0, visibleCount).map((item, index) => (
            <TodoItemCard
              key={item.source_id || `${item.type}-${item.assignment_name}-${item.subject}-${index}`}
              item={item}
              rank={index + 1}
              onComplete={() => onComplete(item)}
              onQuiz={() => onQuiz?.(item)}
            />
          ))}
        </AnimatePresence>
      </div>

      {visibleCount < sortedItems.length && (
        <Button
          variant="outline"
          onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          className="w-full gap-2 text-gray-500 border-gray-200 hover:bg-gray-50"
        >
          <ChevronDown className="w-4 h-4" />
          Load more ({sortedItems.length - visibleCount} remaining)
        </Button>
      )}

      {/* Feedback bar */}
      <div className="pt-2 border-t border-gray-100 mt-2">
        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.p
              key="confirmed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center text-gray-400"
            >
              {feedback === "too_easy" && "Got it — I'll push you harder next time! 💪"}
              {feedback === "just_right" && "Awesome! I'll keep the same intensity 🎯"}
              {feedback === "too_much" && "Noted — I'll ease up on tomorrow's plan 😌"}
            </motion.p>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="text-xs text-gray-400 mr-1">How's this plan?</span>
              {FEEDBACK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFeedback(opt.value)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
                >
                  <span>{opt.emoji}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}