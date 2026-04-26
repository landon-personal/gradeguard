import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Splits text into math and non-math segments and renders accordingly
function MathRenderer({ text }) {
  // Match block math $$...$$ first, then inline math $...$
  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("$$")) {
      parts.push({ type: "block", content: raw.slice(2, -2).trim() });
    } else {
      parts.push({ type: "inline", content: raw.slice(1, -1).trim() });
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "block") return <BlockMath key={i} math={part.content} />;
        if (part.type === "inline") return <InlineMath key={i} math={part.content} />;
        return <span key={i}>{part.content}</span>;
      })}
    </>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <motion.div
        className={`relative mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
            : "bg-white text-indigo-600 shadow-lg shadow-indigo-200/60 ring-1 ring-white/80"
        }`}
        animate={isUser ? undefined : { scale: [1, 1.06, 1], rotate: [0, -4, 4, 0] }}
        transition={isUser ? undefined : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        {!isUser && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />}
      </motion.div>

      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${isUser ? "text-indigo-500" : "text-slate-400"}`}>
          {isUser ? "You" : "AI tutor"}
        </div>

        <div
          className={`relative overflow-hidden rounded-[24px] border px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "rounded-tr-[8px] border-indigo-400/30 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-500/20"
              : "rounded-tl-[8px] border-white/70 bg-white/82 text-slate-800 shadow-[0_12px_32px_rgba(99,102,241,0.08)] backdrop-blur-xl"
          }`}
        >
          {!isUser && <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-indigo-100/70 via-violet-50/55 to-sky-50/45" />}

          <div className="relative">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-slate-900 prose-headings:text-slate-900">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p>
                        {typeof children === "string" ? <MathRenderer text={children} /> : children}
                      </p>
                    ),
                    li: ({ children }) => (
                      <li>
                        {typeof children === "string" ? <MathRenderer text={children} /> : children}
                      </li>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}