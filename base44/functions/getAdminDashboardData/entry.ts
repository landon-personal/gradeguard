import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET environment variable is missing or empty");
const JWT_SECRET = new TextEncoder().encode(rawSecret);

Deno.serve(async (req) => {
  try {
    const bodyText = await req.text();
    let body = {};
    try { body = JSON.parse(bodyText); } catch {}

    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });
    const base44 = createClientFromRequest(newReq);

    // 1. Verify JWT
    const ggToken = body.token;
    if (!ggToken) {
      return Response.json({ error: "Missing token." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(ggToken, JWT_SECRET);
      payload = result.payload;
    } catch {
      return Response.json({ error: "TOKEN_EXPIRED" }, { status: 401 });
    }
    const email = payload.email;

    // 2. Verify user is a school admin
    const adminProfiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: email });
    const adminProfile = adminProfiles?.[0];
    if (!adminProfile || !adminProfile.is_school_admin) {
      return Response.json({ error: "Forbidden: admin access required." }, { status: 403 });
    }

    // 3. Get schools this admin can manage
    const allSchools = await base44.asServiceRole.entities.School.list('-created_date', 50);

    // 4. Get all student profiles for those schools
    // Admin may manage multiple schools, so get profiles across all schools
    const schoolCodes = allSchools.map(s => s.school_code);
    const allProfiles = await base44.asServiceRole.entities.StudentProfile.list('-created_date', 2000);
    const schoolProfiles = allProfiles.filter(p => schoolCodes.includes(p.school_code));

    // Strip user_password from all profiles
    const safeProfiles = schoolProfiles.map(p => {
      const { user_password, ...rest } = p;
      return rest;
    });

    // 5. Get student emails for data scoping
    const studentEmails = new Set(schoolProfiles.map(p => p.user_email));

    // 6. Fetch assignments, tests, gamification stats — scoped to school students
    const [allAssignments, allTests, allGamificationStats, allFlaggedMessages] = await Promise.all([
      base44.asServiceRole.entities.Assignment.list('-created_date', 5000),
      base44.asServiceRole.entities.Test.list('-created_date', 2000),
      base44.asServiceRole.entities.GamificationStats.list('-total_points', 2000),
      base44.asServiceRole.entities.FlaggedMessage.filter(
        {},
        '-created_date',
        1000
      )
    ]);

    const assignments = allAssignments.filter(a => studentEmails.has(a.user_email));
    const tests = allTests.filter(t => studentEmails.has(t.user_email));
    const gamificationStats = allGamificationStats.filter(s => studentEmails.has(s.user_email));
    const flaggedMessages = allFlaggedMessages.filter(m => schoolCodes.includes(m.school_code));

    return Response.json({
      schools: allSchools,
      profiles: safeProfiles,
      assignments,
      tests,
      gamificationStats,
      flaggedMessages
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});