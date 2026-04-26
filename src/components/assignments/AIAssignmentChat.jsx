import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Mic, MicOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIProgressBar from "@/components/ai/AIProgressBar";
import { motion, AnimatePresence } from "framer-motion";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const SYSTEM_PROMPT = `You are a friendly assistant helping a student log their homework assignments.
Today's date is ${TODAY}.

Your job is to collect info about assignments through natural conversation.

For EACH assignment you need:
1. Name (REQUIRED)
2. Subject (REQUIRED)
3. Due date (REQUIRED — infer it smartly: "Friday" means the coming Friday, "next week" means 7 days from today, "tomorrow" means tomorrow, etc. NEVER ask the student to give a specific date format — just figure it out from context. Only ask "when is it due?" if they gave absolutely no time reference at all.)
4. Difficulty: easy, medium, or hard (if not mentioned, make a reasonable guess based on the assignment type and don't ask)
5. Estimated time in minutes (optional, skip if not mentioned)

Rules:
- Be conversational and very brief — like a helpful friend texting
- If the student gives multiple assignments at once, capture all of them
- Do NOT re-ask for info already provided in the conversation
- Only ask a follow-up if a REQUIRED field is truly missing and cannot be inferred
- Ask at most one follow-up question at a time
- When you have all required info for all mentioned assignments, output:

ASSIGNMENTS_READY:{"assignments":[{"name":"...","subject":"...","due_date":"YYYY-MM-DD","difficulty":"easy|medium|hard","time_estimate":null}]}

Only output ASSIGNMENTS_READY once — when truly done collecting everything.`;

export default function AIAssignmentChat({ onClose, onAssignmentsFound }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! Tell me about your assignments — you can list them all at once or one by one. I'll ask if I need any details! 📝" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.start();
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleDictation = () => {
    if (listening) stopDictation();
    else startDictation();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    const userMsg = { role: "user", content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const history = updated.map(m => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nConversation so far:\n${history}\n\nRespond as the assistant now.`
    });

    const reply = typeof result === "string" ? result : result.reply || "";

    // Parse ASSIGNMENTS_READY block if present
    const marker = "ASSIGNMENTS_READY:";
    const idx = reply.indexOf(marker);
    if (idx !== -1) {
      const jsonStr = reply.slice(idx + marker.length).trim();
      const cleanJson = jsonStr.split("\n")[0];
      const parsed = JSON.parse(cleanJson);
      const displayReply = reply.slice(0, idx).trim() || "Got it! Adding your assignments now ✅";
      setMessages(prev => [...prev, { role: "assistant", content: displayReply }]);
      setLoading(false);
      setTimeout(() => {
        onAssignmentsFound(parsed.assignments || []);
        onClose();
      }, 800);
      return;
    }

    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 overflow-hidden pointer-events-none" style={{ zIndex: 9999, top: "64px" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col pointer-events-auto"
        style={{ height: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Assignment Assistant</p>
              <p className="text-xs text-gray-400">Tell me your assignments naturally</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-sm">
                <AIProgressBar
                  title="Thinking through your assignments..."
                  subtitle="AI is organizing the details you shared."
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          {listening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-500 font-medium">Listening...</span>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type or tap 🎤 to speak..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={loading}
            />
            <button
              onClick={toggleDictation}
              title={listening ? "Stop" : "Dictate"}
              className={`p-2 rounded-xl transition-colors ${listening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}