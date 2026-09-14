import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function toPublicUser(row) {
  return { id: row.id, fullName: row.full_name, identifier: row.identifier, role: row.role };
}

authRouter.post("/register", async (req, res) => {
  const { fullName, identifier, password } = req.body || {};

  if (!fullName?.trim() || !identifier?.trim() || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE identifier = ?",
    [identifier.trim()]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this phone/email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (full_name, identifier, password_hash, role) VALUES (?, ?, ?, 'customer')",
    [fullName.trim(), identifier.trim(), passwordHash]
  );

  const user = {
    id: result.insertId,
    full_name: fullName.trim(),
    identifier: identifier.trim(),
    role: "customer"
  };

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier?.trim() || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE identifier = ?",
    [identifier.trim()]
  );
  const user = rows[0];

  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  const user = rows[0];
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ user: toPublicUser(user) });
});
