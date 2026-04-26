import { useState } from "react";
import { Bell, BellOff, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { secureEntity } from "@/lib/secureEntities";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DAY_OPTIONS = [
  { label: "Same day", value: 0 },
  { label: "1 day before", value: 1 },
  { label: "3 days before", value: 3 },
  { label: "1 week before", value: 7 },
];

export default function NotificationSettingsPanel({ settings, userEmail, onClose }) {
  const queryClient = useQueryClient();
  const [pushEnabled, setPushEnabled] = useState(settings?.push_enabled ?? false);
  const [remindDays, setRemindDays] = useState(settings?.remind_days_before ?? [1]);
  const [notifyAssignments, setNotifyAssignments] = useState(settings?.notify_assignments ?? true);
  const [notifyTests, setNotifyTests] = useState(settings?.notify_tests ?? true);
  const [saving, setSaving] = useState(false);
  const [permStatus, setPermStatus] = useState(Notification?.permission || "default");

  const requestPerm = async () => {
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === "granted") setPushEnabled(true);
  };

  const toggleDay = (val) => {
    setRemindDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const data = {
      user_email: userEmail,
      push_enabled: pushEnabled && permStatus === "granted",
      remind_days_before: remindDays,
      notify_assignments: notifyAssignments,
      notify_tests: notifyTests,
    };
    try {
      if (settings?.id) {
        await secureEntity("NotificationSettings").update(settings.id, data);
      } else {
        await secureEntity("NotificationSettings").create(data);
      }
      queryClient.invalidateQueries(['notification-settings', userEmail]);
      onClose();
    } catch (e) {
      console.error("Failed to save notification settings:", e);
      toast.error(e?.message || "Couldn't save your notification settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Bell className="w-4 h-4 text-indigo-500" />
          Notification Settings
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Push toggle */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Push Notifications</p>
          {permStatus === "denied" ? (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">
              Notifications blocked in your browser. Please enable them in your browser settings.
            </p>
          ) : permStatus !== "granted" ? (
            <Button size="sm" onClick={requestPerm} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Bell className="w-3.5 h-3.5" /> Enable Browser Notifications
            </Button>
          ) : (
            <button
              onClick={() => setPushEnabled(v => !v)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                pushEnabled ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <span className="flex items-center gap-2">
                {pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {pushEnabled ? "Push notifications on" : "Push notifications off"}
              </span>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${pushEnabled ? "bg-indigo-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${pushEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}
        </div>

        {/* Remind when */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remind Me</p>
          <div className="grid grid-cols-2 gap-1.5">
            {DAY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleDay(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  remindDays.includes(opt.value)
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {remindDays.includes(opt.value) && <Check className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* What to notify */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notify About</p>
          <div className="space-y-1.5">
            {[
              { label: "Assignments", value: notifyAssignments, set: setNotifyAssignments },
              { label: "Tests", value: notifyTests, set: setNotifyTests },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => item.set(v => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                  item.value ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {item.label}
                <div className={`w-7 h-3.5 rounded-full transition-colors relative ${item.value ? "bg-indigo-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </motion.div>
  );
}