import { scoreTest } from "../src/game.js";
import {
  accountForSession,
  authenticate,
  createPlayer,
  createSession,
  normalizeLanguage,
  normalizeProfile,
  openDatabase,
  publicAccount,
  removeSession,
  sessionCookie,
} from "./accounts.js";
import { ApiError, assertWriteOrigin, readJson } from "./http.js";
import { withTransaction } from "./transactions.js";

export { ApiError };

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 30;
const MAX_CONCURRENT_AUTH = 8;

function createAuthLimits() {
  return { attempts: new Map(), nextSweep: 0, authInFlight: 0 };
}

async function saveProfile(db, account, body) {
  if (!Object.hasOwn(body, "profile") && !Object.hasOwn(body, "language")) {
    throw new ApiError(400, "invalid_input");
  }

  const profile = Object.hasOwn(body, "profile")
    ? JSON.stringify(normalizeProfile(body.profile))
    : null;
  const language = Object.hasOwn(body, "language")
    ? normalizeLanguage(body.language)
    : null;
  const row = await db
    .prepare(
      `
    UPDATE accounts
    SET profile_json = COALESCE(?, profile_json),
        profile_complete = CASE WHEN CAST(? AS TEXT) IS NULL THEN profile_complete ELSE 1 END,
        language = COALESCE(?, language)
    WHERE id = ? RETURNING *
  `,
    )
    .get(profile, profile, language, account.id);
  return publicAccount(row);
}

async function finishQuiz(db, account, answers) {
  if (!account.profileComplete) throw new ApiError(409, "profile_required");
  if (!Array.isArray(answers)) throw new ApiError(400, "invalid_answers");
  let scores;
  try {
    scores = scoreTest(answers);
  } catch {
    throw new ApiError(400, "invalid_answers");
  }
  const row = await db
    .prepare(
      `
    UPDATE accounts SET type_scores = ?, onboarding_complete = 1 WHERE id = ? RETURNING *
  `,
    )
    .get(JSON.stringify(scores), account.id);
  return publicAccount(row);
}

function requireAccount(account) {
  if (!account) throw new ApiError(401, "unauthenticated");
}

export function createApi({
  database,
  dbPath,
  secureCookies = false,
  origin = process.env.APP_ORIGIN,
  extra,
  setup,
  beforeAuth,
  authAddress = (req) => req.socket.remoteAddress,
} = {}) {
  const db = database ?? openDatabase(dbPath);
  try {
    setup?.(db);
  } catch (error) {
    db.close();
    throw error;
  }
  const cookie = sessionCookie(secureCookies);
  const authLimits = createAuthLimits();
  const { attempts } = authLimits;

  async function startAuth(req, res, path, token) {
    const ip = authAddress(req) || "unknown";
    const now = Date.now();
    if (now >= authLimits.nextSweep) {
      for (const [key, entry] of attempts)
        if (entry.until <= now) attempts.delete(key);
      authLimits.nextSweep = now + ATTEMPT_WINDOW_MS;
    }
    let entry = attempts.get(ip);
    if (!entry || entry.until <= now) {
      entry = { count: 0, until: now + ATTEMPT_WINDOW_MS };
      attempts.set(ip, entry);
    }
    const rateLimited = entry.count >= MAX_ATTEMPTS;
    if (rateLimited || authLimits.authInFlight >= MAX_CONCURRENT_AUTH) {
      res.setHeader(
        "Retry-After",
        rateLimited ? Math.ceil((entry.until - now) / 1000) : 1,
      );
      throw new ApiError(429, "rate_limited");
    }
    entry.count++;
    const body = await readJson(req);
    if (authLimits.authInFlight >= MAX_CONCURRENT_AUTH) {
      res.setHeader("Retry-After", 1);
      throw new ApiError(429, "rate_limited");
    }
    authLimits.authInFlight++;
    try {
      await beforeAuth?.(db, path, body);
      let account;
      let session;
      if (path === "/api/register") {
        ({ account, session } = await withTransaction(db, true, async (tx) => {
          const account = await createPlayer(tx, body);
          return {
            account,
            session: await createSession(tx, account.id, token),
          };
        }));
      } else {
        const authenticated = await authenticate(db, body);
        account = authenticated.account;
        session = await withTransaction(db, true, (tx) =>
          createSession(tx, account.id, token, authenticated.passwordHash),
        );
      }
      cookie.write(res, session);
      return account;
    } finally {
      authLimits.authInFlight--;
    }
  }

  async function handler(req, res) {
    const send = (status, data) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(data));
    };
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      assertWriteOrigin(req, origin, secureCookies);
      const path = new URL(req.url, "http://localhost").pathname;
      const token = cookie.read(req);
      const route = req.method + " " + path;

      if (route === "POST /api/register" || route === "POST /api/login") {
        const account = await startAuth(req, res, path, token);
        return send(route === "POST /api/register" ? 201 : 200, { account });
      }
      if (route === "POST /api/logout") {
        req.resume();
        if (token)
          await withTransaction(db, true, (tx) => removeSession(tx, token));
        cookie.write(res, null);
        return send(200, { account: null });
      }

      const account = token
        ? await withTransaction(db, false, (tx) => accountForSession(tx, token))
        : null;
      if (route === "GET /api/session") return send(200, { account });

      if (route === "PATCH /api/profile") {
        requireAccount(account);
        const body = await readJson(req);
        const updated = await withTransaction(db, true, (tx) =>
          saveProfile(tx, account, body),
        );
        return send(200, { account: updated });
      }
      if (route === "POST /api/onboarding") {
        requireAccount(account);
        const body = await readJson(req);
        const updated = await withTransaction(db, true, (tx) =>
          finishQuiz(tx, account, body.answers),
        );
        return send(200, { account: updated });
      }
      if (route === "GET /api/admin/accounts") {
        requireAccount(account);
        if (account.role !== "admin") throw new ApiError(403, "forbidden");
        const rows = await withTransaction(db, false, (tx) =>
          tx
            .prepare(
              "SELECT id, name, email, role, onboarding_complete FROM accounts ORDER BY created_at, id",
            )
            .all(),
        );
        const accounts = rows.map(({ onboarding_complete, ...row }) => ({
          ...row,
          onboardingComplete: Boolean(onboarding_complete),
        }));
        return send(200, { accounts });
      }

      if (extra) {
        const body = await readJson(req);
        if (
          (await extra({ req, res, account, db, body, send, path })) ||
          res.writableEnded
        )
          return;
      }
      return send(404, { error: "not_found" });
    } catch (error) {
      if (res.writableEnded || res.destroyed) return;
      if (error instanceof ApiError)
        return send(error.status, { error: error.code });
      // Keep internals, passwords and account data out of API responses.
      console.error("API request failed:", error?.code ?? error?.name);
      return send(500, { error: "server_error" });
    }
  }

  return { handler, close: () => db.close() };
}
