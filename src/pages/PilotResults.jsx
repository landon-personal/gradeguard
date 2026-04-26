import InfoPageLayout from "@/components/public/InfoPageLayout";

const sections = [
  {
    title: "What schools want to see",
    bullets: [
      "Student activation rate",
      "Weekly active usage",
      "Assignment completion lift",
      "On-time submission lift",
      "Teacher or admin feedback",
      "Student-reported reduction in stress or confusion"
    ]
  },
  {
    title: "How to present a pilot",
    paragraphs: [
      "Run a short pilot with a defined group, measure before-and-after outcomes, and summarize the results in a simple one-page case study.",
      "Use the same scorecard every time so future schools can compare results consistently."
    ]
  },
  {
    title: "Suggested scorecard",
    bullets: [
      "Pilot length: 4-8 weeks",
      "Participants: one grade, classroom group, or advisory cohort",
      "Metrics: completion rate, missed work trend, weekly engagement, survey feedback",
      "Output: one-page summary with quotes, charts, and next-step recommendation"
    ]
  },
  {
    title: "Current status",
    paragraphs: [
      "This page is ready for your first published pilot story. Once you have real school data, replace this placeholder copy with actual metrics, quotes, and results."
    ]
  }
];

export default function PilotResults() {
  return (
    <InfoPageLayout
      eyebrow="Outcomes"
      title="Pilot Results"
      description="A public placeholder page for school pilot outcomes, scorecards, and future case studies."
      sections={sections}
    />
  );
}