import { useState, useRef } from "react";
import { Paperclip, X, Loader2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";

export default function AssignmentAttachment({ assignment, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await secureEntity("Assignment").update(assignment.id, {
      attachment_url: file_url,
      attachment_name: file.name
    });
    onUpdate({ attachment_url: file_url, attachment_name: file.name });
    setUploading(false);
    e.target.value = "";
  };

  const handleRemove = async () => {
    await secureEntity("Assignment").update(assignment.id, {
      attachment_url: null,
      attachment_name: null
    });
    onUpdate({ attachment_url: null, attachment_name: null });
  };

  if (assignment.attachment_url) {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        <a
          href={assignment.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 truncate max-w-[140px]"
        >
          <FileText className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{assignment.attachment_name || "Attachment"}</span>
        </a>
        <button
          onClick={handleRemove}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          title="Remove attachment"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Paperclip className="w-3 h-3" />
        )}
        {uploading ? "Uploading..." : "Attach syllabus / notes"}
      </button>
    </div>
  );
}