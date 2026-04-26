import { useQuery } from "@tanstack/react-query";
import { secureEntity } from "@/lib/secureEntities";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Sparkles, Trophy, Zap } from "lucide-react";
import { getLevel } from "./XPBar";

const LEVEL_NAMES = ["Novice", "Learner", "Student", "Scholar", "Achiever", "Expert", "Master", "Elite", "Champion", "Legend", "Grandmaster"];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ currentUserEmail, currentUserStats, onToggleLeaderboard }) {
  const { data: allStats = [] } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () => secureEntity("GamificationStats").list('-total_points', 20),
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-student-profiles-names'],
    queryFn: () => secureEntity("StudentProfile").list(),
  });

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.user_email, p.user_name]));
  const anonMap = Object.fromEntries(allProfiles.filter(p => p.anonymous_id).map(p => [p.user_email, p.anonymous_id]));

  const getDisplayName = (email) => {
    if (anonMap[email]) return anonMap[email];
    return profileMap[email] || "Student";
  };

  const visible = allStats.filter(s => s.show_on_leaderboard);
  const myRank = visible.findIndex((s) => s.user_email === currentUserEmail) + 1;
  const topThree = visible.slice(0, 3);

  return (
    <div className="overflow-hidden rounded-[28px] border border-yellow-100 bg-white/95 shadow-[0_18px_50px_rgba(234,179,8,0.12)] backdrop-blur-xl">
      <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-400/15 via-orange-400/10 to-pink-400/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-700">
              <Sparkles className="h-3.5 w-3.5" />
              Featured competition
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-900">Leaderboard</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">See who’s climbing fastest and where you stand right now.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-yellow-200 bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-600">Your rank</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{myRank > 0 ? `#${myRank}` : "—"}</div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Your XP</div>
              <div className="mt-1 flex items-center gap-1 text-2xl font-bold text-indigo-600">
                <Zap className="h-5 w-5" />
                {currentUserStats?.total_points || 0}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 px-3 py-3 text-xs text-gray-500 shadow-sm">
              {currentUserStats?.show_on_leaderboard ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span>Show me</span>
              <Switch
                checked={currentUserStats?.show_on_leaderboard ?? true}
                onCheckedChange={onToggleLeaderboard}
                className="scale-75"
              />
            </div>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No one on the leaderboard yet.</p>
      ) : (
        <div className="p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {topThree.map((s, i) => {
              const isMe = s.user_email === currentUserEmail;
              const level = getLevel(s.total_points || 0);
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border px-4 py-4 shadow-sm ${
                    i === 0
                      ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
                      : i === 1
                      ? "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
                      : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                  }`}
                >
                  <div className="text-2xl">{MEDALS[i]}</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-gray-900">
                        {isMe ? "You" : getDisplayName(s.user_email)}
                      </div>
                      <div className="text-xs text-gray-500">Level {level}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rank</div>
                      <div className="text-lg font-bold text-gray-900">#{i + 1}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-lg font-bold text-indigo-600">
                    <Zap className="h-4 w-4" /> {s.total_points || 0}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {visible.map((s, i) => {
              const isMe = s.user_email === currentUserEmail;
              const level = getLevel(s.total_points || 0);
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                    isMe
                      ? "border border-indigo-200 bg-indigo-50 shadow-sm"
                      : "border border-transparent bg-gray-50/70 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-10 text-center text-sm font-bold ${i < 3 ? "text-xl" : "text-gray-400"}`}>
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {isMe ? "You" : getDisplayName(s.user_email)}
                    </div>
                    <div className="text-xs text-gray-500">Level {level}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-indigo-600 shadow-sm">
                    <Zap className="h-4 w-4" />
                    {s.total_points || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}