import InfoPageLayout from "@/components/public/InfoPageLayout";

const sections = [
  {
    title: "How this supports your FERPA review",
    paragraphs: [
      "GradeGuard is positioned as a school-managed planning and study support workspace, not as an open consumer social platform.",
      "You can review school-level activity, flagged safety issues, and workspace configuration that support school oversight."
    ]
  },
  {
    title: "How this supports your COPPA review",
    paragraphs: [
      "For younger students, school-led deployment and supervision matter. GradeGuard is designed to support school-managed use, admin visibility, and safer communication controls."
    ]
  },
  {
    title: "Student data practices",
    bullets: [
      "Student planning data is used to provide the requested educational workflow",
      "You can review school-managed activity appropriate to your role",
      "Flagged content workflows support school safety review",
      "Data sale is not part of the service model"
    ]
  },
  {
    title: "Important note",
    paragraphs: [
      "This page is meant to support your review, but your district should still review its own legal, procurement, and policy requirements before rollout."
    ]
  }
];

export default function StudentDataPrivacy() {
  return (
    <InfoPageLayout
      eyebrow="Student privacy"
      title="FERPA & COPPA Overview"
      description="A simple school-facing overview for reviewing GradeGuard's student-data and school-oversight positioning."
      sections={sections}
    />
  );
}