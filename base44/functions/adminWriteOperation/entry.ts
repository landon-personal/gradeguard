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

    const { operation, entity, id, data } = body;

    // 3. Route to the appropriate operation
    switch (entity) {
      case "School": {
        if (operation === "create") {
          const result = await base44.asServiceRole.entities.School.create(data);
          return Response.json({ result });
        }
        if (operation === "update") {
          const result = await base44.asServiceRole.entities.School.update(id, data);
          return Response.json({ result });
        }
        if (operation === "delete") {
          await base44.asServiceRole.entities.School.delete(id);
          return Response.json({ success: true });
        }
        return Response.json({ error: "Invalid operation for School." }, { status: 400 });
      }

      case "FlaggedMessage": {
        if (operation === "update") {
          const result = await base44.asServiceRole.entities.FlaggedMessage.update(id, data);
          return Response.json({ result });
        }
        return Response.json({ error: "Invalid operation for FlaggedMessage." }, { status: 400 });
      }

      case "StudentProfile": {
        if (operation === "update") {
          // Only allow school_code and school_id updates for reassignment
          const allowedFields = {};
          if (data.school_code !== undefined) allowedFields.school_code = data.school_code;
          if (data.school_id !== undefined) allowedFields.school_id = data.school_id;
          if (Object.keys(allowedFields).length === 0) {
            return Response.json({ error: "No allowed fields to update." }, { status: 400 });
          }
          const result = await base44.asServiceRole.entities.StudentProfile.update(id, allowedFields);
          return Response.json({ result });
        }
        return Response.json({ error: "Invalid operation for StudentProfile." }, { status: 400 });
      }

      default:
        return Response.json({ error: "Unknown entity." }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});