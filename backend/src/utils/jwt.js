import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, fullName: user.full_name },
    config.jwtSecret,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
