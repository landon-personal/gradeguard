import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { Send, Bot, Sparkles, Paperclip, X, FileText, Image, Link, BookOpen, ClipboardList, ChevronDown, Zap, Gamepad2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIProgressBar from "@/components/ai/AIProgressBar";
import { AnimatePresence, motion } from "framer-motion";
import ChatMessage from "../components/assistant/ChatMessage.jsx";
import SuggestionChips from "../components/assistant/SuggestionChips.jsx";
import FlashcardViewer from "../components/assistant/FlashcardViewer.jsx";
import QuizRunner from "../components/assistant/QuizRunner.jsx";
import PerformanceInsights from "../components/assistant/PerformanceInsights.jsx";
import { useAuth } from "../components/AuthGuard";
import { LightningRound, MemoryMatch, TermGuesser } from "../components/assistant/MiniGames.jsx";
import { getQualifiedAssignmentCount } from "@/lib/assignmentQuality";

// NOTE: getQualifiedAssignmentCount is still used for the no-school path (myAssignments)

const SYSTEM_PROMPT = `You are a Socratic study assistant for middle and high school students. Your role is to GUIDE students to discover answers themselves — never give direct answers to academic questions.

Rules:
1. NEVER directly answer homework questions or give away solutions. Instead, ask leading questions, provide hints, or break the problem into smaller steps.
2. For conceptual questions, explain the underlying principles using simple analogies and real-world examples.
3. For large assignments, help break them into small, actionable steps with time estimates.
4. Offer evidence-based study strategies (spaced repetition, active recall, Pomodoro, etc.) tailored to the student's question.
5. Be warm, encouraging, and patient. Celebrate effort and progress.
6. Keep responses concise and easy to read. Use bullet points and short paragraphs.
7. End responses with a guiding question to keep the student thinking.
8. If a student shares their assignment list, help prioritize and plan — but still guide, don't do the work for them.
9. You can manage the student's assignments. If the student says they completed an assignment, want to add a new one, or want to change an assignment's status, use the action field.

Tone: encouraging tutor / coach, not a lecturer.

IMPORTANT: When you need to perform an assignment action, include an "action" field in your response:
- To mark complete: {"type": "update_status", "assignment_id": "<id>", "status": "completed"}
- To mark in progress: {"type": "update_status", "assignment_id": "<id>", "status": "in_progress"}  
- To mark pending: {"type": "update_status", "assignment_id": "<id>", "status": "pending"}
- To add an assignment: {"type": "add_assignment", "name": "<name>", "subject": "<subject>", "due_date": "<YYYY-MM-DD>", "difficulty": "<easy|medium|hard>"}
Only include action when the student explicitly requests it.`;

export default function StudyAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [studyTool, setStudyTool] = useState(null); // { type: 'flashcards'|'quiz', data, testName, subject, difficulty }
  const [attachedFile, setAttachedFile] = useState(null); // { file, url, type: 'pdf'|'image' }
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedLink, setAttachedLink] = useState(null); // { url, title }
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState("");
  const [activeGame, setActiveGame] = useState(null);
  const [autoQuizHandled, setAutoQuizHandled] = useState(false);
  const [aiStatuses, setAiStatuses] = useState(null);
  const [aiStageIndex, setAiStageIndex] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const aiPollTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  const { profile, userEmail, token } = useAuth();

  const { data: schools = [] } = useQuery({
    queryKey: ['school', profile?.school_code],
    queryFn: () => secureEntity("School").filter({ school_code: profile.school_code }),
    enabled: !!profile?.school_code
  });
  const school = schools[0] || null;

  // Premium is earned via loyalty: total school assignments >= students * 100
  const { data: schoolProfiles = [] } = useQuery({
    queryKey: ['school-profiles', profile?.school_code],
    queryFn: () => secureEntity("StudentProfile").filter({ school_code: profile.school_code }, '-created_date', 1000),
    enabled: !!profile?.school_code
  });
  const { data: schoolAssignmentCount = 0 } = useQuery({
    queryKey: ['school-assignment-count', profile?.school_code],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSchoolAssignmentCount", {
        token,
        school_code: profile.school_code,
      });
      return res.data.count || 0;
    },
    enabled: !!profile?.school_code && !!token,
    staleTime: 120000,
  });
  const { data: myAssignments = [] } = useQuery({
    queryKey: ['my-assignments-count', userEmail],
    queryFn: () => secureEntity("Assignment").filter({ user_email: userEmail }, '-created_date', 2000),
    enabled: !!userEmail && !profile?.school_code
  });

  const loyaltyTarget = schoolProfiles.length * 100;
  const hasSchool = !!profile?.school_code;
  const qualifyingSchoolAssignmentCount = schoolAssignmentCount;
  const qualifyingMyAssignmentCount = getQualifiedAssignmentCount(myAssignments);
  const isPremium = hasSchool
    ? (loyaltyTarget > 0 && qualifyingSchoolAssignmentCount >= loyaltyTarget)
    : (qualifyingMyAssignmentCount >= 100);

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAssignments", { token });
      return res.data.assignments;
    },
    enabled: !!userEmail && !!token && !!profile
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['tests', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getTests", { token });
      return (res.data.tests || []).filter(t => t.status === 'upcoming');
    },
    enabled: !!userEmail && !!token && !!profile
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ['quiz-results', userEmail],
    queryFn: () => secureEntity("QuizResult").filter({ user_email: userEmail }, '-created_date', 20),
    enabled: !!userEmail && isPremium
  });

  const pendingAssignments = assignments.filter(a => a.status !== 'completed');

  const handleAction = async (action) => {
    if (!action) return null;
    if (action.type === "update_status") {
      const assignment = assignments.find(a => a.id === action.assignment_id);
      if (assignment) {
        await secureEntity("Assignment").update(action.assignment_id, { status: action.status });
        queryClient.invalidateQueries(['assignments']);
        return `✅ Marked "${assignment.name}" as ${action.status.replace('_', ' ')}.`;
      }
    } else if (action.type === "add_assignment") {
      await secureEntity("Assignment").create({
        user_email: userEmail,
        name: action.name,
        subject: action.subject || "",
        due_date: action.due_date,
        difficulty: action.difficulty || "medium",
        status: "pending"
      });
      queryClient.invalidateQueries(['assignments']);
      return `📝 Added "${action.name}" to your assignments.`;
    }
    return null;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const runTrackedStudyAssistantCall = async ({ prompt, add_context_from_internet = false, file_urls, response_json_schema }) => {
    const stageStatuses = [
      "Preparing context",
      ...(add_context_from_internet || (Array.isArray(file_urls) ? file_urls.length > 0 : !!file_urls) ? ["Analyzing sources"] : []),
      "Calling AI",
      "Formatting response"
    ];

    const job = await secureEntity("AIJob").create({
      user_email: userEmail,
      job_type: 'study_assistant_chat',
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
      prompt,
      add_context_from_internet,
      file_urls,
      response_json_schema,
      stage_statuses: stageStatuses
    });

    stopAiJobPolling();
    setAiStageIndex(stageStatuses.length);

    return response.data.result;
  };

  const generateFlashcards = async (test) => {
    if (loading) return;
    setLoading(true);
    setStudyTool(null);
    setMessages(prev => [...prev,
      { role: "user", content: `Generate flashcards for my ${test.name} test` },
      { role: "assistant", content: `Generating flashcards for **${test.name}** (${test.subject})... ✨` }
    ]);
    try {
    const result = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5",
      prompt: `Generate 10 flashcards for a student studying for a ${test.subject} test called "${test.name}".
      Topics covered: ${test.topics || test.subject}
      Difficulty: ${test.difficulty || 'medium'}
      Each card should have a clear question on the front and a concise answer on the back. Focus on key concepts, definitions, and important facts.

      IMPORTANT: For any mathematical expressions, use LaTeX notation wrapped in dollar signs. Use $...$ for inline math and $$...$$ for block math. Examples: $2^3$, $x^2 + 3x - 4$, $\\frac{1}{2}$. Always use LaTeX for exponents, fractions, square roots, and any math symbols.`,
      response_json_schema: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              }
            }
          }
        }
      }
    });
    if (!result?.cards?.length) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble generating the flashcards. Please try again!" }]);
      return;
    }
    setStudyTool({ type: "flashcards", data: result.cards, testName: test.name });
    } catch (e) {
      console.error("Failed to generate flashcards:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong generating flashcards. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (test) => {
    if (loading) return;
    setLoading(true);
    setStudyTool(null);
    setMessages(prev => [...prev,
      { role: "user", content: `Quiz me on ${test.name}` },
      { role: "assistant", content: `Creating a practice quiz for **${test.name}** (${test.subject})... 📝` }
    ]);
    try {
    const result = await runTrackedStudyAssistantCall({
      prompt: `Create a 8-question multiple choice practice quiz for a student studying for a ${test.subject} test called "${test.name}".
      Topics covered: ${test.topics || test.subject}
      Difficulty: ${test.difficulty || 'medium'}

      Each question must have exactly 4 options and one correct answer. Include a brief Socratic explanation for the correct answer that helps the student understand WHY it's correct.

      IMPORTANT: For any mathematical expressions, use LaTeX notation wrapped in dollar signs. Use $...$ for inline math and $$...$$ for block math. Examples: $2^3$, $x^2 + 3x - 4$, $\\frac{1}{2}$, $\\sqrt{16}$. Always use LaTeX for exponents, fractions, square roots, and any math symbols.`,
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
                correct_index: { type: "number" },
                explanation: { type: "string" }
              }
            }
          }
        }
      }
    });
    if (!result?.questions?.length) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble generating the quiz. Please try again!" }]);
      return;
    }
    setStudyTool({ type: "quiz", data: result.questions, testName: test.name, subject: test.subject, difficulty: test.difficulty });
    } catch (e) {
      console.error("Failed to generate quiz:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong generating the quiz. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoQuizHandled || !tests.length) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tool") !== "quiz") return;

    const testId = urlParams.get("testId");
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setAutoQuizHandled(true);
    generateQuiz(test);

    const url = new URL(window.location.href);
    url.searchParams.delete("tool");
    url.searchParams.delete("testId");
    const nextSearch = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`);
  }, [tests, autoQuizHandled]);

  const handleQuizResults = async ({ score_pct, correct_count, wrong_questions }, testName, subject, difficulty) => {
    // Save quiz result for performance tracking
    const wrongQs = wrong_questions || [];
    // Extract weak topic hints from wrong questions using simple heuristics
    await secureEntity("QuizResult").create({
      user_email: userEmail,
      test_name: testName,
      subject: subject || "General",
      score_pct,
      total_questions: studyTool?.data?.length || 0,
      correct_count,
      difficulty: difficulty || "medium",
      wrong_questions: wrongQs,
      weak_topics: wrongQs.slice(0, 3) // Store first 3 wrong questions as weak topic indicators
    });
    queryClient.invalidateQueries(['quiz-results', userEmail]);

    // Generate AI follow-up message based on performance
    if (isPremium) {
      setLoading(true);
      try {
        const result2 = await base44.integrations.Core.InvokeLLM({
          prompt: `A student just completed a practice quiz on "${testName}" (${subject}) and scored ${score_pct}%.
${wrongQs.length > 0 ? `They got these questions wrong:\n${wrongQs.map(q => `- ${q}`).join('\n')}` : 'They got everything correct!'}

Student profile:
- Hardest subjects: ${(profile?.hardest_subjects || []).join(', ') || 'unknown'}
- Learning style: ${profile?.learning_style || 'unknown'}
- Difficult approach: ${profile?.difficult_approach || 'unknown'}

Write a short, encouraging Socratic response (2-4 sentences) that:
1. Acknowledges their score with the right tone (celebrate if good, encourage if low)
2. ${wrongQs.length > 0 ? 'Points out the specific area they struggled with and asks a guiding question about it' : 'Reinforces what made them successful and suggests how to maintain it'}
3. Suggests the next best study action based on their score and upcoming test

Keep it warm, specific, and actionable.`,
          response_json_schema: {
            type: "object",
            properties: { reply: { type: "string" } }
          }
        });
        setMessages(prev => [...prev, { role: "assistant", content: result2.reply }]);
      } catch (e) {
        console.error("Quiz follow-up message failed:", e);
        // Silent fail — quiz results were already saved, just no AI feedback
      } finally {
        setLoading(false);
      }
    }
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText && !attachedFile && !attachedLink) return;

    // Detect flashcard / quiz intent for a specific test
    const flashcardMatch = tests.find(t =>
      userText?.toLowerCase().includes("flashcard") && userText.toLowerCase().includes(t.name.toLowerCase())
    );
    const quizMatch = tests.find(t =>
      userText?.toLowerCase().includes("quiz") && userText.toLowerCase().includes(t.name.toLowerCase())
    );
    if (flashcardMatch) { setInput(""); return generateFlashcards(flashcardMatch); }
    if (quizMatch) { setInput(""); return generateQuiz(quizMatch); }

    const fileRef = attachedFile;
    const linkRef = attachedLink;

    let displayContent = userText || "";
    if (fileRef) displayContent = displayContent ? `${displayContent} *(📎 ${fileRef.name})*` : `*(📎 ${fileRef.name})* — Please help me with this study guide.`;
    if (linkRef) displayContent = displayContent ? `${displayContent} *(🔗 ${linkRef.url})*` : `*(🔗 ${linkRef.url})* — Please help me with this link.`;

    const userMsg = { role: "user", content: displayContent };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setAttachedFile(null);
    setAttachedLink(null);
    setLoading(true);

    // Use local date for "today" to avoid UTC off-by-one issues
    const localToday = new Date();
    const todayStr = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;

    // Helper: days until a YYYY-MM-DD date from today (local)
    const daysUntil = (dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const due = new Date(y, m - 1, d);
      const today0 = new Date(localToday.getFullYear(), localToday.getMonth(), localToday.getDate());
      return Math.round((due - today0) / 86400000);
    };

    // Build context about the student's assignments
    const allAssignmentsContext = assignments.length > 0
      ? `\n\nToday's date: ${todayStr}\nStudent's assignments (ALL — include IDs for actions):\n${assignments.map(a => {
          const days = daysUntil(a.due_date);
          const dueLabel = days < 0 ? `OVERDUE by ${Math.abs(days)}d` : days === 0 ? 'due TODAY' : `due in ${days}d (${a.due_date})`;
          return `- ID: ${a.id} | "${a.name}" | ${a.subject || 'No subject'} | ${dueLabel} | difficulty: ${a.difficulty || 'unknown'} | status: ${a.status}${a.notes ? ` | notes: "${a.notes}"` : ''}`;
        }).join('\n')}`
      : `\n\nToday's date: ${todayStr}\nStudent has no assignments yet.`;

    const testsContext = tests.length > 0
      ? `\n\nStudent's upcoming tests:\n${tests.map(t => {
          const days = daysUntil(t.test_date);
          const dueLabel = days === 0 ? 'TODAY' : days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d (${t.test_date})`;
          return `- "${t.name}" | ${t.subject} | date: ${dueLabel} | topics: ${t.topics || 'not specified'} | difficulty: ${t.difficulty || 'unknown'}`;
        }).join('\n')}\n\nWhen the student asks about studying for a test, refer to the topics listed above and give targeted study advice.`
      : "";

    const historyForLLM = updatedMessages.slice(-10).map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n');

    const fileInstruction = fileRef
      ? `\n\nThe student has attached a study guide file. Carefully read it and use its content to help the student. If they haven't specified what they want, generate 5–8 practice problems from it using the Socratic approach.`
      : "";

    const linkInstruction = linkRef
      ? `\n\nThe student has shared a link: ${linkRef.url}. Read and analyze the content from that URL to help the student. Use the information found there to answer their question, explain concepts, or generate practice material as appropriate.`
      : "";

    // Build quiz performance context for premium
    const perfContext = isPremium && quizResults.length > 0 ? (() => {
      const bySubject = {};
      quizResults.forEach(r => {
        if (!bySubject[r.subject]) bySubject[r.subject] = { scores: [], wrongQs: [] };
        bySubject[r.subject].scores.push(r.score_pct);
        bySubject[r.subject].wrongQs.push(...(r.wrong_questions || []));
      });
      const summaries = Object.entries(bySubject).map(([subj, d]) => {
        const avg = Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length);
        const topWrong = d.wrongQs.slice(0,2);
        return `  ${subj}: avg ${avg}% ${topWrong.length > 0 ? `| struggled with: ${topWrong.join('; ')}` : ''}`;
      }).join('\n');
      return `\n\nStudent's quiz performance history (use to adapt difficulty and identify gaps):\n${summaries}`;
    })() : "";

    const premiumContext = isPremium && profile ? `

This school has Premium. You are a PERSONAL AI TUTOR who knows this student well:
- Name: ${profile.user_name}
- Study time preference: ${profile.study_time || 'unknown'}
- Break frequency: ${profile.break_frequency || 'unknown'}
- Session length: ${profile.session_length || 'unknown'}
- Deadline approach: ${profile.deadline_approach || 'unknown'}
- Easiest subjects: ${(profile.easiest_subjects || []).join(', ') || 'not set'}
- Hardest subjects: ${(profile.hardest_subjects || []).join(', ') || 'not set'}
- Learning style: ${profile.learning_style || 'unknown'}
- Difficult subject approach: ${profile.difficult_approach || 'unknown'}
Use this information to personalize every response. Reference their strengths and struggles naturally.${perfContext}
When generating practice problems or quizzes, adapt difficulty based on their performance history — make harder problems for strong subjects and scaffold more for weak ones.` : "";

    try {
      const result = await runTrackedStudyAssistantCall({
        prompt: `${SYSTEM_PROMPT}${premiumContext}${allAssignmentsContext}${testsContext}${fileInstruction}${linkInstruction}\n\nConversation history:\n${historyForLLM}\n\nRespond as the assistant now.`,
        add_context_from_internet: !!linkRef,
        file_urls: fileRef ? [fileRef.url] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            action: {
              type: "object",
              properties: {
                type: { type: "string" },
                assignment_id: { type: "string" },
                status: { type: "string" },
                name: { type: "string" },
                subject: { type: "string" },
                due_date: { type: "string" },
                difficulty: { type: "string" }
              }
            }
          }
        }
      });

      const actionFeedback = await handleAction(result.action);
      const finalReply = actionFeedback ? `${result.reply}\n\n${actionFeedback}` : result.reply;

      setMessages(prev => [...prev, { role: "assistant", content: finalReply }]);
    } catch (e) {
      console.error("Study assistant message failed:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
      setAiStatuses(null);
      setAiStageIndex(0);
    }
  };

  const handleLinkAttach = () => {
    const url = linkInputValue.trim();
    if (!url) return;
    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    setAttachedLink({ url: finalUrl });
    setLinkInputValue("");
    setShowLinkInput(false);
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const isImage = file.type.startsWith("image/");
    setAttachedFile({ name: file.name, url: file_url, isImage });
    setUploadingFile(false);
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [selectedTestId, setSelectedTestId] = useState(null);
  const selectedTest = tests.find(t => t.id === selectedTestId) || tests[0] || null;

  const NonPremiumTestTools = ({ tests, selectedTest, selectedTestId, setSelectedTestId, onFlashcards, onQuiz, compact }) => {
    if (!tests.length) return (
      <p className="text-sm text-gray-400">No upcoming tests yet. Add tests from the Tests page!</p>
    );
    return (
      <div className={`flex flex-col items-center gap-3 w-full max-w-md mx-auto px-4 ${compact ? '' : ''}`}>
        <div className="relative w-full">
          <select
            value={selectedTestId || (tests[0]?.id ?? '')}
            onChange={e => setSelectedTestId(e.target.value)}
            className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
          >
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {selectedTest && (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => onFlashcards(selectedTest)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              <BookOpen className="w-4 h-4" /> Flashcards
            </button>
            <button
              onClick={() => onQuiz(selectedTest)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              <ClipboardList className="w-4 h-4" /> Practice Quiz
            </button>
          </div>
        )}
      </div>
    );
  };

  const firstName = profile?.user_name?.split(' ')[0] || 'there';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="rounded-2xl p-4 md:p-6 mb-4 text-white shadow-xl flex-shrink-0" style={{ background: isPremium ? "linear-gradient(135deg, rgba(245,158,11,0.85) 0%, rgba(249,115,22,0.85) 100%)" : "linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: isPremium ? "0 16px 48px rgba(245,158,11,0.3)" : "0 16px 48px rgba(99,102,241,0.3)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold">{isPremium ? 'AI Personal Tutor' : 'Study Tools'}</h1>
            <p className="text-xs md:text-sm opacity-90 truncate">
              {isPremium
                ? 'Your personal AI tutor — adapts to you'
                : 'Generate flashcards and quizzes for your upcoming tests'}
            </p>
          </div>
          {isPremium && (
            <div className="ml-auto bg-white/20 rounded-xl px-2 py-1 text-xs font-bold tracking-wide flex items-center gap-1 flex-shrink-0">
              ✦ Premium
            </div>
          )}
        </div>
      </motion.div>

      {/* Performance insights panel (premium only) */}
      {isPremium && (
        <PerformanceInsights
          quizResults={quizResults}
          tests={tests}
          assignments={assignments}
          onStartChat={(text) => sendMessage(text)}
        />
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl flex flex-col" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(99,102,241,0.07)" }}>
        {activeGame ? (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeGame === 'lightning' && '⚡ Lightning Round'}
                {activeGame === 'memory' && '🎴 Memory Match'}
                {activeGame === 'guess' && '🎯 Term Guesser'}
              </h2>
              <button onClick={() => setActiveGame(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {activeGame === 'lightning' && <LightningRound tests={tests} onClose={() => setActiveGame(null)} />}
              {activeGame === 'memory' && <MemoryMatch tests={tests} onClose={() => setActiveGame(null)} />}
              {activeGame === 'guess' && <TermGuesser tests={tests} onClose={() => setActiveGame(null)} />}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }} className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isPremium ? 'bg-amber-50' : 'bg-indigo-50'}`}>
              <Bot className={`w-8 h-8 ${isPremium ? 'text-amber-500' : 'text-indigo-500'}`} />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg font-semibold text-gray-800 mb-1">
              {isPremium ? `Hey ${firstName}! Your personal tutor is here 🌟` : `Hey ${firstName}! Let's study 📚`}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm text-gray-400 max-w-sm mb-6">
              {isPremium
                ? "I know your learning style and will tailor everything to you. Ask me anything or use the tools below."
                : "Select a test, then generate flashcards or a practice quiz."}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4 w-full">
              {isPremium ? (
                <SuggestionChips onSelect={sendMessage} assignments={pendingAssignments} tests={tests} onFlashcards={generateFlashcards} onQuiz={generateQuiz} />
              ) : (
                <NonPremiumTestTools tests={tests} selectedTest={selectedTest} selectedTestId={selectedTestId} setSelectedTestId={setSelectedTestId} onFlashcards={generateFlashcards} onQuiz={generateQuiz} />
              )}
              {tests.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-3 font-medium">🎮 MINI GAMES</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setActiveGame('lightning')} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md transition-shadow">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-700">Lightning</span>
                    </button>
                    <button onClick={() => setActiveGame('memory')} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-md transition-shadow">
                      <Gamepad2 className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">Memory</span>
                    </button>
                    <button onClick={() => setActiveGame('guess')} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 hover:shadow-md transition-shadow">
                      <Target className="w-5 h-5 text-teal-600" />
                      <span className="text-xs font-semibold text-teal-700">Term Guesser</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {studyTool && !loading && (
                <motion.div
                  key="study-tool"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {studyTool.type === "flashcards" && (
                    <FlashcardViewer
                      cards={studyTool.data}
                      testName={studyTool.testName}
                      onClose={() => setStudyTool(null)}
                    />
                  )}
                  {studyTool.type === "quiz" && (
                    <QuizRunner
                      questions={studyTool.data}
                      testName={studyTool.testName}
                      subject={studyTool.subject}
                      difficulty={studyTool.difficulty}
                      onFinish={() => setStudyTool(null)}
                      onResults={(res) => handleQuizResults(res, studyTool.testName, studyTool.subject, studyTool.difficulty)}
                    />
                  )}
                </motion.div>
              )}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md"
                >
                  <AIProgressBar
                    title="Preparing your AI response..."
                    subtitle="Generating help, study tools, or practice content."
                    statuses={aiStatuses || undefined}
                    activeIndex={aiStatuses ? aiStageIndex : undefined}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          {isPremium && messages.length > 0 && !loading && (
            <div className="mb-2">
              <SuggestionChips onSelect={sendMessage} assignments={pendingAssignments} tests={tests} onFlashcards={generateFlashcards} onQuiz={generateQuiz} compact />
            </div>
          )}
          {isPremium ? (
            <>
              {/* Attached file preview */}
              {attachedFile && (
                <div className="mb-2 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-sm text-amber-700">
                  {attachedFile.isImage ? <Image className="w-4 h-4 flex-shrink-0" /> : <FileText className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate flex-1">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="text-amber-400 hover:text-amber-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attached link preview */}
              {attachedLink && (
                <div className="mb-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-700">
                  <Link className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{attachedLink.url}</span>
                  <button onClick={() => setAttachedLink(null)} className="text-blue-400 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Link input popup */}
              {showLinkInput && (
                <div className="mb-2 flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={linkInputValue}
                    onChange={e => setLinkInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleLinkAttach(); if (e.key === 'Escape') { setShowLinkInput(false); setLinkInputValue(""); } }}
                    placeholder="Paste a URL (e.g. Wikipedia article, YouTube, notes...)"
                    className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <Button size="sm" onClick={handleLinkAttach} className="bg-blue-500 hover:bg-blue-600 rounded-xl">Attach</Button>
                  <button onClick={() => { setShowLinkInput(false); setLinkInputValue(""); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex gap-1.5 items-end">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileAttach} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || loading}
                  className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 transition-colors disabled:opacity-40"
                  title="Attach study guide (PDF or image)"
                >
                  {uploadingFile ? <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowLinkInput(v => !v)}
                  disabled={loading || !!attachedLink}
                  className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors disabled:opacity-40"
                  title="Attach a link"
                >
                  <Link className="w-4 h-4" />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent placeholder:text-gray-400 max-h-28"
                  style={{ minHeight: '40px' }}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={(!input.trim() && !attachedFile && !attachedLink) || loading || uploadingFile}
                  className="bg-amber-500 hover:bg-amber-600 h-10 w-10 p-0 flex-shrink-0 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-300 text-center mt-2">Your tutor remembers your profile and adapts to you ✨</p>
            </>
          ) : (
            <p className="text-xs text-center text-amber-500 font-medium py-2">Keep logging assignments to unlock AI chat!</p>
          )}
        </div>
      </div>

      {/* Progress to Premium Indicator (non-premium only) */}
      {!isPremium && (hasSchool ? loyaltyTarget > 0 : true) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-3 flex-shrink-0 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)" }}>
          {hasSchool ? (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500">🏆 Progress to AI Tutor</span>
                <span className="text-xs text-gray-400">{qualifyingSchoolAssignmentCount} / {loyaltyTarget} qualifying assignments</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa)" }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.round((qualifyingSchoolAssignmentCount / loyaltyTarget) * 100))}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{loyaltyTarget - qualifyingSchoolAssignmentCount > 0 ? `${loyaltyTarget - qualifyingSchoolAssignmentCount} more school-wide qualifying assignments to unlock the AI Tutor!` : 'Almost there!'}</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500">🏆 Progress to AI Study Assistant</span>
                <span className="text-xs text-gray-400">{qualifyingMyAssignmentCount} / 100 qualifying assignments</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa)" }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, qualifyingMyAssignmentCount)}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{100 - qualifyingMyAssignmentCount > 0 ? `Log ${100 - qualifyingMyAssignmentCount} more qualifying assignments to unlock the AI Study Assistant!` : 'Almost there!'}</p>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}