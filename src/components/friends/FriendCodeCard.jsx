import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function FriendCodeCard({ myCode, friendCodeInput, setFriendCodeInput, onAddFriend, isAdding }) {
  const copyCode = () => {
    navigator.clipboard.writeText(myCode || "");
    toast.success("Friend code copied!");
  };

  return (
    <div className="rounded-2xl p-5 border border-white/70 bg-white/70 backdrop-blur space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Your friend code</h2>
        <p className="text-sm text-gray-500 mt-1">Share this code so classmates can add you.</p>
      </div>

      <button
        onClick={copyCode}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 py-3 font-mono font-bold tracking-[0.2em] hover:bg-indigo-100 transition-colors"
      >
        {myCode || "LOADING"}
        <Copy className="w-4 h-4" />
      </button>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Add a friend</p>
        <div className="flex gap-2">
          <Input
            placeholder="Enter friend code"
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
            className="font-mono tracking-widest uppercase"
            maxLength={6}
          />
          <Button onClick={onAddFriend} disabled={isAdding || !friendCodeInput.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}