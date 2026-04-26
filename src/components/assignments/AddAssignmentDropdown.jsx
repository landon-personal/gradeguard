import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Camera, MessageSquare, PenLine, ChevronDown } from "lucide-react";

export default function AddAssignmentDropdown({ onManual, onScan, onAI }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(o => !o);
  };

  const items = [
    {
      icon: Camera,
      label: "Smart Scan",
      desc: "Scan your agenda or planner",
      color: "text-purple-600",
      bg: "hover:bg-purple-50",
      onClick: onScan,
    },
    {
      icon: MessageSquare,
      label: "Ask AI",
      desc: "Tell the AI your assignments naturally",
      color: "text-emerald-600",
      bg: "hover:bg-emerald-50",
      onClick: onAI,
    },
    {
      icon: PenLine,
      label: "Manual",
      desc: "Fill out the form yourself",
      color: "text-indigo-600",
      bg: "hover:bg-indigo-50",
      onClick: onManual,
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Add Assignment
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {items.map(({ icon: Icon, label, desc, color, bg, onClick }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); onClick(); }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${bg}`}
            >
              <div className={`mt-0.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-medium ${color}`}>{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}