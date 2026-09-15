/** docs/TRD.md §4 — token issue for the 3 fixed demo accounts. Not a signup
 *  flow: full per-user auth is an explicit Phase-2 item (§7). */
import { Router } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { signToken, verifyPassword, requireAuth } from "../auth.js";
import { ok, fail, route, parseBody } from "../http.js";

const router = Router();

const credentials = z.object({
  username: z.string().min(1).max(150),
  password: z.string().min(1).max(200),
});

router.post(
  "/token",
  route(async (req, res) => {
    const body = parseBody(credentials, req, res);
    if (!body) return;

    const { rows } = await query(
      "SELECT id, role, name, username, password FROM users WHERE username = $1",
      [body.username],
    );
    const user = rows[0];
    // Same response whether the user is missing or the password is wrong —
    // no username enumeration.
    if (!user || !verifyPassword(body.password, user.password)) {
      return fail(res, 401, "invalid_credentials", "Username or password is incorrect.");
    }
    ok(res, { access: signToken(user), user: { id: user.id, role: user.role, name: user.name } });
  }),
);

router.get("/me", requireAuth, (req, res) => ok(res, req.user));

export default router;
