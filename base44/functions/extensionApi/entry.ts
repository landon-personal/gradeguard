import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
const JWT_SECRET_KEY = new TextEncoder().encode(rawSecret);

// CORS headers for Chrome extension
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Authenticate via JWT token in Authorization header only
  const authHeader = req.headers.get("Authorization");
  let userEmail = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
      userEmail = payload.email;
    } catch {
      return Response.json({ error: "Invalid or expired token" }, { status: 401, headers: cors });
    }
  }

  if (!userEmail) {
    return Response.json({ error: "Authentication required" }, { status: 401, headers: cors });
  }

  // Verify the user exists
  const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: userEmail });
  if (!profiles.length) {
    return Response.json({ error: "User not found" }, { status: 401, headers: cors });
  }
  const profile = profiles[0];

  // GET /assignments
  if (req.method === "GET" && action === "assignments") {
    const assignments = await base44.asServiceRole.entities.Assignment.filter({ user_email: userEmail }, "due_date", 50);
    return Response.json({ assignments }, { headers: cors });
  }

  // GET /tests
  if (req.method === "GET" && action === "tests") {
    const tests = await base44.asServiceRole.entities.Test.filter({ user_email: userEmail }, "test_date", 30);
    return Response.json({ tests }, { headers: cors });
  }

  // GET /profile
  if (req.method === "GET" && action === "profile") {
    return Response.json({ profile }, { headers: cors });
  }

  // GET /ai_plan
  if (req.method === "GET" && action === "ai_plan") {
    const [assignments, tests] = await Promise.all([
      base44.asServiceRole.entities.Assignment.filter({ user_email: userEmail }, "due_date", 50),
      base44.asServiceRole.entities.Test.filter({ user_email: userEmail, status: "upcoming" }, "test_date", 20),
    ]);
    const pending = assignments.filter(a => a.status !== "completed");
    const today = new Date().toISOString().split("T")[0];

    if (!pending.length && !tests.length) {
      return Response.json({ plan: { items: [], daily_tip: "All caught up! Enjoy your day." } }, { headers: cors });
    }

    const prompt = `You are an academic coach for a student. Today is ${today}.
Student preferences: study_time=${profile.study_time || "any"}, deadline_approach=${profile.deadline_approach || "balanced"}, hardest_subjects=${JSON.stringify(profile.hardest_subjects || [])}.
Pending assignments: ${JSON.stringify(pending.map(a => ({ name: a.name, subject: a.subject, due_date: a.due_date, difficulty: a.difficulty, weight: a.weight, time_estimate: a.time_estimate })))}
Upcoming tests: ${JSON.stringify(tests.map(t => ({ name: t.name, subject: t.subject, test_date: t.test_date, topics: t.topics, difficulty: t.difficulty })))}
Create a prioritized to-do list for today. Only include items from the provided lists. Return 3-6 items max. For each item give a suggested_time_today in minutes (realistic, not too much). Include a short daily_tip.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                assignment_name: { type: "string" },
                subject: { type: "string" },
                urgency_level: { type: "string", enum: ["High", "Medium", "Low"] },
                suggested_time_today: { type: "number" },
                priority_reason: { type: "string" }
              }
            }
          },
          daily_tip: { type: "string" }
        }
      }
    });

    return Response.json({ plan: result }, { headers: cors });
  }

  // POST /assignment (create)
  if (req.method === "POST" && action === "create_assignment") {
    const body = await req.json();
    const assignment = await base44.asServiceRole.entities.Assignment.create({
      user_email: userEmail,
      name: body.name,
      subject: body.subject,
      due_date: body.due_date,
      difficulty: body.difficulty || "medium",
      status: "pending",
      weight: body.weight || "unknown",
      time_estimate: body.time_estimate || null,
    });
    return Response.json({ assignment }, { headers: cors });
  }

  // POST /test (create)
  if (req.method === "POST" && action === "create_test") {
    const body = await req.json();
    const test = await base44.asServiceRole.entities.Test.create({
      user_email: userEmail,
      name: body.name,
      subject: body.subject,
      test_date: body.test_date,
      difficulty: body.difficulty || "medium",
      status: "upcoming",
      topics: body.topics || "",
      notes: body.notes || "",
    });
    return Response.json({ test }, { headers: cors });
  }

  // PUT /assignment (update status)
  if (req.method === "PUT" && action === "update_assignment") {
    const body = await req.json();
    const updated = await base44.asServiceRole.entities.Assignment.update(body.id, { status: body.status });
    return Response.json({ assignment: updated }, { headers: cors });
  }

  // PUT /test (update status)
  if (req.method === "PUT" && action === "update_test") {
    const body = await req.json();
    const updated = await base44.asServiceRole.entities.Test.update(body.id, { status: body.status });
    return Response.json({ test: updated }, { headers: cors });
  }

  return Response.json({ error: "Unknown action" }, { status: 400, headers: cors });
});