import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIProgressBar from "@/components/ai/AIProgressBar";

export const LightningRound = ({ tests, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQuestions = async () => {
      const testsList = tests.slice(0, 3).map(t => `${t.name} (${t.subject})`).join(", ");
      if (!testsList) {
        setGameOver(true);
        setLoading(false);
        return;
      }

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 5 quick trivia questions about these upcoming tests: ${testsList}
          For each question, provide 4 multiple choice options.
          Format as JSON: [{"question":"?","options":["A","B","C","D"],"answer":0}]`,
          response_json_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    answer: { type: "number" }
                  }
                }
              }
            }
          }
        });
        setQuestions(result.questions || []);
      } catch (e) {
        console.error("MiniGames trivia generation failed:", e);
        setGameOver(true);
      } finally {
        setLoading(false);
      }
    };

    generateQuestions();
  }, [tests]);

  useEffect(() => {
    if (gameOver || loading || !questions.length) return;
    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        setGameOver(true);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, loading, questions]);

  const handleAnswer = (optionIdx) => {
    if (optionIdx === questions[currentIdx].answer) {
      setScore(score + 10);
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(10);
    } else {
      setGameOver(true);
    }
  };

  if (loading) return <AIProgressBar title="Building lightning round..." subtitle="AI is writing quick quiz questions." className="py-4" />;
  if (!questions.length) return <div className="text-center py-8 text-gray-400">No upcoming tests to quiz on!</div>;

  const current = questions[currentIdx];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-500">Score: {score}</div>
        <div className={`text-sm font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-indigo-500'}`}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {gameOver ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Game Over!</p>
          <p className="text-lg text-indigo-600 font-semibold mb-6">Final Score: {score}</p>
          <button
            onClick={() => { setCurrentIdx(0); setScore(0); setTimeLeft(10); setGameOver(false); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm"
          >
            <RotateCcw className="w-3 h-3 inline mr-2" /> Play Again
          </button>
        </motion.div>
      ) : (
        <motion.div key={currentIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-gray-500">Question {currentIdx + 1}/{questions.length}</p>
          <p className="text-base font-semibold text-gray-800">{current.question}</p>
          <div className="grid gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="p-3 text-left text-sm font-medium bg-gray-50 hover:bg-indigo-100 border border-gray-200 hover:border-indigo-300 rounded-lg transition-colors"
              >
                {String.fromCharCode(65 + i)}: {opt}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const MemoryMatch = ({ tests, onClose }) => {
  const [pairs, setPairs] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generatePairs = async () => {
      const testsList = tests.slice(0, 2).map(t => `${t.name} (${t.subject})`).join(", ");
      if (!testsList) {
        setLoading(false);
        return;
      }

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 6 pairs of related study concepts for these tests: ${testsList}
          Each pair should be (term, definition) or (concept, example).
          Format as JSON: [{"term":"X","definition":"Y"},...]`,
          response_json_schema: {
            type: "object",
            properties: {
              pairs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const shuffled = [];
        (result.pairs || []).forEach(p => {
          shuffled.push({ id: Math.random(), text: p.term, type: 'term', pair: shuffled.length });
          shuffled.push({ id: Math.random(), text: p.definition, type: 'def', pair: shuffled.length - 1 });
        });
        setPairs(shuffled.sort(() => Math.random() - 0.5));
      } catch (e) {
        console.error("MiniGames memory match generation failed:", e);
      } finally {
        setLoading(false);
      }
    };

    generatePairs();
  }, [tests]);

  const handleFlip = (idx) => {
    if (matched.has(idx) || flipped.size >= 2) return;
    const newFlipped = new Set(flipped);
    newFlipped.add(idx);
    setFlipped(newFlipped);

    if (flipped.size === 1) {
      const [first] = Array.from(flipped);
      setTimeout(() => {
        if (pairs[first].pair === idx) {
          setMatched(new Set([...matched, first, idx]));
        }
        setFlipped(new Set());
      }, 600);
    }
  };

  if (loading) return <AIProgressBar title="Building memory match..." subtitle="AI is pairing terms and definitions." className="py-4" />;
  if (!pairs.length) return <div className="text-center py-8 text-gray-400">No tests available!</div>;

  const isComplete = matched.size === pairs.length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Memory Match</p>
          <p className="text-xs text-gray-500 mt-0.5">Match each term with its definition.</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-400">Progress</p>
          <p className="text-sm font-semibold text-gray-700">{matched.size / 2}/{pairs.length / 2}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {pairs.map((pair, i) => (
          <motion.button
            key={i}
            onClick={() => handleFlip(i)}
            className={`min-h-[96px] rounded-2xl border p-3 text-xs sm:text-sm leading-snug transition-all ${
              matched.has(i)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                : flipped.has(i)
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50'
            }`}
            disabled={matched.has(i)}
            whileHover={matched.has(i) ? {} : { scale: 1.03 }}
          >
            <div className="flex h-full items-center justify-center text-center break-words">
              {flipped.has(i) || matched.has(i) ? pair.text : <span className="text-lg font-semibold">?</span>}
            </div>
          </motion.button>
        ))}
      </div>

      {isComplete && (
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
        >
          <RotateCcw className="w-3 h-3 inline mr-2" /> Play Again
        </button>
      )}
    </div>
  );
};

export const TermGuesser = ({ tests, onClose }) => {
  const [term, setTerm] = useState("");
  const [hint, setHint] = useState("");
  const [guesses, setGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateTerm = async () => {
      const testsList = tests.slice(0, 2).map(t => `${t.name}`).join(", ");
      if (!testsList) {
        setGameOver(true);
        setLoading(false);
        return;
      }

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Pick ONE important vocabulary term from these tests: ${testsList}
          Provide the term and a helpful hint (without giving it away).
          Format: {"term":"WORD","hint":"clue"}`,
          response_json_schema: {
            type: "object",
            properties: {
              term: { type: "string" },
              hint: { type: "string" }
            }
          }
        });
        setTerm(result.term || "");
        setHint(result.hint || "");
      } catch (e) {
        console.error("MiniGames vocab term generation failed:", e);
        setGameOver(true);
      } finally {
        setLoading(false);
      }
    };

    generateTerm();
  }, [tests]);

  const handleGuess = () => {
    if (userGuess.toLowerCase() === term.toLowerCase()) {
      setWon(true);
      setGameOver(true);
    } else {
      setGuesses(guesses + 1);
      if (guesses >= 4) {
        setGameOver(true);
      }
      setUserGuess("");
    }
  };

  if (loading) return <AIProgressBar title="Picking a term..." subtitle="AI is choosing a clue for your guessing game." className="py-4" />;

  return (
    <div className="space-y-4">
      {!gameOver ? (
        <>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Guesses: {guesses}/5</p>
            <p className="text-sm font-semibold text-indigo-600">{Math.max(0, 5 - guesses)} left</p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <p className="text-sm text-gray-600 mb-2">💡 Hint:</p>
            <p className="font-semibold text-gray-800">{hint}</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={userGuess}
              onChange={e => setUserGuess(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGuess()}
              placeholder="Enter your guess..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            <button
              onClick={handleGuess}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              Guess
            </button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          {won ? (
            <>
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-xl font-bold text-gray-800 mb-2">Correct!</p>
              <p className="text-lg text-emerald-600 font-semibold">The answer was: <span className="uppercase">{term}</span></p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">😅</div>
              <p className="text-xl font-bold text-gray-800 mb-2">Game Over!</p>
              <p className="text-lg text-orange-600 font-semibold mb-3">The answer was: <span className="uppercase">{term}</span></p>
              <p className="text-sm text-gray-600 mb-4">Keep studying — you'll get it next time!</p>
            </>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            <RotateCcw className="w-3 h-3 inline mr-2" /> Try Another
          </button>
        </motion.div>
      )}
    </div>
  );
};