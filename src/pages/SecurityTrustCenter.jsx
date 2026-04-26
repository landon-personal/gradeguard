import InfoPageLayout from "@/components/public/InfoPageLayout";

const sections = [
  {
    title: "Security basics",
    bullets: [
      "You get role-based access for school admin workflows",
      "You can control onboarding with school codes",
      "Student-facing views are separated from admin-facing views",
      "You can manage school workspaces and remove records when needed"
    ]
  },
  {
    title: "Operational controls",
    bullets: [
      "You can review documented privacy and terms pages",
      "Retention and deletion expectations are defined clearly",
      "Stored data is explained in school-facing language",
      "Flagged-message review supports safer school use"
    ]
  },
  {
    title: "Recommended trust packet",
    paragraphs: [
      "As you review the platform, this page should be paired with a one-page security summary, a short subprocessor list, a data flow diagram, incident response contact details, and a school contract or DPA draft."
    ]
  },
  {
    title: "Security contact",
    paragraphs: [
      "If you are reviewing the platform for your school, use a dedicated contact email for privacy, security, or procurement questions."
    ]
  }
];

export default function SecurityTrustCenter() {
  return (
    <InfoPageLayout
      eyebrow="Trust center"
      title="Security & Trust Center"
      description="A school-facing summary of how GradeGuard approaches privacy, admin oversight, and operational trust during school review."
      sections={sections}
    />
  );
}