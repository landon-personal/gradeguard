import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function InviteLinkButton({ roomCode, className = "", size = "sm", variant = "outline" }) {
  const [done, setDone] = useState(false);

  const handleInvite = async (e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}${createPageUrl("StudyRooms")}?invite=${roomCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my quiz competition",
          text: `Join my quiz competition with code ${roomCode}`,
          url,
        });
        setDone(true);
        setTimeout(() => setDone(false), 1800);
        return;
      } catch {
      }
    }

    await navigator.clipboard.writeText(url);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleInvite}
      className={className}
    >
      {done ? <Check className="w-4 h-4" /> : navigator.share ? <Share2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {done ? "Copied" : "Invite"}
    </Button>
  );
}