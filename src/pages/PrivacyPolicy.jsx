import InfoPageLayout from "@/components/public/InfoPageLayout";

const sections = [
  {
    title: "What we collect",
    paragraphs: [
      "GradeGuard stores the information needed to run the planner experience, such as name, email, assignments, tests, study preferences, classrooms, and school configuration details.",
      "If a school enables branded workspace settings, we may also store school logos, colors, and school-level setup information."
    ]
  },
  {
    title: "How we use information",
    bullets: [
      "To let students track assignments, tests, classes, and study progress",
      "To personalize study plans, reminders, and AI-powered learning tools",
      "To give authorized school admins visibility into school-managed usage and safety workflows",
      "To operate support, security monitoring, and product improvements"
    ]
  },
  {
    title: "Who can access data",
    paragraphs: [
      "Students can access their own information. School admins can access school-level information and admin tools tied to their workspace. Internal access is limited to what is needed to operate and support the service.",
      "We do not sell student data."
    ]
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We keep data for as long as the account or school workspace needs it for educational use, legal compliance, and safety review.",
      "Schools or users can request deletion or export workflows, and records can be removed when a workspace is closed or when deletion is required by policy or contract."
    ]
  }
];

export default function PrivacyPolicy() {
  return (
    <InfoPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains what information GradeGuard stores, why it is used, and how student and school data is handled."
      sections={sections}
    />
  );
}