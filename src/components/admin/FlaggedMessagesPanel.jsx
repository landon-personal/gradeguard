import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Search, Shield, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const severityClasses = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200"
};

const statusClasses = {
  new: "bg-indigo-100 text-indigo-700 border-indigo-200",
  reviewed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  dismissed: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function FlaggedMessagesPanel({ messages = [], schoolName, onAdminWrite }) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => onAdminWrite("update", "FlaggedMessage", id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-dashboard-data"] })
  });

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      const statusMatch = filterStatus === "all" || message.status === filterStatus;
      const severityMatch = filterSeverity === "all" || message.severity === filterSeverity;
      const term = searchTerm.trim().toLowerCase();
      const searchMatch = !term || [
        message.sender_name,
        message.sender_email,
        message.recipient_email,
        message.content,
        message.moderation_reason,
        message.category
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));

      return statusMatch && severityMatch && searchMatch;
    });
  }, [messages, filterSeverity, filterStatus, searchTerm]);

  const counts = useMemo(() => ({
    all: messages.length,
    new: messages.filter(message => message.status === "new").length,
    reviewed: messages.filter(message => message.status === "reviewed").length,
    dismissed: messages.filter(message => message.status === "dismissed").length,
    critical: messages.filter(message => message.severity === "critical").length
  }), [messages]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const newIds = visibleMessages.filter(m => m.status === "new").map(m => m.id);
    setSelectedIds(prev => prev.size === newIds.length ? new Set() : new Set(newIds));
  };

  const handleBulkAction = async (status) => {
    setBulkProcessing(true);
    for (const id of selectedIds) {
      await onAdminWrite("update", "FlaggedMessage", id, { status });
    }
    setSelectedIds(new Set());
    setBulkProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-data"] });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Flagged Messages ({visibleMessages.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Blocked messages{schoolName ? ` for ${schoolName}` : ""} routed to admin review.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-500 font-medium">New</p>
            <p className="text-lg font-bold text-red-700">{counts.new}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500 font-medium">Reviewed</p>
            <p className="text-lg font-bold text-slate-700">{counts.reviewed}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-500 font-medium">Critical</p>
            <p className="text-lg font-bold text-amber-700">{counts.critical}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-xs text-indigo-500 font-medium">Total</p>
            <p className="text-lg font-bold text-indigo-700">{counts.all}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sender, recipient, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-44 bg-white">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["all", "new", "reviewed", "dismissed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap flex-shrink-0 ${filterStatus === status ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-75">({counts[status]})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("dismissed")} disabled={bulkProcessing}>
              <XCircle className="w-4 h-4 mr-1" /> Dismiss All
            </Button>
            <Button size="sm" onClick={() => handleBulkAction("reviewed")} disabled={bulkProcessing} className="bg-indigo-600 hover:bg-indigo-700">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Review All
            </Button>
          </div>
        </div>
      )}

      {visibleMessages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No flagged messages here</p>
          <p className="text-sm text-gray-400 mt-1">Only blocked profanity messages are sent to admins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.filter(m => m.status === "new").length > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={selectedIds.size === visibleMessages.filter(m => m.status === "new").length && selectedIds.size > 0} onChange={handleSelectAll} className="rounded border-gray-300" />
              Select all new messages
            </label>
          )}
          {visibleMessages.map((message) => (
            <div key={message.id} className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${selectedIds.has(message.id) ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                  {message.status === "new" && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(message.id)}
                      onChange={() => handleToggleSelect(message.id)}
                      className="rounded border-gray-300 mt-1"
                    />
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{message.sender_name || message.sender_email}</p>
                    <span className="text-gray-300">→</span>
                    <p className="text-sm text-gray-600">{message.recipient_email}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(message.created_date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={severityClasses[message.severity] || severityClasses.medium}>{message.severity}</Badge>
                  <Badge className={statusClasses[message.status] || statusClasses.new}>{message.status}</Badge>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Blocked content</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>

              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  {message.category && (
                    <p className="text-xs text-gray-500">Category: <span className="text-gray-700">{message.category}</span></p>
                  )}
                  {message.moderation_reason && (
                    <p className="text-sm text-gray-600">{message.moderation_reason}</p>
                  )}
                </div>

                {message.status === "new" && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ id: message.id, status: "dismissed" })}
                      disabled={updateMutation.isPending}
                      className="flex-1 sm:flex-initial"
                    >
                      <XCircle className="w-4 h-4" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: message.id, status: "reviewed" })}
                      disabled={updateMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-initial"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Reviewed
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}