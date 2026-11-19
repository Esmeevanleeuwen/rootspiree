import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { openDatabase, provisionAdmin } from "./accounts.js";
import { createApi } from "./api.js";

async function start(t, config) {
  const api = createApi(config);
  const server = createServer(api.handler);
  const address = await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address()));
  });
  const stop = () =>
    new Promise((resolve) => {
      if (server.listening)
        server.close(() => {
          api.close();
          resolve();
        });
      else resolve();
    });
  t.after(stop);
  const origin = "http://127.0.0.1:" + address.port;
  async function req(
    path,
    { method = "GET", cookie, body, headers = {} } = {},
  ) {
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(origin + "/api/" + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const rawCookie = res.headers.get("set-cookie");
    return {
      status: res.status,
      data: await res.json(),
      cookie: rawCookie?.split(";")[0],
      rawCookie,
    };
  }
  return { req, stop };
}

test("separate player and admin accounts, ordered onboarding, sessions across restarts", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "rootspiree-auth-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const dbPath = join(dir, "state.sqlite");
  const admin = {
    email: "admin@example.test",
    password: "admin test passphrase",
    name: "Guide",
  };
  const credentials = {
    email: "PLAYER@example.test",
    password: "player test passphrase",
    name: "  A Player ",
    language: "nl",
  };
  const db = openDatabase(dbPath);
  assert.equal(await provisionAdmin(db, admin), "created");
  db.close();

  const app = await start(t, { dbPath });
  const { req } = app;
  assert.deepEqual((await req("session")).data, { account: null });
  const crossOrigin = await req("register", {
    method: "POST",
    body: credentials,
    headers: { Origin: "https://other.example" },
  });
  assert.equal(crossOrigin.status, 403);

  const signedUp = await req("register", {
    method: "POST",
    body: { ...credentials, role: "admin" },
  });
  assert.equal(signedUp.status, 201);
  const cookie = signedUp.cookie;
  const { account } = signedUp.data;
  assert.equal(account.role, "player");
  assert.equal(account.name, "A Player");
  assert.equal(account.email, "player@example.test");
  assert.equal(account.language, "nl");
  assert.equal(account.profileComplete, false);
  assert.equal(account.onboardingComplete, false);
  assert.match(signedUp.rawCookie, /HttpOnly; SameSite=Lax/);
  assert.ok(!("password_hash" in account));

  assert.equal((await req("admin/accounts", { cookie })).status, 403);
  let response = await req("onboarding", {
    method: "POST",
    cookie,
    body: { answers: Array(16).fill(3) },
  });
  assert.equal(response.data.error, "profile_required");
  response = await req("profile", {
    method: "PATCH",
    cookie,
    body: { language: "en" },
  });
  assert.equal(response.data.account.profileComplete, false);
  assert.equal(response.data.account.language, "en");

  const profile = {
    hobbies: "Gardening",
    job: "",
    goals: "Be more patient",
    interests: "Plants",
  };
  response = await req("profile", {
    method: "PATCH",
    cookie,
    body: { profile },
  });
  assert.equal(response.data.account.profileComplete, true);
  assert.deepEqual(response.data.account.profile, profile);
  response = await req("onboarding", {
    method: "POST",
    cookie,
    body: { answers: [3] },
  });
  assert.equal(response.data.error, "invalid_answers");
  response = await req("onboarding", {
    method: "POST",
    cookie,
    body: { answers: Array(16).fill(3) },
  });
  assert.equal(response.data.account.onboardingComplete, true);
  assert.deepEqual(response.data.account.typeScores, [0, 0, 0, 0]);

  const signedIn = await req("login", {
    method: "POST",
    cookie,
    body: credentials,
  });
  assert.equal(signedIn.status, 200);
  assert.notEqual(signedIn.cookie, cookie);
  assert.equal((await req("session", { cookie })).data.account, null);
  assert.equal(
    (
      await req("login", {
        method: "POST",
        body: { ...credentials, password: "incorrect passphrase" },
      })
    ).status,
    401,
  );
  assert.equal(
    (await req("register", { method: "POST", body: credentials })).status,
    409,
  );

  const adminSession = await req("login", { method: "POST", body: admin });
  assert.equal(adminSession.data.account.role, "admin");
  assert.equal(adminSession.data.account.onboardingComplete, true);
  const roster = await req("admin/accounts", { cookie: adminSession.cookie });
  assert.deepEqual(
    roster.data.accounts.map((p) => [p.role, p.onboardingComplete]),
    [
      ["admin", true],
      ["player", true],
    ],
  );
  assert.ok(
    roster.data.accounts.every(
      (p) => !("profile" in p) && !("password_hash" in p),
    ),
  );

  const checkDb = openDatabase(dbPath);
  const secret = checkDb
    .prepare("SELECT password_hash FROM accounts WHERE id = ?")
    .get(account.id).password_hash;
  assert.match(secret, /^scrypt\$/);
  assert.ok(!secret.includes(credentials.password));
  await assert.rejects(
    provisionAdmin(checkDb, credentials),
    (error) => error.code === "email_in_use",
  );
  checkDb.close();
  await app.stop();

  const reopened = await start(t, { dbPath });
  const restored = await reopened.req("session", { cookie: signedIn.cookie });
  assert.deepEqual(restored.data.account.profile, profile);
  assert.equal(
    (await reopened.req("logout", { method: "POST", cookie: signedIn.cookie }))
      .status,
    200,
  );
  assert.equal(
    (await reopened.req("session", { cookie: signedIn.cookie })).data.account,
    null,
  );
});
