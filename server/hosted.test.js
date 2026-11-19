import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { statements } from "../src/content.js";
import { createHostedApi } from "./hosted.js";

const origin = "https://rootspiree.example.test";
const playerPassword = "a different sample password";

function snapshotStore() {
  let snapshot = null;
  let version = 0;
  let waiting;
  let conflictCount = 0;
  return {
    pairReads() {
      waiting = [];
    },
    get conflicts() {
      return conflictCount;
    },
    async read() {
      const value = snapshot && {
        bytes: Buffer.from(snapshot.bytes),
        etag: snapshot.etag,
      };
      if (waiting) {
        await new Promise((resolve) => {
          waiting.push(resolve);
          if (waiting.length === 2) {
            for (const release of waiting) release();
            waiting = null;
          }
        });
      }
      return value;
    },
    async write(bytes, etag) {
      if ((snapshot?.etag ?? undefined) !== etag) {
        conflictCount++;
        return false;
      }
      snapshot = { bytes: Buffer.from(bytes), etag: String(++version) };
      return true;
    },
  };
}

async function start(t, options) {
  const { handler } = createHostedApi({
    origin,
    adminEmail: "",
    adminPassword: "",
    ...options,
  });
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}`;
  return async (
    route,
    { body, method = "GET", cookie, requestOrigin = origin } = {},
  ) => {
    const headers = { Origin: requestOrigin };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(url + "/api/" + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.get("set-cookie");
    return {
      status: response.status,
      data: await response.json(),
      cookie: setCookie?.split(";")[0],
      setCookie,
    };
  };
}

test("hosted requests preserve concurrent signups and survive a new instance", async (t) => {
  const storage = snapshotStore();
  const first = await start(t, { storage });
  const second = await start(t, { storage });
  const credentials = (email) => ({
    email,
    name: email.split("@")[0],
    password: playerPassword,
    language: "en",
  });
  storage.pairReads();
  const [one, two] = await Promise.all([
    first("register", {
      method: "POST",
      body: credentials("one@example.test"),
    }),
    second("register", {
      method: "POST",
      body: credentials("two@example.test"),
    }),
  ]);
  assert.equal(storage.conflicts, 1);
  for (const registration of [one, two]) {
    assert.equal(registration.status, 201);
    assert.match(
      registration.setCookie,
      /^__Host-rootspiree_session=.*; Secure$/,
    );
  }

  const reader = await start(t, { storage });
  assert.equal(
    (await reader("session", { cookie: one.cookie })).data.account.email,
    "one@example.test",
  );
  assert.equal(
    (await reader("session", { cookie: two.cookie })).data.account.email,
    "two@example.test",
  );
  const rejected = await reader("profile", {
    cookie: one.cookie,
    method: "PATCH",
    requestOrigin: "https://different.example.test",
    body: { profile: {} },
  });
  assert.equal(rejected.status, 403);
  assert.equal(
    (
      await reader("profile", {
        cookie: one.cookie,
        method: "PATCH",
        body: { profile: { hobbies: "Hiking" } },
      })
    ).status,
    200,
  );
  const quiz = await reader("onboarding", {
    cookie: one.cookie,
    method: "POST",
    body: { answers: statements.map(() => 3) },
  });
  assert.deepEqual(quiz.data.account.typeScores, [0, 0, 0, 0, 0]);
  const world = await second("world", { cookie: one.cookie });
  assert.equal(world.status, 200);
  assert.ok(
    world.data.game.players.some(({ id }) => id === one.data.account.id),
  );
});

test("hosted admin is bootstrapped once and its credentials are never reset implicitly", async (t) => {
  const storage = snapshotStore();
  const adminEmail = "gm@example.test";
  const adminPassword = "an admin sample password";
  const adminOptions = { storage, adminEmail, adminPassword };
  const first = await start(t, adminOptions);
  const reserved = await first("register", {
    method: "POST",
    body: {
      email: adminEmail,
      password: playerPassword,
      name: "Reserved",
      language: "en",
    },
  });
  assert.equal(reserved.status, 409);
  assert.equal(await storage.read(), null);
  const invalid = await first("login", {
    method: "POST",
    body: { email: adminEmail, password: playerPassword },
  });
  assert.equal(invalid.status, 401);
  assert.equal(await storage.read(), null);

  const admin = await first("login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword },
  });
  assert.equal(admin.data.account.role, "admin");
  const second = await start(t, {
    ...adminOptions,
    adminPassword: playerPassword,
  });
  const replacement = await second("login", {
    method: "POST",
    body: { email: adminEmail, password: playerPassword },
  });
  assert.equal(replacement.status, 401);
  const session = await second("session", { cookie: admin.cookie });
  assert.equal(session.data.account.id, admin.data.account.id);
});

test("hosted writes with unavailable storage do not leak a success cookie", async (t) => {
  const storage = {
    read: async () => null,
    write: async () => {
      throw new Error("storage unavailable");
    },
  };
  t.mock.method(console, "error", () => {});
  const request = await start(t, { storage });
  const response = await request("register", {
    method: "POST",
    body: {
      email: "player@example.test",
      password: playerPassword,
      name: "Player",
      language: "en",
    },
  });
  assert.equal(response.status, 503);
  assert.equal(response.cookie, undefined);
});
