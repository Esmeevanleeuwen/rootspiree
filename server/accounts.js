import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";
import { ApiError } from "./http.js";
import { withTransaction } from "./transactions.js";

const scryptAsync = promisify(scrypt);
const HASH_PARAMS = { N: 32768, r: 8, p: 3, maxmem: 48 * 1024 * 1024 };
const HASH_SIZE = 32;
const SESSION_SECS = 7 * 24 * 60 * 60;
const PROFILE_KEYS = ["hobbies", "job", "goals", "interests"];
const EMPTY_PROFILE = Object.fromEntries(PROFILE_KEYS.map((key) => [key, ""]));
const DEFAULT_DB_PATH = "data/rootspiree.sqlite";

export function openDatabase(
  dbPath = process.env.DATA_PATH || DEFAULT_DB_PATH,
) {
  if (dbPath !== ":memory:") {
    dbPath = resolve(dbPath);
    mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
    closeSync(openSync(dbPath, "a", 0o600));
  }
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('player', 'admin')),
        password_hash TEXT NOT NULL,
        profile_json TEXT NOT NULL,
        profile_complete INTEGER NOT NULL DEFAULT 0,
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        language TEXT NOT NULL CHECK (language IN ('en', 'nl')),
        type_scores TEXT,
        created_at INTEGER NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id);
      CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    `);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function publicAccount(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    profile: JSON.parse(row.profile_json),
    profileComplete: Boolean(row.profile_complete),
    onboardingComplete: Boolean(row.onboarding_complete),
    language: row.language,
    typeScores: row.type_scores === null ? null : JSON.parse(row.type_scores),
  };
}

export function normalizeEmail(email) {
  if (typeof email !== "string" || email.length > 254)
    throw new ApiError(400, "invalid_email");
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u.test(normalized)) {
    throw new ApiError(400, "invalid_email");
  }
  return normalized;
}

function normalizeName(name) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    throw new ApiError(400, "invalid_name");
  }
  return name.trim();
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length > 256) {
    throw new ApiError(400, "invalid_password");
  }
  const size = Array.from(password).length;
  if (size < 12 || size > 128 || !password.trim()) {
    throw new ApiError(400, "invalid_password");
  }
}

export function normalizeLanguage(language) {
  if (language !== "en" && language !== "nl")
    throw new ApiError(400, "invalid_input");
  return language;
}

export function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new ApiError(400, "invalid_input");
  }
  return Object.fromEntries(
    PROFILE_KEYS.map((key) => {
      const value = profile[key] ?? "";
      if (typeof value !== "string" || value.length > 500)
        throw new ApiError(400, "invalid_input");
      return [key, value.trim()];
    }),
  );
}

async function passwordHash(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, HASH_SIZE, HASH_PARAMS);
  return (
    "scrypt$" + salt.toString("base64url") + "$" + hash.toString("base64url")
  );
}

async function passwordMatches(password, stored) {
  // Perform the same derivation for an unknown email to reduce timing differences.
  const [, salt = "", hash = ""] = (stored ?? "").split("$");
  const expected = stored
    ? Buffer.from(hash, "base64url")
    : Buffer.alloc(HASH_SIZE);
  const candidate = await scryptAsync(
    password,
    stored ? Buffer.from(salt, "base64url") : Buffer.alloc(16),
    HASH_SIZE,
    HASH_PARAMS,
  );
  return (
    expected.length === candidate.length &&
    timingSafeEqual(expected, candidate) &&
    Boolean(stored)
  );
}

export async function createPlayer(db, input) {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const language = normalizeLanguage(input.language ?? "en");
  validatePassword(input.password);
  const password = await passwordHash(input.password);
  const id = randomUUID();
  const row = await db
    .prepare(
      `
    INSERT INTO accounts (id, email, name, role, password_hash, profile_json, language, created_at)
    VALUES (?, ?, ?, 'player', ?, ?, ?, ?)
    ON CONFLICT(email) DO NOTHING
    RETURNING *
  `,
    )
    .get(
      id,
      email,
      name,
      password,
      JSON.stringify(EMPTY_PROFILE),
      language,
      Date.now(),
    );
  if (!row) throw new ApiError(409, "email_in_use");
  return publicAccount(row);
}

export async function authenticate(db, input) {
  let email;
  try {
    email = normalizeEmail(input.email);
    validatePassword(input.password);
  } catch {
    throw new ApiError(401, "invalid_credentials");
  }
  const row = await withTransaction(db, false, (tx) =>
    tx.prepare("SELECT * FROM accounts WHERE email = ?").get(email),
  );
  if (!(await passwordMatches(input.password, row?.password_hash))) {
    throw new ApiError(401, "invalid_credentials");
  }
  return { account: publicAccount(row), passwordHash: row.password_hash };
}

function sessionHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookie(secure) {
  const name = secure ? "__Host-rootspiree_session" : "rootspiree_session";
  return {
    read(req) {
      const match = req.headers.cookie
        ?.split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(name + "="));
      const token = match?.slice(name.length + 1);
      return /^[a-zA-Z0-9_-]{43}$/.test(token ?? "") ? token : null;
    },
    write(res, token) {
      res.setHeader(
        "Set-Cookie",
        [
          name + "=" + (token ?? ""),
          "Path=/",
          "HttpOnly",
          "SameSite=Lax",
          "Max-Age=" + (token ? SESSION_SECS : 0),
          ...(secure ? ["Secure"] : []),
        ].join("; "),
      );
    },
  };
}

export async function accountForSession(db, token) {
  if (!token) return null;
  const row = await db
    .prepare(
      `
    SELECT accounts.* FROM accounts JOIN sessions ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `,
    )
    .get(sessionHash(token), Date.now());
  return row ? publicAccount(row) : null;
}

export async function removeSession(db, token) {
  if (token)
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(sessionHash(token));
}

export async function createSession(
  db,
  accountId,
  previousToken,
  expectedPasswordHash,
) {
  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  if (expectedPasswordHash) {
    const current = await db
      .prepare("SELECT password_hash FROM accounts WHERE id = ?")
      .get(accountId);
    if (current?.password_hash !== expectedPasswordHash)
      throw new ApiError(401, "invalid_credentials");
  }
  await removeSession(db, previousToken);
  await db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  await db
    .prepare(
      "INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)",
    )
    .run(sessionHash(token), accountId, now + SESSION_SECS * 1000);
  return token;
}

export async function provisionAdmin(
  db,
  { email, password, name = "Game Master" },
  { firstOnly = false } = {},
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(name);
  validatePassword(password);
  const hash = await passwordHash(password);

  return withTransaction(db, true, async (tx) => {
    if (
      firstOnly &&
      (await tx
        .prepare("SELECT 1 FROM accounts WHERE role = 'admin' LIMIT 1")
        .get())
    )
      return "unchanged";
    const existing = await tx
      .prepare("SELECT id, role FROM accounts WHERE email = ?")
      .get(normalizedEmail);
    if (existing && existing.role !== "admin")
      throw new ApiError(409, "email_in_use");
    if (existing) {
      await tx
        .prepare("UPDATE accounts SET name = ?, password_hash = ? WHERE id = ?")
        .run(normalizedName, hash, existing.id);
      await tx
        .prepare("DELETE FROM sessions WHERE account_id = ?")
        .run(existing.id);
    } else {
      await tx
        .prepare(
          `
        INSERT INTO accounts (id, email, name, role, password_hash, profile_json, profile_complete, onboarding_complete, language, created_at)
        VALUES (?, ?, ?, 'admin', ?, ?, 1, 1, 'en', ?)
      `,
        )
        .run(
          randomUUID(),
          normalizedEmail,
          normalizedName,
          hash,
          JSON.stringify(EMPTY_PROFILE),
          Date.now(),
        );
    }
    return existing ? "updated" : "created";
  });
}
