import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import TestForm from "../components/tests/TestForm";
import IllustratedEmptyState from "../components/common/IllustratedEmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TestCard from "../components/tests/TestCard";
import { differenceInDays } from "date-fns";
import { parseLocalDate } from "../components/utils/dateUtils";
import { useAuth } from "../components/AuthGuard";
import OfflineNotice from "../components/common/OfflineNotice";
import useOfflineEntityData from "../hooks/useOfflineEntityData";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { matchesTestSearch } from "../lib/naturalLanguageFilters";

export default function TestsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("date_soon");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { profile, userEmail, token, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "1") {
      setEditingTest(null);
      setShowForm(true);
      urlParams.delete("new");
      const nextUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  const { data: tests = [], isLoading, isUsingOfflineData } = useOfflineEntityData({
    queryKey: ['tests', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getTests", { token });
      return res.data.tests;
    },
    enabled: !!userEmail && !!token && !!profile,
    storageKey: `gg_cache_tests_${userEmail}`,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // Keyboard shortcut: N to open form, Esc to close
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if (e.key === "n" || e.key === "N") { setEditingTest(null); setShowForm(true); }
      if (e.key === "Escape") { setShowForm(false); setEditingTest(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const subjects = [...new Set(tests.map(t => t.subject).filter(Boolean))];

  const filteredTests = tests.filter((test) => {
    const subjectMatch = filterSubject === 'all' || test.subject === filterSubject;
    const searchMatch = matchesTestSearch(test, debouncedSearch);
    return subjectMatch && searchMatch;
  });

  const sortTests = (list) => [...list].sort((a, b) => {
    switch (sortBy) {
      case 'date_late':
        return parseLocalDate(b.test_date) - parseLocalDate(a.test_date);
      case 'subject':
        return String(a.subject || '').localeCompare(String(b.subject || '')) || String(a.name || '').localeCompare(String(b.name || ''));
      case 'name':
        return String(a.name || '').localeCompare(String(b.name || ''));
      case 'date_soon':
      default:
        return parseLocalDate(a.test_date) - parseLocalDate(b.test_date);
    }
  });

  const upcomingTests = sortTests(
    filteredTests.filter(t => t.status !== 'completed' && differenceInDays(parseLocalDate(t.test_date), today) >= 0)
  );

  const pastTests = sortTests(
    filteredTests.filter(t => t.status === 'completed' || differenceInDays(parseLocalDate(t.test_date), today) < 0)
  );

  const createMutation = useMutation({
    mutationFn: (data) => secureEntity("Test").create({ ...data, user_email: userEmail, status: 'upcoming' }),
    onSuccess: () => { queryClient.invalidateQueries(['tests']); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => secureEntity("Test").update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['tests']); setEditingTest(null); setShowForm(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => secureEntity("Test").delete(id),
    onSuccess: () => queryClient.invalidateQueries(['tests'])
  });

  const handleSubmit = (formData) => {
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setShowForm(true);
  };

  const handleMarkDone = (test) => {
    // Optimistic update
    queryClient.setQueryData(['tests', userEmail], (old = []) =>
      old.map(t => t.id === test.id ? { ...t, status: 'completed' } : t)
    );
    updateMutation.mutate({ id: test.id, data: { status: 'completed' } });
  };

  const handleDeleteRequest = useCallback((id) => setDeleteConfirm(id), []);
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) deleteMutation.mutate(deleteConfirm);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteMutation]);

  const handleQuiz = (test) => {
    navigate(`${createPageUrl("StudyAssistant")}?tool=quiz&testId=${test.id}`);
  };

  if (isLoading || authLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      {isUsingOfflineData && <OfflineNotice label="You’re offline — showing your saved tests." />}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="rounded-2xl p-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(99,102,241,0.85) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 16px 48px rgba(124,58,237,0.3)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tests & Exams</h1>
            <p className="text-purple-100 mt-1 text-sm">Track upcoming tests and get a personalized study plan</p>
          </div>
          <Button
            onClick={() => { setEditingTest(null); setShowForm(true); }}
            className="bg-white text-purple-700 hover:bg-purple-50 gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Test
          </Button>
        </div>
      </motion.div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <TestForm
            test={editingTest}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingTest(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteConfirm}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        title="Delete test?"
        description="This test will be permanently removed. This cannot be undone."
      />

      {tests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Try: biology next week, hard algebra, upcoming finals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/70"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-52 bg-white/70">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_soon">Test Date (Soonest)</SelectItem>
                <SelectItem value="date_late">Test Date (Latest)</SelectItem>
                <SelectItem value="subject">Subject (A-Z)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            {subjects.length > 0 && (
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-44 bg-white/70">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>
      )}

      {tests.length > 0 && upcomingTests.length === 0 && pastTests.length === 0 && !showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 rounded-2xl border border-dashed border-white/70" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
          <p className="font-medium text-gray-600">No matching tests</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search or subject filter.</p>
        </motion.div>
      )}

      {/* Upcoming Tests */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading tests...</div>
      ) : upcomingTests.length === 0 && pastTests.length === 0 && !showForm ? (
        <IllustratedEmptyState
          icon={Plus}
          emoji="📝"
          tone="violet"
          title="No upcoming tests"
          description="Add your next quiz, test, or exam so the app can build practice tools and a smarter study plan around it."
          hint="Flashcards and practice quizzes unlock after your first test"
          actions={
            <Button onClick={() => { setEditingTest(null); setShowForm(true); }} className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" /> Add Test
            </Button>
          }
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upcoming ({upcomingTests.length})</h2>
          <AnimatePresence>
            {upcomingTests.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
                <TestCard test={t} onEdit={handleEdit} onDelete={handleDeleteRequest} onMarkDone={handleMarkDone} onQuiz={handleQuiz} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Past Tests */}
      {pastTests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Past / Completed ({pastTests.length})</h2>
          <AnimatePresence>
            {pastTests.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, delay: i * 0.04 }}>
                <TestCard test={t} onEdit={handleEdit} onDelete={handleDeleteRequest} onMarkDone={handleMarkDone} onQuiz={handleQuiz} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}