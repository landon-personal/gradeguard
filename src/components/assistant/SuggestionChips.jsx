import { BookOpen, ClipboardList } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  "Help me break down a big assignment",
  "How should I study for an upcoming test?",
  "Explain the Pomodoro technique",
  "I'm struggling with a hard concept",
  "Help me prioritize my assignments",
];

export default function SuggestionChips({ onSelect, assignments = [], tests = [], compact = false, onFlashcards, onQuiz }) {
  const assignmentChips = assignments.slice(0, 2).map(a =>
    `Help me get started on "${a.name}"`
  );

  const chips = assignmentChips.length > 0
    ? [...assignmentChips, ...DEFAULT_SUGGESTIONS.slice(0, compact ? 1 : 2)]
    : DEFAULT_SUGGESTIONS.slice(0, compact ? 3 : 5);

  const upcomingTests = tests.slice(0, 2);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          {chip}
        </button>
      ))}

      {!compact && upcomingTests.map((test) => (
        <div key={test.id} className="flex gap-1.5">
          {onFlashcards && (
            <button
              onClick={() => onFlashcards(test)}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Flashcards for {test.name}
            </button>
          )}
          {onQuiz && (
            <button
              onClick={() => onQuiz(test)}
              className="text-xs px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <ClipboardList className="w-3 h-3" />
              Quiz me on {test.name}
            </button>
          )}
        </div>
      ))}

      {compact && upcomingTests.slice(0, 1).map((test) => (
        <div key={test.id} className="flex gap-1.5">
          {onFlashcards && (
            <button
              onClick={() => onFlashcards(test)}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Flashcards: {test.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}