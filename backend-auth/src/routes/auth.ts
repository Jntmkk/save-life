import { Router } from "express";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool, type UserRow } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.username ?? user.email,
    createdAt: user.created_at,
  };
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<(UserRow & RowDataPacket)[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<(UserRow & RowDataPacket)[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

authRouter.post("/register", async (req, res) => {
  const { email, password, username } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    res.status(400).json({ message: "A valid email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }
  if (username !== undefined && (typeof username !== "string" || username.length < 2 || username.length > 64)) {
    res.status(400).json({ message: "Username must be 2-64 characters" });
    return;
  }

  if (await findUserByEmail(email)) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
    [email, username ?? null, passwordHash],
  );

  const user = await findUserById(result.insertId);
  if (!user) {
    res.status(500).json({ message: "Failed to load created user" });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, username, password } = req.body ?? {};
  const identity = email ?? username;

  if (typeof identity !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await findUserByEmail(identity);
  // Compare against a dummy hash when the user doesn't exist so the response
  // time doesn't reveal whether the email is registered.
  const hash = user?.password_hash ?? "$2b$10$C6UzMDM.H6dfI/f/IKcEeO7ZDZBZQ7L6Y2A0H5A5S5K5K5K5K5K5K";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.auth!.sub);
  if (!user) {
    res.status(401).json({ message: "User no longer exists" });
    return;
  }
  res.json(publicUser(user));
});

// Stateless JWT — the client discards the token. Endpoint exists so the
// frontend has a stable contract if server-side revocation is added later.
authRouter.post("/logout", (_req, res) => {
  res.json({ success: true });
});
