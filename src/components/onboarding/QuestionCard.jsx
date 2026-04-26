import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

export default function QuestionCard({ question, options, value, onChange, multiSelect = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">{question}</h3>
      {multiSelect && (
        <p className="text-sm text-gray-500">Select all that apply</p>
      )}
      <div className={`space-y-2 ${multiSelect ? 'grid grid-cols-2 gap-2 space-y-0' : ''}`}>
        {options.map((option) => {
          const isSelected = multiSelect
            ? (value || []).includes(option.value)
            : value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (multiSelect) {
                  const current = value || [];
                  if (current.includes(option.value)) {
                    onChange(current.filter(v => v !== option.value));
                  } else {
                    onChange([...current, option.value]);
                  }
                } else {
                  onChange(option.value);
                }
              }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 text-gray-700'
              }`}
            >
              <div className="flex-shrink-0">
                {isSelected
                  ? <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  : <Circle className="w-5 h-5 text-gray-300" />
                }
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{option.description}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}