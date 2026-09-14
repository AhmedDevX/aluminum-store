import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || null,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aluminum_store"
  },
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
  seedAdmin: {
    identifier: process.env.SEED_ADMIN_IDENTIFIER || "admin@example.com",
    password: process.env.SEED_ADMIN_PASSWORD || "change-this-password",
    fullName: process.env.SEED_ADMIN_NAME || "Admin"
  }
};
