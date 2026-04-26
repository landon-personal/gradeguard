import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, TableLayoutType } from 'npm:docx@9.5.0';

const STEP_1_ANSWERS = {
  "Vendor Name": "GradeGuard (operated by [Your Company Name])",
  "Product Name": "GradeGuard — AI-Powered Study Planner",
  "ClassLink Integration": "No",
  "Canvas LMS Integration": "No",
  "SIS Integration": "No",
  "Integration Method": "None — GradeGuard is a standalone web application. Students create accounts directly and enter their own study data. No data is imported from or exported to school systems.",
  "Meets Tech Requirements": "Yes",
  "In-App Messaging": "Conditional — GradeGuard includes optional peer features (messaging, Friends, Leaderboard, Quiz Competition study rooms). However, for schools with Student Anonymization enabled (such as CMS), ALL peer-to-peer features are automatically and completely disabled. No student-to-student interaction of any kind is possible for anonymized schools.",
  "Admin Monitoring": "Yes (non-anonymized schools only) — School administrators have a Flagged Messages dashboard for schools that have messaging enabled. For anonymized schools, this is not applicable as messaging is fully disabled.",
  "Admin Can Disable Messaging": "Automatic — Messaging is automatically disabled for all schools with Student Anonymization enabled. No admin action required.",
  "Peripherals Required": "No",
  "Generative AI": "Yes — GradeGuard includes an AI Study Assistant that generates practice quizzes, flashcards, and personalized study plans based on student-entered assignments and tests. The AI does not answer homework questions directly; it uses a Socratic method to guide learning.",
};

const DATA_FIELDS = [
  { category: "Application Technology Meta Data", element: "IP Addresses of users, use of cookies, etc.", details: "Yes — standard web session cookies for authentication" },
  { category: "Communications", element: "Online communications captured (emails, blog entries, messaging)", details: "No (for anonymized schools) — Messaging, Friends, Leaderboard, and Quiz Competition study rooms are ALL completely disabled when Student Anonymization is enabled. No peer communications or interactions are captured or stored." },
  { category: "Student Contact Information", element: "Email", details: "Yes — used for account login only. For schools with anonymization enabled, email is stored but never displayed." },
  { category: "Student Identifiers", element: "Provider/App assigned student ID number", details: "Yes — anonymous student ID code (e.g. RFSA-0001-AB)" },
  { category: "Student Identifiers", element: "Student app username", details: "Yes — student enters their own display name during signup" },
  { category: "Student Identifiers", element: "Student app passwords", details: "Yes — hashed with bcrypt; never stored in plain text" },
  { category: "Student Name", element: "First and/or Last", details: "Yes — student self-reports during signup. For anonymized schools, only visible to the student." },
  { category: "Student In App Performance", element: "Program/application performance", details: "Yes — quiz scores, assignment completion rates, study streaks" },
  { category: "Student Survey Responses", element: "Student responses to surveys or questionnaires", details: "Yes — study preference survey during onboarding" },
  { category: "Student work", element: "Student generated content; writing, pictures, etc.", details: "Yes — student-uploaded study notes and files" },
];

const NOT_COLLECTED = [
  "Assessment — Standardized test scores", "Attendance — School or class attendance data",
  "Conduct — Behavioral data", "Demographics — Date of Birth, Place of Birth, Gender, Ethnicity, Language",
  "Enrollment — Grade level, Homeroom, Counselor, Programs, Graduation year",
  "Parent/Guardian Contact Information — Address, Email, Phone", "Parent/Guardian Name",
  "Schedule — Courses, Teacher names",
  "Special Indicator — ELL, Low income, Medical, Disability, IEP/504, Living situations",
  "Student Contact Information — Address, Phone", "Student Identifiers — District ID, State ID",
  "Transcript — Grades, Course data", "Transportation — Bus assignment, Pickup/dropoff",
  "Student Program Membership — Activities or clubs",
];

function buildDataWorksheet() {
  const children = [];
  children.push(new Paragraph({ text: "GradeGuard — CMS Third Party Data Collection & Reporting Worksheet", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
  children.push(new Paragraph({ text: "Pre-filled answers for the Charlotte-Mecklenburg Schools vendor approval process.", spacing: { after: 300 } }));
  children.push(new Paragraph({ text: "Section 1: Vendor & Product Information", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }));

  for (const [key, value] of Object.entries(STEP_1_ANSWERS)) {
    children.push(new Paragraph({ children: [new TextRun({ text: `${key}: `, bold: true }), new TextRun({ text: value })], spacing: { after: 150 } }));
  }

  children.push(new Paragraph({ text: "Section 2: Student Data Fields Collected", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }));

  // Column widths in twips (1 inch = 1440 twips). Total page ~9360 twips for standard margins.
  const colWidths = [2400, 2800, 4160]; // Category, Element, Details

  const headerRow = new TableRow({
    children: ["Category", "Data Element", "Details"].map((text, i) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })], alignment: AlignmentType.LEFT })],
        shading: { fill: "10B981" },
        width: { size: colWidths[i], type: WidthType.DXA },
      })
    ),
  });
  const dataRows = DATA_FIELDS.map(row =>
    new TableRow({
      children: [row.category, row.element, row.details].map((text, i) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 18 })], spacing: { before: 40, after: 40 } })],
          width: { size: colWidths[i], type: WidthType.DXA },
        })
      ),
    })
  );
  children.push(new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
  }));

  children.push(new Paragraph({ text: "Section 3: Data Fields NOT Collected", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }));
  children.push(new Paragraph({ text: "GradeGuard does NOT collect or have access to any of the following:", spacing: { after: 150 } }));
  for (const item of NOT_COLLECTED) {
    children.push(new Paragraph({ children: [new TextRun(`• ${item}`)], spacing: { after: 60 } }));
  }

  children.push(new Paragraph({ text: "Section 4: Student Data Anonymization", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }));
  for (const point of [
    "Each student is assigned a unique anonymous code (e.g. RFSA-0012-KM)",
    "Friends feature, peer messaging, Leaderboard, and Quiz Competition (live study rooms) are ALL COMPLETELY DISABLED for anonymized schools — no student-to-student interaction of any kind occurs",
    "Admin dashboards show anonymous codes — real names are not exposed",
    "Students still see their own real name on their personal dashboard only",
    "Existing students are retroactively anonymized when the feature is enabled",
  ]) {
    children.push(new Paragraph({ children: [new TextRun(`• ${point}`)], spacing: { after: 60 } }));
  }

  return new Document({ sections: [{ children }] });
}

function buildSecurityOverview() {
  const children = [];
  children.push(new Paragraph({ text: "GradeGuard — Security & Compliance Overview for CMS", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
  children.push(new Paragraph({ text: `Prepared: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, spacing: { after: 300 } }));

  const sections = [
    { title: "1. Platform Security Certifications", paragraphs: [
      "GradeGuard is built and hosted on the Base44 platform, which holds the following certifications:",
    ], bullets: [
      "SOC 2 Type II — Annual audit covering security, availability, and confidentiality controls.",
      "ISO 27001 — International standard for information security management systems.",
    ]},
    { title: "2. Data Storage & Encryption", bullets: [
      "All data encrypted at rest using AES-256", "All data in transit encrypted using TLS 1.2+",
      "Passwords hashed using bcrypt with salt", "Database access restricted to authenticated service-layer operations",
      "No student data is sold, shared with third parties, or used for advertising",
    ]},
    { title: "3. Access Controls", bullets: [
      "JWT-based authentication with token expiry", "Role-based access control (student vs. school admin)",
      "Students can only access their own data", "School admins can only view aggregate data for their school",
      "AI content moderation on all peer messaging with severity-based escalation",
    ]},
    { title: "4. Data Retention & Deletion", paragraphs: [
      "Student accounts and all associated data can be deleted upon request by the school administrator or the student. GradeGuard does not retain student data after account deletion.",
    ]},
    { title: "5. FERPA Compliance", paragraphs: [
      "GradeGuard collects only student-entered data (no school system imports). The platform operates under the 'school official' exception when deployed by a school. Student data anonymization is available for full FERPA compliance.",
    ]},
    { title: "6. Contact", paragraphs: [
      "For security inquiries or data deletion requests, contact the GradeGuard administrator or email privacy@cms.k12.nc.us.",
    ]},
  ];

  for (const section of sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }));
    for (const p of (section.paragraphs || [])) {
      children.push(new Paragraph({ text: p, spacing: { after: 100 } }));
    }
    for (const b of (section.bullets || [])) {
      children.push(new Paragraph({ children: [new TextRun(`• ${b}`)], spacing: { after: 60 } }));
    }
  }

  return new Document({ sections: [{ children }] });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docType } = await req.json();

    let doc;
    let filename;
    if (docType === 'data_worksheet') {
      doc = buildDataWorksheet();
      filename = 'GradeGuard_CMS_Data_Worksheet.docx';
    } else if (docType === 'security_overview') {
      doc = buildSecurityOverview();
      filename = 'GradeGuard_CMS_Security_Overview.docx';
    } else {
      return Response.json({ error: 'Invalid docType' }, { status: 400 });
    }

    const buffer = await Packer.toBuffer(doc);

    // Upload the file and return a download URL
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const file = new File([blob], filename, { type: blob.type });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ file_url, filename });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});