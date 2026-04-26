import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipient_email, recipient_name } = await req.json();
    if (!recipient_email) return Response.json({ error: 'recipient_email is required' }, { status: 400 });

    // Fetch assignments for this user
    const assignments = await base44.entities.Assignment.filter({ user_email: user.email });

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = assignments.filter(a => {
      if (a.status !== 'completed') return false;
      return new Date(a.updated_date) >= weekAgo;
    });

    const pending = assignments.filter(a => a.status !== 'completed');
    const overdue = pending.filter(a => new Date(a.due_date) < now);
    const upcoming = pending.filter(a => {
      const due = new Date(a.due_date);
      const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    // Calculate streak
    const sorted = assignments.filter(a => a.status === 'completed').sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 365; i++) {
      const day = new Date(today); day.setDate(day.getDate() - i);
      const dayStr = day.toDateString();
      const hadActivity = sorted.some(a => new Date(a.updated_date).toDateString() === dayStr);
      if (hadActivity) streak++;
      else if (i > 0) break;
    }

    const studentName = user.full_name || user.email;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an educational reporting assistant. Generate a professional, warm weekly progress summary email for a parent or teacher about a student named "${studentName}".

Week summary data:
- Assignments completed this week: ${completedThisWeek.length}
${completedThisWeek.map(a => `  • "${a.name}" (${a.subject || 'General'}) - ${a.difficulty || 'unknown'} difficulty`).join('\n') || '  (none)'}
- Current study streak: ${streak} day(s)
- Total pending assignments: ${pending.length}
- Overdue assignments: ${overdue.length}
${overdue.map(a => `  • "${a.name}" (${a.subject || 'General'}) - was due ${a.due_date}`).join('\n') || ''}
- Upcoming this week: ${upcoming.length}
${upcoming.map(a => `  • "${a.name}" (${a.subject || 'General'}) - due ${a.due_date}`).join('\n') || ''}

The email should:
- Be addressed to "${recipient_name || 'Parent/Teacher'}"
- Mention the student by first name: "${studentName.split(' ')[0]}"
- Highlight accomplishments positively
- Mention any concerns (overdue assignments) constructively
- Include 1-2 specific ways the recipient can support the student
- Be professional but warm, 3-5 short paragraphs
- Sign off from "GradeGuard"

Return a subject line and the full email body (plain text, no HTML).`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" }
        }
      }
    });

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: result.subject,
      body: result.body
    });

    return Response.json({ success: true, subject: result.subject, preview: result.body });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});