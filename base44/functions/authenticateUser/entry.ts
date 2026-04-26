import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { SignJWT } from 'npm:jose@5.2.0';
import bcrypt from 'npm:bcryptjs@2.4.3';

// FAIL FAST: refuse to start if JWT_SECRET is missing or empty
const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret || !rawSecret.trim()) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing or empty. The authenticateUser function cannot start.");
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);
const BCRYPT_ROUNDS = 10;

// Basic email format check: at least one char before @, a dot somewhere after @
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory rate limiting for failed login attempts
const loginAttempts = new Map(); // email -> { count, lockedUntil }
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const remainingMin = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return { allowed: false, remainingMin };
  }
  // Lock expired — reset
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(email);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(email, entry);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

// SHA-256 hex hash (matches the old client-side method)
async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isBcryptHash(hash) {
  return hash && (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$"));
}

async function verifyPassword(plainPassword, storedHash) {
  // Phase 1: Try bcrypt (already-migrated users)
  if (isBcryptHash(storedHash)) {
    return bcrypt.compareSync(plainPassword, storedHash);
  }

  // Phase 2: Try legacy SHA-256 (un-migrated users)
  const sha256Hash = await sha256Hex(plainPassword);
  if (sha256Hash === storedHash) {
    return true; // needs migration
  }

  // Phase 3: Legacy plain-text check (very old accounts)
  if (plainPassword === storedHash) {
    return true; // needs migration
  }

  return false;
}

async function migratePassword(base44, profileId, plainPassword) {
  const bcryptHash = bcrypt.hashSync(plainPassword, BCRYPT_ROUNDS);
  await base44.asServiceRole.entities.StudentProfile.update(profileId, {
    user_password: bcryptHash,
  });
}

async function signToken(email, role) {
  return new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password, action, name } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // --- SIGNUP ---
    if (action === "signup") {
      if (!name?.trim()) {
        return Response.json({ error: "Name is required for signup." }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      // Check if email already exists
      const existing = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: trimmedEmail });
      if (existing && existing.length > 0) {
        return Response.json({ error: "Could not create account. Please try a different email or log in." }, { status: 409 });
      }

      // Hash password with bcrypt (server-side, auto-salted)
      const bcryptHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

      // Create profile — always non-admin for signups
      const profileData = {
        user_email: trimmedEmail,
        user_password: bcryptHash,
        user_name: name.trim(),
        is_school_admin: false,
        onboarding_completed: false,
      };

      await base44.asServiceRole.entities.StudentProfile.create(profileData);

      // Note: anonymous_id is assigned during onboarding when school_code is set,
      // via the saveProfile step if the school has anonymize_students enabled.

      const token = await signToken(trimmedEmail, "student");

      return Response.json({ token, email: trimmedEmail, role: "student" });
    }

    // --- LOGIN ---

    // Rate limiting check
    const rateCheck = checkRateLimit(trimmedEmail);
    if (!rateCheck.allowed) {
      return Response.json({ error: `Too many failed attempts. Please try again in ${rateCheck.remainingMin} minute${rateCheck.remainingMin !== 1 ? 's' : ''}.` }, { status: 429 });
    }

    const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ user_email: trimmedEmail });
    const profile = profiles?.[0];

    if (!profile) {
      recordFailedAttempt(trimmedEmail);
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, profile.user_password);
    if (!passwordValid) {
      recordFailedAttempt(trimmedEmail);
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Successful login — clear any failed attempts
    clearAttempts(trimmedEmail);

    // Silent migration: if not already bcrypt, re-hash with bcrypt
    if (!isBcryptHash(profile.user_password)) {
      await migratePassword(base44, profile.id, password);
    }

    // Determine role
    const role = profile.is_school_admin ? "admin" : "student";

    const token = await signToken(trimmedEmail, role);

    return Response.json({
      token,
      email: trimmedEmail,
      role,
      onboarding_completed: profile.onboarding_completed ?? false,
      school_code: profile.school_code || null,
      is_school_admin: profile.is_school_admin ?? false,
      user_name: profile.user_name || null,
    });
  } catch (error) {
    console.error("authenticateUser error:", error.message);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
});