import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

function WeeklyArc({ completionRate, completed, total }) {
  const display = completionRate;
  const pct = Math.min(display / 100, 0.9999); // never full circle (breaks SVG arc)

  // SVG arc: goes from bottom-left to bottom-right (270° sweep)
  const R = 54;
  const cx = 80, cy = 76;
  const startDeg = 135; // degrees
  const totalDeg = 270;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const startRad = toRad(startDeg);
  const endRad = toRad(startDeg + totalDeg);
  const fillRad = toRad(startDeg + totalDeg * pct);

  const pt = (angle) => ({
    x: cx + R * Math.cos(angle),
    y: cy + R * Math.sin(angle),
  });

  const trackStart = pt(startRad);
  const trackEnd = pt(endRad);
  const fillEnd = pt(fillRad);

  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;

  const fillSweepDeg = totalDeg * pct;
  const largeFill = fillSweepDeg > 180 ? 1 : 0;
  const fillPath = `M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 ${largeFill} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="120" viewBox="0 0 160 120">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path d={trackPath} fill="none" stroke="#e0e7ff" strokeWidth="12" strokeLinecap="round" />
        {pct > 0 && (
          <path d={fillPath} fill="none" stroke="url(#arcGrad)" strokeWidth="12" strokeLinecap="round" />
        )}
        <text x="80" y="80" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#4338ca">{display}%</text>
        <text x="80" y="95" textAnchor="middle" fontSize="10" fill="#9ca3af">this week</text>
      </svg>
      <p className="text-sm text-gray-500">{completed} completed · {total} total</p>
    </div>
  );
}

const SUBJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6"
];

export default function ProgressCharts({ assignments }) {
  // Last 7 days completion data
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(day);
      const dayStr = dayStart.toDateString();

      const completed = assignments.filter(a => {
        if (a.status !== "completed") return false;
        return new Date(a.updated_date).toDateString() === dayStr;
      }).length;

      const added = assignments.filter(a => {
        return new Date(a.created_date).toDateString() === dayStr;
      }).length;

      return {
        day: format(day, "EEE"),
        Completed: completed,
        Added: added,
      };
    });
  }, [assignments]);

  // Subject breakdown (completed)
  const subjectData = useMemo(() => {
    const counts = {};
    assignments.forEach(a => {
      if (a.status !== "completed") return;
      const subj = a.subject || "Other";
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [assignments]);

  // Overall completion rate
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === "completed").length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: total - completed },
  ];

  if (total === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section title */}
      <h2 className="text-lg font-semibold text-gray-800">📊 Your Progress</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Activity – Last 7 Days</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar dataKey="Completed" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Added" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 inline-block" /> Added
            </span>
          </div>
        </div>

        {/* Weekly progress arc */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-gray-700">Weekly Completion Rate</p>
          <WeeklyArc completionRate={completionRate} completed={completed} total={total} />
        </div>
      </div>

      {/* Subject breakdown */}
      {subjectData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Completed by Subject</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={subjectData} layout="vertical" barSize={14}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {subjectData.map((_, i) => (
                  <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}