import { createHash, timingSafeEqual } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { BlobError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import {
  normalizeEmail,
  openDatabase,
  provisionAdmin,
  sessionCookie,
} from "./accounts.js";
import { createApi, createAuthLimits } from "./api.js";
import { ApiError, assertWriteOrigin, readJson } from "./http.js";
import { handleWorld, setupWorld } from "./world.js";

const SNAPSHOT_PATH = "levelup-world.sqlite";
const MAX_ATTEMPTS = 4;
const storageTimeout = () => AbortSignal.timeout(5000);

function blobStorage() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Private game storage is not configured");
  }
  // An ambiguous network failure must not be retried as a write conflict.
  // This setting disables the pinned SDK's internal transport retries.
  process.env.VERCEL_BLOB_RETRIES = "0";
  return {
    async read() {
      const file = await get(SNAPSHOT_PATH, {
        access: "private",
        useCache: false,
        abortSignal: storageTimeout(),
      });
      if (!file) return null;
      if (file.statusCode !== 200 || !file.blob.etag || file.blob.size === 0)
        throw new Error("The stored world snapshot is invalid");
      return {
        bytes: Buffer.from(await new Response(file.stream).arrayBuffer()),
        etag: file.blob.etag,
      };
    },
    async write(bytes, etag) {
      try {
        await put(SNAPSHOT_PATH, bytes, {
          access: "private",
          contentType: "application/vnd.sqlite3",
          allowOverwrite: Boolean(etag),
          ifMatch: etag,
          abortSignal: storageTimeout(),
        });
        return true;
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) return false;
        if (!etag) {
          // Create-only writes report an existing pathname as an SDK error,
          // not as an ETag conflict.
          if (
            error instanceof BlobError &&
            error.message.includes("This blob already exists")
          )
            return false;
          const latest = await this.read();
          if (latest?.bytes.equals(bytes)) return true;
        }
        throw error;
      }
    },
  };
}

function bufferResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    writableEnded: false,
    setHeader(key, value) {
      headers.set(key, value);
    },
    end(body) {
      this.body = body;
      this.writableEnded = true;
    },
    sendTo(res) {
      res.statusCode = this.statusCode;
      for (const [key, value] of headers) res.setHeader(key, value);
      res.end(this.body);
    },
  };
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}

const requestAddress = (req) => {
  const forwarded = req.headers["x-vercel-forwarded-for"];
  if (
    process.env.VERCEL === "1" &&
    typeof forwarded === "string" &&
    isIP(forwarded)
  )
    return forwarded;
  return req.socket.remoteAddress;
};

const passwordDigest = (password) =>
  createHash("sha256").update(password).digest();

export function createHostedApi({
  storage = blobStorage(),
  origin = process.env.APP_ORIGIN,
  adminEmail = process.env.ADMIN_EMAIL,
  adminPassword = process.env.ADMIN_PASSWORD,
  adminName = process.env.ADMIN_NAME || "Game Master",
} = {}) {
  const authLimits = createAuthLimits();
  const cookie = sessionCookie(true);
  const admin =
    adminEmail && adminPassword
      ? {
          email: normalizeEmail(adminEmail),
          password: adminPassword,
          name: adminName,
        }
      : null;
  const adminDigest = admin && passwordDigest(admin.password);
  const matchesAdminEmail = (body) =>
    admin &&
    typeof body.email === "string" &&
    body.email.trim().toLowerCase() === admin.email;

  async function runAgainstSnapshot(req, body, path, dbPath, retry) {
    const response = bufferResponse();
    const db = openDatabase(dbPath);
    try {
      setupWorld(db);
      if (
        req.method === "POST" &&
        path === "/api/login" &&
        matchesAdminEmail(body) &&
        typeof body.password === "string" &&
        body.password.length <= 256 &&
        timingSafeEqual(passwordDigest(body.password), adminDigest) &&
        !db.prepare("SELECT 1 FROM accounts WHERE role = 'admin' LIMIT 1").get()
      ) {
        await provisionAdmin(db, admin);
      }
      await createApi({
        database: db,
        secureCookies: true,
        origin,
        extra: handleWorld,
        authLimits,
        authAddress: requestAddress,
      }).handler(req, response, { body, retry });
    } finally {
      // With one open connection, closing the database checkpoints its WAL.
      db.close();
    }
    return response;
  }

  async function handler(req, res) {
    try {
      assertWriteOrigin(req, origin, true);
      const path = new URL(req.url, "http://localhost").pathname;
      const token = cookie.read(req);
      if (req.method === "GET" && !token) {
        if (path === "/api/session") return json(res, 200, { account: null });
        if (path === "/api/world")
          return json(res, 401, { error: "unauthenticated" });
      }

      const body = path === "/api/logout" ? {} : await readJson(req);
      if (
        req.method === "POST" &&
        path === "/api/register" &&
        matchesAdminEmail(body)
      ) {
        throw new ApiError(409, "email_in_use");
      }
      const writing = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
      const folder = await mkdtemp(join(tmpdir(), "levelup-world-"));
      try {
        const dbPath = join(folder, "world.sqlite");
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const previous = await storage.read();
          if (previous)
            await writeFile(dbPath, previous.bytes, { mode: 0o600 });
          const result = await runAgainstSnapshot(
            req,
            body,
            path,
            dbPath,
            attempt > 0,
          );
          if (!writing || result.statusCode < 200 || result.statusCode >= 300)
            return result.sendTo(res);

          const bytes = await readFile(dbPath);
          if (
            (previous && bytes.equals(previous.bytes)) ||
            (await storage.write(bytes, previous?.etag))
          )
            return result.sendTo(res);
          await rm(dbPath, { force: true });
          if (attempt + 1 < MAX_ATTEMPTS)
            await setTimeout(20 * (attempt + 1) + Math.random() * 20);
        }
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
      res.setHeader("Retry-After", "1");
      return json(res, 503, { error: "server_error" });
    } catch (error) {
      if (res.writableEnded || res.destroyed) return;
      if (error instanceof ApiError)
        return json(res, error.status, { error: error.code });
      console.error("Hosted game storage failed:", error?.name);
      return json(res, 503, { error: "server_error" });
    }
  }

  return { handler };
}
