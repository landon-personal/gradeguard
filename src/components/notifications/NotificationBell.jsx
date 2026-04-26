import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { AnimatePresence } from "framer-motion";
import NotificationSettingsPanel from "./NotificationSettingsPanel";
import { parseLocalDate } from "@/components/utils/dateUtils";
import { differenceInDays } from "date-fns";

export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("gg_auth_token");

  const { data: settingsArr = [] } = useQuery({
    queryKey: ['notification-settings', userEmail],
    queryFn: () => secureEntity("NotificationSettings").filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['bell-assignments', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAssignments", { token });
      return res.data.assignments || [];
    },
    enabled: !!userEmail && !!token,
    staleTime: 60000,
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['bell-tests', userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getTests", { token });
      return res.data.tests || [];
    },
    enabled: !!userEmail && !!token,
    staleTime: 60000,
  });

  const settings = settingsArr[0] || null;

  // Count upcoming items within remind window
  const remindDays = settings?.remind_days_before ?? [1];
  const maxDays = Math.max(...remindDays, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingCount = [
    ...assignments.filter(a => {
      if (a.status === "completed" || !a.due_date) return false;
      const d = differenceInDays(parseLocalDate(a.due_date), today);
      return d >= 0 && d <= maxDays;
    }),
    ...tests.filter(t => {
      if (t.status === "completed" || !t.test_date) return false;
      const d = differenceInDays(parseLocalDate(t.test_date), today);
      return d >= 0 && d <= maxDays;
    })
  ].length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="Notification settings"
      >
        <Bell className="w-5 h-5" />
        {upcomingCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <NotificationSettingsPanel
              settings={settings}
              userEmail={userEmail}
              onClose={() => setOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}