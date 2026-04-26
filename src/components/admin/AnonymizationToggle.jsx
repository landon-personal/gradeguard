import { useState } from "react";
import { Shield, Loader2, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function AnonymizationToggle({ school, studentCount, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("gg_auth_token");

  const handleAnonymize = async () => {
    if (loading) return;
    if (!confirm(`This will assign anonymous IDs to all ${studentCount} students in ${school.name}. Continue?`)) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("anonymizeSchoolStudents", {
        token,
        school_code: school.school_code,
      });
      setResult(res.data);
      if (onComplete) onComplete();
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (school.anonymize_students && !result) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
        <Shield className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Student Anonymization Active</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">Student Privacy Anonymization</p>
          <p className="text-xs text-amber-700 mt-1">
            Enable to assign anonymous IDs to all {studentCount} students. Required for CMS/district privacy compliance.
            Once enabled, student names and emails are hidden from admin views and shared features.
          </p>

          <AnimatePresence>
            {result && !result.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
              >
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Anonymization Complete
                </div>
                <div className="text-xs text-emerald-600 mt-1 space-y-0.5">
                  <p><Users className="w-3 h-3 inline" /> {result.newly_anonymized} students newly anonymized</p>
                  <p>Total students: {result.total_students}</p>
                </div>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-red-600">
                Error: {result.error}
              </motion.p>
            )}
          </AnimatePresence>

          {!school.anonymize_students && (
            <Button
              onClick={handleAnonymize}
              disabled={loading}
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              size="sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? "Anonymizing..." : "Enable Anonymization"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}