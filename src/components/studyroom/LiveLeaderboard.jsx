import { Crown, Timer } from "lucide-react";
import { buildLeaderboardEntries } from "./leaderboardUtils";

export default function LiveLeaderboard({
  results = [],
  memberEmails = [],
  memberNames = [],
  userEmail,
  title = "Live Leaderboard",
}) {
  const entries = buildLeaderboardEntries(results, memberEmails, memberNames);

  return (
    <div className="bg-white/80 rounded-2xl border border-white/60 shadow-sm p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400">Updates as players finish the quiz</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No scores yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_email}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                entry.user_email === userEmail
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="w-7 text-center text-sm font-bold text-gray-500">
                {entry.status === "finished" ? (
                  entry.rank === 1 ? <Crown className="w-4 h-4 text-amber-500 mx-auto" /> : `#${entry.rank}`
                ) : (
                  <Timer className="w-4 h-4 text-gray-300 mx-auto" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {entry.user_name}
                  {entry.user_email === userEmail && (
                    <span className="text-xs text-indigo-500 ml-1">(you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {entry.status === "finished"
                    ? `${entry.correct_count}/${entry.total_questions} correct`
                    : "Still answering"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {entry.status === "finished" ? `${entry.score_pct}%` : "—"}
                </p>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {entry.status === "finished" ? "Finished" : "Racing"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}