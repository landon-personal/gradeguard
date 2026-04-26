import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { GraduationCap, BookOpen, Trophy, MessageCircle, FlaskConical, ArrowRight, CheckCircle, CheckCircle2, AlertTriangle, Sparkles, Brain, Zap, Star, Users, TrendingUp, Clock, Shield, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import AmbientBackground from "../components/layout/AmbientBackground";
import usePerformanceMode from "../hooks/usePerformanceMode";

const features = [
{ icon: BookOpen, title: "Assignment Tracker", description: "Never miss a deadline again. Track every assignment with due dates, difficulty ratings, and smart status updates." },
{ icon: FlaskConical, title: "Test Prep Engine", description: "Add upcoming tests and get day-by-day study plans tailored to your schedule and learning style." },
{ icon: Trophy, title: "Gamified Progress", description: "Earn XP, unlock badges, and compete with classmates on the leaderboard — studying has never felt this rewarding." },
{ icon: MessageCircle, title: "AI Study Assistant", description: "Generate flashcards from your notes, turn assignments into step-by-step plans, and get concepts explained in plain English." }];


const aiCapabilities = [
{ icon: "🃏", text: "Generate flashcards from your notes instantly" },
{ icon: "📋", text: "Turn vague assignments into step-by-step action plans" },
{ icon: "💡", text: "Explain complex concepts in simple terms" },
{ icon: "📅", text: "Build a personalized study schedule around your life" },
{ icon: "🎯", text: "Prioritize what to work on today based on deadlines" },
{ icon: "📊", text: "Track your progress and surface weak spots" }];


const testimonials = [
{ name: "Maya R.", grade: "10th Grade", school: "Lincoln High", text: "I went from missing deadlines every week to being the most organized person in my friend group. GradeGuard literally changed how I study.", avatar: "🧑‍🎓" },
{ name: "Jordan T.", grade: "11th Grade", school: "Riverside Academy", text: "The AI study plan is insane. It figured out I was weak in calculus and scheduled extra sessions before my exam. I got a B+ when I expected a C.", avatar: "👩‍🎓" },
{ name: "Priya K.", grade: "9th Grade", school: "Summit Prep", text: "The leaderboard makes me actually want to finish my homework. I'm competing with my friends and we're all doing better because of it.", avatar: "🧑‍🏫" }];


const loyaltyPerks = [
{ icon: "🎯", title: "Early Access", description: "Be first to try new features before anyone else." },
{ icon: "🏅", title: "Exclusive Badges", description: "Earn badges only available to founding members." },
{ icon: "⭐", title: "Founder Status", description: "Permanently marked as a GradeGuard OG on the leaderboard." },
{ icon: "🎁", title: "Free Premium (Forever)", description: "When premium launches, founding members get it free — always." }];


const STATIC_STATS = [
{ value: "94%", label: "Report less stress" },
{ value: "3.2×", label: "More assignments completed on time" }];


export default function HomePage() {
  const navigate = useNavigate();

  // SEO: add semantic heading structure via noscript fallback for crawlers
  useEffect(() => {
    // Update canonical for subdomains
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.origin + "/";
    // Update meta description dynamically if on a school subdomain
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = `GradeGuard for ${parts[0].toUpperCase()} — AI-powered study planner. Track assignments, prep for tests, and study smarter.`;
    }
  }, []);
  const [schoolName, setSchoolName] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [studentCount, setStudentCount] = useState(null);
  const [openWhyIndex, setOpenWhyIndex] = useState(null);
  const { lowPerformance } = usePerformanceMode();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle cross-domain logout
    const ggLogout = params.get("logout");
    if (ggLogout === "1") {
      localStorage.removeItem("gg_user_email");
      localStorage.removeItem("gg_auth_token");
      const url = new URL(window.location.href);
      url.searchParams.delete("logout");
      window.history.replaceState({}, "", url.toString());
    }

    // Handle cross-domain login handoff
    const ggLogin = params.get("gg_login");
    const ggToken = params.get("gg_token");
    const nextUrl = params.get("next");
    if (ggLogin) {
      localStorage.setItem("gg_user_email", ggLogin);
      if (ggToken) localStorage.setItem("gg_auth_token", ggToken);
      // If a next URL is provided (e.g. subdomain dashboard), redirect there with auth params
      if (nextUrl) {
        const target = new URL(decodeURIComponent(nextUrl));
        target.searchParams.set("gg_login", ggLogin);
        if (ggToken) target.searchParams.set("gg_token", ggToken);
        window.location.href = target.toString();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("gg_login");
      url.searchParams.delete("gg_token");
      window.history.replaceState({}, "", url.toString());
    }

    const paramCode = params.get("school");
    const host = window.location.hostname;
    const parts = host.split(".");
    const subdomainCode = parts.length > 2 ? parts[0].toUpperCase() : null;
    const code = paramCode?.toUpperCase() || subdomainCode;
    if (code) {
      base44.entities.School.filter({ school_code: code }).then((schools) => {
        if (schools && schools[0]) setSchoolName(schools[0].name);
      }).catch(() => {});
    }

    const userEmail = ggLogin || localStorage.getItem("gg_user_email");
    const storedToken = localStorage.getItem("gg_auth_token");
    if (userEmail && storedToken) {
      base44.functions.invoke("getStudentProfile", { token: storedToken }).then((res) => {
        const profile = res.data;
        if (profile?.error === "TOKEN_EXPIRED") {
          localStorage.removeItem("gg_user_email");
          localStorage.removeItem("gg_auth_token");
          return;
        }
        if (profile?.onboarding_completed) {
          const host = window.location.hostname;
          if (profile.school_code && (host === "gradeguard.org" || host === "www.gradeguard.org")) {
            const dashboardPath = profile.is_school_admin ? "AdminDashboard" : "Dashboard";
            let redirectUrl = `https://${profile.school_code.toLowerCase()}.gradeguard.org/${dashboardPath}?gg_login=${encodeURIComponent(userEmail)}&gg_token=${encodeURIComponent(storedToken)}`;
            window.location.href = redirectUrl;
            return;
          }
          navigate(profile.is_school_admin ? createPageUrl("AdminDashboard") : createPageUrl("Dashboard"));
        } else if (!profile?.user_email) {
          localStorage.removeItem("gg_user_email");
          localStorage.removeItem("gg_auth_token");
        }
      }).catch(() => {
        localStorage.removeItem("gg_user_email");
        localStorage.removeItem("gg_auth_token");
      });
    } else if (userEmail && !storedToken) {
      // Has email but no token — stale session
      localStorage.removeItem("gg_user_email");
    }

    // Handle session expired redirect
    const sessionExpired = params.get("session_expired");
    if (sessionExpired === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("session_expired");
      window.history.replaceState({}, "", url.toString());
      // Show toast after a tick so it renders
      setTimeout(() => {
        import("sonner").then(({ toast }) => toast.error("Your session expired. Please log in again."));
      }, 500);
    }

    const interval = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const glassCard = {
    background: lowPerformance ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.45)",
    backdropFilter: lowPerformance ? "blur(12px)" : "blur(20px)",
    WebkitBackdropFilter: lowPerformance ? "blur(12px)" : "blur(20px)",
    border: "1px solid rgba(255,255,255,0.65)",
    boxShadow: "0 4px 24px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.9)"
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #e8eaf6 0%, #ede7f6 30%, #e3f2fd 60%, #f3e5f5 100%)",
      backgroundSize: lowPerformance ? "100% 100%" : "400% 400%",
      animation: lowPerformance ? "none" : "gradientShift 12s ease infinite"
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <AmbientBackground lowPerformance={lowPerformance} />

      {/* ─── HERO ─── */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium text-indigo-700"
          style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 2px 12px rgba(99,102,241,0.08)" }}>
          🎓 Made for students, by students
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-3 drop-shadow-sm">

          Study Smarter with{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            GradeGuard.
          </span>
        </motion.h1>

        {schoolName &&
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }} className="text-base text-gray-500 mb-2">
            for <span className="font-semibold text-gray-700">{schoolName}</span>
          </motion.p>
        }

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed mt-2">

          GradeGuard tracks your assignments, preps you for tests, and uses AI to build a personalized study plan — so you can spend less time stressing and more time actually learning.
        </motion.p>

        {/* CTA buttons */}
        <div className="mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl("Onboarding") + "?mode=signup"} className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(99,102,241,0.45)" }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-2xl text-base font-semibold text-white transition-colors"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.9) 100%)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 8px 32px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                Get Started Free <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/for-admins" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-2xl text-base font-semibold text-slate-900 transition-colors"
                style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.78)", boxShadow: "0 4px 20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.85)" }}>
                <Shield className="w-5 h-5 text-indigo-600" />
                For School Admins
              </motion.button>
            </Link>
            <Link to={createPageUrl("Onboarding")} className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-2xl text-base font-semibold text-indigo-700 transition-colors"
                style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 20px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
                Log In
              </motion.button>
            </Link>
          </motion.div>


        </div>

        {/* Stats bar */}
        


















      </section>

      {/* ─── MOCK DASHBOARD PREVIEW ─── */}
      <section className="relative max-w-5xl mx-auto px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 24px 64px rgba(99,102,241,0.2)" }}>

          {/* Mac browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-3 h-6 rounded-lg bg-gray-100 flex items-center px-3">
              <span className="text-xs text-gray-400">gradeguard.org/dashboard</span>
            </div>
          </div>



















          {/* Mock dashboard content — matches real Dashboard layout */}
          <div className="p-4 md:p-6 space-y-4" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #ede7f6 30%, #e3f2fd 60%, #f3e5f5 100%)" }}>

            {/* Hero greeting card */}
            <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.88) 0%, rgba(139,92,246,0.88) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <h3 className="text-lg md:text-xl font-bold">Good morning, Jordan! 👋</h3>
              <p className="text-indigo-100 mt-0.5 text-sm">You have 4 assignments to work on today.</p>
              <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
                {[
                { icon: BookOpen, value: "4", label: "Pending" },
                { icon: CheckCircle2, value: "2", label: "Done today" },
                { icon: AlertTriangle, value: "1", label: "Overdue", red: true }].
                map(({ icon: Icon, value, label, red }) =>
                <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                    <div className={`flex items-center justify-center gap-1 text-base font-bold ${red ? "text-red-200" : ""}`}>
                      <Icon className="w-4 h-4" />{value}
                    </div>
                    <div className="text-xs text-indigo-100 mt-0.5">{label}</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Study Plan card */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.75)" }}>
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/50">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">AI Study Plan</p>
                  <p className="text-xs text-gray-500">Personalized for today based on your workload</p>
                </div>
              </div>
              {/* Tip */}
              <div className="mx-4 mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-500 text-xs">💡</span>
                <p className="text-xs text-amber-800">Start with Math today — tackle your hardest subject first while your mind is fresh.</p>
              </div>
              {/* Todo items */}
              <div className="p-3 space-y-2">
                {[
                { rank: 1, name: "Problem Set 4.3", subject: "Math", time: 40, urgency: "High", gradient: "from-red-500 to-orange-400", why: "Due tomorrow and rated hard — tackle it first while your energy is highest." },
                { rank: 2, name: "Draft essay thesis", subject: "English", time: 25, urgency: "Medium", gradient: "from-orange-500 to-amber-400", why: "Due in 2 days. Getting the thesis down now will make the rest of the essay easier." },
                { rank: 3, name: "Review Chapter 7 for test", subject: "Bio", time: 30, urgency: "Medium", gradient: "from-amber-500 to-yellow-400", why: "Your test is in 3 days — spreading review over multiple sessions improves retention." }].
                map(({ rank, name, subject, time, urgency, gradient, why }, i) => {
                  const isOpen = openWhyIndex === i;
                  return (
                  <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-start p-3 gap-2.5">
                      <div className={`flex-shrink-0 w-6 h-6 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                        {rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-xs">{name}</span>
                          <span className="text-xs border border-gray-200 rounded-full px-1.5 py-0.5 text-gray-500">{subject}</span>
                          <span className={`text-xs border rounded-full px-1.5 py-0.5 font-medium ${urgency === "High" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>{urgency}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />{time} min
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setOpenWhyIndex(isOpen ? null : i)}
                            className="flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            Why?
                            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                              <ChevronRight className="w-4 h-4" />
                            </motion.span>
                          </motion.button>
                        </div>
                        <AnimatePresence initial={false}>
                           {isOpen && (
                             <motion.p
                               key="why"
                               initial={{ opacity: 0, height: 0, marginTop: 0 }}
                               animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                               exit={{ opacity: 0, height: 0, marginTop: 0 }}
                               transition={{ duration: 0.22, ease: "easeInOut" }}
                               className="text-xs text-gray-500 bg-indigo-50 rounded-lg p-3 leading-relaxed border border-indigo-100 overflow-hidden"
                             >
                               {why}
                             </motion.p>
                           )}
                         </AnimatePresence>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-gray-200 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                );}
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2 drop-shadow-sm">Everything you need to succeed</h2>
        <p className="text-center text-gray-500 text-sm mb-8 max-w-xl mx-auto">One platform to replace the sticky notes, the forgotten deadlines, and the last-minute panic sessions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description }, i) =>
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(99,102,241,0.13)" }}
            className="rounded-2xl p-5 flex gap-4"
            style={glassCard}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── AI CAPABILITIES ─── */}
      <section className="relative max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-3xl p-8 md:p-10" style={glassCard}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Your AI study assistant</h2>
          </div>
          <p className="text-gray-500 text-sm mb-7 ml-13">Not just a chatbot — a tutor that knows your schedule, your deadlines, and your weak spots.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiCapabilities.map(({ icon, text }) =>
            <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/70">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      
































      {/* ─── LOYALTY / FOUNDING MEMBERS ─── */}
      <section className="relative max-w-5xl mx-auto px-4 py-10">
        





































      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative max-w-5xl mx-auto px-4 py-10 pb-8">
        <div className="rounded-3xl p-8 md:p-12 text-center"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 16px 48px rgba(99,102,241,0.3)" }}>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Your grades won't fix themselves.</h2>
          <p className="text-indigo-100 text-sm md:text-base max-w-xl mx-auto mb-8">
            Join {studentCount >= 1000 ? `${studentCount.toLocaleString()}+ students` : "students"} who use GradeGuard to stay organized, study smarter, and actually feel on top of their schoolwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl("Onboarding") + "?mode=signup"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 px-8 h-12 rounded-2xl text-base font-semibold text-indigo-700"
                style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                Get started free <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to={createPageUrl("Onboarding")}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 h-12 rounded-2xl text-base font-semibold text-white"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                Log in
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.72)", boxShadow: "0 8px 28px rgba(15,23,42,0.06)" }}>
          <div>
            <p className="text-sm font-semibold text-gray-900">School trust resources</p>
            <p className="text-sm text-gray-500">Privacy, security, student-data positioning, and pilot outcomes in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/privacy" className="rounded-xl bg-white/80 px-3 py-2 text-gray-700 border border-white shadow-sm hover:bg-white transition-colors">Privacy</Link>
            <Link to="/terms" className="rounded-xl bg-white/80 px-3 py-2 text-gray-700 border border-white shadow-sm hover:bg-white transition-colors">Terms</Link>
            <Link to="/student-data-privacy" className="rounded-xl bg-white/80 px-3 py-2 text-gray-700 border border-white shadow-sm hover:bg-white transition-colors">FERPA & COPPA</Link>
            <Link to="/security" className="rounded-xl bg-white/80 px-3 py-2 text-gray-700 border border-white shadow-sm hover:bg-white transition-colors">Security</Link>
            <div className="relative group">
              <span className="rounded-xl bg-white/60 px-3 py-2 text-gray-400 border border-white shadow-sm cursor-not-allowed inline-flex">Pilot Results</span>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>);

}