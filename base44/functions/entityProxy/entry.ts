import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
const JWT_SECRET = new TextEncoder().encode(rawSecret);

// Entities where records belong to a specific user via user_email field
const USER_SCOPED_ENTITIES = {
  'Assignment': 'user_email',
  'Test': 'user_email',
  'NotificationSettings': 'user_email',
  'QuizResult': 'user_email',
  'AIJob': 'user_email',
  'Event': 'user_email',
};

// Entities that are user-scoped for writes but allow filtered reads across users
// (e.g. leaderboard needs to read all GamificationStats, friends need to look up profiles)
const USER_SCOPED_WRITE_OPEN_READ = {
  'StudentProfile': 'user_email',
  'GamificationStats': 'user_email',
};

// Entities where membership is checked via a member_emails array field
const MEMBER_SCOPED_ENTITIES = {
  'FriendConnection': 'member_emails',
  'StudyRoom': 'member_emails',
};

// Entities where any authenticated user can read, but writes are scoped
const READ_OPEN_ENTITIES = ['School', 'StudyRoomNote', 'StudyRoomResult'];

// Entities only admins can write to
const ADMIN_ONLY_WRITE = ['FlaggedMessage'];

const ALL_ALLOWED = new Set([
  ...Object.keys(USER_SCOPED_ENTITIES),
  ...Object.keys(USER_SCOPED_WRITE_OPEN_READ),
  ...Object.keys(MEMBER_SCOPED_ENTITIES),
  ...READ_OPEN_ENTITIES,
  ...ADMIN_ONLY_WRITE,
]);

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

    const { action, entity, id, data, filter, sort, limit } = body;

    if (!ALL_ALLOWED.has(entity)) {
      return Response.json({ error: "Entity not allowed." }, { status: 403 });
    }

    const entityRef = base44.asServiceRole.entities[entity];
    if (!entityRef) {
      return Response.json({ error: "Entity not found." }, { status: 404 });
    }

    // --- OWNERSHIP / SCOPING ENFORCEMENT ---

    const userField = USER_SCOPED_ENTITIES[entity];
    const openReadUserField = USER_SCOPED_WRITE_OPEN_READ[entity];
    const memberField = MEMBER_SCOPED_ENTITIES[entity];
    const isReadOpen = READ_OPEN_ENTITIES.includes(entity);
    const isAdminOnly = ADMIN_ONLY_WRITE.includes(entity);

    // Helper: check admin status (lazy, only called when needed)
    const checkAdmin = async () => {
      const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: email });
      return profiles[0]?.is_school_admin === true;
    };

    // Helper: verify record ownership for update/delete
    const verifyOwnership = async (recordId) => {
      const records = await entityRef.filter({ id: recordId });
      const record = records[0];
      if (!record) return { allowed: false, reason: "Record not found." };

      const ownerField = userField || openReadUserField;
      if (ownerField) {
        if (record[ownerField] !== email) return { allowed: false, reason: "Access denied." };
      } else if (memberField) {
        if (!(record[memberField] || []).includes(email)) return { allowed: false, reason: "Access denied." };
      }
      return { allowed: true, record };
    };

    switch (action) {
      case "list": {
        if (userField) {
          // Strictly user-scoped: force filter by user's email
          const result = await entityRef.filter({ [userField]: email }, sort || '-created_date', limit || 200);
          return Response.json({ result });
        }
        if (openReadUserField) {
          // Open-read entities: anyone can list (for leaderboard, friend lookups)
          // but sensitive fields are stripped
          const all = await entityRef.list(sort || '-created_date', limit || 200);
          const result = entity === 'StudentProfile'
            ? all.map(({ user_password, ...rest }) => rest)
            : all;
          return Response.json({ result });
        }
        if (memberField) {
          // Member-scoped: list all then filter client-side (SDK doesn't support array-contains)
          const all = await entityRef.list(sort || '-created_date', limit || 500);
          const result = all.filter(r => (r[memberField] || []).includes(email));
          return Response.json({ result });
        }
        if (isAdminOnly) {
          const admin = await checkAdmin();
          if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
        }
        // Read-open entities: allow full list
        const result = await entityRef.list(sort || '-created_date', limit || 200);
        return Response.json({ result });
      }

      case "filter": {
        if (userField) {
          // Strictly user-scoped: force the user_email filter
          const securedFilter = { ...(filter || {}), [userField]: email };
          const result = await entityRef.filter(securedFilter, sort || '-created_date', limit || 200);
          return Response.json({ result });
        }
        if (openReadUserField) {
          // Open-read: allow filtered reads (leaderboard, friend code lookups)
          const all = await entityRef.filter(filter || {}, sort || '-created_date', limit || 200);
          if (entity === 'StudentProfile') {
            const filterKeys = Object.keys(filter || {});
            const isFriendCodeOnly = filterKeys.length === 1 && filterKeys[0] === 'friend_code';
            const result = all.map(p => {
              if (isFriendCodeOnly) {
                return { id: p.id, user_name: p.user_name, user_email: p.user_email, friend_code: p.friend_code };
              }
              const { user_password, ...rest } = p;
              return rest;
            });
            return Response.json({ result });
          }
          return Response.json({ result: all });
        }
        if (memberField) {
          // Filter then check membership
          const all = await entityRef.filter(filter || {}, sort || '-created_date', limit || 500);
          const result = all.filter(r => (r[memberField] || []).includes(email));
          return Response.json({ result });
        }
        if (isAdminOnly) {
          const admin = await checkAdmin();
          if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
        }
        const result = await entityRef.filter(filter || {}, sort || '-created_date', limit || 200);
        return Response.json({ result });
      }

      case "create": {
        if (isAdminOnly) {
          const admin = await checkAdmin();
          if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
        }
        if (userField || openReadUserField) {
          // Force user_email to the authenticated user
          const field = userField || openReadUserField;
          const securedData = { ...data, [field]: email };
          const result = await entityRef.create(securedData);
          return Response.json({ result });
        }
        if (memberField) {
          // Ensure creator is a member
          const memberList = data[memberField] || [];
          if (!memberList.includes(email)) {
            memberList.push(email);
          }
          const result = await entityRef.create({ ...data, [memberField]: memberList });
          return Response.json({ result });
        }
        const result = await entityRef.create(data);
        return Response.json({ result });
      }

      case "update": {
        if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
        if (isAdminOnly) {
          const admin = await checkAdmin();
          if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
        }
        if (userField || openReadUserField || memberField) {
          const { allowed, reason } = await verifyOwnership(id);
          if (!allowed) return Response.json({ error: reason }, { status: 403 });
        }
        // For user-scoped entities, prevent changing ownership
        const ownerField = userField || openReadUserField;
        const securedData = ownerField ? { ...data, [ownerField]: email } : data;
        const result = await entityRef.update(id, securedData);
        return Response.json({ result });
      }

      case "delete": {
        if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
        if (isAdminOnly) {
          const admin = await checkAdmin();
          if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
        }
        if (userField || openReadUserField || memberField) {
          const { allowed, reason } = await verifyOwnership(id);
          if (!allowed) return Response.json({ error: reason }, { status: 403 });
        }
        await entityRef.delete(id);
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: "Invalid action." }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});