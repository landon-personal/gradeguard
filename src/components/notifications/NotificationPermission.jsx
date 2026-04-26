import { useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotificationPermission({ onDone }) {
  const [status, setStatus] = useState(Notification?.permission || "default");

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setStatus(result);
  };

  if (status === "granted") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
          <p className="text-gray-500 mt-1.5 text-sm">You'll get reminders before assignments are due.</p>
        </div>
        <Button onClick={onDone} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12">
          Finish Setup 🎉
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stay on top of deadlines 🔔</h2>
        <p className="text-gray-500 mt-1.5 text-sm leading-relaxed">
          Enable browser notifications to get reminders when assignments are coming up soon — so you never miss a deadline.
        </p>
      </div>

      <div className="bg-indigo-50 rounded-xl p-4 space-y-2 text-sm text-indigo-700">
        <p className="font-medium">You'll be notified:</p>
        <ul className="space-y-1 text-indigo-600">
          <li>• When an assignment is due tomorrow</li>
          <li>• When an overdue assignment needs attention</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button
          onClick={requestPermission}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-12"
        >
          <Bell className="w-4 h-4" /> Enable Notifications
        </Button>
        <Button
          variant="ghost"
          onClick={onDone}
          className="w-full text-gray-400 gap-2 h-10"
        >
          <BellOff className="w-4 h-4" /> Skip for now
        </Button>
      </div>
    </motion.div>
  );
}