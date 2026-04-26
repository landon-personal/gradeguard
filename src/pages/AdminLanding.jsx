import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { ArrowRight, BarChart3, CheckCircle2, School, Shield, Sparkles, Users, AlertTriangle } from "lucide-react";
import AmbientBackground from "../components/layout/AmbientBackground";
import usePerformanceMode from "../hooks/usePerformanceMode";

const approvalReasons = [
  {
    icon: Users,
    title: "Help students follow through",
    description: "Give your students one place to track assignments, tests, and daily priorities instead of juggling scattered tools."
  },
  {
    icon: BarChart3,
    title: "Get admin visibility",
    description: "See school-level engagement, progress trends, and student activity without adding another complicated system."
  },
  {
    icon: AlertTriangle,
    title: "Use safer rollout controls",
    description: "School codes, flagged-message review, and admin oversight help you support safer student use."
  },
  {
    icon: Sparkles,
    title: "Add useful AI support",
    description: "Give students help with prioritizing work, preparing for tests, and staying organized without increasing staff workload."
  }
];

const adminFeatures = [
  "Launch a school-branded experience with your own name, logo, and colors",
  "Control student onboarding with school codes",
  "Review school-level analytics for engagement and academic activity",
  "Use flagged-message review for admin oversight",
  "See student progress across the school workspace",
  "Give students planning tools that build stronger organization and study habits"
];

const complianceCards = [
  {
    title: "Support your FERPA review",
    description: "GradeGuard is framed as a school-managed planning workspace with admin visibility and privacy-first controls."
  },
  {
    title: "Support your COPPA review",
    description: "The page emphasizes school oversight, safer student use, and clear supervision instead of consumer-style social positioning."
  },
  {
    title: "Give your team a clearer review process",
    description: "Privacy, oversight, and safety are presented as core decision points so you can evaluate fit more confidently."
  }
];

export default function AdminLanding() {
  const { lowPerformance } = usePerformanceMode();
  const glassCard = {
    background: lowPerformance ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.55)",
    backdropFilter: lowPerformance ? "blur(12px)" : "blur(20px)",
    WebkitBackdropFilter: lowPerformance ? "blur(12px)" : "blur(20px)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 8px 32px rgba(99,102,241,0.10)"
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #e8eaf6 0%, #ede7f6 30%, #e3f2fd 60%, #f3e5f5 100%)"
      }}
    >
      <AmbientBackground lowPerformance={lowPerformance} />

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-14 space-y-6 sm:space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10"
          style={glassCard}
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-white/70 border border-white/80 mb-4 sm:mb-6">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Built for school admin conversations
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-8 items-center">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Give your students a planning platform you can roll out with confidence.
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                GradeGuard helps your students stay organized, prepare for tests, and build better study habits while giving you stronger visibility, safer controls, and privacy-first positioning.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6">
                <Link to={createPageUrl("Onboarding") + "?mode=signup&role=admin"} className="w-full sm:w-auto">
                  <button className="inline-flex items-center justify-center gap-2 px-5 h-10 w-full sm:w-auto rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg hover:bg-indigo-700 transition-colors">
                    Set up school <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link to="/" className="w-full sm:w-auto">
                  <button className="inline-flex items-center justify-center gap-2 px-5 h-10 w-full sm:w-auto rounded-xl bg-white/80 text-gray-800 text-sm font-semibold border border-white shadow-sm hover:bg-white transition-colors">
                    Back to main site
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 text-xs sm:text-sm">
                <Link to="/security" className="inline-flex items-center rounded-xl bg-white/75 px-3 py-2 font-medium text-gray-800 border border-white shadow-sm hover:bg-white transition-colors">
                  Security & Privacy
                </Link>
                <Link to="/student-data-privacy" className="inline-flex items-center rounded-xl bg-white/75 px-3 py-2 font-medium text-gray-800 border border-white shadow-sm hover:bg-white transition-colors">
                  FERPA & COPPA
                </Link>
                <div className="relative group">
                  <span className="inline-flex items-center rounded-xl bg-white/55 px-3 py-2 font-medium text-gray-400 border border-white shadow-sm cursor-not-allowed">
                    Pilot Results
                  </span>
                  <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    Coming soon
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-5">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white/65 border border-white/80 shadow-sm">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> FERPA-ready
                </div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white/65 border border-white/80 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /> COPPA-ready
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-slate-900 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <School className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Admin overview</p>
                  <h2 className="font-semibold text-lg">Why this works for your school</h2>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Improve student organization without adding teacher complexity",
                  "Use analytics, oversight, and school-managed rollout controls",
                  "Review privacy and safety in a FERPA/COPPA-aware frame",
                  "Get student engagement and flagged-message visibility"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {approvalReasons.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-2xl sm:rounded-3xl p-4 sm:p-5"
              style={glassCard}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 sm:mb-4">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-6">
          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7" style={glassCard}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Privacy and policy</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">FERPA & COPPA review</h2>
              </div>
            </div>
            <div className="space-y-4">
              {complianceCards.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/70 border border-white p-4">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              This page positions the app for FERPA and COPPA discussions with school admins; districts should still validate local policy and legal requirements before rollout.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7" style={glassCard}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">What you get</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What this gives your school</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {adminFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 border border-white p-4">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-center text-white"
          style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.92) 0%, rgba(124,58,237,0.92) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 16px 48px rgba(99,102,241,0.28)"
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Review the school version of GradeGuard.</h2>
          <p className="text-indigo-100 mt-3 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            This page focuses on student outcomes, admin oversight, and FERPA/COPPA-aware messaging so you can evaluate whether the platform fits your school.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link to={createPageUrl("Onboarding") + "?mode=signup&role=admin"}>
              <button className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors">
                Create school workspace <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/">
              <button className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
                View student homepage
              </button>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}