import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { calcPointsForAssignment, getNewBadges, BONUS_EARLY } from "./BadgeDefinitions";
import { calcStreak } from "./streakUtils";

export function useGamification(user, assignments) {
  const queryClient = useQueryClient();

  const { data: statsArr = [] } = useQuery({
    queryKey: ['gamification-stats', user?.email],
    queryFn: () => secureEntity("GamificationStats").filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const stats = statsArr[0];

  const awardPoints = async (assignment) => {
    if (!user) return [];
    const streak = calcStreak(assignments);
    const points = calcPointsForAssignment(assignment, streak);

    let currentStats = stats;

    if (!currentStats) {
      // Create new stats record
      currentStats = await secureEntity("GamificationStats").create({
        user_email: user.email,
        user_name: user.full_name || user.email,
        total_points: 0,
        assignments_completed: 0,
        badges: [],
        show_on_leaderboard: true,
      });
    }

    const isEarly = assignment.due_date && new Date() < new Date(assignment.due_date);
    const newTotalPoints = (currentStats.total_points || 0) + points;
    const newCompleted = (currentStats.assignments_completed || 0) + 1;
    const newHardCompleted = (currentStats.hard_completed || 0) + (assignment.difficulty === "hard" ? 1 : 0);
    const newEarlyCompletions = (currentStats.early_completions || 0) + (isEarly ? 1 : 0);

    const updatedStats = {
      ...currentStats,
      total_points: newTotalPoints,
      assignments_completed: newCompleted,
      hard_completed: newHardCompleted,
      early_completions: newEarlyCompletions,
      user_name: user.full_name || user.email,
      last_completion_date: new Date().toISOString(),
    };

    // Check for new badges
    const newBadges = getNewBadges(updatedStats, streak);
    if (newBadges.length > 0) {
      updatedStats.badges = [...(currentStats.badges || []), ...newBadges.map(b => b.id)];
    }

    await secureEntity("GamificationStats").update(currentStats.id, updatedStats);
    queryClient.invalidateQueries(['gamification-stats']);
    queryClient.invalidateQueries(['gamification-leaderboard']);

    return { points, newBadges };
  };

  return { stats, awardPoints };
}