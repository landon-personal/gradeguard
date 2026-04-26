import { useState } from "react";
import { X, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import AIProgressBar from "@/components/ai/AIProgressBar";

const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Foreign Language", "Art", "Physical Education", "Computer Science", "Music", "Other"];

export default function TestForm({ test, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    name: test?.name || "",
    subject: test?.subject || "",
    test_date: test?.test_date || "",
    topics: test?.topics || "",
    difficulty: test?.difficulty || "",
    notes: test?.notes || "",
    share_with_friends: test ? (test.share_with_friends ?? true) : true
  });
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleAISuggest = async () => {
    if (!form.name || !form.subject) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `A middle/high school student has a test called "${form.name}" for "${form.subject}".
Suggest:
1. Expected difficulty (easy, medium, or hard)
2. Key topics they should study (as a short comma-separated list, max 6 topics)`,
      response_json_schema: {
        type: "object",
        properties: {
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          topics: { type: "string" }
        }
      }
    });
    setForm(prev => ({
      ...prev,
      difficulty: result.difficulty || prev.difficulty,
      topics: prev.topics || result.topics || prev.topics
    }));
    setAiLoading(false);
  };

  const isValid = form.name && form.subject && form.test_date;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{test ? 'Edit Test' : 'Add Upcoming Test'}</h3>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Test Name *</Label>
            <Input
              placeholder="e.g. Chapter 5 Quiz, Midterm Exam"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Subject *</Label>
            <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Test Date *</Label>
            <Input
              type="date"
              value={form.test_date}
              onChange={e => setForm({ ...form, test_date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium text-gray-700">What's it on? (topics covered)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={!form.name || !form.subject || aiLoading}
                className="gap-1.5 border-purple-200 text-purple-600 hover:bg-purple-50 text-xs h-7"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? "..." : "AI Suggest"}
              </Button>
            </div>
            <Textarea
              placeholder="e.g. Quadratic equations, graphing parabolas, factoring..."
              value={form.topics}
              onChange={e => setForm({ ...form, topics: e.target.value })}
              className="resize-none"
              rows={2}
            />
            {aiLoading && (
              <AIProgressBar
                title="Generating test suggestions..."
                subtitle="AI is filling in likely topics and difficulty."
                className="mt-3"
              />
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Expected Difficulty</Label>
            <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Extra Notes (optional)</Label>
            <Input
              placeholder="e.g. Open book, 50 mins long..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Share with Friends</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, share_with_friends: !form.share_with_friends })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.share_with_friends ? "bg-purple-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.share_with_friends ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-500">{form.share_with_friends ? "Friends can view this test" : "Only you can view this test"}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading || !isValid} className="bg-purple-600 hover:bg-purple-700">
            {isLoading ? 'Saving...' : test ? 'Update Test' : 'Add Test'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}