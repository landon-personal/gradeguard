export const BADGES = [
  // ── Completion milestones ──────────────────────────────────────────
  {
    id: "first_assignment",
    name: "First Step",
    description: "Complete your first assignment",
    emoji: "🎯",
    condition: (stats) => stats.assignments_completed >= 1,
    color: "from-blue-400 to-blue-600"
  },
  {
    id: "five_assignments",
    name: "Getting Started",
    description: "Complete 5 assignments",
    emoji: "📚",
    condition: (stats) => stats.assignments_completed >= 5,
    color: "from-green-400 to-green-600"
  },
  {
    id: "ten_assignments",
    name: "Dedicated Student",
    description: "Complete 10 assignments",
    emoji: "🏅",
    condition: (stats) => stats.assignments_completed >= 10,
    color: "from-teal-400 to-teal-600"
  },
  {
    id: "twenty_five_assignments",
    name: "Academic Warrior",
    description: "Complete 25 assignments",
    emoji: "⚔️",
    condition: (stats) => stats.assignments_completed >= 25,
    color: "from-indigo-400 to-indigo-600"
  },
  {
    id: "fifty_assignments",
    name: "A+ Achiever",
    description: "Complete 50 assignments",
    emoji: "🌟",
    condition: (stats) => stats.assignments_completed >= 50,
    color: "from-yellow-400 to-yellow-600"
  },
  {
    id: "hundred_assignments",
    name: "Century Scholar",
    description: "Complete 100 assignments",
    emoji: "💎",
    condition: (stats) => stats.assignments_completed >= 100,
    color: "from-purple-400 to-purple-600"
  },

  // ── Streak badges ──────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "On a Roll",
    description: "3-day study streak",
    emoji: "🔥",
    condition: (stats, streak) => streak >= 3,
    color: "from-orange-400 to-orange-600"
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day study streak",
    emoji: "💪",
    condition: (stats, streak) => streak >= 7,
    color: "from-red-400 to-red-600"
  },
  {
    id: "streak_14",
    name: "Consistent Contributor",
    description: "14-day study streak",
    emoji: "🚀",
    condition: (stats, streak) => streak >= 14,
    color: "from-purple-400 to-purple-600"
  },
  {
    id: "streak_30",
    name: "Legend",
    description: "30-day study streak",
    emoji: "🏆",
    condition: (stats, streak) => streak >= 30,
    color: "from-yellow-400 to-yellow-600"
  },

  // ── XP / Points badges ─────────────────────────────────────────────
  {
    id: "points_100",
    name: "Century Club",
    description: "Earn 100 XP",
    emoji: "💯",
    condition: (stats) => stats.total_points >= 100,
    color: "from-pink-400 to-pink-600"
  },
  {
    id: "points_500",
    name: "XP Hunter",
    description: "Earn 500 XP",
    emoji: "⭐",
    condition: (stats) => stats.total_points >= 500,
    color: "from-amber-400 to-amber-600"
  },
  {
    id: "points_1000",
    name: "Power Player",
    description: "Earn 1,000 XP",
    emoji: "⚡",
    condition: (stats) => stats.total_points >= 1000,
    color: "from-cyan-400 to-cyan-600"
  },
  {
    id: "points_2500",
    name: "XP Master",
    description: "Earn 2,500 XP",
    emoji: "🔮",
    condition: (stats) => stats.total_points >= 2500,
    color: "from-violet-400 to-violet-600"
  },

  // ── Difficulty badges ──────────────────────────────────────────────
  {
    id: "hard_5",
    name: "Challenge Accepted",
    description: "Complete 5 hard assignments",
    emoji: "🦁",
    condition: (stats) => (stats.hard_completed || 0) >= 5,
    color: "from-red-500 to-rose-600"
  },
  {
    id: "hard_15",
    name: "Gladiator",
    description: "Complete 15 hard assignments",
    emoji: "🛡️",
    condition: (stats) => (stats.hard_completed || 0) >= 15,
    color: "from-rose-500 to-red-700"
  },

  // ── Early bird badges ──────────────────────────────────────────────
  {
    id: "early_5",
    name: "Early Bird",
    description: "Complete 5 assignments before their due date",
    emoji: "🐦",
    condition: (stats) => (stats.early_completions || 0) >= 5,
    color: "from-sky-400 to-sky-600"
  },
  {
    id: "early_20",
    name: "Ahead of Schedule",
    description: "Complete 20 assignments before their due date",
    emoji: "⏰",
    condition: (stats) => (stats.early_completions || 0) >= 20,
    color: "from-teal-400 to-emerald-600"
  },
];

export const POINTS_PER_COMPLETION = 10;
export const BONUS_HARD = 5;
export const BONUS_MEDIUM = 2;
export const BONUS_EASY = 0;
export const BONUS_EARLY = 8;
export const STREAK_BONUS_MULTIPLIER = 0.1; // +10% per streak day, capped at 50%

export function calcPointsForAssignment(assignment, streak = 0) {
  let points = POINTS_PER_COMPLETION;

  if (assignment.difficulty === "hard") points += BONUS_HARD;
  if (assignment.difficulty === "medium") points += BONUS_MEDIUM;

  const isEarly = assignment.due_date && new Date() < new Date(assignment.due_date);
  if (isEarly) points += BONUS_EARLY;

  // Streak bonus: capped at 50%
  const streakBonus = Math.min(streak * STREAK_BONUS_MULTIPLIER, 0.5);
  points = Math.round(points * (1 + streakBonus));

  return points;
}

export function getNewBadges(stats, streak) {
  const earned = stats.badges || [];
  return BADGES.filter(b => !earned.includes(b.id) && b.condition(stats, streak));
}