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

    const { school_code } = body;
    if (!school_code) {
      return Response.json({ count: 0 });
    }

    // Get all student emails in this school
    const profiles = await base44.asServiceRole.entities.StudentProfile.filter(
      { school_code },
      '-created_date',
      5000
    );
    const studentEmails = new Set(profiles.map(p => p.user_email));

    if (studentEmails.size === 0) {
      return Response.json({ count: 0 });
    }

    // Get all assignments and count those belonging to school students
    const allAssignments = await base44.asServiceRole.entities.Assignment.list('-created_date', 10000);
    const schoolAssignments = allAssignments.filter(a => studentEmails.has(a.user_email));

    return Response.json({ count: schoolAssignments.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});