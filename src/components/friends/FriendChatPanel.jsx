import { useState, useRef, useCallback } from "react";
import { MessageCircle, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const RATE_LIMIT_MS = 3000;

export default function FriendChatPanel({ friendName, userEmail, messages, messageText, setMessageText, blockedWarning, onSend, isSending }) {
  const orderedMessages = [...messages].reverse();
  const lastSentRef = useRef(0);
  const [cooldown, setCooldown] = useState(false);

  const handleSend = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < RATE_LIMIT_MS) {
      setCooldown(true);
      setTimeout(() => setCooldown(false), RATE_LIMIT_MS - (now - lastSentRef.current));
      return;
    }
    lastSentRef.current = now;
    onSend();
  }, [onSend]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Messages with {friendName}</h2>
          <p className="text-sm text-gray-500 mt-1">Only educational messages are allowed, and profanity may be reported to admins.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
          <Shield className="w-3.5 h-3.5" /> AI filtered
        </div>
      </div>

      <div className="flex-1 min-h-[320px] rounded-2xl border border-gray-100 bg-white p-4 overflow-y-auto space-y-3">
        {orderedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <MessageCircle className="w-8 h-8 mb-2 text-indigo-300" />
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Say hi! Ask about homework, share study tips, or discuss upcoming tests.</p>
          </div>
        ) : (
          orderedMessages.map((message) => {
            const isMine = message.sender_email === userEmail;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p className="text-xs font-semibold mb-1 opacity-80">{isMine ? "You" : message.sender_name || friendName}</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-3 space-y-2">
        {blockedWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Message blocked: {blockedWarning}
          </div>
        )}
        <Textarea
          placeholder="Ask about homework, tests, notes, or study plans..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="min-h-[90px] border-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2">
          {cooldown && <span className="text-xs text-gray-400">Slow down — wait a moment</span>}
          <div className="ml-auto">
            <Button onClick={handleSend} disabled={isSending || cooldown || !messageText.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}