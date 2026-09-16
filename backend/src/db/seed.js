import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { config } from "../config.js";

const SAMPLE_PRODUCTS = [
  {
    category: "windows",
    name_ar: "شباك الوميتال سحاب",
    name_en: "Alumetal Sliding Window",
    description_ar: "شباك سحاب بفردتين، مناسب للصالات والغرف، متاح بمقاسات مخصصة.",
    description_en: "Two-panel sliding window, suitable for living rooms and bedrooms.",
    images: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600"
    ]
  },
  {
    category: "doors",
    name_ar: "باب الوميتال مدخل رئيسي",
    name_en: "Alumetal Main Entrance Door",
    description_ar: "باب مدخل بتصميم عصري، متوفر بعدة ألوان وتشطيبات.",
    description_en: "Modern entrance door design, available in several finishes.",
    images: [
      "https://images.unsplash.com/photo-1587582140719-b0f0c8b98e8e?w=600"
    ]
  },
  {
    category: "wardrobes",
    name_ar: "دولاب الوميتال سرايدر",
    name_en: "Alumetal Sliding Wardrobe",
    description_ar: "دولاب بأبواب سحاب من الالوميتال، مساحة تخزين مرنة حسب المقاس.",
    description_en: "Sliding-door Alumetal wardrobe, sized to your space.",
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600"
    ]
  }
];

async function seed() {
  const [existingAdmin] = await pool.query(
    "SELECT id FROM users WHERE identifier = ?",
    [config.seedAdmin.identifier]
  );

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(config.seedAdmin.password, 10);
    await pool.query(
      "INSERT INTO users (full_name, identifier, password_hash, role) VALUES (?, ?, ?, 'admin')",
      [config.seedAdmin.fullName, config.seedAdmin.identifier, passwordHash]
    );
    console.log(`Admin account created: ${config.seedAdmin.identifier}`);
  } else {
    console.log("Admin account already exists, skipping.");
  }

  const [existingProducts] = await pool.query(
    "SELECT COUNT(*) AS count FROM products"
  );

  if (existingProducts[0].count === 0) {
    for (const product of SAMPLE_PRODUCTS) {
      await pool.query(
        `INSERT INTO products (category, name_ar, name_en, description_ar, description_en, images)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          product.category,
          product.name_ar,
          product.name_en,
          product.description_ar,
          product.description_en,
          JSON.stringify(product.images)
        ]
      );
    }
    console.log(`${SAMPLE_PRODUCTS.length} sample products created.`);
  } else {
    console.log("Products already exist, skipping.");
  }

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
