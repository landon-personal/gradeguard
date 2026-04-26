import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
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
    const myEmail = payload.email;
    const friendEmail = body.friend_email;

    if (!friendEmail) {
      return Response.json({ error: "Missing friend_email." }, { status: 400 });
    }

    // Verify the requester is actually friends with this person
    const connections = await base44.asServiceRole.entities.FriendConnection.list('-created_date', 500);
    const isFriend = connections.some(c =>
      (c.member_emails || []).includes(myEmail) &&
      (c.member_emails || []).includes(friendEmail)
    );

    if (!isFriend) {
      return Response.json({ error: "Not friends with this user." }, { status: 403 });
    }

    // Fetch friend's shared assignments and tests
    const [assignments, tests] = await Promise.all([
      base44.asServiceRole.entities.Assignment.filter(
        { user_email: friendEmail, share_with_friends: true },
        'due_date',
        50
      ),
      base44.asServiceRole.entities.Test.filter(
        { user_email: friendEmail, share_with_friends: true },
        'test_date',
        50
      ),
    ]);

    return Response.json({
      assignments: assignments.filter(a => a.status !== 'completed'),
      tests: tests.filter(t => t.status !== 'completed'),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});