import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const productsRouter = Router();

function toPublicProduct(row) {
  const images =
    typeof row.images === "string" ? JSON.parse(row.images) : row.images;
  return {
    id: row.id,
    category: row.category,
    name: { ar: row.name_ar, en: row.name_en },
    description: { ar: row.description_ar, en: row.description_en },
    images
  };
}

productsRouter.get("/", async (req, res) => {
  const { category } = req.query;
  const [rows] = category
    ? await pool.query(
        "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC",
        [category]
      )
    : await pool.query("SELECT * FROM products ORDER BY created_at DESC");

  res.json({ products: rows.map(toPublicProduct) });
});

productsRouter.get("/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
    req.params.id
  ]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Product not found." });
  }
  res.json({ product: toPublicProduct(rows[0]) });
});

productsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { category, name, description, images } = req.body || {};

  if (!category || !name?.ar?.trim() || !name?.en?.trim()) {
    return res.status(400).json({ error: "Category and both names are required." });
  }

  const [result] = await pool.query(
    `INSERT INTO products (category, name_ar, name_en, description_ar, description_en, images)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      category,
      name.ar.trim(),
      name.en.trim(),
      description?.ar || "",
      description?.en || "",
      JSON.stringify(images || [])
    ]
  );

  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
    result.insertId
  ]);
  res.status(201).json({ product: toPublicProduct(rows[0]) });
});

productsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { category, name, description, images } = req.body || {};

  if (!category || !name?.ar?.trim() || !name?.en?.trim()) {
    return res.status(400).json({ error: "Category and both names are required." });
  }

  await pool.query(
    `UPDATE products
     SET category = ?, name_ar = ?, name_en = ?, description_ar = ?, description_en = ?, images = ?
     WHERE id = ?`,
    [
      category,
      name.ar.trim(),
      name.en.trim(),
      description?.ar || "",
      description?.en || "",
      JSON.stringify(images || []),
      req.params.id
    ]
  );

  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
    req.params.id
  ]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Product not found." });
  }
  res.json({ product: toPublicProduct(rows[0]) });
});

productsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
  res.status(204).end();
});
