import { WifiOff } from "lucide-react";

export default function OfflineNotice({ label = "You're offline — showing saved data." }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <p>{label}</p>
      </div>
    </div>
  );
}