import { motion } from "framer-motion";

const toneStyles = {
  indigo: {
    chip: "bg-indigo-100 text-indigo-700",
    halo: "from-indigo-500/25 via-violet-500/10 to-sky-400/10",
    iconWrap: "bg-indigo-600 text-white shadow-indigo-500/30",
  },
  violet: {
    chip: "bg-violet-100 text-violet-700",
    halo: "from-violet-500/25 via-fuchsia-500/10 to-indigo-400/10",
    iconWrap: "bg-violet-600 text-white shadow-violet-500/30",
  },
  amber: {
    chip: "bg-amber-100 text-amber-700",
    halo: "from-amber-400/25 via-orange-400/10 to-yellow-300/10",
    iconWrap: "bg-amber-500 text-white shadow-amber-500/30",
  },
};

export default function IllustratedEmptyState({ icon: Icon, emoji = "✨", title, description, hint, actions, tone = "indigo" }) {
  const toneStyle = toneStyles[tone] || toneStyles.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-[28px] border border-white/70 px-6 py-10 text-center"
      style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${toneStyle.halo}`} />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-sm">
          <span>{emoji}</span>
          Fresh start
        </div>
        <div className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-[22px] ${toneStyle.iconWrap} shadow-xl`}>
          {Icon ? <Icon className="h-7 w-7" /> : <span className="text-3xl">{emoji}</span>}
        </div>
        <h3 className="mt-5 text-2xl font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        {hint && <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneStyle.chip}`}>{hint}</p>}
        {actions && <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>}
      </div>
    </motion.div>
  );
}