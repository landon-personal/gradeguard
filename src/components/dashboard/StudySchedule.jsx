import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Calendar, Clock, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/base44Client";
import { differenceInDays } from "date-fns";
import { parseLocalDate } from "../utils/dateUtils";

const URGENCY_COLORS = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

function ScheduleBlock({ block, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
    >
      <div className="flex flex-col items-center min-w-[56px]">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1 whitespace-nowrap">{block.time_slot}</span>
        <div className="flex-1 w-px bg-gray-200 my-1" />
        <span className="text-xs text-gray-400">{block.duration_minutes}m</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{block.task}</p>
            <p className="text-xs text-gray-500 mt-0.5">{block.subject}</p>
          </div>
          {block.urgency && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${URGENCY_COLORS[block.urgency] || URGENCY_COLORS.Low}`}>
              {block.urgency}
            </span>
          )}
        </div>
        {block.description && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{block.description}</p>
        )}
      </div>
    </motion.div>
  );
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function StudySchedule({ assignments, tests, profile, school }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [history, setHistory] = useState([]);

  // Auto-generate when assignments/tests change (after first load)
  const dataKey = JSON.stringify([
    assignments.map(a => `${a.id}:${a.status}:${a.due_date}:${a.updated_date}`).sort(),
    tests.map(t => `${t.id}:${t.test_date}:${t.updated_date}`).sort()
  ]);
  const prevDataKey = useRef(null);

  useEffect(() => {
    if (!profile || assignments.length === 0) return;
    if (prevDataKey.current === null) {
      // First load — auto-generate
      prevDataKey.current = dataKey;
      generateSchedule();
    } else if (prevDataKey.current !== dataKey) {
      // Data changed — regenerate
      prevDataKey.current = dataKey;
      generateSchedule();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, profile]);

  const buildContext = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weightLabel = { prepare: "20% (low stakes)", rehearse: "30% (mid stakes)", perform: "50% (high stakes)" };

    const pendingAssignments = assignments.filter(a => a.status !== 'completed');
    const assignmentsContext = pendingAssignments.map(a => ({
      name: a.name,
      subject: a.subject,
      due_date: a.due_date,
      days_until_due: differenceInDays(parseLocalDate(a.due_date), today),
      difficulty: a.difficulty,
      time_estimate: a.time_estimate,
      weight: a.weight ? weightLabel[a.weight] : "unspecified"
    }));

    const testsContext = tests.map(t => ({
      name: t.name,
      subject: t.subject,
      test_date: t.test_date,
      days_until_test: differenceInDays(parseLocalDate(t.test_date), today),
      topics: t.topics || "not specified",
      difficulty: t.difficulty || "unknown"
    }));

    const studentContext = {
      study_time: profile.study_time,
      break_frequency: profile.break_frequency,
      session_length: profile.session_length,
      deadline_approach: profile.deadline_approach,
      easiest_subjects: profile.easiest_subjects,
      hardest_subjects: profile.hardest_subjects,
      learning_style: profile.learning_style,
    };

    return { assignmentsContext, testsContext, studentContext, today };
  };

  const generateSchedule = async (adjustmentNote = null) => {
    if (!profile) return;
    if (adjustmentNote) setAdjusting(true);
    else setLoading(true);

    const { assignmentsContext, testsContext, studentContext, today } = buildContext();

    const schoolHoursSection = school?.school_hours_start && school?.school_hours_end
      ? `\nSchool hours: ${formatTime(school.school_hours_start)} to ${formatTime(school.school_hours_end)}. Do NOT schedule study blocks during school hours EXCEPT during the study hall/advisory period below.`
      : "";

    const studyHallSection = school?.study_hall_start && school?.study_hall_end
      ? `\nStudy Hall / Advisory period: ${formatTime(school.study_hall_start)} to ${formatTime(school.study_hall_end)}. This IS an allowed study window even though it falls during school hours.`
      : "";

    const adjustmentSection = adjustmentNote
      ? `\n\nThe student has requested the following adjustment to the schedule:\n"${adjustmentNote}"\n\nPlease regenerate the schedule incorporating this change.`
      : "";

    const previousScheduleSection = schedule
      ? `\n\nPrevious schedule for reference:\n${JSON.stringify(schedule.blocks, null, 2)}`
      : "";

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert academic coach creating a personalized daily study schedule for a middle/high school student.

Student preferences:
${JSON.stringify(studentContext, null, 2)}

Pending assignments:
${JSON.stringify(assignmentsContext, null, 2)}

Upcoming tests:
${JSON.stringify(testsContext, null, 2)}

Today's date: ${today.toISOString().split('T')[0]}
${schoolHoursSection}${studyHallSection}
${previousScheduleSection}${adjustmentSection}

Create a realistic, hour-by-hour study schedule for TODAY.
- Start around the student's preferred study time (morning/afternoon/evening/night).
- Include short breaks based on their break_frequency preference.
- Prioritize by urgency (days until due) and weight (perform > rehearse > prepare).
- Be specific with time slots (e.g. "3:30 PM").
- Include a brief tip for the day.
- IMPORTANT: Only schedule study/homework sessions for the assignments and tests listed above. Do NOT invent or reference classes, lectures, or school periods that are not in the data provided. Do not say things like "get ready for X class" — you do not know the student's class schedule.`,
      response_json_schema: {
        type: "object",
        properties: {
          blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time_slot: { type: "string" },
                duration_minutes: { type: "number" },
                task: { type: "string" },
                subject: { type: "string" },
                urgency: { type: "string", enum: ["High", "Medium", "Low"] },
                description: { type: "string" }
              }
            }
          },
          daily_tip: { type: "string" }
        }
      }
    });

    setSchedule(result);
    if (adjustmentNote) {
      setHistory(prev => [...prev, adjustmentNote]);
      setAdjustment("");
    }
    setLoading(false);
    setAdjusting(false);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustment.trim()) return;
    generateSchedule(adjustment.trim());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center animate-pulse">
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Building your schedule...</p>
            <p className="text-xs text-gray-400">AI is crafting a personalized day plan</p>
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex gap-4">
            <Skeleton className="h-16 w-14 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!schedule && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-900 text-lg">Dynamic Study Schedule</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">Add assignments or tests and your schedule will be generated automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Today's Study Schedule</h2>
            <p className="text-xs text-gray-500">AI-personalized for your day</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-gray-500" onClick={() => generateSchedule()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Daily tip */}
      {schedule.daily_tip && (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{schedule.daily_tip}</p>
        </div>
      )}

      {/* Schedule blocks */}
      <div className="space-y-3">
        <AnimatePresence>
          {schedule.blocks.map((block, i) => (
            <ScheduleBlock key={`${block.time_slot}-${i}`} block={block} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Adjustment history */}
      {history.length > 0 && (
        <div className="text-xs text-gray-400 space-y-1 pt-1">
          <p className="font-medium text-gray-500">Adjustments applied:</p>
          {history.map((h, i) => (
            <p key={i} className="flex gap-1.5"><span className="text-indigo-400">↳</span> {h}</p>
          ))}
        </div>
      )}

      {/* Adjustment input */}
      <div className="pt-2">
        <p className="text-xs font-medium text-gray-600 mb-2">Need to change something?</p>
        <form onSubmit={handleAdjustSubmit} className="flex gap-2">
          <input
            type="text"
            value={adjustment}
            onChange={e => setAdjustment(e.target.value)}
            placeholder='e.g. "I have basketball practice at 4:00 PM"'
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white"
            disabled={adjusting}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!adjustment.trim() || adjusting}
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 rounded-xl px-4"
          >
            {adjusting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}