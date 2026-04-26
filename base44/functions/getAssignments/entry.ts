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
    const email = payload.email;

    const assignments = await base44.asServiceRole.entities.Assignment.filter(
      { user_email: email },
      'due_date',
      2000
    );

    return Response.json({ assignments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});