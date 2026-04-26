import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AmbientBackground from "@/components/layout/AmbientBackground";

export default function InfoPageLayout({ eyebrow, title, description, sections, updatedLabel = "Last updated: March 23, 2026" }) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #ede7f6 30%, #e3f2fd 60%, #f3e5f5 100%)" }}>
      <AmbientBackground />
      <div className="relative max-w-4xl mx-auto px-4 py-14 space-y-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-3xl p-8 md:p-10" style={{ background: "rgba(255,255,255,0.58)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.72)", boxShadow: "0 8px 32px rgba(99,102,241,0.10)" }}>
          <p className="text-sm font-medium text-indigo-600 mb-3">{eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="mt-4 text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">{description}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-400">{updatedLabel}</p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-3xl p-6 md:p-7"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.72)", boxShadow: "0 8px 28px rgba(15,23,42,0.06)" }}
            >
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm md:text-base text-gray-600 leading-relaxed">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <Link to="/" className="rounded-xl bg-white/80 px-4 py-2 font-medium text-gray-800 border border-white shadow-sm hover:bg-white transition-colors">Back to homepage</Link>
          <Link to="/for-admins" className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors">View admin page</Link>
        </div>
      </div>
    </div>
  );
}