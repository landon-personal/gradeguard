const normalizeAssignmentText = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const hasMeaningfulName = (name = "") => {
  const normalized = normalizeAssignmentText(name);
  const lettersOnly = normalized.replace(/[^a-z]/g, "");
  return normalized.length >= 5 && lettersOnly.length >= 3;
};

export function isQualifyingAssignment(assignment) {
  if (!assignment) return false;
  if (!hasMeaningfulName(assignment.name)) return false;
  if (!normalizeAssignmentText(assignment.subject)) return false;
  if (!assignment.due_date) return false;
  return true;
}

export function getQualifiedAssignments(assignments = []) {
  const seen = new Set();

  return assignments.filter((assignment) => {
    if (!isQualifyingAssignment(assignment)) return false;

    const fingerprint = [
      assignment.user_email || "",
      normalizeAssignmentText(assignment.name),
      normalizeAssignmentText(assignment.subject),
      assignment.due_date,
    ].join("|");

    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

export function getQualifiedAssignmentCount(assignments = []) {
  return getQualifiedAssignments(assignments).length;
}