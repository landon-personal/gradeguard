import { Crown } from "lucide-react";
import { sortLeaderboard } from "./leaderboardUtils";

const podiumConfig = {
  1: { height: "h-32", bg: "from-amber-400 to-yellow-500", label: "1st" },
  2: { height: "h-24", bg: "from-slate-300 to-slate-400", label: "2nd" },
  3: { height: "h-20", bg: "from-orange-300 to-amber-400", label: "3rd" },
};

export default function PodiumDisplay({ results = [], userEmail }) {
  const topThree = sortLeaderboard(results).slice(0, 3);
  const visualOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  if (!topThree.length) return null;

  return (
    <div className="bg-white/80 rounded-2xl border border-white/60 shadow-sm p-5">
      <div className="text-center mb-5">
        <h3 className="font-semibold text-gray-900">Final Podium</h3>
        <p className="text-xs text-gray-400">Top performers in this quiz battle</p>
      </div>

      <div className="flex items-end justify-center gap-3">
        {visualOrder.map((player) => {
          const place = topThree.findIndex((entry) => entry.user_email === player.user_email) + 1;
          const config = podiumConfig[place];

          return (
            <div key={player.user_email} className="flex-1 max-w-[140px] text-center">
              <div className="mb-2 min-h-[52px] flex flex-col items-center justify-end">
                {place === 1 && <Crown className="w-5 h-5 text-amber-500 mb-1" />}
                <p className="text-sm font-semibold text-gray-900 truncate w-full">
                  {player.user_name}
                  {player.user_email === userEmail && <span className="text-indigo-500 ml-1">(you)</span>}
                </p>
                <p className="text-xs text-gray-400">{player.score_pct}%</p>
              </div>
              <div className={`rounded-t-2xl bg-gradient-to-b ${config.bg} ${config.height} flex flex-col items-center justify-center text-white shadow-sm`}>
                <p className="text-xs font-medium opacity-90">{config.label}</p>
                <p className="text-lg font-bold">{player.correct_count}/{player.total_questions}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}