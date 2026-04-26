import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
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
      return Response.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    const email = payload.email;

    // Verify user is a school admin
    const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: email });
    const profile = profiles?.[0];
    if (!profile || !profile.is_school_admin) {
      return Response.json({ error: "Forbidden: admin access required." }, { status: 403 });
    }

    if (!profile.school_code) {
      return Response.json({ error: "No school associated with this admin." }, { status: 400 });
    }

    // Return only flagged messages for this admin's school
    const messages = await base44.asServiceRole.entities.FlaggedMessage.filter(
      { school_code: profile.school_code },
      '-created_date',
      500
    );

    return Response.json({ messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});