import ReactMarkdown from "react-markdown";
import { FileText, Link2 } from "lucide-react";

export default function SharedNoteCard({ note }) {
  const relationLabel = note.related_type === "assignment"
    ? "Assignment"
    : note.related_type === "test"
      ? "Test"
      : "General";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{note.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            By {note.author_name || note.author_email}
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
          {relationLabel}
        </span>
      </div>

      {(note.related_title || note.related_subject) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Link2 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="truncate">
            {note.related_title}
            {note.related_subject ? ` · ${note.related_subject}` : ""}
          </span>
        </div>
      )}

      {note.summary_markdown && (
        <ReactMarkdown className="prose prose-sm max-w-none text-sm text-gray-700 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {note.summary_markdown}
        </ReactMarkdown>
      )}

      {note.document_url && (
        <a
          href={note.document_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <FileText className="w-4 h-4" />
          {note.document_name || "Open document"}
        </a>
      )}
    </div>
  );
}