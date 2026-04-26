import { useState } from "react";
import { X, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import AIProgressBar from "@/components/ai/AIProgressBar";


const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Foreign Language", "Art", "Physical Education", "Computer Science", "Music", "Other"];

export default function AssignmentForm({ assignment, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    name: assignment?.name || "",
    subject: assignment?.subject || "",
    due_date: assignment?.due_date || "",
    difficulty: assignment?.difficulty || "",
    weight: assignment?.weight || "",
    time_estimate: assignment?.time_estimate || "",
    notes: assignment?.notes || "",
    is_recurring: assignment?.is_recurring || false,
    recurrence_frequency: assignment?.recurrence_frequency || "",
    share_with_friends: assignment ? (assignment.share_with_friends ?? true) : true
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      time_estimate: form.time_estimate ? Number(form.time_estimate) : undefined,
      recurrence_frequency: form.is_recurring ? form.recurrence_frequency : undefined
    });
  };

  const handleAISuggest = async () => {
    if (!form.name) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `A middle/high school student has an assignment named: "${form.name}"${form.subject ? ` for subject: "${form.subject}"` : ""}.

Suggest:
1. The subject category (pick the best match from: ${SUBJECTS.join(", ")})
2. Difficulty level (easy, medium, or hard) based on typical assignment complexity
3. Estimated time to complete in minutes

Be realistic for a middle/high school student.`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          time_estimate: { type: "number" }
        }
      }
    });
    setForm(prev => ({
      ...prev,
      subject: prev.subject || result.subject || prev.subject,
      difficulty: result.difficulty || prev.difficulty,
      time_estimate: result.time_estimate || prev.time_estimate
    }));
    setAiSuggested(true);
    setAiLoading(false);
  };

  const isValid = form.name && form.subject && form.due_date;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900">
            {assignment ? 'Edit Assignment' : 'Add New Assignment'}
          </h3>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Assignment Name *</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="e.g. Chapter 5 Math Worksheet"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setAiSuggested(false); }}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={!form.name || aiLoading}
                className="shrink-0 gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? "..." : aiSuggested ? "Re-suggest" : "AI Suggest"}
              </Button>
            </div>
            {aiLoading && (
              <AIProgressBar
                title="Generating assignment suggestions..."
                subtitle="AI is estimating the subject, difficulty, and time needed."
                className="mt-3"
              />
            )}
            {aiSuggested && !aiLoading && (
              <p className="text-xs text-indigo-500 mt-1">✨ AI filled in subject, difficulty & time estimate</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Subject *</Label>
            <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Due Date *</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Difficulty</Label>
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
            <Label className="text-sm font-medium text-gray-700">Weight</Label>
            <Select value={form.weight} onValueChange={v => setForm({ ...form, weight: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepare">Prepare (20%)</SelectItem>
                <SelectItem value="rehearse">Rehearse (30%)</SelectItem>
                <SelectItem value="perform">Perform (50%)</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="not_a_grade">Not a Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Time Estimate (minutes)</Label>
            <Input
              type="number"
              placeholder="e.g. 60"
              value={form.time_estimate}
              onChange={e => setForm({ ...form, time_estimate: e.target.value })}
              min={1}
              className="mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Recurring Assignment</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_recurring: !form.is_recurring })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_recurring ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_recurring ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-500">{form.is_recurring ? "Yes – repeats automatically" : "No"}</span>
            </div>
          </div>

          {form.is_recurring && (
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Repeat Frequency</Label>
              <Select value={form.recurrence_frequency} onValueChange={v => setForm({ ...form, recurrence_frequency: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Share with Friends</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, share_with_friends: !form.share_with_friends })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.share_with_friends ? "bg-indigo-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.share_with_friends ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-500">{form.share_with_friends ? "Friends can view this assignment" : "Only you can view this assignment"}</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes, instructions, or details..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? 'Saving...' : assignment ? 'Update Assignment' : 'Add Assignment'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}