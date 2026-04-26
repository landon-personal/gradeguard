import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Users, CheckCircle, Clock, XCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function StudentList({ profiles, assignments, gamificationStats, schools = [], onAdminWrite }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reassigning, setReassigning] = useState(null);
  const queryClient = useQueryClient();

  const reassignMutation = useMutation({
    mutationFn: ({ profileId, schoolCode, schoolId }) =>
      onAdminWrite("update", "StudentProfile", profileId, { school_code: schoolCode, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      setReassigning(null);
    }
  });

  const getSchoolName = (schoolCode) => {
    const school = schools.find(s => s.school_code === schoolCode);
    return school?.name || schoolCode || "—";
  };

  const studentsData = useMemo(() => {
    const students = profiles.filter(p => !p.is_school_admin);
    
    return students.map(student => {
      const studentAssignments = assignments.filter(a => a.user_email === student.user_email);
      const completedCount = studentAssignments.filter(a => a.status === 'completed').length;
      const pendingCount = studentAssignments.filter(a => a.status !== 'completed').length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueCount = studentAssignments.filter(a => 
        a.status !== 'completed' && new Date(a.due_date) < today
      ).length;
      
      const stats = gamificationStats.find(s => s.user_email === student.user_email);
      const xp = stats?.total_points || 0;
      const badges = (stats?.badges || []).length;
      
      return {
        ...student,
        completedCount,
        pendingCount,
        overdueCount,
        xp,
        badges,
        status: overdueCount >= 3 ? 'at-risk' : student.onboarding_completed ? 'active' : 'inactive'
      };
    });
  }, [profiles, assignments, gamificationStats]);

  const filteredAndSorted = useMemo(() => {
    let result = [...studentsData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.user_name?.toLowerCase().includes(term) || 
        s.user_email?.toLowerCase().includes(term) ||
        s.anonymous_id?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== "all") {
      result = result.filter(s => s.status === filterStatus);
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.user_name || a.user_email).localeCompare(b.user_name || b.user_email);
        case "xp":
          return b.xp - a.xp;
        case "completed":
          return b.completedCount - a.completedCount;
        case "overdue":
          return b.overdueCount - a.overdueCount;
        case "date":
          return new Date(b.created_date) - new Date(a.created_date);
        default:
          return 0;
      }
    });
    
    return result;
  }, [studentsData, searchTerm, sortBy, filterStatus]);

  const statusCounts = useMemo(() => {
    return {
      all: studentsData.length,
      active: studentsData.filter(s => s.status === 'active').length,
      inactive: studentsData.filter(s => s.status === 'inactive').length,
      'at-risk': studentsData.filter(s => s.status === 'at-risk').length
    };
  }, [studentsData]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Students ({filteredAndSorted.length})
        </h2>
        
        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'active', 'inactive', 'at-risk'].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap flex-shrink-0 ${filterStatus === status ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            >
              {status === 'all' ? 'All' : status === 'at-risk' ? 'At Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-75">({statusCounts[status]})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="xp">XP (High to Low)</SelectItem>
            <SelectItem value="completed">Completed (Most)</SelectItem>
            <SelectItem value="overdue">Overdue (Most)</SelectItem>
            <SelectItem value="date">Join Date (Recent)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Cards */}
      <div className="space-y-3">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students found</p>
          </div>
        ) : (
          filteredAndSorted.map(student => (
            <div
              key={student.id}
              className={`bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
                student.status === 'at-risk' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {student.anonymous_id
                        ? `${student.anonymous_id}`
                        : (student.user_name || student.user_email)}
                    </h3>
                    {student.status === 'at-risk' && (
                      <Badge className="bg-red-100 text-red-700 text-xs">At Risk</Badge>
                    )}
                    {student.status === 'inactive' && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {student.anonymous_id
                      ? <span className="font-mono text-xs text-emerald-600">{student.anonymous_id}</span>
                      : student.user_email}
                  </p>
                  
                  {student.school_code && (
                    <div className="mt-2 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {reassigning === student.id ? (
                        <Select
                          value={student.school_code}
                          onValueChange={(val) => {
                            const school = schools.find(s => s.school_code === val);
                            reassignMutation.mutate({ profileId: student.id, schoolCode: val, schoolId: school?.id || "" });
                          }}
                          onOpenChange={(open) => { if (!open) setReassigning(null); }}
                          defaultOpen
                        >
                          <SelectTrigger className="h-7 text-xs w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {schools.map(s => (
                              <SelectItem key={s.id} value={s.school_code}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          className="text-xs text-gray-600 hover:text-indigo-600 hover:underline transition-colors"
                          onClick={() => setReassigning(student.id)}
                          title="Click to reassign school"
                        >
                          {getSchoolName(student.school_code)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-5 gap-2 sm:gap-4 text-sm mt-3 sm:mt-0 w-full sm:w-auto">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 font-semibold text-xs sm:text-sm">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {student.completedCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Done</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600 font-semibold text-xs sm:text-sm">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {student.pendingCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Pending</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`flex items-center justify-center gap-1 font-semibold text-xs sm:text-sm ${student.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {student.overdueCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Late</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 font-semibold text-xs sm:text-sm">
                      ⭐ {student.xp}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">XP</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 font-semibold text-xs sm:text-sm">
                      🏅 {student.badges}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Badges</div>
                  </div>
                </div>
              </div>
              
              {/* Study preferences summary */}
              {student.onboarding_completed && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500 flex-wrap">
                  {student.study_time && (
                    <span>📅 Studies: <span className="text-gray-700">{student.study_time}</span></span>
                  )}
                  {student.hardest_subjects && student.hardest_subjects.length > 0 && (
                    <span>📚 Challenges: <span className="text-gray-700">{student.hardest_subjects.join(', ')}</span></span>
                  )}
                  {student.learning_style && (
                    <span>🎯 Style: <span className="text-gray-700">{student.learning_style}</span></span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}