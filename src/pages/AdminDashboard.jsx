import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Copy, School, Users, Check, X, Pencil, Trash2, Shield, BarChart3, Sparkles, AlertTriangle } from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SchoolAnalytics from "../components/admin/SchoolAnalytics";
import StudentList from "../components/admin/StudentList";
import FlaggedMessagesPanel from "../components/admin/FlaggedMessagesPanel";
import AnonymizationToggle from "../components/admin/AnonymizationToggle";
import { getQualifiedAssignmentCount } from "@/lib/assignmentQuality";
import { Link } from "react-router-dom";

function generateSchoolCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", school_code: "", sso_provider: "none", sso_domain: "", school_hours_start: "", school_hours_end: "", study_hall_start: "", study_hall_end: "", brand_name: "", brand_logo_url: "", brand_primary_color: "", brand_tagline: "" });
  const [activeTab, setActiveTab] = useState("schools");
  const [selectedSchoolId, setSelectedSchoolId] = useState("all");
  const [deleteSchoolConfirm, setDeleteSchoolConfirm] = useState(null);

  const token = localStorage.getItem("gg_auth_token");

  // Single backend call for ALL admin data — JWT verified server-side
  const { data: adminData, isLoading, isFetched, error: adminError } = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAdminDashboardData", { token });
      return res.data;
    },
    enabled: !!token
  });

  const schools = adminData?.schools || [];
  const profiles = adminData?.profiles || [];
  const allAssignments = adminData?.assignments || [];
  const allTests = adminData?.tests || [];
  const allGamificationStats = adminData?.gamificationStats || [];
  const flaggedMessages = adminData?.flaggedMessages || [];

  // Admin write operations via backend function
  const adminWrite = async (operation, entity, id, data) => {
    const res = await base44.functions.invoke("adminWriteOperation", { token, operation, entity, id, data });
    return res.data;
  };

  const createMutation = useMutation({
    mutationFn: (data) => adminWrite("create", "School", null, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      setShowForm(false);
      setForm({ name: "", description: "", sso_provider: "none", sso_domain: "", school_hours_start: "", school_hours_end: "", study_hall_start: "", study_hall_end: "", brand_name: "", brand_logo_url: "", brand_primary_color: "", brand_tagline: "" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminWrite("update", "School", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      setEditingSchool(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminWrite("delete", "School", id, null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] })
  });

  const handleDeleteSchoolConfirm = () => {
    if (deleteSchoolConfirm) deleteMutation.mutate(deleteSchoolConfirm);
    setDeleteSchoolConfirm(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const schoolData = {
      ...form,
      sso_enabled: form.sso_provider !== 'none',
    };
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data: schoolData });
    } else {
      createMutation.mutate({ ...schoolData, school_code: form.school_code || generateSchoolCode() });
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setForm({
      name: school.name,
      description: school.description || "",
      school_code: school.school_code || "",
      sso_provider: school.sso_provider || "none",
      sso_domain: school.sso_domain || "",
      school_hours_start: school.school_hours_start || "",
      school_hours_end: school.school_hours_end || "",
      study_hall_start: school.study_hall_start || "",
      study_hall_end: school.study_hall_end || "",
      brand_name: school.brand_name || "",
      brand_logo_url: school.brand_logo_url || "",
      brand_primary_color: school.brand_primary_color || "",
      brand_tagline: school.brand_tagline || ""
    });
    setShowForm(true);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStudentCount = (schoolCode) => profiles.filter(p => p.school_code === schoolCode).length;

  const getSchoolAssignmentCount = (schoolCode) => {
    const schoolEmails = profiles.filter(p => p.school_code === schoolCode).map(p => p.user_email);
    return getQualifiedAssignmentCount(allAssignments.filter(a => schoolEmails.includes(a.user_email)));
  };

  const isSchoolPremium = (school) => {
    const studentCount = getStudentCount(school.school_code);
    const assignmentCount = getSchoolAssignmentCount(school.school_code);
    return assignmentCount >= studentCount * 100;
  };

  const getLoyaltyProgress = (school) => {
    const studentCount = getStudentCount(school.school_code);
    if (studentCount === 0) return { current: 0, target: 100, pct: 0 };
    const assignmentCount = getSchoolAssignmentCount(school.school_code);
    const target = studentCount * 100;
    return { current: assignmentCount, target, pct: Math.min(100, Math.round((assignmentCount / target) * 100)) };
  };

  // Filter profiles/assignments/tests by selected school
  const selectedSchool = selectedSchoolId === "all" ? null : schools.find(s => s.id === selectedSchoolId);
  const filteredProfiles = selectedSchool
    ? profiles.filter(p => p.school_code === selectedSchool.school_code)
    : profiles;
  const filteredAssignments = selectedSchool
    ? allAssignments.filter(a => filteredProfiles.some(p => p.user_email === a.user_email))
    : allAssignments;
  const filteredTests = selectedSchool
    ? allTests.filter(t => filteredProfiles.some(p => p.user_email === t.user_email))
    : allTests;
  const filteredGamificationStats = selectedSchool
    ? allGamificationStats.filter(s => filteredProfiles.some(p => p.user_email === s.user_email))
    : allGamificationStats;
  const filteredFlaggedMessages = selectedSchool
    ? flaggedMessages.filter(m => m.school_code === selectedSchool.school_code)
    : flaggedMessages;
  const newFlaggedCount = filteredFlaggedMessages.filter(m => m.status === 'new').length;

  if (!isFetched || isLoading) {
    return <div className="flex items-center justify-center min-h-64 text-gray-400 text-sm">Loading...</div>;
  }

  // Server returned 403 — not admin
  if (adminError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">Admin Access Required</h2>
          <p className="text-sm text-gray-400 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      <ConfirmDialog
        open={!!deleteSchoolConfirm}
        onConfirm={handleDeleteSchoolConfirm}
        onCancel={() => setDeleteSchoolConfirm(null)}
        title="Delete school?"
        description="This will permanently remove the school and all its settings. Students will no longer be associated with it."
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, rgba(51,65,85,0.88) 0%, rgba(79,70,229,0.88) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 16px 48px rgba(51,65,85,0.3)" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-300 mt-1 text-sm">{schools.length} school{schools.length !== 1 ? 's' : ''} · {profiles.filter(p => !p.is_school_admin).length} students enrolled</p>
          </div>
          {activeTab === "schools" && (
            <Button
              onClick={() => { setEditingSchool(null); setForm({ name: "", description: "", sso_provider: "none", sso_domain: "", school_hours_start: "", school_hours_end: "", study_hall_start: "", study_hall_end: "" }); setShowForm(true); }}
              className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create School
            </Button>
          )}
        </div>
      </motion.div>

      {/* School Filter */}
      {schools.length > 1 && (activeTab === "analytics" || activeTab === "students" || activeTab === "flagged") && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium shrink-0">Viewing:</span>
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="flex overflow-x-auto gap-1 sm:gap-2 border-b border-white/40 -mx-4 px-4 scrollbar-hide" style={{ backdropFilter: "blur(8px)", WebkitOverflowScrolling: "touch" }}>
        {[
          { id: 'schools', label: 'Schools', mobileLabel: 'Schools', icon: School },
          { id: 'analytics', label: 'Analytics', mobileLabel: 'Stats', icon: BarChart3 },
          { id: 'students', label: 'Students', mobileLabel: 'Students', icon: Users },
          { id: 'flagged', label: 'Flagged Messages', mobileLabel: 'Flagged', icon: AlertTriangle },
          { id: 'compliance', label: 'CMS Compliance', mobileLabel: 'CMS', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium text-sm transition-all border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.mobileLabel}</span>
            {tab.id === 'flagged' && newFlaggedCount > 0 && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {newFlaggedCount}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <SchoolAnalytics
            profiles={filteredProfiles}
            assignments={filteredAssignments}
            tests={filteredTests}
            gamificationStats={filteredGamificationStats}
            schoolName={selectedSchool?.name}
          />
        </motion.div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <StudentList
            profiles={filteredProfiles}
            assignments={filteredAssignments}
            gamificationStats={filteredGamificationStats}
            schools={schools}
            onAdminWrite={adminWrite}
          />
        </motion.div>
      )}

      {/* CMS Compliance Tab */}
      {activeTab === "compliance" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
            <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">CMS Digital Resources Approval</h3>
            <p className="text-sm text-gray-500 mb-4">Pre-filled answers for the Charlotte-Mecklenburg Schools vendor approval process.</p>
            <Link to="/cms-compliance">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Shield className="w-4 h-4" /> View Compliance Guide
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Flagged Messages Tab */}
      {activeTab === "flagged" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <FlaggedMessagesPanel
            messages={filteredFlaggedMessages}
            schoolName={selectedSchool?.name}
            onAdminWrite={adminWrite}
          />
        </motion.div>
      )}

      {/* Schools Tab */}
      {activeTab === "schools" && (
        <>
          {/* Form */}
          <AnimatePresence>
            {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border shadow-lg p-6"
            style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px rgba(99,102,241,0.12)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                {editingSchool ? 'Edit School' : 'Create New School'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingSchool(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>School Name *</Label>
                  <Input
                    placeholder="e.g. Lincoln Middle School"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="e.g. Grade 6–8"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>School Code {editingSchool ? "" : "(optional — auto-generated if blank)"}</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      placeholder={editingSchool ? "" : "e.g. ABC123"}
                      value={form.school_code}
                      onChange={e => setForm({ ...form, school_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) })}
                      className="font-mono tracking-widest"
                    />
                    {!editingSchool && (
                      <Button type="button" variant="outline" onClick={() => setForm({ ...form, school_code: generateSchoolCode() })}>
                        Generate
                      </Button>
                    )}
                  </div>
                  {editingSchool && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ Changing the code will require existing students to re-join with the new code.</p>
                  )}
                </div>
                <div>
                  <Label>SSO Provider</Label>
                  <Select value={form.sso_provider} onValueChange={v => setForm({ ...form, sso_provider: v })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No SSO</SelectItem>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="microsoft">Microsoft 365</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.sso_provider !== 'none' && (
                  <div>
                    <Label>School Email Domain</Label>
                    <Input
                      placeholder="e.g. school.edu"
                      value={form.sso_domain}
                      onChange={e => setForm({ ...form, sso_domain: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                )}

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3">School Hours</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>School Start Time</Label>
                      <Input type="time" value={form.school_hours_start} onChange={e => setForm({ ...form, school_hours_start: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>School End Time</Label>
                      <Input type="time" value={form.school_hours_end} onChange={e => setForm({ ...form, school_hours_end: e.target.value })} className="mt-1.5" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3">🎨 White Label Branding</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>App Name (e.g. Lincoln Planner)</Label>
                      <Input placeholder="Defaults to GradeGuard" value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input placeholder="e.g. Your school's study hub" value={form.brand_tagline} onChange={e => setForm({ ...form, brand_tagline: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Logo URL</Label>
                      <Input placeholder="https://..." value={form.brand_logo_url} onChange={e => setForm({ ...form, brand_logo_url: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          type="color"
                          value={form.brand_primary_color || "#4f46e5"}
                          onChange={e => setForm({ ...form, brand_primary_color: e.target.value })}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input placeholder="#4f46e5" value={form.brand_primary_color} onChange={e => setForm({ ...form, brand_primary_color: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Study Hall / Advisory Period</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Study Hall Start</Label>
                      <Input type="time" value={form.study_hall_start} onChange={e => setForm({ ...form, study_hall_start: e.target.value })} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Study Hall End</Label>
                      <Input type="time" value={form.study_hall_end} onChange={e => setForm({ ...form, study_hall_end: e.target.value })} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingSchool(null); }}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSchool ? 'Update School' : 'Create School'}
                </Button>
              </div>
            </form>
          </motion.div>
            )}
          </AnimatePresence>

          {/* Schools list */}
      {isLoading ? (
        <div className="text-sm text-gray-400 text-center py-8">Loading...</div>
      ) : schools.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="text-center py-16 rounded-2xl border border-dashed border-white/70" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
          <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">No schools yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create your first school so students can sign up</p>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" /> Create School
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              className="rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 20px rgba(99,102,241,0.08)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{school.name}</h3>
                  {school.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{school.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(school)}>
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteSchoolConfirm(school.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {/* School code */}
                <div className="flex items-center gap-2 bg-indigo-50/80 rounded-xl px-3 py-2">
                  <span className="font-mono font-bold text-indigo-700 tracking-widest text-sm">
                    {school.school_code}
                  </span>
                  <button
                    onClick={() => copyCode(school.school_code)}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === school.school_code
                      ? <Check className="w-3.5 h-3.5 text-green-500" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>

                {/* Student count */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {getStudentCount(school.school_code)} students
                </div>

                {/* SSO badge */}
                {school.sso_enabled && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    SSO: {school.sso_provider}
                    {school.sso_domain && ` (${school.sso_domain})`}
                  </Badge>
                )}

                {/* Premium badge (earned via loyalty) */}
                {isSchoolPremium(school) && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Premium Unlocked
                  </Badge>
                )}
              </div>

              {/* Anonymization toggle */}
              <div className="mt-3">
                <AnonymizationToggle
                  school={school}
                  studentCount={getStudentCount(school.school_code)}
                  onComplete={() => queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] })}
                />
              </div>

              {/* Loyalty progress bar */}
              {!isSchoolPremium(school) && (() => {
                const { current, target, pct } = getLoyaltyProgress(school);
                return (
                  <div className="mt-4 pt-3 border-t border-white/60">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Loyalty to Premium</span>
                      <span>{current} / {target} qualifying assignments</span>
                    </div>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct}% — unlock AI Tutor for all students when your school hits {target} qualifying assignments</p>
                  </div>
                );
              })()}
            </motion.div>
          ))}
        </div>
      )}
        </>
      )}
    </motion.div>
  );
}