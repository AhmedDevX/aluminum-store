import mysql from "mysql2/promise";
import { config } from "../config.js";

export const pool = config.databaseUrl
  ? mysql.createPool(config.databaseUrl)
  : mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10
    });
