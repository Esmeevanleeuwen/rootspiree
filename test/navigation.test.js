import assert from "node:assert/strict";
import { test } from "node:test";
import {
  screenForHash,
  screenHash,
  workspaceHash,
  workspaceView,
} from "../src/navigation.js";

test("workspace destinations survive login and setup redirects", () => {
  const quest = "#/play/quests?status=review";
  assert.equal(screenForHash(quest), "game");
  const login = screenHash("auth", quest);
  assert.equal(screenForHash(login), "auth");
  assert.equal(screenHash("game", login), quest);
  const signup = screenHash("register", login);
  assert.equal(screenForHash(signup), "register");
  assert.equal(screenHash("game", screenHash("onboard", signup)), quest);
  assert.equal(screenForHash("#how-it-works"), "landing");
  assert.equal(
    screenHash("game", "#/login?next=https://example.invalid"),
    "#/play",
  );
});

test("quest editor URLs restore the same draft context", () => {
  const questEditor = {
    draftId: "draft_10",
    playerId: "player-22",
    sharedGoalId: "goal_3",
    returnPage: "players",
  };
  assert.deepEqual(
    workspaceView(workspaceHash("questEditor", { questEditor }), true),
    {
      page: "questEditor",
      questEditor,
    },
  );
  assert.deepEqual(
    workspaceView("#/play/quests/edit?draft[]=bad&from=settings", true),
    {
      page: "questEditor",
      questEditor: {},
    },
  );
});

test("region links retain the selected region and its quest template", () => {
  const world = workspaceHash("world", { region: "shadowwood" });
  assert.equal(screenHash("game", screenHash("auth", world)), world);
  assert.deepEqual(workspaceView(world, false), {
    page: "world",
    region: "shadowwood",
  });
  const questEditor = {
    draftId: "regional-draft",
    template: "shadowwood",
    returnPage: "world",
  };
  const editor = workspaceHash("questEditor", { questEditor });
  assert.deepEqual(workspaceView(editor, true), {
    page: "questEditor",
    questEditor,
  });
  assert.deepEqual(workspaceView(editor, false), { page: "home" });
  assert.equal(workspaceHash("world", { region: "unknown" }), "#/play/world");
  assert.deepEqual(workspaceView("#/play/quests/edit?template=unknown", true), {
    page: "questEditor",
    questEditor: {},
  });
});

test("workspace URLs normalize role-restricted views and round trip list filters", () => {
  assert.deepEqual(workspaceView("#/play/people/accounts", false), {
    page: "home",
  });
  assert.deepEqual(workspaceView("#/play/profile/quiz", true), {
    page: "home",
  });
  assert.deepEqual(workspaceView("#/play/quests?status=drafts", false), {
    page: "quests",
  });
  assert.deepEqual(workspaceView("#/play/unknown?status=review", true), {
    page: "home",
  });
  const myView = { questFilter: "Afgerond", questScope: "all" };
  assert.deepEqual(workspaceView(workspaceHash("quests", myView), false), {
    page: "quests",
    ...myView,
  });
  const people = { peopleFilter: "characters" };
  assert.deepEqual(workspaceView(workspaceHash("players", people), true), {
    page: "players",
    ...people,
  });
});
