import assert from "node:assert/strict";
import test from "node:test";
import { openDatabase, publicAccount } from "./accounts.js";
import { handleWorld, setupWorld } from "./world.js";
import { emptyJourney } from "../src/game.js";

function worldFixture(t) {
  const db = openDatabase(":memory:");
  setupWorld(db);
  t.after(() => db.close());
  const insert = db.prepare(`
    INSERT INTO accounts (
      id, email, name, role, password_hash, profile_json, profile_complete,
      onboarding_complete, language, type_scores, created_at
    ) VALUES (?, ?, ?, ?, 'unused', ?, ?, ?, 'en', ?, ?)
  `);
  for (const [id, role, complete] of [
    ["alex", "player", 1],
    ["casey", "player", 1],
    ["unready", "player", 0],
    ["admin", "admin", 1],
  ]) {
    insert.run(
      id,
      id + "@example.test",
      id,
      role,
      '{"hobbies":"private hobby"}',
      complete,
      complete,
      role === "player" && complete ? "[3,1,-4,0]" : null,
      Date.now(),
    );
  }
  return {
    db,
    request(actor, body) {
      const account =
        actor &&
        publicAccount(
          db.prepare("SELECT * FROM accounts WHERE id = ?").get(actor),
        );
      let response;
      const handled = handleWorld({
        req: { method: body ? "POST" : "GET" },
        path: "/api/world",
        account,
        body,
        db,
        send(status, data) {
          assert.equal(status, 200);
          response = data;
        },
      });
      assert.equal(handled, true);
      return response;
    },
  };
}

test("the world restricts administration and saves assignments, submissions and feedback", (t) => {
  const { request } = worldFixture(t);
  const quest = {
    id: "task-1",
    playerId: "alex",
    name: "Practice",
    desc: "Private directions",
    plus: 10,
    minus: 4,
  };
  assert.throws(() => request(null), { code: "unauthenticated" });
  assert.throws(() => request("unready"), { code: "onboarding_required" });
  assert.throws(() => request("alex", { action: "quest", quest }), {
    code: "forbidden",
  });
  request("admin", { action: "quest", quest });
  assert.throws(
    () =>
      request("casey", { action: "submit", id: quest.id, text: "Not mine." }),
    { code: "forbidden" },
  );
  request("alex", {
    action: "submit",
    id: quest.id,
    text: "My private submission.",
  });
  assert.throws(
    () =>
      request("alex", {
        action: "review",
        id: quest.id,
        passed: true,
        text: "Self-review.",
      }),
    { code: "forbidden" },
  );
  const { game } = request("admin", {
    action: "review",
    id: quest.id,
    passed: true,
    text: "Well done.",
  });
  assert.equal(game.quests[0].state, "Behaald");
  assert.equal(game.quests[0].evidence, "My private submission.");
  assert.equal(request("alex").game.quests[0].feedback, "Well done.");
  const [publicQuest] = request("casey").game.quests;
  assert.equal(publicQuest.name, "Practice");
  assert.equal(publicQuest.desc, undefined);
  assert.equal(publicQuest.evidence, undefined);
  assert.equal(publicQuest.feedback, undefined);
});

test("only the owner can read private profiles and the GM can read explicitly shared goals", (t) => {
  const { db, request } = worldFixture(t);
  const goal = {
    id: "goal-1",
    kind: "voice",
    text: "My goal",
    situation: "At home",
    action: "Practice",
    sign: "Done",
    shared: true,
  };
  const journey = {
    ...emptyJourney(),
    stage: "room",
    house: "nacht",
    prefs: [2, 2, 2, 2],
    typeScores: [-12, -12, -12, -12],
    goals: [goal],
    activeGoal: goal.id,
  };
  request("alex", { action: "journey", journey });
  const alex = (actor) =>
    request(actor).game.players.find((player) => player.id === "alex");
  assert.deepEqual(alex("alex").journey.typeScores, [3, 1, -4, 0]);
  assert.deepEqual(alex("alex").journey.prefs, [2, 2, 2, 2]);
  assert.deepEqual(alex("casey").journey, { house: "nacht", goals: [] });
  assert.deepEqual(alex("admin").journey, {
    house: "nacht",
    goals: [
      { id: "goal-1", text: "My goal", action: "Practice", shared: true },
    ],
  });
  assert.equal(alex("admin").email, undefined);
  assert.equal(alex("admin").profile, undefined);
  db.prepare("UPDATE accounts SET type_scores = ? WHERE id = 'alex'").run(
    "[-1,-2,3,4]",
  );
  assert.deepEqual(alex("alex").journey.prefs, [1, 1, 0, 0]);
  const first = request("alex", {
    action: "exercise",
    id: "exercise-1",
    goalId: goal.id,
  });
  const repeat = request("alex", {
    action: "exercise",
    id: "exercise-2",
    goalId: goal.id,
  });
  assert.equal(first.questId, "exercise-1");
  assert.equal(repeat.questId, first.questId);
  assert.equal(repeat.game.quests.length, 1);
  assert.ok(repeat.game.quests[0].privateSteps.includes("Practice"));
  assert.equal(request("admin").game.quests[0].privateSteps, undefined);
});

test("likes retain the public count without exposing which other accounts voted", (t) => {
  const { request } = worldFixture(t);
  request("admin", { action: "post", id: "post-1", text: "Welcome" });
  request("alex", { action: "like", id: "post-1" });
  request("casey", { action: "like", id: "post-1" });
  const [post] = request("alex").game.posts;
  assert.deepEqual(post.votes, { alex: true });
  assert.equal(post.likes, 1);
  assert.equal(post.playerId, "gm");
  const [after] = request("alex", { action: "like", id: "post-1" }).game.posts;
  assert.deepEqual(after.votes, {});
  assert.equal(after.likes, 1);
});
