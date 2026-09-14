import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const quoteRequestsRouter = Router();

function toPublicRequest(row) {
  return {
    id: row.id,
    productId: row.product_id,
    width: row.width,
    height: row.height,
    quantity: row.quantity,
    color: row.color,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at
  };
}

quoteRequestsRouter.post("/", requireAuth, async (req, res) => {
  const {
    productId,
    width,
    height,
    quantity,
    color,
    customerName,
    customerPhone,
    notes
  } = req.body || {};

  if (!productId || !width || !height || !customerName?.trim() || !customerPhone?.trim()) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const [result] = await pool.query(
    `INSERT INTO quote_requests
      (user_id, product_id, width, height, quantity, color, customer_name, customer_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      productId,
      width,
      height,
      quantity || 1,
      color || null,
      customerName.trim(),
      customerPhone.trim(),
      notes || null
    ]
  );

  const [rows] = await pool.query("SELECT * FROM quote_requests WHERE id = ?", [
    result.insertId
  ]);
  res.status(201).json({ request: toPublicRequest(rows[0]) });
});

quoteRequestsRouter.get("/mine", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM quote_requests WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ requests: rows.map(toPublicRequest) });
});

quoteRequestsRouter.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM quote_requests ORDER BY created_at DESC"
  );
  res.json({ requests: rows.map(toPublicRequest) });
});

quoteRequestsRouter.patch(
  "/admin/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { status } = req.body || {};
    if (!["pending", "contacted", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    await pool.query("UPDATE quote_requests SET status = ? WHERE id = ?", [
      status,
      req.params.id
    ]);

    const [rows] = await pool.query("SELECT * FROM quote_requests WHERE id = ?", [
      req.params.id
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Request not found." });
    }
    res.json({ request: toPublicRequest(rows[0]) });
  }
);
