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
    const email = payload.email;

    const { action, room_code, school_code, room_id, data } = body;

    if (action === "find_by_code") {
      // Find a room by code and school — used for joining
      if (!room_code || !school_code) {
        return Response.json({ error: "Missing room_code or school_code." }, { status: 400 });
      }
      const rooms = await base44.asServiceRole.entities.StudyRoom.filter({
        room_code,
        school_code,
      });
      const room = rooms[0] || null;
      return Response.json({ room });
    }

    if (action === "list_school_rooms") {
      // List all rooms in the school (for discovery)
      if (!school_code) {
        return Response.json({ error: "Missing school_code." }, { status: 400 });
      }
      const rooms = await base44.asServiceRole.entities.StudyRoom.filter(
        { school_code },
        '-created_date',
        200
      );
      return Response.json({ rooms });
    }

    if (action === "join") {
      // Join a room — verify it exists, add user to members
      if (!room_id) {
        return Response.json({ error: "Missing room_id." }, { status: 400 });
      }
      const rooms = await base44.asServiceRole.entities.StudyRoom.filter({ id: room_id });
      const room = rooms[0];
      if (!room) {
        return Response.json({ error: "Room not found." }, { status: 404 });
      }
      if (!(room.member_emails || []).includes(email)) {
        const userName = data?.user_name || email;
        await base44.asServiceRole.entities.StudyRoom.update(room.id, {
          member_emails: [...(room.member_emails || []), email],
          member_names: [...(room.member_names || []), userName],
        });
      }
      return Response.json({ success: true });
    }

    if (action === "find_by_invite") {
      // Find room by invite code (for URL-based invites)
      if (!room_code) {
        return Response.json({ error: "Missing room_code." }, { status: 400 });
      }
      const rooms = await base44.asServiceRole.entities.StudyRoom.filter({ room_code });
      const room = rooms[0] || null;
      return Response.json({ room });
    }

    return Response.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});