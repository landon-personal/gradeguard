import bcrypt from 'npm:bcryptjs@2.4.3';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
const JWT_SECRET = new TextEncoder().encode(rawSecret);

Deno.serve(async (req) => {
  try {
    // JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      await jwtVerify(authHeader.slice(7), JWT_SECRET);
    } catch {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return Response.json({ error: 'No password provided' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    return Response.json({ hashed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});