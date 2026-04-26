import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Send, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklySummaryButton() {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!recipientEmail.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke('weeklySummaryEmail', {
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim()
      });
      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setSent(true);
        setTimeout(() => {
          setOpen(false);
          setSent(false);
          setRecipientEmail("");
          setRecipientName("");
        }, 2500);
      }
    } catch (e) {
      setError(e?.message || "Couldn't send the summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
      >
        <Mail className="w-4 h-4" />
        Share Weekly Summary
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
              <button
                onClick={() => !loading && setOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>

              {sent ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800 text-lg">Summary sent!</h3>
                  <p className="text-sm text-gray-400 mt-1">Check their inbox shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Send Weekly Summary</h3>
                      <p className="text-xs text-gray-400">AI-generated report of this week's progress</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Recipient's name (optional)</label>
                      <Input
                        placeholder="e.g. Mom, Mr. Smith"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Recipient's email *</label>
                      <Input
                        type="email"
                        placeholder="parent@email.com"
                        value={recipientEmail}
                        onChange={e => { setRecipientEmail(e.target.value); setError(""); }}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                      />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={!recipientEmail.trim() || loading}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    {loading ? (
                      <>Generating & sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Summary</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}