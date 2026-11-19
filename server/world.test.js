import assert from "node:assert/strict";
import test from "node:test";
import { openDatabase, publicAccount } from "./accounts.js";
import { handleWorld, setupWorld } from "./world.js";
import { emptyJourney } from "../src/game.js";

function worldFixture(t, setup = setupWorld) {
  const db = openDatabase(":memory:");
  t.after(() => db.close());
  setup(db);
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
    ["other-admin", "admin", 1],
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

test("an unfinished draft stays private, can be edited, and is removed when assigned", (t) => {
  const { request } = worldFixture(t);
  const draft = { id: "draft-1", playerId: null, name: "Follow the thread" };
  assert.throws(
    () => request("alex", { action: "saveQuestDraft", quest: draft }),
    {
      code: "forbidden",
    },
  );
  const saved = request("admin", {
    action: "saveQuestDraft",
    quest: draft,
  }).game;
  assert.deepEqual(saved.questDrafts, [
    {
      ...draft,
      desc: "",
      submissionPrompt: "",
      completionCriteria: "",
      sharedGoalId: null,
      plus: 10,
      minus: 2,
    },
  ]);
  assert.equal(saved.quests.length, 0);
  assert.equal(request("alex").game.questDrafts, undefined);
  assert.deepEqual(request("other-admin").game.questDrafts, []);
  request("other-admin", { action: "deleteQuestDraft", id: draft.id });
  assert.equal(request("admin").game.questDrafts.length, 1);
  assert.throws(
    () => request("other-admin", { action: "saveQuestDraft", quest: draft }),
    {
      code: "conflict",
    },
  );

  const quest = {
    ...saved.questDrafts[0],
    playerId: "alex",
    desc: "Ask a follow-up in your next conversation.",
    submissionPrompt: "Send the question and what you learned.",
    completionCriteria:
      "The question follows up on what the other person said.",
  };
  request("admin", { action: "saveQuestDraft", quest });
  assert.deepEqual(request("admin").game.questDrafts, [quest]);
  assert.throws(
    () =>
      request("admin", {
        action: "quest",
        quest: { ...quest, completionCriteria: "" },
      }),
    { code: "invalid_input" },
  );
  assert.deepEqual(request("admin").game.questDrafts, [quest]);
  assert.throws(() => request("other-admin", { action: "quest", quest }), {
    code: "conflict",
  });

  const assigned = request("admin", { action: "quest", quest });
  assert.equal(assigned.questId, quest.id);
  assert.deepEqual(assigned.game.questDrafts, []);
  assert.equal(assigned.game.quests.length, 1);
  assert.equal(
    request("alex").game.quests[0].submissionPrompt,
    quest.submissionPrompt,
  );
  assert.equal(
    request("alex").game.quests[0].completionCriteria,
    quest.completionCriteria,
  );
  assert.equal(request("casey").game.quests[0].submissionPrompt, undefined);
  assert.equal(request("casey").game.quests[0].completionCriteria, undefined);
  assert.equal(
    request("admin", { action: "quest", quest }).game.quests.length,
    1,
  );
  assert.throws(
    () =>
      request("admin", {
        action: "quest",
        quest: { ...quest, playerId: "casey" },
      }),
    { code: "conflict" },
  );
});

test("an assignment can link only to a currently shared goal of the recipient", (t) => {
  const { request } = worldFixture(t);
  const goal = {
    id: "practice-listening",
    kind: "voice",
    text: "Listen well",
    situation: "At home",
    action: "Ask one question",
    sign: "Follow up on something the other person said",
    shared: true,
  };
  const journey = {
    ...emptyJourney(),
    stage: "room",
    house: "nacht",
    activeGoal: goal.id,
    goals: [goal],
  };
  request("alex", { action: "journey", journey });
  const quest = {
    id: "assigned",
    playerId: "alex",
    name: "Ask one question",
    desc: "Listen and follow up.",
    submissionPrompt: "Summarize the reply.",
    completionCriteria: "The question refers to something you heard.",
    sharedGoalId: goal.id,
    plus: 10,
    minus: 2,
  };
  assert.throws(
    () =>
      request("admin", {
        action: "quest",
        quest: { ...quest, playerId: "casey" },
      }),
    { code: "conflict" },
  );

  request("admin", { action: "saveQuestDraft", quest });
  request("alex", {
    action: "journey",
    journey: { ...journey, goals: [{ ...goal, shared: false }] },
  });
  assert.throws(() => request("admin", { action: "quest", quest }), {
    code: "conflict",
  });
  assert.deepEqual(request("admin").game.questDrafts, [quest]);
  assert.equal(request("admin").game.quests.length, 0);
  request("alex", { action: "journey", journey });
  const { game } = request("admin", { action: "quest", quest });
  assert.equal(game.quests[0].sharedGoalId, goal.id);
  assert.equal(request("alex").game.quests[0].sharedGoalId, undefined);
  assert.equal(
    request("alex", {
      action: "exercise",
      id: "exercise-1",
      goalId: goal.id,
    }).questId,
    "exercise-1",
  );
});

test("opening a previous world updates the schema and preserves its quests", (t) => {
  const { db, request } = worldFixture(t, (db) => {
    db.exec(`
      CREATE TABLE world_quests (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        goal_id TEXT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        state TEXT NOT NULL,
        plus INTEGER NOT NULL,
        minus INTEGER NOT NULL,
        evidence TEXT,
        feedback TEXT,
        private_steps TEXT
      );
      INSERT INTO world_quests (id, player_id, name, description, state, plus, minus)
        VALUES ('old-quest', 'alex', 'Old quest', 'Old instructions', 'Open', 10, 2);
    `);
    setupWorld(db);
  });
  setupWorld(db);
  const [old] = request("alex").game.quests;
  assert.equal(old.desc, "Old instructions");
  assert.equal(old.submissionPrompt, undefined);
  assert.equal(old.completionCriteria, undefined);
  const { questId } = request("admin", {
    action: "quest",
    quest: {
      id: "new",
      playerId: "alex",
      name: "New quest",
      desc: "Use the current editor.",
      submissionPrompt: "Record an outcome.",
      completionCriteria: "Summarize one observation.",
      plus: 10,
      minus: 2,
    },
  });
  assert.equal(questId, "new");
  assert.equal(request("alex").game.quests.length, 2);
});
