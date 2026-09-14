import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const chatRouter = Router();

function toPublicMessage(row) {
  return {
    id: row.id,
    sender: row.sender,
    text: row.text,
    createdAt: row.created_at
  };
}

chatRouter.get("/history", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC",
    [req.user.id]
  );
  res.json({ messages: rows.map(toPublicMessage) });
});

chatRouter.get("/admin/conversations", requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id AS userId, u.full_name AS fullName,
            m.text AS lastMessage, m.created_at AS lastMessageAt
     FROM users u
     JOIN chat_messages m ON m.id = (
       SELECT id FROM chat_messages
       WHERE user_id = u.id
       ORDER BY created_at DESC
       LIMIT 1
     )
     ORDER BY m.created_at DESC`
  );
  res.json({ conversations: rows });
});

chatRouter.get(
  "/admin/:userId/history",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC",
      [req.params.userId]
    );
    res.json({ messages: rows.map(toPublicMessage) });
  }
);
