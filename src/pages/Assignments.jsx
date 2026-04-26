import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { ArrowUpDown, BookOpen, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import AssignmentCard from "../components/assignments/AssignmentCard";
import AssignmentForm from "../components/assignments/AssignmentForm";
import AddAssignmentDropdown from "../components/assignments/AddAssignmentDropdown";
import SmartScanModal from "../components/assignments/SmartScanModal";
import AIAssignmentChat from "../components/assignments/AIAssignmentChat";
import { useGamification } from "../components/gamification/useGamification";
import BadgeUnlockToast from "../components/gamification/BadgeUnlockToast";
import { useAuth } from "../components/AuthGuard";
import ChromeExtensionNudge from "../components/ChromeExtensionNudge";
import OfflineNotice from "../components/common/OfflineNotice";
import IllustratedEmptyState from "../components/common/IllustratedEmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import XPGainToast from "../components/gamification/XPGainToast";
import useOfflineEntityData from "../hooks/useOfflineEntityData";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { matchesAssignmentSearch } from "../lib/naturalLanguageFilters";

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showScan, setShowScan] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("due_soon");
  const [pendingBadges, setPendingBadges] = useState([]);
  const [xpToast, setXpToast] = useState(null);
  const [showExtensionNudge, setShowExtensionNudge] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { profile, userEmail, token, isLoading: authLoading } = useAuth();
  const user = userEmail ? { email: userEmail } : null;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "1") {
      setEditingAssignment(null);
      setShowForm(true);
      urlParams.delete("new");
      const nextUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  const { data: assignments = [], isLoading, isUsingOfflineData } = useOfflineEntityData({
    queryKey: ['assignments', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAssignments", { token });
      return res.data.assignments;
    },
    enabled: !!userEmail && !!token && !!profile,
    storageKey: `gg_cache_assignments_${userEmail}`,
  });

  const { awardPoints } = useGamification(user, assignments);

  const createMutation = useMutation({
    mutationFn: (data) => secureEntity("Assignment").create({ ...data, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => secureEntity("Assignment").update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setEditingAssignment(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => secureEntity("Assignment").delete(id),
    onSuccess: () => queryClient.invalidateQueries(['assignments'])
  });

  const handleDeleteRequest = useCallback((id) => setDeleteConfirm(id), []);
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) deleteMutation.mutate(deleteConfirm);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteMutation]);

  const handleSubmit = (data) => {
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleStatusChange = async (assignment, status) => {
    // Only award XP once: when going from a non-completed state to completed for the first time
    const wasNeverCompleted = assignment.status !== "completed" && !assignment.xp_awarded;
    updateMutation.mutate({ id: assignment.id, data: { status, ...(status === "completed" && wasNeverCompleted ? { xp_awarded: true } : {}) } });
    if (status === "completed" && wasNeverCompleted) {
      const result = await awardPoints({ ...assignment, status: "completed" });
      if (result?.points) {
        setXpToast(`+${result.points} XP earned!`);
        setTimeout(() => setXpToast(null), 2500);
      }
      if (result?.newBadges?.length > 0) {
        setPendingBadges(result.newBadges);
      }
      // Show extension nudge exactly when the 5th assignment is completed
      const totalCompleted = assignments.filter(a => a.status === "completed" || a.xp_awarded).length + 1;
      const nudgeShown = localStorage.getItem("gg_ext_nudge_shown");
      if (totalCompleted === 5 && !nudgeShown) {
        setTimeout(() => setShowExtensionNudge(true), 1500);
        localStorage.setItem("gg_ext_nudge_shown", "1");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleAttachmentUpdate = (id, updates) => {
    queryClient.setQueryData(['assignments', userEmail], (old = []) =>
      old.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  };

  const handleBulkCreate = async (items) => {
    for (const a of items) {
      await secureEntity("Assignment").create({ ...a, user_email: user.email, status: "pending" });
    }
    queryClient.invalidateQueries(['assignments']);
  };

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // Keyboard shortcut: N to open form
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if (e.key === "n" || e.key === "N") { setEditingAssignment(null); setShowForm(true); }
      if (e.key === "Escape") { setShowForm(false); setEditingAssignment(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const subjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];

  const filtered = assignments.filter(a => {
    const statusMatch = filterStatus === 'all' || a.status === filterStatus;
    const subjectMatch = filterSubject === 'all' || a.subject === filterSubject;
    const searchMatch = matchesAssignmentSearch(a, debouncedSearch);
    return statusMatch && subjectMatch && searchMatch;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'due_late':
        return String(b.due_date || '').localeCompare(String(a.due_date || ''));
      case 'recent':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'subject':
        return String(a.subject || '').localeCompare(String(b.subject || '')) || String(a.name || '').localeCompare(String(b.name || ''));
      case 'due_soon':
      default:
        return String(a.due_date || '').localeCompare(String(b.due_date || ''));
    }
  });

  const pending = sortedFiltered.filter(a => a.status !== 'completed');
  const completed = sortedFiltered.filter(a => a.status === 'completed');

  if (isLoading || authLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl" />
        <div className="h-10 bg-gray-100 rounded-xl w-64" />
        <div className="grid gap-3 md:grid-cols-2">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      {showExtensionNudge && <ChromeExtensionNudge onClose={() => setShowExtensionNudge(false)} />}
      {isUsingOfflineData && <OfflineNotice label="You’re offline — showing your saved assignments." />}
      {/* Badge unlock toasts */}
      {pendingBadges.length > 0 && (
        <BadgeUnlockToast
          badge={pendingBadges[0]}
          onDone={() => setPendingBadges(prev => prev.slice(1))}
        />
      )}
      <XPGainToast message={xpToast} />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 16px 48px rgba(99,102,241,0.3)" }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Assignments</h1>
              <p className="text-indigo-100 mt-1 text-sm">{pending.length} pending · {completed.length} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AddAssignmentDropdown
                onManual={() => { setEditingAssignment(null); setShowForm(true); }}
                onScan={() => setShowScan(true)}
                onAI={() => setShowAIChat(true)}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {showScan && (
        <SmartScanModal
          onClose={() => setShowScan(false)}
          onAssignmentsFound={handleBulkCreate}
        />
      )}
      {showAIChat && (
        <AIAssignmentChat
          onClose={() => setShowAIChat(false)}
          onAssignmentsFound={handleBulkCreate}
        />
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <AssignmentForm
            assignment={editingAssignment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Filters */}
      {assignments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Try: math due next week, hard essays, completed science..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/70"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white/70">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_soon">Due Date (Soonest)</SelectItem>
                <SelectItem value="due_late">Due Date (Latest)</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="subject">Subject (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1 min-w-0 h-9 text-sm bg-white/70">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {subjects.length > 0 && (
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="flex-1 min-w-0 h-9 text-sm bg-white/70">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>
      )}

      {/* Assignments */}
      {assignments.length > 0 && pending.length === 0 && completed.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 rounded-2xl border border-dashed border-white/70" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
          <p className="font-medium text-gray-600">No matching assignments</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search, subject, or status filter.</p>
        </motion.div>
      )}
      {assignments.length === 0 ? (
        <IllustratedEmptyState
          icon={BookOpen}
          emoji="📚"
          tone="indigo"
          title="No assignments yet"
          description="Start with one homework item or scan a worksheet to build your planner automatically."
          hint="Your daily plan appears here after your first assignment"
          actions={
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Assignment
            </Button>
          }
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Pending ({pending.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <AnimatePresence>
                  {pending.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.28, delay: i * 0.05 }}>
                      <AssignmentCard
                       assignment={a}
                       onEdit={handleEdit}
                       onDelete={handleDeleteRequest}
                       onStatusChange={handleStatusChange}
                       onUpdate={handleAttachmentUpdate}
                      />
                      </motion.div>
                      ))}
                      </AnimatePresence>
                      </div>
                      </div>
                      )}

                      {completed.length > 0 && (
                      <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Completed ({completed.length})
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                      <AnimatePresence>
                      {completed.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                      <AssignmentCard
                       assignment={a}
                       onEdit={handleEdit}
                       onDelete={handleDeleteRequest}
                       onStatusChange={handleStatusChange}
                       onUpdate={handleAttachmentUpdate}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}