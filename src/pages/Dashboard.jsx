import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { RefreshCw, BookOpen, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SmartTodoList from "../components/dashboard/SmartTodoList";
import ProgressCharts from "../components/dashboard/ProgressCharts";
import WeeklySummaryButton from "../components/dashboard/WeeklySummaryButton";
import TutorialOverlay from "../components/tutorial/TutorialOverlay";
import TodaysFocusCard from "../components/dashboard/TodaysFocusCard";
import MoodCheckIn from "../components/dashboard/MoodCheckIn";
import OfflineNotice from "../components/common/OfflineNotice";
import { useGamification } from "../components/gamification/useGamification";
import useOfflineEntityData from "../hooks/useOfflineEntityData";
import { differenceInDays } from "date-fns";
import { parseLocalDate } from "../components/utils/dateUtils";
import { useAuth } from "../components/AuthGuard";
import { useNotifications } from "../components/notifications/useNotifications";
import { createPageUrl } from "@/utils";
import IllustratedEmptyState from "../components/common/IllustratedEmptyState";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [todoList, setTodoList] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("gg_ai_plan") || "null"); } catch { return null; }
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [moodTone, setMoodTone] = useState("balanced");
  const [aiStatuses, setAiStatuses] = useState(null);
  const [aiStageIndex, setAiStageIndex] = useState(0);

  const getLocalDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const { profile, userEmail, token, isLoading: authLoading } = useAuth();
  const user = userEmail ? { email: userEmail, full_name: profile?.user_name } : null;

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const seen = localStorage.getItem("gg_tutorial_seen_v2_" + profile.user_email);
    if (!seen) {
      setShowTutorial(true);
      localStorage.setItem("gg_tutorial_seen_v2_" + profile.user_email, "1");
    }
  }, [profile]);

  const { data: assignments = [], isLoading: assignmentsLoading, isUsingOfflineData } = useOfflineEntityData({
    queryKey: ['assignments', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAssignments", { token });
      return res.data.assignments;
    },
    enabled: !!userEmail && !!token && !!profile,
    storageKey: `gg_cache_assignments_${userEmail}`,
  });

  const { data: tests = [], isLoading: testsLoading } = useOfflineEntityData({
    queryKey: ['tests', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getTests", { token });
      return (res.data.tests || []).filter(t => t.status === 'upcoming');
    },
    enabled: !!userEmail && !!token && !!profile,
    storageKey: `gg_cache_tests_${userEmail}`,
  });

  const activeTests = tests.filter((test) => differenceInDays(parseLocalDate(test.test_date), new Date(new Date().setHours(0, 0, 0, 0))) >= 0);

  const { data: notifSettingsArr = [] } = useQuery({
    queryKey: ['notification-settings', userEmail],
    queryFn: () => secureEntity("NotificationSettings").filter({ user_email: userEmail }),
    enabled: !!userEmail && !!profile
  });
  const notifSettings = notifSettingsArr[0] || null;

  useNotifications({ userEmail, assignments, tests, settings: notifSettings });

  const generateAIPlanRef = useRef(null);
  const prevSignatureRef = useRef(null);
  const aiPollTimeoutRef = useRef(null);

  // Auto-generate plan only when assignments or tests actually change (new/updated items)
  useEffect(() => {
    if (!profile) return;
    const pending = assignments.filter(a => a.status !== 'completed');
    if (!pending.length && !activeTests.length) return;

    // Build a signature based on ids + updated_date to detect real changes
    const signature = [...pending, ...activeTests]
      .map(item => `${item.id}:${item.updated_date}`)
      .sort()
      .join("|");

    if (prevSignatureRef.current === signature) return;
    prevSignatureRef.current = signature;

    // If we already have a cached plan and this is just the initial mount (same data), skip
    if (todoList && sessionStorage.getItem("gg_ai_plan_sig") === signature) return;

    if (generateAIPlanRef.current) clearTimeout(generateAIPlanRef.current);
    generateAIPlanRef.current = setTimeout(() => {
      generateAIPlan();
    }, 600);
    return () => clearTimeout(generateAIPlanRef.current);
  }, [assignments, tests, profile]);

  const { awardPoints } = useGamification(user, assignments);

  const pendingAssignments = assignments.filter(a => a.status !== 'completed');
  const completedToday = assignments.filter(a => {
    if (a.status !== 'completed') return false;
    const updated = new Date(a.updated_date);
    const today = new Date();
    return updated.toDateString() === today.toDateString();
  });

  const overdue = pendingAssignments.filter(a => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(parseLocalDate(a.due_date), today) < 0;
  });

  const stopAiJobPolling = () => {
    if (aiPollTimeoutRef.current) {
      clearTimeout(aiPollTimeoutRef.current);
      aiPollTimeoutRef.current = null;
    }
  };

  const pollAiJob = async (jobId) => {
    const jobs = await secureEntity("AIJob").filter({ id: jobId });
    const job = jobs[0];

    if (!job) return;

    setAiStatuses(job.stage_statuses || null);
    setAiStageIndex(job.status === 'completed' ? (job.stage_statuses?.length || 0) : (job.stage_index || 0));

    if (job.status === 'completed' || job.status === 'failed') {
      stopAiJobPolling();
      return;
    }

    aiPollTimeoutRef.current = setTimeout(() => pollAiJob(jobId), 800);
  };

  useEffect(() => () => stopAiJobPolling(), []);

  const generateAIPlan = useCallback(async () => {
    if (!pendingAssignments.length && !activeTests.length) {
      setLoadingAI(false);
      return;
    }
    if (!profile) {
      setLoadingAI(false);
      return;
    }
    setLoadingAI(true);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayKey = `gg_plan_feedback_${userEmail}_${getLocalDateKey(today)}`;
    const prevFeedback = localStorage.getItem(todayKey);
    const feedbackInstruction = prevFeedback === "too_easy"
      ? "\nThe student said yesterday's plan was TOO EASY. Assign more tasks and increase suggested study times."
      : prevFeedback === "too_much"
      ? "\nThe student said yesterday's plan was TOO MUCH. Reduce the number of tasks and suggested study times — keep it manageable."
      : "";

    const weightLabel = { prepare: "20% (low stakes)", rehearse: "30% (mid stakes)", perform: "50% (high stakes)" };
    const assignmentsContext = pendingAssignments.map(a => {
      const [ay, am, ad] = a.due_date.split('-').map(Number);
      const dueDay = new Date(ay, am - 1, ad);
      return {
        id: a.id,
        name: a.name,
        subject: a.subject,
        due_date: a.due_date,
        days_until_due: differenceInDays(dueDay, today),
        difficulty: a.difficulty,
        time_estimate: a.time_estimate,
        status: a.status,
        weight: a.weight ? weightLabel[a.weight] : "unspecified"
      };
    });

    const testsContext = activeTests.map(t => {
      const [ty, tm, td] = t.test_date.split('-').map(Number);
      const testDay = new Date(ty, tm - 1, td);
      return {
        id: t.id,
        name: t.name,
        subject: t.subject,
        test_date: t.test_date,
        days_until_test: differenceInDays(testDay, today),
        topics: t.topics || "not specified",
        difficulty: t.difficulty || "unknown"
      };
    });

    const studentContext = {
      study_time: profile.study_time,
      break_frequency: profile.break_frequency,
      session_length: profile.session_length,
      deadline_approach: profile.deadline_approach,
      study_environment: profile.study_environment,
      easiest_subjects: profile.easiest_subjects,
      hardest_subjects: profile.hardest_subjects,
      difficult_approach: profile.difficult_approach,
      learning_style: profile.learning_style,
      subject_balance: profile.subject_balance
    };

    const testsSection = testsContext.length > 0
      ? `\nUpcoming tests:\n${JSON.stringify(testsContext, null, 2)}\n`
      : "";

    const attachmentUrls = pendingAssignments
      .filter(a => a.attachment_url)
      .map(a => a.attachment_url);

    try {
      const stageStatuses = ["Preparing tasks", ...(attachmentUrls.length > 0 ? ["Analyzing attachments"] : []), "Generating plan", "Formatting plan"];
      const job = await secureEntity("AIJob").create({
        user_email: userEmail,
        job_type: 'dashboard_study_plan',
        status: 'queued',
        stage_index: 0,
        stage_label: stageStatuses[0],
        stage_statuses: stageStatuses
      });

      setAiStatuses(stageStatuses);
      setAiStageIndex(0);
      stopAiJobPolling();
      pollAiJob(job.id);

      const response = await base44.functions.invoke('runStudyAssistantJob', {
        token: localStorage.getItem("gg_auth_token"),
        jobId: job.id,
        prompt: `You are an academic coach for a middle/high school student. 
The student's current energy/mood tone is: "${moodTone}". Adjust your language and pacing recommendations accordingly — e.g. gentle for tired students, intense for focused ones.

Student's study preferences:
${JSON.stringify(studentContext, null, 2)}

Pending assignments:
${JSON.stringify(assignmentsContext, null, 2)}
${testsSection}
Today's date: ${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}

Create a smart, personalized to-do list for TODAY. ONLY include items from the actual assignments and tests listed above — do NOT invent or add any tasks that are not in the provided lists. Prioritize based on:
1. Urgency (days until due / days until test)
2. Assignment weight — Perform (50%) assignments should be prioritized heavily over Rehearse (30%) and Prepare (20%)
3. Student's difficulty with that subject
4. Their deadline_approach preference
5. Difficulty level vs their capabilities

For each assignment, use its exact name and tell the student how long to work on it today and WHY.
For each test, include a focused study session using the test's exact name and specific topics from the test's topic list.
For every returned item, also include the exact source_id from the provided assignments/tests so the app can match it to the correct record.

IMPORTANT: Only include tasks from the provided assignments and tests. Do not create generic tasks like "study [subject] concepts" unless they directly map to a real test or assignment in the list above.

Also include a short, encouraging daily tip based on their study style.
${feedbackInstruction}
${attachmentUrls.length > 0 ? `The student has attached files (syllabi or notes) for some assignments — use them to provide more accurate time and topic recommendations.` : ""}`,
        file_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_id: { type: "string" },
                  assignment_name: { type: "string" },
                  subject: { type: "string" },
                  urgency_level: { type: "string", enum: ["High", "Medium", "Low"] },
                  suggested_time_today: { type: "number" },
                  priority_reason: { type: "string" },
                  type: { type: "string", enum: ["assignment", "test_study"] }
                }
              }
            },
            daily_tip: { type: "string" }
          }
        },
        stage_statuses: stageStatuses
      });

      stopAiJobPolling();
      setAiStageIndex(stageStatuses.length);
      await new Promise((resolve) => setTimeout(resolve, 450));

      const result = response.data.result;

      const normalizedResult = {
        ...result,
      items: (result.items || []).map(item => {
        const matchesTest = item.source_id
          ? activeTests.some(t => t.id === item.source_id)
          : activeTests.some(t => t.name === item.assignment_name && t.subject === item.subject);

        return matchesTest ? { ...item, type: 'test_study' } : { ...item, type: 'assignment' };
      })
    };

      normalizedResult.generated_at = new Date().toISOString();
      setTodoList(normalizedResult);
      sessionStorage.setItem("gg_ai_plan", JSON.stringify(normalizedResult));
      const pending2 = assignments.filter(a => a.status !== 'completed');
      const sig = [...pending2, ...activeTests].map(item => `${item.id}:${item.updated_date}`).sort().join("|");
      sessionStorage.setItem("gg_ai_plan_sig", sig);
    } finally {
      setLoadingAI(false);
      setAiStatuses(null);
      setAiStageIndex(0);
    }
  }, [assignments, pendingAssignments, activeTests, profile, moodTone, userEmail]);

  const handleQuizFromTodo = (todoItem) => {
    const test = todoItem?.source_id
      ? activeTests.find(t => t.id === todoItem.source_id)
      : activeTests.find(t => t.name === todoItem?.assignment_name && t.subject === todoItem?.subject);

    if (test) {
      navigate(`${createPageUrl("StudyAssistant")}?tool=quiz&testId=${test.id}`);
    }
  };

  const handleCompleteFromTodo = async (todoItem) => {
    if (!todoItem) return;

    const nextTodoList = todoList ? {
      ...todoList,
      items: (todoList.items || []).filter(i =>
        todoItem.source_id
          ? i.source_id !== todoItem.source_id
          : !(i.type === todoItem.type && i.assignment_name === todoItem.assignment_name && i.subject === todoItem.subject)
      )
    } : null;

    setTodoList(nextTodoList);
    sessionStorage.setItem("gg_ai_plan", JSON.stringify(nextTodoList));

    const remainingPendingAssignments = pendingAssignments.filter((assignment) => {
      if (todoItem.type === 'assignment') {
        return todoItem.source_id ? assignment.id !== todoItem.source_id : !(assignment.name === todoItem.assignment_name && assignment.subject === todoItem.subject);
      }
      return true;
    });

    const remainingActiveTests = activeTests.filter((test) => {
      if (todoItem.type === 'test_study') {
        return todoItem.source_id ? test.id !== todoItem.source_id : !(test.name === todoItem.assignment_name && test.subject === todoItem.subject);
      }
      return true;
    });

    const nextSignature = [...remainingPendingAssignments, ...remainingActiveTests]
      .map(item => `${item.id}:${item.updated_date}`)
      .sort()
      .join("|");

    prevSignatureRef.current = nextSignature;
    sessionStorage.setItem("gg_ai_plan_sig", nextSignature);

    if (todoItem.type === 'test_study') {
      const test = todoItem.source_id
        ? tests.find(t => t.id === todoItem.source_id)
        : tests.find(t => t.name === todoItem.assignment_name && t.subject === todoItem.subject);

      if (test) {
        queryClient.setQueryData(['tests', userEmail], (current = []) =>
          current.filter((item) => item.id !== test.id)
        );
        await secureEntity("Test").update(test.id, { status: 'completed' });
      }
    } else {
      const assignment = todoItem.source_id
        ? assignments.find(a => a.id === todoItem.source_id)
        : assignments.find(a => a.name === todoItem.assignment_name && a.subject === todoItem.subject);

      if (assignment) {
        const shouldAwardXp = assignment.status !== 'completed' && !assignment.xp_awarded;

        queryClient.setQueryData(['assignments', userEmail], (current = []) =>
          current.map((item) => item.id === assignment.id ? { ...item, status: 'completed', ...(shouldAwardXp ? { xp_awarded: true } : {}) } : item)
        );
        await secureEntity("Assignment").update(assignment.id, { status: 'completed', ...(shouldAwardXp ? { xp_awarded: true } : {}) });

        if (shouldAwardXp) {
          await awardPoints({ ...assignment, status: 'completed', xp_awarded: true });
        }
      }
    }
  };

  const firstName = profile?.user_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const isReady = !!profile && !authLoading && !assignmentsLoading && !testsLoading;

  const normalizedTodoList = todoList ? {
    ...todoList,
    items: (todoList.items || []).map(item => {
      const matchesTest = item.source_id
        ? tests.some(t => t.id === item.source_id)
        : tests.some(t => t.name === item.assignment_name && t.subject === item.subject);

      return matchesTest ? { ...item, type: 'test_study' } : { ...item, type: 'assignment' };
    })
  } : null;

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: "easeOut" }
  });

  if (!isReady) {
    return (
      <div className="space-y-6 md:space-y-8 animate-pulse">
        <div className="bg-gradient-to-r from-indigo-300 to-purple-300 rounded-2xl h-48 opacity-60" />
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      {isUsingOfflineData && <OfflineNotice label="You’re offline — your saved dashboard data is still available." />}

      {/* Hero greeting */}
      <motion.div
        {...fadeUp(0)}
        className="rounded-2xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 16px 48px rgba(99,102,241,0.3)" }}
      >
        <h1 className="text-2xl md:text-3xl font-bold">{greeting}, {firstName}! 👋</h1>
        <p className="text-indigo-100 mt-1 text-sm md:text-base">
          {pendingAssignments.length === 0
            ? "You're all caught up! No pending assignments."
            : `You have ${pendingAssignments.length} assignment${pendingAssignments.length !== 1 ? 's' : ''} to work on.`
          }
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
          {[
            { icon: BookOpen, value: pendingAssignments.length, label: "Pending", extra: "" },
            { icon: CheckCircle2, value: completedToday.length, label: "Done today", extra: "" },
            { icon: AlertTriangle, value: overdue.length, label: "Overdue", extra: overdue.length > 0 ? "text-red-200" : "" },
          ].map(({ icon: Icon, value, label, extra }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.08, ease: "easeOut" }}
              className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center"
            >
              <div className={`flex items-center justify-center gap-1.5 text-xl font-bold ${extra}`}>
                <Icon className="w-5 h-5" />
                {value}
              </div>
              <div className="text-xs text-indigo-100 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Plan section — featured, main content */}
      <motion.div {...fadeUp(0.08)}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.1)"
          }}
        >
          {/* Section header bar */}
          <div
            className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">AI Study Plan</h2>
                <p className="text-xs text-gray-500">Personalized for today based on your workload</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todoList && !loadingAI && (pendingAssignments.length > 0 || activeTests.length > 0) && (
                <Button onClick={generateAIPlan} variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-indigo-600 h-8 px-2.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">Refresh</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {(pendingAssignments.length > 0 || activeTests.length > 0) ? (
              <SmartTodoList
                todoList={normalizedTodoList}
                isLoading={loadingAI}
                onComplete={handleCompleteFromTodo}
                onQuiz={handleQuizFromTodo}
                hideHeader
                userEmail={userEmail}
                onFeedback={() => {}}
                aiStatuses={aiStatuses}
                aiStageIndex={aiStageIndex}
              />
            ) : (
              <IllustratedEmptyState
                icon={Sparkles}
                emoji="🎉"
                tone="amber"
                title="All caught up"
                description="You have nothing urgent right now, so this is a perfect time to log your next assignment or upcoming test."
                hint="Once new work is added, your AI plan will rebuild automatically"
                actions={
                  <>
                    <Button onClick={() => navigate(`${createPageUrl("Assignments")}?new=1`)} className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto">
                      <BookOpen className="w-4 h-4" /> Add Assignment
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`${createPageUrl("Tests")}?new=1`)} className="gap-2 w-full sm:w-auto">
                      <AlertTriangle className="w-4 h-4" /> Add Test
                    </Button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Secondary row: Mood + Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <motion.div {...fadeUp(0.25)} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <MoodCheckIn userEmail={userEmail} onMoodChange={setMoodTone} />
        </motion.div>
        {(pendingAssignments.length > 0 || activeTests.length > 0) && (
          <motion.div {...fadeUp(0.28)} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <TodaysFocusCard assignments={assignments} tests={activeTests} />
          </motion.div>
        )}
      </div>

      {/* Progress Charts */}
      <motion.div {...fadeUp(0.35)}>
        <ProgressCharts assignments={assignments} />
      </motion.div>

      {/* Weekly Summary */}
      <motion.div {...fadeUp(0.4)} className="flex justify-center pb-2">
        <WeeklySummaryButton />
      </motion.div>
    </div>
  );
}