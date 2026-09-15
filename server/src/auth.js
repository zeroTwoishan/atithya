/** docs/TRD.md §4 — real JWTs, issued to the 3 fixed demo role accounts. */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

import { fail } from "./http.js";

const TOKEN_TTL = "12h"; // a 36h demo, not a production login flow

function secret() {
  const value = process.env.JWT_SECRET;
  // Fail loudly at first use rather than signing every token with "undefined".
  if (!value) throw new Error("JWT_SECRET is not set — see server/.env.example");
  return value;
}

/** scrypt from node:crypto — no bcrypt/argon2 native dependency to build. */
export function hashPassword(plain) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(plain, salt, 64).toString("hex")}`;
}

export function verifyPassword(plain, stored) {
  const [saltHex, hashHex] = String(stored).split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual); // constant-time, not ===
}

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, name: user.name }, secret(), { expiresIn: TOKEN_TTL });

/** Populates req.user from the Bearer token, or 401s. */
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return fail(res, 401, "unauthenticated", "Missing Bearer token.");
  }
  try {
    const claims = jwt.verify(token, secret());
    req.user = { id: claims.sub, role: claims.role, name: claims.name };
    next();
  } catch {
    // Deliberately not echoing the jwt error — expired vs malformed vs wrong
    // signature is information the caller does not need.
    return fail(res, 401, "invalid_token", "Token is invalid or expired.");
  }
}

/** Role gate. Ownership checks stay in the routes — a role alone never proves
 *  the caller owns the specific row they are asking for (docs/TRD.md §6). */
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : fail(res, 403, "forbidden", `Requires role: ${roles.join(" or ")}.`);
