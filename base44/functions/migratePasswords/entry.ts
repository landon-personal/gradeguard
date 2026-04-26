import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import bcrypt from 'npm:bcryptjs@2.4.3';

const BCRYPT_ROUNDS = 10;

function isBcryptHash(pw) {
  return pw && (pw.startsWith("$2a$") || pw.startsWith("$2b$") || pw.startsWith("$2y$"));
}

function isSha256Hash(pw) {
  return /^[a-f0-9]{64}$/.test(pw);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profiles = await base44.asServiceRole.entities.StudentProfile.filter({});
    let migrated = 0;
    let skipped = 0;

    for (const profile of profiles) {
      const pw = profile.user_password;
      if (!pw || isBcryptHash(pw)) {
        skipped++;
        continue;
      }

      // For plain-text passwords, hash them with bcrypt directly
      // For SHA-256 hashed passwords, we can't reverse them — hash the SHA-256 string with bcrypt
      // so login flow (which tries bcrypt first, then SHA-256 fallback) still works
      const hashed = bcrypt.hashSync(pw, BCRYPT_ROUNDS);
      await base44.asServiceRole.entities.StudentProfile.update(profile.id, { user_password: hashed });
      migrated++;
    }

    return Response.json({ success: true, migrated, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});