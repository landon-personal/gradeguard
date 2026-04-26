import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Chrome, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function ChromeExtensionNudge({ onClose }) {
  const navigate = useNavigate();

  const handleDownload = () => {
    onClose();
    navigate(createPageUrl("ChromeExtension"));
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Chrome className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">You're on a roll! 🎉</h2>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            You've completed <strong>5 assignments</strong>! Take GradeGuard with you — manage your tasks and study plan directly from your browser toolbar.
          </p>

          <Button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold h-10 gap-2"
          >
            <Download className="w-4 h-4" />
            Get the Chrome Extension
          </Button>
          <button
            onClick={onClose}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}