import { Server } from "socket.io";
import { pool } from "../db/pool.js";
import { verifyToken } from "../utils/jwt.js";
import { config } from "../config.js";

function toPublicMessage(row, conversationUserId) {
  return {
    id: row.id,
    sender: row.sender,
    text: row.text,
    createdAt: row.created_at,
    conversationUserId
  };
}

export function attachChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, role } = socket.user;

    // Every customer gets a private room keyed by their own user id, so
    // support replies (and their own messages) reach exactly their session(s).
    socket.join(`user:${userId}`);
    if (role === "admin") {
      socket.join("admins");
    }

    socket.on("admin:watch", ({ userId: watchedUserId }) => {
      // Reserved for future use (e.g. read receipts / presence). Currently
      // the "admins" room already receives every conversation's messages,
      // and the AdminChatPanel filters client-side by conversationUserId.
      if (role !== "admin" || !watchedUserId) return;
    });

    socket.on("message", async ({ text, toUserId }) => {
      if (!text?.trim()) return;

      const isAdminSending = role === "admin" && toUserId;
      const conversationUserId = isAdminSending ? toUserId : userId;
      const sender = isAdminSending ? "support" : "customer";

      const [result] = await pool.query(
        "INSERT INTO chat_messages (user_id, sender, text) VALUES (?, ?, ?)",
        [conversationUserId, sender, text.trim()]
      );
      const [rows] = await pool.query(
        "SELECT * FROM chat_messages WHERE id = ?",
        [result.insertId]
      );

      const message = toPublicMessage(rows[0], conversationUserId);

      io.to(`user:${conversationUserId}`).emit("message", message);
      io.to("admins").emit("message", message);
    });
  });

  return io;
}
