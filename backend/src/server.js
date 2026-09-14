import express from "express";
import "express-async-errors";
import cors from "cors";
import http from "http";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { quoteRequestsRouter } from "./routes/quoteRequests.routes.js";
import { contactMessagesRouter } from "./routes/contactMessages.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { attachChatSocket } from "./sockets/chatSocket.js";

const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/quote-requests", quoteRequestsRouter);
app.use("/api/contact-messages", contactMessagesRouter);
app.use("/api/chat", chatRouter);

// Centralized error handler: any thrown/rejected error in a route above
// (e.g. a MySQL failure) lands here instead of crashing the process or
// leaking a stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const httpServer = http.createServer(app);
attachChatSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`API + chat socket listening on port ${config.port}`);
});
