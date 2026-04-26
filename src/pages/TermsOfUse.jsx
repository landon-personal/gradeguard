import InfoPageLayout from "@/components/public/InfoPageLayout";

const sections = [
  {
    title: "Using GradeGuard",
    paragraphs: [
      "GradeGuard is intended for school planning, studying, and school-managed student support. Users should use the platform for legitimate educational purposes and follow school rules and local laws."
    ]
  },
  {
    title: "Account responsibilities",
    bullets: [
      "Keep login details secure",
      "Provide accurate account and school information",
      "Do not misuse messaging, classroom, or AI tools",
      "Do not attempt to access other users' private data"
    ]
  },
  {
    title: "School-managed environments",
    paragraphs: [
      "If a school uses GradeGuard, the school may manage workspace rules, access, branding, and oversight features for users in that school environment.",
      "Schools remain responsible for evaluating whether the service fits their own legal and policy requirements."
    ]
  },
  {
    title: "Service changes",
    paragraphs: [
      "We may update features, policies, or service terms over time. Continued use after an update means the updated terms apply."
    ]
  }
];

export default function TermsOfUse() {
  return (
    <InfoPageLayout
      eyebrow="Terms"
      title="Terms of Use"
      description="These terms describe the basic rules for using GradeGuard in student and school settings."
      sections={sections}
    />
  );
}