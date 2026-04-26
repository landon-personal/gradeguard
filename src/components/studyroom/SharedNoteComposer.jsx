import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Upload } from "lucide-react";

export default function SharedNoteComposer({ roomId, schoolCode, userEmail, userName, relatedOptions = [], onCreated }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedRelation, setSelectedRelation] = useState("general");
  const [fileMeta, setFileMeta] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileMeta({ url: file_url, name: file.name });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || (!summary.trim() && !fileMeta)) return;

    const selected = relatedOptions.find((option) => option.value === selectedRelation);
    const relatedType = selected?.type || "general";

    setSaving(true);
    await secureEntity("StudyRoomNote").create({
      room_id: roomId,
      school_code: schoolCode,
      author_email: userEmail,
      author_name: userName,
      title: title.trim(),
      summary_markdown: summary.trim(),
      document_url: fileMeta?.url,
      document_name: fileMeta?.name,
      related_type: relatedType,
      related_entity_id: selected?.entityId || "",
      related_title: selected?.title || "",
      related_subject: selected?.subject || "",
    });
    setSaving(false);

    setTitle("");
    setSummary("");
    setSelectedRelation("general");
    setFileMeta(null);
    onCreated?.();
  };

  return (
    <div className="bg-white/80 rounded-2xl border border-white/60 shadow-sm p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900">Add shared note</h3>
        <p className="text-xs text-gray-400">Upload a document, write a markdown summary, and link it to a study item.</p>
      </div>

      <Input
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <select
        value={selectedRelation}
        onChange={(e) => setSelectedRelation(e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      >
        <option value="general">General room note</option>
        {relatedOptions.filter((option) => option.value !== "general").map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Write a markdown summary for the room..."
        className="w-full min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Upload document"}
        </Button>
        {fileMeta && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span className="truncate max-w-[220px]">{fileMeta.name}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading || !title.trim() || (!summary.trim() && !fileMeta)} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Saving..." : "Save note"}
        </Button>
      </div>
    </div>
  );
}