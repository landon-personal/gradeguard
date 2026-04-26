import { useEffect, useCallback } from "react";
import { secureEntity } from "@/lib/secureEntities";
import { parseLocalDate } from "@/components/utils/dateUtils";
import { differenceInDays } from "date-fns";

// Fire a browser push notification
function sendPush(title, body, icon = "/favicon.ico") {
  if (Notification?.permission === "granted") {
    new Notification(title, { body, icon });
  }
}

export function useNotifications({ userEmail, assignments = [], tests = [], settings }) {
  const checkAndNotify = useCallback(async () => {
    if (!userEmail || !settings) return;
    if (!settings.push_enabled) return;
    if (Notification?.permission !== "granted") return;

    const remindDays = settings.remind_days_before?.length ? settings.remind_days_before : [1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split("T")[0];

    // Avoid re-notifying the same day
    if (settings.last_checked === todayStr) return;

    const notifications = [];

    if (settings.notify_assignments !== false) {
      assignments
        .filter(a => a.status !== "completed")
        .forEach(a => {
          if (!a.due_date) return;
          const due = parseLocalDate(a.due_date);
          const daysUntil = differenceInDays(due, today);
          if (remindDays.includes(daysUntil)) {
            notifications.push({
              title: daysUntil === 0 ? `Due today: ${a.name}` : `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}: ${a.name}`,
              body: a.subject ? `${a.subject} — don't forget!` : "Don't forget to complete this assignment!"
            });
          }
          if (daysUntil < 0) {
            notifications.push({
              title: `Overdue: ${a.name}`,
              body: `This assignment was due ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago.`
            });
          }
        });
    }

    if (settings.notify_tests !== false) {
      tests
        .filter(t => t.status !== "completed")
        .forEach(t => {
          if (!t.test_date) return;
          const due = parseLocalDate(t.test_date);
          const daysUntil = differenceInDays(due, today);
          if (remindDays.includes(daysUntil)) {
            notifications.push({
              title: daysUntil === 0 ? `Test today: ${t.name}` : `Test in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}: ${t.name}`,
              body: t.subject ? `${t.subject} — study up!` : "Make sure you're prepared!"
            });
          }
        });
    }

    // Fire all push notifications
    notifications.forEach(n => sendPush(n.title, n.body));

    // Update last_checked so we don't re-fire today
    if (notifications.length > 0 || settings.last_checked !== todayStr) {
      await secureEntity("NotificationSettings").update(settings.id, { last_checked: todayStr });
    }
  }, [userEmail, assignments, tests, settings]);

  useEffect(() => {
    if (assignments.length > 0 || tests.length > 0) {
      checkAndNotify();
    }
  }, [checkAndNotify]);
}