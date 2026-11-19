import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { normalizeEmail, provisionAdmin } from "./accounts.js";
import { createApi } from "./api.js";
import { ApiError } from "./http.js";
import { openPostgres } from "./postgres.js";
import { withTransaction } from "./transactions.js";
import { handleWorld } from "./world.js";

function requestAddress(req) {
  const forwarded = req.headers["x-vercel-forwarded-for"];
  if (
    process.env.VERCEL === "1" &&
    typeof forwarded === "string" &&
    isIP(forwarded)
  )
    return forwarded;
  return req.socket.remoteAddress;
}

const passwordDigest = (password) =>
  createHash("sha256").update(password).digest();

export function createHostedApi({
  database,
  origin = process.env.APP_ORIGIN,
  adminEmail = process.env.ADMIN_EMAIL,
  adminPassword = process.env.ADMIN_PASSWORD,
  adminName = process.env.ADMIN_NAME || "Game Master",
} = {}) {
  const email = adminEmail && adminPassword ? normalizeEmail(adminEmail) : null;
  const digest = email && passwordDigest(adminPassword);

  async function beforeAuth(db, path, body) {
    if (
      !email ||
      typeof body.email !== "string" ||
      body.email.trim().toLowerCase() !== email
    )
      return;
    if (path === "/api/register") throw new ApiError(409, "email_in_use");
    if (
      typeof body.password !== "string" ||
      body.password.length > 256 ||
      !timingSafeEqual(passwordDigest(body.password), digest)
    )
      return;

    const adminExists = await withTransaction(db, false, (tx) =>
      tx.prepare("SELECT 1 FROM accounts WHERE role = 'admin' LIMIT 1").get(),
    );
    if (!adminExists) {
      await provisionAdmin(
        db,
        { email, password: adminPassword, name: adminName },
        { firstOnly: true },
      );
    }
  }

  return createApi({
    database:
      database ??
      openPostgres(process.env.LEVELUP_DATABASE_URL, {
        ca: process.env.LEVELUP_DATABASE_CA?.trim(),
      }),
    origin,
    secureCookies: true,
    authAddress: requestAddress,
    beforeAuth,
    extra: handleWorld,
  });
}
