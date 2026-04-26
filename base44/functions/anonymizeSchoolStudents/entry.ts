import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
const JWT_SECRET = new TextEncoder().encode(rawSecret);

function generateAnonymousId(schoolCode, index) {
  const prefix = (schoolCode || "STU").substring(0, 4).toUpperCase();
  const num = String(index).padStart(4, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const suffix = chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${num}-${suffix}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, school_code } = await req.json();

    if (!token || !school_code) {
      return Response.json({ error: "Missing token or school_code" }, { status: 400 });
    }

    // Verify JWT
    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return Response.json({ error: "TOKEN_EXPIRED" }, { status: 401 });
    }

    // Verify caller is admin
    const callerProfiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: payload.email });
    const caller = callerProfiles[0];
    if (!caller?.is_school_admin) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Enable anonymization on the school
    const schools = await base44.asServiceRole.entities.School.filter({ school_code: school_code.toUpperCase() });
    const school = schools[0];
    if (!school) {
      return Response.json({ error: "School not found" }, { status: 404 });
    }

    await base44.asServiceRole.entities.School.update(school.id, { anonymize_students: true });

    // Get all students in this school
    const allStudents = await base44.asServiceRole.entities.StudentProfile.filter(
      { school_code: school_code.toUpperCase() },
      '-created_date',
      2000
    );

    // Find students that need anonymization (no anonymous_id yet, and not admins)
    const toAnonymize = allStudents.filter(s => !s.anonymous_id && !s.is_school_admin);

    // Find highest existing index
    const existingIds = allStudents.filter(s => s.anonymous_id).map(s => {
      const match = s.anonymous_id.match(/-(\d{4})-/);
      return match ? parseInt(match[1]) : 0;
    });
    let nextIndex = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    let anonymizedCount = 0;
    for (const student of toAnonymize) {
      const anonId = generateAnonymousId(school_code, nextIndex);
      await base44.asServiceRole.entities.StudentProfile.update(student.id, {
        anonymous_id: anonId
      });
      nextIndex++;
      anonymizedCount++;
    }

    return Response.json({
      success: true,
      school_name: school.name,
      total_students: allStudents.filter(s => !s.is_school_admin).length,
      newly_anonymized: anonymizedCount,
      already_anonymized: allStudents.filter(s => !!s.anonymous_id).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});