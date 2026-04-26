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

    const { connection_id } = body;
    if (!connection_id) {
      return Response.json({ error: "connection_id is required." }, { status: 400 });
    }

    // Verify the user is a member of this connection
    const connections = await base44.asServiceRole.entities.FriendConnection.filter({ id: connection_id });
    const connection = connections?.[0];
    if (!connection || !connection.member_emails?.includes(email)) {
      return Response.json({ error: "Forbidden: you are not a member of this connection." }, { status: 403 });
    }

    const messages = await base44.asServiceRole.entities.FriendMessage.filter(
      { connection_id },
      '-created_date',
      200
    );

    return Response.json({ messages, connection });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});