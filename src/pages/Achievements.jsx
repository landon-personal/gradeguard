import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import XPBar from "../components/gamification/XPBar";
import BadgeGrid from "../components/gamification/BadgeGrid";
import Leaderboard from "../components/gamification/Leaderboard";
import SubjectProgressTracker from "../components/gamification/SubjectProgressTracker";
import PointsBreakdown from "../components/gamification/PointsBreakdown";
import { calcStreak } from "../components/gamification/streakUtils";
import { Flame, CheckCircle2, Zap, BookOpen, Star } from "lucide-react";
import { useAuth } from "../components/AuthGuard";
import { motion } from "framer-motion";

export default function AchievementsPage() {
  const queryClient = useQueryClient();

  const { profile, userEmail, token } = useAuth();

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAssignments", { token });
      return res.data.assignments;
    },
    enabled: !!userEmail && !!token && !!profile
  });

  const { data: statsArr = [] } = useQuery({
    queryKey: ['gamification-stats', userEmail],
    queryFn: () => secureEntity("GamificationStats").filter({ user_email: userEmail }),
    enabled: !!userEmail && !!profile
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['school-brand', profile?.school_code],
    queryFn: () => secureEntity("School").filter({ school_code: profile.school_code }),
    enabled: !!profile?.school_code
  });
  const isAnonymized = schools[0]?.anonymize_students === true;

  const stats = statsArr[0];
  const streak = calcStreak(assignments);
  const completed = assignments.filter(a => a.status === "completed");
  const earnedBadges = (stats?.badges || []).length;

  const toggleMutation = useMutation({
    mutationFn: (show) => secureEntity("GamificationStats").update(stats.id, { show_on_leaderboard: show }),
    onSuccess: () => queryClient.invalidateQueries(['gamification-stats'])
  });

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: "easeOut" }
  });

  if (!profile || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      {/* Hero Header */}
      <motion.div {...fadeUp(0)} className="rounded-2xl p-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.85) 0%, rgba(249,115,22,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 16px 48px rgba(234,179,8,0.25)" }}>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-yellow-100 mt-1 text-sm">Your progress, badges, and rankings</p>

        {/* Stats Row inside hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { icon: Zap, value: stats?.total_points || 0, label: "Total XP", color: "text-yellow-200" },
            { icon: CheckCircle2, value: completed.length, label: "Completed", color: "text-yellow-200" },
            { icon: Flame, value: streak, label: "Day Streak", color: "text-yellow-200" },
            { icon: Star, value: earnedBadges, label: "Badges", color: "text-yellow-200" },
          ].map(({ icon: Icon, value, label, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.07 }} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-yellow-100 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* XP Bar */}
      <motion.div {...fadeUp(0.1)}><XPBar totalPoints={stats?.total_points || 0} /></motion.div>

      {/* Leaderboard — hidden for anonymized schools */}
      {!isAnonymized && (
        <motion.div {...fadeUp(0.15)}>
          <Leaderboard
            currentUserEmail={userEmail}
            currentUserStats={stats}
            onToggleLeaderboard={(show) => toggleMutation.mutate(show)}
          />
        </motion.div>
      )}

      {/* XP How-to */}
      <motion.div {...fadeUp(0.2)}><PointsBreakdown /></motion.div>

      {/* Badges */}
      <motion.div {...fadeUp(0.25)} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(99,102,241,0.07)" }}>
        <BadgeGrid earnedBadgeIds={stats?.badges || []} />
      </motion.div>

      {/* Subject Progress */}
      <motion.div {...fadeUp(0.3)} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.65)", boxShadow: "0 4px 24px rgba(99,102,241,0.07)" }}>
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Subject Skill Progress
        </h3>
        <SubjectProgressTracker assignments={assignments} />
      </motion.div>
    </motion.div>
  );
}