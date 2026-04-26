import { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Award, BookOpen, AlertTriangle, Building2 } from "lucide-react";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];

export default function SchoolAnalytics({ profiles, assignments, tests, gamificationStats, schoolName }) {
  const analytics = useMemo(() => {
    const totalStudents = profiles.filter(p => !p.is_school_admin).length;
    const activeStudents = profiles.filter(p => p.onboarding_completed && !p.is_school_admin).length;
    
    // Assignment completion rate
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
    
    // Overdue assignments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = assignments.filter(a => a.status !== 'completed' && new Date(a.due_date) < today).length;
    
    // Subject performance (avg completion by subject)
    const subjectData = {};
    assignments.forEach(a => {
      if (!a.subject) return;
      if (!subjectData[a.subject]) {
        subjectData[a.subject] = { total: 0, completed: 0 };
      }
      subjectData[a.subject].total++;
      if (a.status === 'completed') subjectData[a.subject].completed++;
    });
    
    const subjectPerformance = Object.entries(subjectData)
      .map(([subject, data]) => ({
        subject,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        total: data.total
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
    
    // Commonly marked difficult subjects
    const hardestSubjects = {};
    profiles.forEach(p => {
      (p.hardest_subjects || []).forEach(subj => {
        hardestSubjects[subj] = (hardestSubjects[subj] || 0) + 1;
      });
    });
    
    const challengingSubjects = Object.entries(hardestSubjects)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    
    // Study preferences distribution
    const studyTimePrefs = {};
    const breakFreqPrefs = {};
    profiles.forEach(p => {
      if (p.study_time) studyTimePrefs[p.study_time] = (studyTimePrefs[p.study_time] || 0) + 1;
      if (p.break_frequency) breakFreqPrefs[p.break_frequency] = (breakFreqPrefs[p.break_frequency] || 0) + 1;
    });
    
    const studyTimeData = Object.entries(studyTimePrefs).map(([name, value]) => ({ name, value }));
    const breakFreqData = Object.entries(breakFreqPrefs).map(([name, value]) => ({ name, value }));
    
    // Engagement metrics
    const totalXP = gamificationStats.reduce((sum, s) => sum + (s.total_points || 0), 0);
    const avgXP = gamificationStats.length > 0 ? Math.round(totalXP / gamificationStats.length) : 0;
    const totalBadges = gamificationStats.reduce((sum, s) => sum + ((s.badges || []).length), 0);
    
    // At-risk students (high overdue rate)
    const atRiskStudents = profiles.filter(p => {
      if (p.is_school_admin) return false;
      const studentAssignments = assignments.filter(a => a.user_email === p.user_email);
      const studentOverdue = studentAssignments.filter(a => a.status !== 'completed' && new Date(a.due_date) < today).length;
      return studentOverdue >= 3; // 3+ overdue
    });
    
    return {
      totalStudents,
      activeStudents,
      completionRate,
      overdueCount,
      subjectPerformance,
      challengingSubjects,
      studyTimeData,
      breakFreqData,
      totalXP,
      avgXP,
      totalBadges,
      atRiskStudents
    };
  }, [profiles, assignments, tests, gamificationStats]);

  return (
    <div className="space-y-6">
      {schoolName && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
          <Building2 className="w-4 h-4" />
          Showing data for: <span className="font-bold">{schoolName}</span>
        </div>
      )}
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Active Students</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{analytics.activeStudents}</div>
          <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">of {analytics.totalStudents} enrolled</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Completion Rate</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{analytics.completionRate}%</div>
          <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">Assignments completed</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Avg XP</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{analytics.avgXP}</div>
          <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">{analytics.totalBadges} badges earned</div>
        </div>
        
        <div className={`bg-gradient-to-br ${analytics.overdueCount > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500'} rounded-2xl p-4 sm:p-5 text-white shadow-lg`}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Overdue</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{analytics.overdueCount}</div>
          <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">{analytics.atRiskStudents.length} at-risk</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Subject Performance */}
        {analytics.subjectPerformance.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Subject Completion Rates
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.subjectPerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} width={35} />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Challenging Subjects */}
        {analytics.challengingSubjects.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              Common Learning Challenges
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.challengingSubjects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="subject" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-3">Students who marked each subject as challenging</p>
          </div>
        )}
        
        {/* Study Time Preferences */}
        {analytics.studyTimeData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Preferred Study Times</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics.studyTimeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.studyTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">When students prefer to study</p>
          </div>
        )}
        
        {/* Break Frequency */}
        {analytics.breakFreqData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Break Frequency Preferences</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics.breakFreqData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.breakFreqData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">How often students take breaks</p>
          </div>
        )}
      </div>

      {/* At-Risk Students Alert */}
      {analytics.atRiskStudents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                {analytics.atRiskStudents.length} Students Need Attention
              </h4>
              <p className="text-sm text-red-700 mb-3">
                The following students have 3 or more overdue assignments:
              </p>
              <div className="flex flex-wrap gap-2">
                {analytics.atRiskStudents.map(student => (
                  <span key={student.id} className="bg-white px-3 py-1.5 rounded-lg text-sm text-gray-700 border border-red-200">
                    {student.user_name || student.user_email}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}