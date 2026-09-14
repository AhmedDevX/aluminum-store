import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const contactMessagesRouter = Router();

function toPublicMessage(row) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at
  };
}

contactMessagesRouter.post("/", requireAuth, async (req, res) => {
  const { name, contact, subject, message } = req.body || {};

  if (!name?.trim() || !contact?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const [result] = await pool.query(
    `INSERT INTO contact_messages (user_id, name, contact, subject, message)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, name.trim(), contact.trim(), subject?.trim() || null, message.trim()]
  );

  const [rows] = await pool.query(
    "SELECT * FROM contact_messages WHERE id = ?",
    [result.insertId]
  );
  res.status(201).json({ message: toPublicMessage(rows[0]) });
});

contactMessagesRouter.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM contact_messages ORDER BY created_at DESC"
  );
  res.json({ messages: rows.map(toPublicMessage) });
});

contactMessagesRouter.patch(
  "/admin/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { status } = req.body || {};
    if (!["new", "read"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    await pool.query("UPDATE contact_messages SET status = ? WHERE id = ?", [
      status,
      req.params.id
    ]);

    const [rows] = await pool.query(
      "SELECT * FROM contact_messages WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Message not found." });
    }
    res.json({ message: toPublicMessage(rows[0]) });
  }
);
