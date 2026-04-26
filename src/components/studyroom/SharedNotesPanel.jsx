import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import SharedNoteComposer from "./SharedNoteComposer";
import SharedNoteCard from "./SharedNoteCard";

export default function SharedNotesPanel({ roomId, schoolCode, userEmail, userName }) {
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["study-room-notes", roomId],
    queryFn: () => secureEntity("StudyRoomNote").filter({ room_id: roomId }, "-created_date", 50),
    enabled: !!roomId,
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["room-note-assignments", userEmail],
    queryFn: () => secureEntity("Assignment").filter({ user_email: userEmail }, "due_date", 30),
    enabled: !!userEmail,
    initialData: [],
  });

  const { data: tests = [] } = useQuery({
    queryKey: ["room-note-tests", userEmail],
    queryFn: () => secureEntity("Test").filter({ user_email: userEmail, status: "upcoming" }, "test_date", 30),
    enabled: !!userEmail,
    initialData: [],
  });

  useEffect(() => {
    const unsubscribe = base44.entities.StudyRoomNote.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      queryClient.invalidateQueries({ queryKey: ["study-room-notes", roomId] });
    });

    return unsubscribe;
  }, [roomId, queryClient]);

  const relatedOptions = [
    { value: "general", label: "General room note", type: "general" },
    ...assignments
      .filter((assignment) => assignment.status !== "completed")
      .map((assignment) => ({
        value: `assignment:${assignment.id}`,
        label: `Assignment · ${assignment.name}${assignment.subject ? ` (${assignment.subject})` : ""}`,
        type: "assignment",
        entityId: assignment.id,
        title: assignment.name,
        subject: assignment.subject || "",
      })),
    ...tests.map((test) => ({
      value: `test:${test.id}`,
      label: `Test · ${test.name}${test.subject ? ` (${test.subject})` : ""}`,
      type: "test",
      entityId: test.id,
      title: test.name,
      subject: test.subject || "",
    })),
  ];

  return (
    <div className="space-y-4">
      <SharedNoteComposer
        roomId={roomId}
        schoolCode={schoolCode}
        userEmail={userEmail}
        userName={userName}
        relatedOptions={relatedOptions}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["study-room-notes", roomId] })}
      />

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">Shared study notes</h3>
          <p className="text-xs text-gray-400">Everything your room has collected for collaborative study.</p>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white/70 rounded-2xl border border-white/60 p-6 text-center text-sm text-gray-400">
            No shared notes yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <SharedNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}