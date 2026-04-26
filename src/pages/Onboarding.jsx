import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { GraduationCap, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import QuestionCard from "../components/onboarding/QuestionCard";

const QUESTIONS = [
  {
    key: "study_time",
    question: "When do you do your best work?",
    options: [
      { value: "morning", label: "Morning", description: "Before noon, fresh and focused" },
      { value: "afternoon", label: "Afternoon", description: "After school hours" },
      { value: "evening", label: "Evening", description: "After dinner, 6–9pm" },
      { value: "night", label: "Night", description: "Late night, 9pm+" }
    ]
  },
  {
    key: "break_frequency",
    question: "How often do you like to take breaks when studying?",
    options: [
      { value: "frequent", label: "Frequent breaks", description: "Every 15–20 minutes" },
      { value: "moderate", label: "Moderate breaks", description: "Every 30–45 minutes" },
      { value: "rarely", label: "Rarely", description: "I prefer long, uninterrupted sessions" }
    ]
  },
  {
    key: "session_length",
    question: "What's your ideal study session length?",
    options: [
      { value: "short", label: "Short", description: "Under 30 minutes" },
      { value: "medium", label: "Medium", description: "30–60 minutes" },
      { value: "long", label: "Long", description: "60+ minutes" }
    ]
  },
  {
    key: "deadline_approach",
    question: "How do you typically handle deadlines?",
    options: [
      { value: "early", label: "Well in advance", description: "I like to finish early" },
      { value: "balanced", label: "Steady pace", description: "A bit each day leading up" },
      { value: "pressure", label: "Deadline pressure", description: "I work better under pressure" }
    ]
  },
  {
    key: "study_environment",
    question: "What's your ideal study environment?",
    options: [
      { value: "quiet", label: "Complete silence", description: "No distractions" },
      { value: "light_noise", label: "Light background noise", description: "Café-style ambiance" },
      { value: "music", label: "Music", description: "With headphones on" }
    ]
  },
  {
    key: "easiest_subjects",
    question: "Which subjects feel easiest for you?",
    multiSelect: true,
    options: [
      { value: "Math", label: "Math" },
      { value: "Science", label: "Science" },
      { value: "English", label: "English" },
      { value: "Social Studies", label: "Social Studies" },
      { value: "Foreign Language", label: "Foreign Language" },
      { value: "Art", label: "Art" },
      { value: "Computer Science", label: "CS / Tech" }
    ]
  },
  {
    key: "hardest_subjects",
    question: "Which subjects are most challenging for you?",
    multiSelect: true,
    options: [
      { value: "Math", label: "Math" },
      { value: "Science", label: "Science" },
      { value: "English", label: "English" },
      { value: "Social Studies", label: "Social Studies" },
      { value: "Foreign Language", label: "Foreign Language" },
      { value: "Art", label: "Art" },
      { value: "Computer Science", label: "CS / Tech" }
    ]
  },
  {
    key: "difficult_approach",
    question: "When you have a difficult assignment, you tend to...",
    options: [
      { value: "tackle_first", label: "Tackle it first", description: "Get it out of the way" },
      { value: "save_last", label: "Save it for last", description: "Warm up with easier tasks first" },
      { value: "break_chunks", label: "Break it into chunks", description: "Work on it in small pieces over time" }
    ]
  },
  {
    key: "learning_style",
    question: "How deeply do you usually study material?",
    options: [
      { value: "deep", label: "Deep understanding", description: "I want to truly get it before moving on" },
      { value: "balanced", label: "Balanced", description: "Mix of depth and breadth" },
      { value: "surface", label: "Surface level first", description: "Quick overview, revisit if needed" }
    ]
  },
  {
    key: "subject_balance",
    question: "When juggling multiple subjects, you prefer to...",
    options: [
      { value: "one_at_a_time", label: "One at a time", description: "Complete one before moving on" },
      { value: "rotate", label: "Rotate subjects", description: "Switch every 30 min for variety" },
      { value: "priority_first", label: "Priority first", description: "Most urgent subject takes the most time" }
    ]
  }
];

// Password hashing is now handled server-side by authenticateUser backend function

export default function OnboardingPage() {
  const navigate = useNavigate();
  // -1 = auth (login/signup), 0 = school code, 1 = name, 2+ = questions
  const [step, setStep] = useState(-1);

  // If already logged in (or just handed off via gg_login param), redirect to dashboard
  useEffect(() => {
    // First, handle cross-domain login handoff
    const params = new URLSearchParams(window.location.search);
    const ggLogin = params.get("gg_login");
    if (ggLogin) {
      localStorage.setItem("gg_user_email", ggLogin);
      const url = new URL(window.location.href);
      url.searchParams.delete("gg_login");
      window.history.replaceState({}, "", url.toString());
    }

    const email = ggLogin || localStorage.getItem("gg_user_email");
    if (!email) return;
    secureEntity("StudentProfile").filter({ user_email: email }).then(profiles => {
      const profile = profiles[0];
      if (profile?.onboarding_completed) {
        navigate(profile.is_school_admin ? createPageUrl("AdminDashboard") : createPageUrl("Dashboard"));
      }
    }).catch(() => {
      // silently ignore auth errors on onboarding page
    });
  }, []);
  const urlParams = new URLSearchParams(window.location.search);
  const [authMode, setAuthMode] = useState(urlParams.get("mode") === "signup" || urlParams.get("role") === "admin" ? "signup" : "login"); // "login" | "signup"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdminSignup, setIsAdminSignup] = useState(urlParams.get("role") === "admin");
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [existingProfile, setExistingProfile] = useState(null);

  // Auto-detect school code from subdomain (e.g. rfsa.base44.app or rfsa.gradeguard.org)
  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2) {
      const code = parts[0].toUpperCase();
      setSchoolCode(code);
    }
    // Also support ?school= param
    const params = new URLSearchParams(window.location.search);
    const paramCode = params.get("school");
    if (paramCode) setSchoolCode(paramCode.toUpperCase());

  }, []);

  const handleAuth = async () => {
    setAuthError("");
    if (!authEmail.trim() || !authPassword.trim()) { setAuthError("Please fill in all fields."); return; }
    if (authMode === "signup" && !authName.trim()) { setAuthError("Please enter your name."); return; }
    if (authMode === "signup" && authPassword.length < 8) { setAuthError("Password must be at least 8 characters."); return; }
    setAuthLoading(true);
    try {
      // Helper: redirect to school subdomain if needed
      const redirectIfSchoolSubdomain = (schoolCode) => {
        if (!schoolCode) return false;
        const host = window.location.hostname;
        const subdomain = schoolCode.toLowerCase();
        // Only redirect if we're NOT already on the school's subdomain
        if (host === "gradeguard.org" || host === "www.gradeguard.org") {
          window.location.href = `https://${subdomain}.gradeguard.org`;
          return true;
        }
        return false;
      };

      if (authMode === "login") {
        // Authenticate via backend function (server-side password verification + JWT)
        const response = await base44.functions.invoke("authenticateUser", {
          email: authEmail.trim(),
          password: authPassword,
          action: "login",
        });
        const result = response.data;
        if (result.error) { setAuthError(result.error); setAuthLoading(false); return; }

        // Store token and email
        localStorage.setItem("gg_auth_token", result.token);
        localStorage.setItem("gg_user_email", result.email);

        if (result.school_code) {
          const host = window.location.hostname;
          const dashboardPage = result.is_school_admin ? "AdminDashboard" : "Dashboard";
          const subdomain = result.school_code.toLowerCase();
          if (host === "gradeguard.org" || host === "www.gradeguard.org") {
            window.location.href = `https://${subdomain}.gradeguard.org/${dashboardPage}?gg_login=${encodeURIComponent(result.email)}&gg_token=${encodeURIComponent(result.token)}`;
            return;
          } else {
            const nextUrl = encodeURIComponent(`https://${host}/${dashboardPage}`);
            window.location.href = `https://gradeguard.org/?gg_login=${encodeURIComponent(result.email)}&gg_token=${encodeURIComponent(result.token)}&next=${nextUrl}`;
            return;
          }
        }
        if (result.onboarding_completed) {
          navigate(result.is_school_admin ? createPageUrl("AdminDashboard") : createPageUrl("Dashboard"));
          return;
        }
        // Need to fetch full profile for onboarding continuation
        const profiles = await secureEntity("StudentProfile").filter({ user_email: result.email });
        const profile = profiles[0];
        setExistingProfile(profile);
        setFirstName(profile?.user_name?.split(" ")[0] || "");
        setStep(profile?.is_school_admin ? "admin-school" : 0);
      } else {
        // Signup via backend function (server-side bcrypt hashing + JWT)
        if (isAdminSignup) {
          const response = await base44.functions.invoke("authenticateUser", {
            email: authEmail.trim(),
            password: authPassword,
            name: authName.trim(),
            action: "signup",
          });
          const result = response.data;
          if (result.error) { setAuthError(result.error); setAuthLoading(false); return; }
          localStorage.setItem("gg_auth_token", result.token);
          localStorage.setItem("gg_user_email", result.email);
          navigate(createPageUrl("AdminDashboard"));
          return;
        }

        // Student signup — just validate email availability via backend
        const response = await base44.functions.invoke("authenticateUser", {
          email: authEmail.trim(),
          password: authPassword,
          name: authName.trim(),
          action: "signup",
        });
        const result = response.data;
        if (result.error) { setAuthError(result.error); setAuthLoading(false); return; }
        localStorage.setItem("gg_auth_token", result.token);
        localStorage.setItem("gg_user_email", result.email);
        setFirstName(authName.trim().split(" ")[0]);
        setStep(0);
      }
    } catch (e) {
      setAuthError(e?.message || "Something went wrong. Please try again.");
    }
    setAuthLoading(false);
  };

  const currentQuestion = QUESTIONS[step - 2]; // step 0=school, 1=name, 2+=questions
  const totalSteps = QUESTIONS.length + 2;
  const progress = (step / totalSteps) * 100;

  const handleSchoolCodeNext = async () => {
    if (!schoolCode.trim()) {
      setSchoolError("Please enter your school code.");
      return;
    }
    try {
      const schools = await secureEntity("School").filter({ school_code: schoolCode.trim().toUpperCase() });
      if (!schools || schools.length === 0) {
        setSchoolError("School code not found. Please check with your school administrator.");
        return;
      }
      setSchoolError("");
      const code = schoolCode.trim().toUpperCase();
      setAnswers(prev => ({ ...prev, school_code: code, school_id: schools[0].id }));
      setStep(1); // go to name step — redirect happens after onboarding is complete
    } catch (e) {
      console.error("School code lookup failed:", e);
      setSchoolError("Couldn't check that code right now. Please try again in a moment.");
    }
  };

  const handleAnswerChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return firstName.trim().length > 0;
    const q = QUESTIONS[step - 2];
    if (q.multiSelect) return (answers[q.key] || []).length > 0;
    return !!answers[q.key];
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    const email = authEmail.trim();

    try {
      // Check if the school requires anonymization and generate an anonymous ID
      let anonymousId = null;
      if (answers.school_code) {
        const schoolsForAnon = await secureEntity("School").filter({ school_code: answers.school_code });
        const targetSchool = schoolsForAnon[0];
        if (targetSchool?.anonymize_students) {
          // Generate a unique anonymous ID
          const allProfiles = await secureEntity("StudentProfile").filter({ school_code: answers.school_code });
          const existingIndexes = allProfiles
            .filter(p => p.anonymous_id)
            .map(p => { const m = p.anonymous_id.match(/-(\d{4})-/); return m ? parseInt(m[1]) : 0; });
          const nextIdx = existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 1;
          const prefix = answers.school_code.substring(0, 4).toUpperCase();
          const num = String(nextIdx).padStart(4, "0");
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
          const suffix = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
          anonymousId = `${prefix}-${num}-${suffix}`;
        }
      }

      // Password is already hashed server-side by authenticateUser — only save preferences here
      const profileData = {
        user_name: authMode === "signup" ? authName.trim() : existingProfile?.user_name || firstName.trim(),
        school_code: answers.school_code,
        school_id: answers.school_id,
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        onboarding_completed: true,
        study_time: answers.study_time,
        break_frequency: answers.break_frequency,
        session_length: answers.session_length,
        deadline_approach: answers.deadline_approach,
        study_environment: answers.study_environment,
        easiest_subjects: answers.easiest_subjects,
        hardest_subjects: answers.hardest_subjects,
        difficult_approach: answers.difficult_approach,
        learning_style: answers.learning_style,
        subject_balance: answers.subject_balance
      };

      if (existingProfile) {
        await secureEntity("StudentProfile").update(existingProfile.id, profileData);
      } else {
        // Profile was already created during signup, find and update it
        const profiles = await secureEntity("StudentProfile").filter({ user_email: email });
        if (profiles[0]) {
          await secureEntity("StudentProfile").update(profiles[0].id, profileData);
        }
      }

      // After onboarding, redirect to school subdomain if on gradeguard.org
      const host = window.location.hostname;
      const schoolCodeFinal = answers.school_code;
      if (schoolCodeFinal && (host === "gradeguard.org" || host === "www.gradeguard.org")) {
        const storedToken = localStorage.getItem("gg_auth_token");
        let redirectUrl = `https://${schoolCodeFinal.toLowerCase()}.gradeguard.org/Dashboard?gg_login=${encodeURIComponent(email)}`;
        if (storedToken) redirectUrl += `&gg_token=${encodeURIComponent(storedToken)}`;
        window.location.href = redirectUrl;
        return;
      }
      navigate(createPageUrl("Dashboard"));
    } catch (e) {
      console.error("Failed to save onboarding profile:", e);
      setSaveError(e?.message || "Couldn't finish setting up your account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              GradeGuard
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {step === -1
              ? "Your personalized study planner"
              : step === 0
              ? "Let's get you set up in a few quick steps"
              : step === 1
              ? "Just a couple things before we start"
              : `Question ${step - 1} of ${QUESTIONS.length}`
            }
          </p>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {step === -1 ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex rounded-xl bg-gray-100 p-1 mb-2">
                  {["login", "signup"].map(m => (
                    <button
                      key={m}
                      onClick={() => { setAuthMode(m); setAuthError(""); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${authMode === m ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {m === "login" ? "Log In" : "Sign Up"}
                    </button>
                  ))}
                </div>
                {authMode === "signup" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                      <Input placeholder="e.g. Alex Johnson" value={authName} onChange={e => setAuthName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">I’m signing up as...</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div
                          className={`p-2.5 border rounded-lg cursor-pointer transition-all ${!isAdminSignup ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-gray-50 border-gray-200"}`}
                          onClick={() => setIsAdminSignup(false)}
                        >
                          <div className="flex items-start gap-2.5">
                            <input type="radio" checked={!isAdminSignup} onChange={() => {}} className="mt-0.5 w-4 h-4 accent-indigo-500 pointer-events-none" />
                            <div>
                              <p className="text-[13px] font-semibold text-gray-800 leading-tight">Student</p>
                              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">For most people — track assignments, tests, and study plans.</p>
                            </div>
                          </div>
                        </div>
                        <div className={`p-2.5 border rounded-lg cursor-pointer transition-all ${isAdminSignup ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200"}`} onClick={() => setIsAdminSignup(true)}>
                          <div className="flex items-start gap-2.5">
                            <input type="radio" checked={isAdminSignup} onChange={() => {}} className="mt-0.5 w-4 h-4 accent-amber-500 pointer-events-none" />
                            <div>
                              <p className="text-[13px] font-semibold text-gray-800 leading-tight">School Admin</p>
                              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">For school staff managing the school workspace.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <Input type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAuth()}
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {authError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authError}</p>}
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11" onClick={handleAuth} disabled={authLoading}>
                  {authLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
                  {!authLoading && <ArrowRight className="w-4 h-4" />}
                </Button>
                <p className="text-center text-xs text-gray-400">
                  {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }} className="text-indigo-600 hover:underline font-medium">
                    {authMode === "login" ? "Sign up" : "Log in"}
                  </button>
                </p>
              </motion.div>
            ) : step === 0 ? (
              <motion.div
                key="school-code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome! 👋</h2>
                  <p className="text-gray-500 mt-1.5 text-sm leading-relaxed">
                    First, enter the school code provided by your school administrator.
                  </p>
                </div>
                <div>
                  <Input
                    placeholder="Enter school code (e.g. ABC123)"
                    value={schoolCode}
                    onChange={e => { setSchoolCode(e.target.value.toUpperCase()); setSchoolError(""); }}
                    className="text-center font-mono text-lg tracking-widest uppercase"
                    maxLength={8}
                  />
                  {schoolError && (
                    <p className="text-sm text-red-500 mt-2 text-center">{schoolError}</p>
                  )}
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-12"
                  onClick={handleSchoolCodeNext}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => { setAnswers(prev => ({ ...prev, school_code: null, school_id: null })); setStep(1); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors text-center"
                >
                  I don't have a school code
                </button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="name-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">What's your name?</h2>
                  <p className="text-gray-500 mt-1.5 text-sm">
                    We'll use this to personalize your experience.
                  </p>
                </div>
                <Input
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="text-lg"
                  onKeyDown={e => e.key === 'Enter' && firstName.trim() && setStep(2)}
                  autoFocus
                />
              </motion.div>
            ) : (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QuestionCard
                  question={currentQuestion.question}
                  options={currentQuestion.options}
                  value={answers[currentQuestion.key]}
                  onChange={(value) => handleAnswerChange(currentQuestion.key, value)}
                  multiSelect={currentQuestion.multiSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step > 0 && step <= QUESTIONS.length + 1 && (
          <div className="flex justify-between mt-4">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              className="gap-2 text-gray-500"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {step < QUESTIONS.length + 1 ? (
              <Button
                disabled={!canProceed()}
                onClick={() => setStep(s => s + 1)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {saveError && (
                  <p className="text-xs text-red-600 max-w-xs text-right">{saveError}</p>
                )}
                <Button
                  disabled={!canProceed() || saving}
                  onClick={saveProfile}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {saving ? 'Setting up...' : 'Finish Setup'} {!saving && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}