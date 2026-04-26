import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, Download, CheckCircle2, Copy, Check, ExternalLink, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const CMS_EMAIL = "privacy@cms.k12.nc.us";

const STEP_1_ANSWERS = {
  vendor_name: "GradeGuard (operated by [Your Company Name])",
  product_name: "GradeGuard — AI-Powered Study Planner",
  classlink: "No",
  canvas_lms: "No",
  sis_integration: "No",
  integration_method: "None — GradeGuard is a standalone web application. Students create accounts directly and enter their own study data. No data is imported from or exported to school systems.",
  meets_tech_requirements: "Yes",
  in_app_messaging: "Conditional — GradeGuard includes optional peer features (messaging, Friends, Leaderboard, Quiz Competition study rooms). However, for schools with Student Anonymization enabled (such as CMS), ALL peer-to-peer features are automatically and completely disabled. No student-to-student interaction of any kind is possible for anonymized schools.",
  admin_monitoring: "Yes (non-anonymized schools only) — School administrators have a Flagged Messages dashboard for schools that have messaging enabled. For anonymized schools, this is not applicable as messaging is fully disabled.",
  admin_disable_messaging: "Automatic — Messaging is automatically disabled for all schools with Student Anonymization enabled. No admin action required.",
  peripherals: "No",
  generative_ai: "Yes — GradeGuard includes an AI Study Assistant that generates practice quizzes, flashcards, and personalized study plans based on student-entered assignments and tests. The AI does not answer homework questions directly; it uses a Socratic method to guide learning.",
};

const DATA_FIELDS = [
  { category: "Application Technology Meta Data", element: "IP Addresses of users, use of cookies, etc.", shared: "Yes — standard web session cookies for authentication" },
  { category: "Communications", element: "Online communications captured (emails, blog entries, messaging)", shared: "No (for anonymized schools) — Messaging, Friends, Leaderboard, and Quiz Competition study rooms are ALL completely disabled when Student Anonymization is enabled. No peer communications or interactions are captured or stored." },
  { category: "Student Contact Information", element: "Email", shared: "Yes — used for account login only. For schools with anonymization enabled, email is stored but never displayed to other users or admins; an anonymous code is used instead." },
  { category: "Student Identifiers", element: "Provider/App assigned student ID number", shared: "Yes — anonymous student ID code (e.g. RFSA-0001-AB) is assigned to each student" },
  { category: "Student Identifiers", element: "Student app username", shared: "Yes — student enters their own display name during signup" },
  { category: "Student Identifiers", element: "Student app passwords", shared: "Yes — hashed with bcrypt (industry standard); never stored in plain text" },
  { category: "Student Name", element: "First and/or Last", shared: "Yes — student self-reports during signup. For anonymized schools, this is only visible to the student themselves." },
  { category: "Student In App Performance", element: "Program/application performance", shared: "Yes — quiz scores, assignment completion rates, study streaks (all student-entered data, no school system imports)" },
  { category: "Student Survey Responses", element: "Student responses to surveys or questionnaires", shared: "Yes — study preference survey during onboarding (e.g. preferred study time, learning style)" },
  { category: "Student work", element: "Student generated content; writing, pictures, etc.", shared: "Yes — student-uploaded study notes and files (stored securely, only accessible by the student and their study group)" },
];

const NOT_COLLECTED = [
  "Assessment — Standardized test scores",
  "Attendance — School or class attendance data",
  "Conduct — Behavioral data",
  "Demographics — Date of Birth, Place of Birth, Gender, Ethnicity, Language",
  "Enrollment — Grade level, Homeroom, Counselor, Programs, Graduation year",
  "Parent/Guardian Contact Information — Address, Email, Phone",
  "Parent/Guardian Name",
  "Schedule — Courses, Teacher names",
  "Special Indicator — ELL, Low income, Medical, Disability, IEP/504, Living situations",
  "Student Contact Information — Address, Phone",
  "Student Identifiers — District ID, State ID",
  "Transcript — Grades, Course data",
  "Transportation — Bus assignment, Pickup/dropoff",
  "Student Program Membership — Activities or clubs",
];

export default function CMSCompliance() {
  const [copiedField, setCopiedField] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const downloadDoc = async (docType, filename) => {
    setDownloading(docType);
    try {
      const res = await base44.functions.invoke('generateCMSDocument', { docType });
      const { file_url } = res.data;
      const a = document.createElement('a');
      a.href = file_url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(null);
    }
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, rgba(51,65,85,0.88) 0%, rgba(16,185,129,0.88) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">CMS Digital Resources Approval</h1>
            <p className="text-emerald-100 text-sm mt-1">Pre-filled answers for Charlotte-Mecklenburg Schools vendor approval forms</p>
          </div>
        </div>
      </motion.div>

      {/* Overview */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> CMS Approval Process — 5 Steps</h2>
        <p className="text-sm text-gray-600 mb-4">All completed documents should be emailed to <a href={`mailto:${CMS_EMAIL}`} className="text-emerald-600 font-medium hover:underline">{CMS_EMAIL}</a></p>
        <div className="space-y-3">
          {[
            { step: 1, title: "Third Party Data Collection & Reporting Worksheet", status: "ready", desc: "Answers pre-filled below — copy into the CMS worksheet" },
            { step: 2, title: "Data Confidentiality & Security Agreement", status: "review", desc: "Legal agreement — needs your company signature" },
            { step: 3, title: "Vendor Readiness Assessment Report (Self-Assessment)", status: "ready", desc: "Can use HECVAT Lite or COSN K-12CVAT — answers guided below" },
            { step: 4, title: "Third-Party Assessment/Audit Report", status: "platform", desc: "Base44 platform provides SOC 2 Type II and ISO 27001 certifications" },
            { step: 5, title: "VPAT (Accessibility)", status: "todo", desc: "WCAG 2.1-AA compliance template — must be completed before April 24, 2026" },
          ].map(({ step, title, status, desc }) => (
            <div key={step} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-white/50">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                status === 'platform' ? 'bg-blue-100 text-blue-700' :
                status === 'review' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>{step}</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              {status === 'ready' && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Data Worksheet Answers */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">1</span>
          Third Party Data Collection & Reporting Worksheet
        </h2>

        <div className="space-y-3">
          {Object.entries(STEP_1_ANSWERS).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-white/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm text-gray-800 mt-1">{value}</p>
              </div>
              <button
                onClick={() => copyText(key, value)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy"
              >
                {copiedField === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Data fields table */}
        <h3 className="font-semibold text-gray-900 mt-6 mb-3">Data Fields Collected</h3>
        <div className="overflow-x-auto rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-50/80">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Category</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Element</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {DATA_FIELDS.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-600 font-medium">{row.category}</td>
                  <td className="px-3 py-2 text-gray-600">{row.element}</td>
                  <td className="px-3 py-2 text-gray-800">{row.shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold text-gray-900 mt-6 mb-3">Data Fields NOT Collected</h3>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {NOT_COLLECTED.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Platform Security */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">4</span>
          Third-Party Assessment / Audit (Platform Certifications)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          GradeGuard is built and hosted on the <strong>Base44</strong> platform, which holds the following security certifications:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { cert: "SOC 2 Type II", desc: "Annual audit by independent third party covering security, availability, and confidentiality controls." },
            { cert: "ISO 27001", desc: "International standard for information security management systems (ISMS)." },
          ].map(({ cert, desc }) => (
            <div key={cert} className="p-4 rounded-xl bg-blue-50/80 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <p className="font-bold text-blue-800">{cert}</p>
              </div>
              <p className="text-xs text-blue-700">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Note: These certifications cover the hosting platform infrastructure. The SOC 2 Type II executive summary can be requested from Base44's Security Trust Center to submit to CMS.
        </p>
      </div>

      {/* Anonymization Details */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Student Data Anonymization (GradeGuard Feature)
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>When a school admin enables <strong>Student Anonymization</strong>, the following protections are applied:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-600">
            <li>Each student is assigned a unique anonymous code (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">RFSA-0012-KM</code>)</li>
            <li>Friends feature, peer messaging, Leaderboard, and Quiz Competition (live study rooms) are ALL <strong>completely disabled</strong> for anonymized schools — no student-to-student interaction of any kind occurs</li>
            <li>Admin dashboards show anonymous codes — real names are not exposed to administrators</li>
            <li>Students still log in with their email and see their own real name on their personal dashboard only</li>
            <li>The mapping between anonymous codes and real identities is stored in an encrypted database accessible only to the platform's service layer</li>
            <li>Existing students are retroactively anonymized when the feature is enabled</li>
          </ul>
        </div>
      </div>

      {/* Submit CTA */}
      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)" }}>
        <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 mb-2">Ready to Submit?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Download the official CMS forms, fill in the pre-filled answers above, and email everything to:
        </p>
        <a href={`mailto:${CMS_EMAIL}`} className="text-emerald-600 font-bold text-lg hover:underline">{CMS_EMAIL}</a>
        <p className="text-xs text-gray-400 mt-4 mb-2 font-semibold uppercase tracking-wide">Download pre-filled .docx files</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => downloadDoc('data_worksheet', 'GradeGuard_CMS_Data_Worksheet.docx')}
            disabled={!!downloading}
            className="gap-2 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {downloading === 'data_worksheet' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Data Worksheet (.docx)
          </Button>
          <Button
            onClick={() => downloadDoc('security_overview', 'GradeGuard_CMS_Security_Overview.docx')}
            disabled={!!downloading}
            className="gap-2 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {downloading === 'security_overview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Security Overview (.docx)
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-5 mb-2 font-semibold uppercase tracking-wide">Official CMS blank forms</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="https://www.cmsk12.org/fs/resource-manager/view/4b2939a8-9cca-437a-9e98-424289fc2722" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 text-sm"><ExternalLink className="w-4 h-4" /> Data Worksheet</Button>
          </a>
          <a href="https://www.cmsk12.org/fs/resource-manager/view/e01c54b2-77d5-4c62-90e2-8adaf0cb481a" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 text-sm"><ExternalLink className="w-4 h-4" /> Security Agreement</Button>
          </a>
          <a href="https://www.cmsk12.org/fs/resource-manager/view/8e9b7eb5-2334-4726-8e8b-563c7be39cc2" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 text-sm"><ExternalLink className="w-4 h-4" /> Vendor Readiness Assessment</Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}