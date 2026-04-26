import { useState, useRef } from "react";
import { Camera, X, Loader2, CheckCircle, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIProgressBar from "@/components/ai/AIProgressBar";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartScanModal({ onClose, onAssignmentsFound }) {
  const [step, setStep] = useState("upload"); // upload | scanning | results | clarifying
  const [imageUrl, setImageUrl] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [clarifyingIndex, setClarifyingIndex] = useState(0);
  const [clarifyingField, setClarifyingField] = useState(null);
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarifyingAnswer, setClarifyingAnswer] = useState("");
  const [loadingClarify, setLoadingClarify] = useState(false);
  const fileRef = useRef(null);

  // Returns the first assignment + field that needs clarification
  const findMissing = (list) => {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.due_date) return { index: i, field: "due_date", question: `When is "${a.name}" due? (e.g. "Friday", "March 10")` };
      if (!a.subject) return { index: i, field: "subject", question: `What subject is "${a.name}" for?` };
    }
    return null;
  };

  const getMissingCount = (list, startIndex = 0) =>
    list.slice(startIndex).reduce((count, assignment) => {
      if (!assignment.due_date) return count + 1;
      if (!assignment.subject) return count + 1;
      return count;
    }, 0);

  const handleFile = async (file) => {
    if (!file) return;
    setStep("scanning");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);

    const result = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5",
      prompt: `You are scanning a student's agenda, homework planner, or assignment sheet. 
Extract all assignments you can see. For each one, identify:
- Assignment name (required)
- Subject/course (if visible)
- Due date (if visible, in YYYY-MM-DD format; if a day like "Monday" is mentioned, use today's date as reference: ${new Date().toISOString().split("T")[0]})
- Difficulty (easy/medium/hard — guess based on assignment type)
- Estimated time in minutes

Return only what you can clearly infer. If info is missing, leave it null.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                subject: { type: "string" },
                due_date: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                time_estimate: { type: "number" }
              },
              required: ["name"]
            }
          }
        }
      }
    });

    const found = result.assignments || [];
    setAssignments(found);
    setSelected(found.map((_, i) => i));

    const missing = findMissing(found);
    if (missing) {
      setClarifyingIndex(missing.index);
      setClarifyingField(missing.field);
      setClarifyingQuestion(missing.question);
      setClarifyingAnswer("");
      setStep("clarifying");
    } else {
      setStep("results");
    }
  };

  const handleClarifySubmit = async () => {
    if (!clarifyingAnswer.trim()) return;
    setLoadingClarify(true);

    // Use AI to parse the user's answer into the correct field value
    let parsed = clarifyingAnswer.trim();
    if (clarifyingField === "due_date") {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gpt_5",
        prompt: `Today is ${new Date().toISOString().split("T")[0]}. The student said the due date is: "${clarifyingAnswer}". Convert this to a YYYY-MM-DD date string. Return only the date.`,
        response_json_schema: { type: "object", properties: { date: { type: "string" } } }
      });
      parsed = res.date || clarifyingAnswer;
    }

    const updated = assignments.map((a, i) =>
      i === clarifyingIndex ? { ...a, [clarifyingField]: parsed } : a
    );
    setAssignments(updated);

    const missing = findMissing(updated);
    if (missing) {
      setClarifyingIndex(missing.index);
      setClarifyingField(missing.field);
      setClarifyingQuestion(missing.question);
      setClarifyingAnswer("");
    } else {
      setStep("results");
    }
    setLoadingClarify(false);
  };

  const toggleSelect = (i) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleAdd = () => {
    const toAdd = assignments.filter((_, i) => selected.includes(i));
    onAssignmentsFound(toAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Smart Scan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a photo of your agenda or planner</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                >
                  <Camera className="w-10 h-10 text-indigo-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Tap to upload a photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or HEIC</p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handleFile(e.target.files?.[0])}
                />
              </motion.div>
            )}

            {step === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
                <AIProgressBar
                  title="Reading your planner..."
                  subtitle="AI is extracting assignments from your photo."
                />
              </motion.div>
            )}

            {step === "clarifying" && (
              <motion.div key="clarifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-4 py-2"
              >
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5" />
                  Filling in missing info ({getMissingCount(assignments, clarifyingIndex)} left)
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800">{clarifyingQuestion}</p>
                </div>
                {loadingClarify && (
                  <AIProgressBar
                    title="Updating assignment details..."
                    subtitle="AI is converting your answer into the right format."
                  />
                )}
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Your answer..."
                    value={clarifyingAnswer}
                    onChange={e => setClarifyingAnswer(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleClarifySubmit()}
                    autoFocus
                  />
                  <button
                    onClick={handleClarifySubmit}
                    disabled={!clarifyingAnswer.trim() || loadingClarify}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors"
                  >
                    {loadingClarify ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => setStep("results")}
                  className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors"
                >
                  Skip remaining questions
                </button>
              </motion.div>
            )}

            {step === "results" && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {assignments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No assignments found. Try a clearer photo.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">
                      Found {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}. Select which to add:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {assignments.map((a, i) => (
                        <div
                          key={i}
                          onClick={() => toggleSelect(i)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selected.includes(i)
                              ? "border-indigo-400 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selected.includes(i) ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                            }`}>
                              {selected.includes(i) && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[a.subject, a.due_date, a.difficulty].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAdd}
                      disabled={selected.length === 0}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                    >
                      Add {selected.length} Assignment{selected.length !== 1 ? "s" : ""}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}