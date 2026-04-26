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

    // Verify JWT
    const ggToken = body.token;
    if (!ggToken) {
      return Response.json({ error: "Missing token." }, { status: 401 });
    }
    let jwtPayload;
    try {
      const result = await jwtVerify(ggToken, JWT_SECRET);
      jwtPayload = result.payload;
    } catch {
      return Response.json({ error: "TOKEN_EXPIRED" }, { status: 401 });
    }

    const { connectionId, senderName, content } = body;
    // Use the email from the verified JWT, not from the request body
    const senderEmail = jwtPayload.email;

    if (!connectionId || !content?.trim()) {
      return Response.json({ error: 'connectionId and content are required' }, { status: 400 });
    }

    const trimmedContent = content.trim();
    const connections = await base44.asServiceRole.entities.FriendConnection.filter({ id: connectionId });
    const connection = connections[0];

    if (!connection) {
      return Response.json({ error: 'Friend connection not found' }, { status: 404 });
    }

    const members = connection.member_emails || [];
    if (!members.includes(senderEmail)) {
      return Response.json({ error: 'Sender is not part of this friendship' }, { status: 403 });
    }

    const recipientEmail = members.find((email) => email !== senderEmail) || senderEmail;
    const moderation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `You are a strict school messaging moderator for student-to-student chat.

Classify the message using these rules:
1. is_educational = true ONLY if the message is clearly about school, homework, studying, tests, classes, assignments, notes, schedules, or direct academic coordination.
2. If the message is not educational, still decide whether it should be escalated to a school admin.
3. should_escalate = true ONLY when the message includes clear profanity or vulgar language.
4. Do NOT escalate casual off-topic chat, memes, slang, flirting, gossip, or other non-educational content unless there is actual profanity.
5. Use category = profanity when profanity is present. Otherwise use a non-profanity category.
6. severity must be one of: low, medium, high, critical.

Message: """${trimmedContent}"""`,
      response_json_schema: {
        type: 'object',
        properties: {
          is_educational: { type: 'boolean' },
          should_escalate: { type: 'boolean' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          category: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    });

    if (!moderation.is_educational) {
      const senderProfiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: senderEmail });
      const senderProfile = senderProfiles[0];
      const shouldEscalate = moderation.should_escalate && moderation.category === 'profanity' && !!senderProfile?.school_code;

      if (shouldEscalate) {
        await base44.asServiceRole.entities.FlaggedMessage.create({
          connection_id: connectionId,
          school_code: senderProfile.school_code,
          sender_email: senderEmail,
          sender_name: senderName || senderEmail,
          recipient_email: recipientEmail,
          content: trimmedContent,
          category: moderation.category || 'conduct',
          severity: moderation.severity || 'high',
          moderation_reason: moderation.reason || 'Blocked and routed to admin review.',
          status: 'new'
        });
      }

      return Response.json({
        success: false,
        blocked: true,
        escalated: shouldEscalate,
        reason: shouldEscalate
          ? (moderation.reason || 'This message was blocked and sent to your school admin for review.')
          : (moderation.reason || 'Only educational messages are allowed between friends.')
      }, { status: 403 });
    }

    const message = await base44.asServiceRole.entities.FriendMessage.create({
      connection_id: connectionId,
      sender_email: senderEmail,
      sender_name: senderName || senderEmail,
      recipient_email: recipientEmail,
      content: trimmedContent
    });

    return Response.json({ success: true, blocked: false, message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});