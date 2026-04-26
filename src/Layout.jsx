import { Link, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, BookOpen, School, LogOut, Menu, X, Trophy, MessageCircle, FlaskConical, Users, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import NotificationBell from "./components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSchoolBrand } from "./components/SchoolBrand";
import FloatingStreakCounter from "./components/dashboard/FloatingStreakCounter";
import WhatsNewModal from "./components/updates/WhatsNewModal";
import AmbientBackground from "./components/layout/AmbientBackground";
import usePerformanceMode from "./hooks/usePerformanceMode";

const WHATS_NEW_RELEASE_DATE = new Date("2026-03-19T00:00:00.000Z");

// Handle cross-domain auth handoff (runs once per full page load)
(function handleCrossDomainAuth() {
  const p = new URLSearchParams(window.location.search);
  const login = p.get("gg_login");
  const token = p.get("gg_token");
  if (login) localStorage.setItem("gg_user_email", login);
  if (token) localStorage.setItem("gg_auth_token", token);
  if (login || token) {
    p.delete("gg_login");
    p.delete("gg_token");
    const remaining = p.toString();
    window.history.replaceState({}, "", window.location.pathname + (remaining ? "?" + remaining : ""));
  }
})();

export default function Layout({ children, currentPageName }) {
  // Set dynamic page title for SEO
  useEffect(() => {
    const pageTitles = {
      Home: "GradeGuard — AI-Powered Study Planner for Students",
      Dashboard: "Dashboard | GradeGuard",
      Assignments: "Assignments | GradeGuard",
      Tests: "Tests | GradeGuard",
      StudyAssistant: "AI Study Assistant | GradeGuard",
      Achievements: "Achievements | GradeGuard",
      StudyRooms: "Quiz Competition | GradeGuard",
      Friends: "Friends | GradeGuard",
      AdminDashboard: "Admin Dashboard | GradeGuard",

      Onboarding: "Get Started | GradeGuard",
      ChromeExtension: "Chrome Extension | GradeGuard",
      AdminLanding: "For School Admins | GradeGuard",
      PrivacyPolicy: "Privacy Policy | GradeGuard",
      TermsOfUse: "Terms of Use | GradeGuard",
      StudentDataPrivacy: "Student Data Privacy | GradeGuard",
      SecurityTrustCenter: "Security & Trust | GradeGuard",
      PilotResults: "Pilot Results | GradeGuard",
      CMSCompliance: "CMS Compliance | GradeGuard",
    };
    document.title = pageTitles[currentPageName] || "GradeGuard — AI-Powered Study Planner for Students";
  }, [currentPageName]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { lowPerformance } = usePerformanceMode();
  const location = useLocation();
  const seenMessageIdsRef = useRef(new Set());

  const userEmail = localStorage.getItem("gg_user_email");

  const ggToken = localStorage.getItem("gg_auth_token");

  const { data: profile = null } = useQuery({
    queryKey: ['student-profile', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getStudentProfile", { token: ggToken });
      if (res.data?.error === "TOKEN_EXPIRED") {
        localStorage.removeItem("gg_user_email");
        localStorage.removeItem("gg_auth_token");
        window.location.href = "/?session_expired=1";
        return null;
      }
      return res.data;
    },
    enabled: !!userEmail && !!ggToken
  });
  const user = profile ? { email: profile.user_email, full_name: profile.user_name } : null;
  const isAdmin = profile?.is_school_admin === true;

  const { data: schools = [] } = useQuery({
    queryKey: ['school-brand', profile?.school_code],
    queryFn: () => secureEntity("School").filter({ school_code: profile.school_code }),
    enabled: !!profile?.school_code
  });

  const { data: allConnections = [] } = useQuery({
    queryKey: ['layout-friend-connections', userEmail],
    queryFn: () => secureEntity("FriendConnection").list('-created_date', 200),
    enabled: !!userEmail
  });
  const school = schools[0] || null;
  const isAnonymized = school?.anonymize_students === true;
  const brand = {
    name: school?.brand_name || "GradeGuard",
    color: school?.brand_primary_color || null,
    logo_url: school?.brand_logo_url || null,
    tagline: school?.brand_tagline || null,
  };

  // For the Home page (logged-out), also detect school from subdomain
  const { schoolName: subdomainSchoolName } = useSchoolBrand();
  const pageSchoolName = school?.name || subdomainSchoolName;

  const isOnboarding = currentPageName === "Onboarding";

  const studentPrimaryNavItems = [
    { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { label: "Assignments", page: "Assignments", icon: BookOpen },
    { label: "Tests", page: "Tests", icon: FlaskConical },
    { label: "Study Assistant", page: "StudyAssistant", icon: MessageCircle },
  ];

  const studentSecondaryNavItems = [
    { label: "Achievements", page: "Achievements", icon: Trophy },
    ...(!isAnonymized ? [{ label: "Quiz Competition", page: "StudyRooms", icon: Users }] : []),
    ...(!isAnonymized ? [{ label: "Friends", page: "Friends", icon: Users }] : []),
  ];

  const adminNavItems = [
    { label: "Admin", page: "AdminDashboard", icon: School },
  ];

  const navItems = isAdmin ? [...adminNavItems] : (user && !isOnboarding ? [...studentPrimaryNavItems, ...studentSecondaryNavItems] : []);
  const desktopNavItems = isAdmin ? adminNavItems : (user && !isOnboarding ? studentPrimaryNavItems : []);
  const overflowNavItems = !isAdmin && user && !isOnboarding ? studentSecondaryNavItems : [];
  const hasActiveOverflowItem = overflowNavItems.some(({ page }) => page === currentPageName);
  const brandTargetPage = isAdmin ? "AdminDashboard" : "Dashboard";

  useEffect(() => {
    if (!profile || isAdmin || isOnboarding) return;

    const isExistingUser = profile.created_date && new Date(profile.created_date) < WHATS_NEW_RELEASE_DATE;
    if (isExistingUser && !profile.has_seen_post_quiz_update) {
      setShowWhatsNew(true);
    }
  }, [profile, isAdmin, isOnboarding]);

  const handleDismissWhatsNew = async (targetPage = null) => {
    setShowWhatsNew(false);

    if (profile?.id && !profile.has_seen_post_quiz_update) {
      await secureEntity("StudentProfile").update(profile.id, { has_seen_post_quiz_update: true });
    }

    if (targetPage) {
      window.location.href = createPageUrl(targetPage);
    }
  };

  useEffect(() => {
    if (!userEmail || isAnonymized) return;

    const unsubscribe = base44.entities.FriendMessage.subscribe((event) => {
      if (event.type !== 'create' || !event.data) return;

      const message = event.data;
      const activeConnectionId = new URLSearchParams(location.search).get('connectionId');
      if (message.recipient_email !== userEmail || message.sender_email === userEmail) return;
      if (currentPageName === 'Friends' && activeConnectionId === message.connection_id) return;
      if (seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);

      const connection = allConnections.find((item) => item.id === message.connection_id);
      const senderName = message.sender_name || connection?.member_names?.find((name) => name !== profile?.user_name) || message.sender_email;
      const openUrl = `${createPageUrl('Friends?connectionId=' + message.connection_id + '&tab=messages')}`;
      const preview = (message.content || '').length > 72 ? `${message.content.slice(0, 72)}...` : (message.content || 'New message');

      toast.custom((toastId) => (
        <button
          onClick={() => {
            toast.dismiss(toastId);
            window.location.href = openUrl;
          }}
          className="w-[360px] max-w-[calc(100vw-24px)] rounded-[28px] border border-white/70 bg-white/85 p-3 text-left shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-gray-900">{senderName}</p>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                  Message
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{preview}</p>
              <div className="mt-2 inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                Open chat
              </div>
            </div>
          </div>
        </button>
      ), {
        duration: 6000,
        position: 'top-right'
      });
    });

    return unsubscribe;
  }, [allConnections, currentPageName, location.search, profile?.user_name, userEmail, isAnonymized]);

  return (
    <MotionConfig reducedMotion={prefersReducedMotion || lowPerformance ? "always" : "never"} transition={prefersReducedMotion || lowPerformance ? { duration: 0.01 } : undefined}>
      <div className={`min-h-screen ${lowPerformance ? "low-performance" : ""}`} style={{
      background: "linear-gradient(135deg, #e8eaf6 0%, #ede7f6 30%, #e3f2fd 60%, #f3e5f5 100%)",
      backgroundSize: prefersReducedMotion || lowPerformance ? "100% 100%" : "400% 400%",
      animation: prefersReducedMotion || lowPerformance ? "none" : "gradientShift 12s ease infinite"
    }}>
      <style>{`
        :root {
          --primary: 238 84% 60%;
          --primary-foreground: 0 0% 98%;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .low-performance *,
        .low-performance *::before,
        .low-performance *::after {
          animation: none !important;
          transition: none !important;
        }
        .low-performance .allow-spin {
          animation: spin 1s linear infinite !important;
        }
        .low-performance .allow-ai-glow {
          animation: aiStatusGlow 1.6s ease-in-out infinite !important;
        }
        .low-performance [style*="backdrop-filter"],
        .low-performance .backdrop-blur,
        .low-performance .backdrop-blur-sm,
        .low-performance .backdrop-blur-md,
        .low-performance .backdrop-blur-lg,
        .low-performance .backdrop-blur-xl,
        .low-performance .backdrop-blur-2xl {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}</style>
      {!lowPerformance && <AmbientBackground fixed lowPerformance={lowPerformance} />}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/40 shadow-sm" style={{ background: lowPerformance ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.55)", backdropFilter: lowPerformance ? "none" : "blur(20px)", WebkitBackdropFilter: lowPerformance ? "none" : "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl(brandTargetPage)} className="flex items-center gap-2.5">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded-xl object-cover shadow-md" />
            ) : (
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c87ae1b851d45eece445d/ad711b049_f886201a2_Screenshot2026-02-25102247AM.png" alt="GradeGuard" className="w-8 h-8 rounded-xl object-cover shadow-md" />
            )}
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-tight" style={{ background: brand.color ? `linear-gradient(135deg, ${brand.color}, ${brand.color}99)` : "linear-gradient(135deg, #4338ca, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {brand.name}
              </span>
              {brand.tagline && (
                <span className="text-xs text-gray-400 leading-none hidden md:block">{brand.tagline}</span>
              )}
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavItems.map(({ label, page, icon: Icon }) => (
              <motion.div key={page} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={createPageUrl(page)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap ${
                    currentPageName === page
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </motion.div>
            ))}
            {overflowNavItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap ${
                      hasActiveOverflowItem
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    More
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {overflowNavItems.map(({ label, page, icon: Icon }) => (
                    <DropdownMenuItem key={page} asChild>
                      <Link to={createPageUrl(page)} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user && !isOnboarding && !isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/55 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-white/80 hover:text-gray-900">
                    <Plus className="w-4 h-4" />
                    Quick add
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link to={`${createPageUrl('Assignments')}?new=1`} className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Assignment
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`${createPageUrl('Tests')}?new=1`} className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Test
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {user && !isOnboarding && (
              <NotificationBell userEmail={user.email} />
            )}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-gray-500 font-medium">
                  {user.full_name || user.email}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("gg_user_email");
                    localStorage.removeItem("gg_auth_token");
                    const host = window.location.hostname;
                    const parts = host.split(".");
                    const isSubdomain = parts.length > 2;
                    if (isSubdomain) {
                      const rootDomain = parts.slice(-2).join(".");
                      window.location.href = `https://${rootDomain}/?logout=1`;
                    } else {
                      window.location.href = "/";
                    }
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {navItems.map(({ label, page, icon: Icon }) => (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  currentPageName === page
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {user && !isOnboarding && !isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="md:hidden p-2 rounded-xl border border-white/50 bg-white/55 text-gray-700 hover:bg-white/80 hover:text-gray-900 transition-colors" title="Quick add">
                    <Plus className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link to={`${createPageUrl('Assignments')}?new=1`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Assignment
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`${createPageUrl('Tests')}?new=1`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Test
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {user && (
              <button
                onClick={() => {
                    localStorage.removeItem("gg_user_email");
                    localStorage.removeItem("gg_auth_token");
                    const host = window.location.hostname;
                    const parts = host.split(".");
                    const isSubdomain = parts.length > 2;
                    if (isSubdomain) {
                      const rootDomain = parts.slice(-2).join(".");
                      window.location.href = `https://${rootDomain}/?logout=1`;
                    } else {
                      window.location.href = "/";
                    }
                  }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      {showWhatsNew && profile && !isAdmin && !isOnboarding && !isAnonymized && (
        <WhatsNewModal
          onDismiss={() => handleDismissWhatsNew()}
          onExploreFriends={() => handleDismissWhatsNew("Friends")}
        />
      )}

      {user && !isOnboarding && <FloatingStreakCounter userEmail={user.email} />}

      <main className={`relative z-10 ${
        currentPageName === "Home" ? "" :
        currentPageName === "StudyAssistant" ? "max-w-6xl mx-auto px-4 py-4 flex flex-col overflow-hidden" :
        "max-w-6xl mx-auto px-4 py-6 md:py-8"
      }`} style={currentPageName === "StudyAssistant" ? { height: 'calc(100dvh - 64px)' } : {}}>

        {children}
      </main>
      </div>
    </MotionConfig>
  );
}