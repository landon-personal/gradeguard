import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

function MathText({ text }) {
  if (!text) return null;
  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    const raw = match[0];
    if (raw.startsWith("$$")) parts.push({ type: "block", content: raw.slice(2, -2).trim() });
    else parts.push({ type: "inline", content: raw.slice(1, -1).trim() });
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });
  return (
    <>
      {parts.map((p, i) =>
        p.type === "block" ? <BlockMath key={i} math={p.content} /> :
        p.type === "inline" ? <InlineMath key={i} math={p.content} /> :
        <span key={i}>{p.content}</span>
      )}
    </>
  );
}

export default function QuizRunner({ questions, testName, subject, difficulty, onFinish, onResults }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [done, setDone] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const q = questions[index];
  const isCorrect = selected === q?.correct_index;

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswer = { correct: selected === q.correct_index, question: q.question, selected };
    const updatedAnswers = [...answers, newAnswer];

    if (index + 1 >= questions.length) {
      const wrongQs = updatedAnswers.filter(a => !a.correct).map(a => a.question);
      const correctCount = updatedAnswers.filter(a => a.correct).length;
      const pct = Math.round((correctCount / questions.length) * 100);
      setAnswers(updatedAnswers);
      if (onResults) onResults({ score_pct: pct, correct_count: correctCount, wrong_questions: wrongQs });
      setDone(true);
      return;
    }

    setAnswers(updatedAnswers);
    setSelected(null);
    setShowExplanation(false);
    setIndex(i => i + 1);
  };

  const score = answers.filter(a => a.correct).length;

  if (done) {
    const completedAnswers = answers;
    const finalScore = score;
    const pct = Math.round((finalScore / questions.length) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "💪";
    const wrongAnswers = completedAnswers
      .map((a, i) => ({ ...a, index: i, question: questions[i] }))
      .filter(a => !a.correct);
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
        <div className="text-center">
          <div className="text-4xl mb-2">{emoji}</div>
          <div className="text-lg font-bold text-gray-800">{finalScore}/{questions.length} correct ({pct}%)</div>
          <div className="text-sm text-gray-500 mt-1">
            {pct >= 80 ? "Great job! You're well prepared." : pct >= 60 ? "Good effort — review the ones you missed." : "Keep studying — you'll get there!"}
          </div>
        </div>
        <div className="space-y-2">
          {completedAnswers.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${a.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {a.correct ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span className="line-clamp-2">{a.question}</span>
            </div>
          ))}
        </div>

        {/* Review wrong answers */}
        {wrongAnswers.length > 0 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReview(v => !v)}
              className="w-full gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              {showReview ? "Hide Review" : `Review ${wrongAnswers.length} Wrong Answer${wrongAnswers.length > 1 ? "s" : ""}`}
            </Button>
            {showReview && (
              <div className="mt-3 space-y-3">
                {wrongAnswers.map((wa) => {
                  const q = wa.question;
                  return (
                    <div key={wa.index} className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-800"><MathText text={q.question} /></p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2 py-1.5 rounded-lg ${
                            oi === q.correct_index ? "bg-green-100 text-green-700 font-medium" :
                            oi === completedAnswers[wa.index]?.selected ? "bg-red-100 text-red-600 line-through" :
                            "text-gray-500"
                          }`}>
                            <span className="font-medium mr-1">{String.fromCharCode(65 + oi)}.</span>
                            <MathText text={opt} />
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-amber-700 mt-1">
                          <span className="font-semibold">Why: </span><MathText text={q.explanation} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onFinish && (
          <Button onClick={onFinish} variant="outline" size="sm" className="w-full">Done</Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-700">📝 Quiz — {testName}</span>
        <span className="text-xs text-gray-400">{index + 1} / {questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <p className="text-sm font-medium text-gray-800 leading-relaxed"><MathText text={q.question} /></p>

          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let style = "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700";
              if (selected !== null) {
                if (i === q.correct_index) style = "border-green-400 bg-green-50 text-green-700 font-medium";
                else if (i === selected && !isCorrect) style = "border-red-400 bg-red-50 text-red-600";
                else style = "border-gray-200 bg-gray-50 text-gray-400";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-xl border transition-colors ${style}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs p-3 rounded-xl ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
            >
              <span className="font-semibold">{isCorrect ? "✅ Correct! " : "❌ Not quite. "}</span>
              <MathText text={q.explanation} />
            </motion.div>
          )}

          {selected !== null && (
            <Button onClick={handleNext} size="sm" className="w-full gap-1 bg-indigo-600 hover:bg-indigo-700">
              {index + 1 >= questions.length ? "See Results" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}