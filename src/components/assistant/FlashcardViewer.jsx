import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Download } from "lucide-react";
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

export default function FlashcardViewer({ cards, testName, onClose }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(1);

  const goTo = (next) => {
    setDirection(next > index ? 1 : -1);
    setFlipped(false);
    setTimeout(() => setIndex(next), 50);
  };

  const handleExport = () => {
    const text = cards.map((c, i) => `Card ${i + 1}\nQ: ${c.front}\nA: ${c.back}\n`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testName}-flashcards.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = cards[index];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-700">📇 Flashcards — {testName}</span>
        <span className="text-xs text-gray-400">{index + 1} / {cards.length}</span>
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped(f => !f)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`rounded-xl p-5 min-h-[120px] flex flex-col items-center justify-center text-center shadow-sm border ${
              flipped
                ? "bg-indigo-600 text-white border-indigo-400"
                : "bg-white text-gray-800 border-gray-200"
            }`}
          >
            <div className="text-xs font-medium mb-2 opacity-60 uppercase tracking-wide">
              {flipped ? "Answer" : "Question"}
            </div>
            <div className="text-sm font-medium leading-relaxed">
              <MathText text={flipped ? card.back : card.front} />
            </div>
            {!flipped && (
              <div className="text-xs text-gray-400 mt-3">tap to reveal answer</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline" size="sm"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => goTo(index + 1)}
            disabled={index === cards.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}