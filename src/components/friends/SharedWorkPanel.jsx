import { BookOpen, Copy, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDateLabel(dateString, prefix = "") {
  if (!dateString) return "No date";
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${prefix}${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function SharedWorkPanel({ friendName, assignments, tests, onCopyAssignment, onCopyTest, copyingAssignmentId, copyingTestId }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">{friendName}'s schoolwork</h2>
        <p className="mt-1 text-sm text-gray-500">Copy anything you want into your own planner.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p>Assignments</p>
              <p className="text-xs font-medium text-gray-400">{assignments.length} shared</p>
            </div>
          </div>

          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-8 text-center text-sm text-gray-400">
                No assignments shared yet.
              </div>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{assignment.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{assignment.subject || "General"}</span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-600">{formatDateLabel(assignment.due_date, "Due ")}</span>
                      </div>
                      {assignment.notes && (
                        <p className="mt-3 text-sm leading-6 text-gray-500">{assignment.notes}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 self-start"
                      onClick={() => onCopyAssignment(assignment)}
                      disabled={copyingAssignmentId === assignment.id}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copyingAssignmentId === assignment.id ? "Copying..." : "Copy"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <FlaskConical className="h-4 w-4" />
            </div>
            <div>
              <p>Tests</p>
              <p className="text-xs font-medium text-gray-400">{tests.length} shared</p>
            </div>
          </div>

          <div className="space-y-3">
            {tests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-8 text-center text-sm text-gray-400">
                No tests shared yet.
              </div>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{test.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{test.subject || "General"}</span>
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-600">{formatDateLabel(test.test_date)}</span>
                      </div>
                      {test.topics && (
                        <p className="mt-3 text-sm leading-6 text-gray-500">
                          <span className="font-medium text-gray-700">Topics:</span> {test.topics}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 self-start"
                      onClick={() => onCopyTest(test)}
                      disabled={copyingTestId === test.id}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copyingTestId === test.id ? "Copying..." : "Copy"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}