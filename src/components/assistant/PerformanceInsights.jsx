import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle, BookOpen, ChevronDown, ChevronUp, Target, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

function ScorePill({ pct }) {
  const color = pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>;
}

export default function PerformanceInsights({ quizResults, tests, assignments, onStartChat }) {
  const [expanded, setExpanded] = useState(true);

  if (!quizResults || quizResults.length === 0) return null;

  // Aggregate weak subjects
  const subjectScores = {};
  quizResults.forEach(r => {
    if (!subjectScores[r.subject]) subjectScores[r.subject] = { total: 0, count: 0, wrong: [] };
    subjectScores[r.subject].total += r.score_pct;
    subjectScores[r.subject].count += 1;
    subjectScores[r.subject].wrong.push(...(r.wrong_questions || []));
  });

  const subjectAvgs = Object.entries(subjectScores).map(([subject, data]) => ({
    subject,
    avg: Math.round(data.total / data.count),
    wrongQuestions: data.wrong
  })).sort((a, b) => a.avg - b.avg);

  const weakSubjects = subjectAvgs.filter(s => s.avg < 75);
  const strongSubjects = subjectAvgs.filter(s => s.avg >= 80);

  // Upcoming deadlines that need attention
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgentTests = tests
    .filter(t => t.status === 'upcoming')
    .map(t => ({ ...t, daysLeft: differenceInDays(new Date(t.test_date), today) }))
    .filter(t => t.daysLeft >= 0 && t.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const urgentAssignments = assignments
    .filter(a => a.status === 'pending')
    .map(a => ({ ...a, daysLeft: differenceInDays(new Date(a.due_date), today) }))
    .filter(a => a.daysLeft >= 0 && a.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const recentResults = quizResults.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-3 flex-shrink-0"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">Your Performance Insights</span>
          {weakSubjects.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {weakSubjects.length} area{weakSubjects.length > 1 ? 's' : ''} to review
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Recent quiz results */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Quizzes</p>
                <div className="space-y-1.5">
                  {recentResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800 truncate block">{r.test_name}</span>
                        <span className="text-xs text-gray-400">{r.subject} · {r.correct_count}/{r.total_questions} correct</span>
                      </div>
                      <ScorePill pct={r.score_pct} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak areas */}
              {weakSubjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400" /> Areas Needing Review
                  </p>
                  <div className="space-y-2">
                    {weakSubjects.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-red-700">{s.subject}</p>
                          {s.wrongQuestions.length > 0 && (
                            <p className="text-xs text-red-500 mt-0.5 line-clamp-1">
                              Struggled with: {s.wrongQuestions[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <ScorePill pct={s.avg} />
                          <button
                            onClick={() => onStartChat(`I need help reviewing ${s.subject}. I've been struggling — my average score is ${s.avg}%. Can you guide me through the key concepts?`)}
                            className="text-xs text-red-600 font-semibold bg-white border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            Get help →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strong subjects */}
              {strongSubjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3 text-green-500" /> Strong Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {strongSubjects.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs font-medium text-green-700">{s.subject}</span>
                        <ScorePill pct={s.avg} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proactive study suggestions */}
              {(urgentTests.length > 0 || urgentAssignments.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> Suggested Study Sessions
                  </p>
                  <div className="space-y-1.5">
                    {urgentTests.map((t, i) => {
                      const subjectData = subjectScores[t.subject];
                      const avg = subjectData ? Math.round(subjectData.total / subjectData.count) : null;
                      const isWeak = avg !== null && avg < 75;
                      return (
                        <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 border ${isWeak ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div>
                            <p className={`text-sm font-medium ${isWeak ? 'text-red-700' : 'text-amber-700'}`}>
                              {isWeak ? '⚠️' : '📅'} {t.name}
                            </p>
                            <p className={`text-xs ${isWeak ? 'text-red-500' : 'text-amber-500'}`}>
                              {t.daysLeft === 0 ? 'Today!' : `${t.daysLeft}d away`} · {t.subject}
                              {isWeak && ` · Avg ${avg}% — extra prep recommended`}
                            </p>
                          </div>
                          <button
                            onClick={() => onStartChat(`I have a ${t.subject} test "${t.name}" in ${t.daysLeft === 0 ? 'today' : `${t.daysLeft} days`}. ${isWeak ? `My practice scores have been around ${avg}% in this subject — I need focused help.` : 'Help me make a targeted study plan for it.'} Topics: ${t.topics || 'not specified'}`)}
                            className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors whitespace-nowrap ${isWeak ? 'text-red-600 bg-white border-red-200 hover:bg-red-50' : 'text-amber-600 bg-white border-amber-200 hover:bg-amber-50'}`}
                          >
                            Study now →
                          </button>
                        </div>
                      );
                    })}
                    {urgentAssignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-indigo-700">📝 {a.name}</p>
                          <p className="text-xs text-indigo-500">
                            {a.daysLeft === 0 ? 'Due today!' : `Due in ${a.daysLeft}d`} · {a.subject || 'No subject'}
                          </p>
                        </div>
                        <button
                          onClick={() => onStartChat(`Help me work on "${a.name}" for ${a.subject || 'class'}. It's due in ${a.daysLeft === 0 ? 'today' : `${a.daysLeft} days`} and I'm not sure where to start.`)}
                          className="text-xs text-indigo-600 font-semibold bg-white border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors whitespace-nowrap"
                        >
                          Get help →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}