import { goalKinds, houses, letters, scenes, traits } from "../src/content.js";
import { examples } from "../src/examples.js";
import {
  currentGoal,
  emptyJourney,
  exerciseSteps,
  houseCandidates,
  typeCode,
  typePreferences,
} from "../src/game.js";
import { ApiError } from "./http.js";
import { withTransaction } from "./transactions.js";

const stagesWithHouse = new Set([
  "reveal",
  "goal",
  "goals",
  "letterIntro",
  "letters",
  "tune",
  "room",
]);
const journeyStages = new Set(["welcome", "story", "tie", ...stagesWithHouse]);
const avatars = new Set(["fern", "sun", "moon", "tide"]);
const idPattern = /^[a-zA-Z0-9_-]{1,64}$/;

export function setupWorld(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_profiles (
      account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      bio TEXT NOT NULL DEFAULT '',
      journey TEXT,
      type_scores TEXT,
      share_personality INTEGER NOT NULL DEFAULT 0 CHECK (share_personality IN (0, 1))
    );
    CREATE TABLE IF NOT EXISTS world_npcs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS world_quests (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      goal_id TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('Open', 'Ingeleverd', 'Behaald', 'Niet behaald')),
      plus INTEGER NOT NULL CHECK (plus BETWEEN 0 AND 999),
      minus INTEGER NOT NULL CHECK (minus BETWEEN 0 AND 999),
      evidence TEXT,
      feedback TEXT,
      private_steps TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS world_open_exercise
      ON world_quests (player_id, goal_id) WHERE state = 'Open' AND goal_id IS NOT NULL;
    CREATE TABLE IF NOT EXISTS world_quest_drafts (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS world_posts (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      message TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS world_votes (
      post_id TEXT NOT NULL REFERENCES world_posts(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, account_id)
    );
  `);
  updateWorldSchema(db);
  const npc = examples.players.find((player) => player.npc);
  db.prepare(
    `
    INSERT OR IGNORE INTO world_npcs (id, name, role, avatar, description)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(npc.id, npc.name, npc.role, npc.av, npc.desc);
}

function updateWorldSchema(db) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const columns = new Set(
      db
        .prepare("PRAGMA table_info(world_quests)")
        .all()
        .map(({ name }) => name),
    );
    const additions = {
      submission_prompt: "TEXT",
      completion_criteria: "TEXT",
      shared_goal_id: "TEXT",
      assigned_by: "TEXT REFERENCES accounts(id) ON DELETE SET NULL",
    };
    for (const [name, type] of Object.entries(additions)) {
      if (!columns.has(name))
        db.exec(`ALTER TABLE world_quests ADD COLUMN ${name} ${type}`);
    }
    const hasSharing = db
      .prepare("PRAGMA table_info(world_profiles)")
      .all()
      .some(({ name }) => name === "share_personality");
    if (!hasSharing) {
      db.exec(`
        ALTER TABLE world_profiles ADD COLUMN share_personality
          INTEGER NOT NULL DEFAULT 0 CHECK (share_personality IN (0, 1))
      `);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function requireInput(valid) {
  if (!valid) throw new ApiError(400, "invalid_input");
}

function requireAdmin(account) {
  if (account.role !== "admin") throw new ApiError(403, "forbidden");
}

function requirePlayer(account) {
  if (account.role !== "player") throw new ApiError(403, "forbidden");
}

function record(value) {
  requireInput(value && typeof value === "object" && !Array.isArray(value));
  return value;
}

function id(value) {
  requireInput(typeof value === "string" && idPattern.test(value));
  return value;
}

function shortText(value, limit, optional = false) {
  requireInput(typeof value === "string");
  const text = value.trim();
  requireInput(text.length <= limit && (optional || text.length > 0));
  return text;
}

function integer(value, min, max) {
  requireInput(Number.isInteger(value) && value >= min && value <= max);
  return value;
}

function validatedGoal(value) {
  const goal = record(value);
  requireInput(
    typeof goal.kind === "string" && Object.hasOwn(goalKinds, goal.kind),
  );
  requireInput(typeof goal.shared === "boolean");
  return {
    id: id(goal.id),
    kind: goal.kind,
    shared: goal.shared,
    text: shortText(goal.text, 220),
    situation: shortText(goal.situation, 150, true),
    action: shortText(goal.action, 170),
    sign: shortText(goal.sign, 170),
  };
}

function validatedJourney(value) {
  const journey = record(value);
  const { stage, house, activeGoal, editGoal } = journey;
  requireInput(journeyStages.has(stage));
  requireInput(Array.isArray(journey.goals) && journey.goals.length <= 30);
  const goals = journey.goals.map(validatedGoal);
  const goalIds = new Set(goals.map((goal) => goal.id));
  requireInput(goalIds.size === goals.length);
  requireInput(activeGoal === null || goalIds.has(activeGoal));
  requireInput(editGoal === null || goalIds.has(editGoal));
  requireInput(
    house === null ||
      (typeof house === "string" && Object.hasOwn(houses, house)),
  );
  requireInput(!stagesWithHouse.has(stage) || house !== null);

  const { answers, letterAnswers, prefs } = journey;
  requireInput(Array.isArray(answers) && answers.length <= scenes.length);
  requireInput(
    answers.every(
      (answer, index) =>
        typeof answer === "string" &&
        scenes[index].opts.some(([key]) => key === answer),
    ),
  );
  requireInput(
    Array.isArray(letterAnswers) && letterAnswers.length <= letters.length,
  );
  requireInput(letterAnswers.every((answer) => answer === 0 || answer === 1));
  requireInput(
    prefs === null ||
      (Array.isArray(prefs) &&
        prefs.length === 4 &&
        prefs.every(
          (answer) => Number.isInteger(answer) && answer >= 0 && answer <= 2,
        )),
  );
  if (stage === "tie" || stage === "reveal") {
    requireInput(answers.length === scenes.length);
    const candidates = houseCandidates(answers);
    requireInput(
      stage === "tie" ? candidates.length > 1 : candidates.includes(house),
    );
  }

  const index = integer(journey.index, 0, scenes.length - 1);
  const letterIndex = integer(journey.letterIndex, 0, letters.length - 1);
  requireInput(stage !== "story" || index <= answers.length);
  requireInput(stage !== "letters" || letterIndex <= letterAnswers.length);
  return {
    stage,
    house,
    activeGoal,
    editGoal,
    goals,
    answers,
    letterAnswers,
    prefs,
    index,
    letterIndex,
  };
}

function ownJourney(row, typeScores) {
  const journey = {
    ...emptyJourney(),
    ...JSON.parse(row?.journey ?? "null"),
    typeScores,
  };
  const previousScores = JSON.parse(row?.type_scores ?? "null");
  const typeChanged = traits.some(
    (_, i) => previousScores?.[i] !== typeScores?.[i],
  );
  if (typeChanged || journey.prefs === null) {
    journey.prefs = typeScores ? typePreferences(typeScores) : null;
  }
  return journey;
}

async function readPlayers(db, account) {
  const users = await db
    .prepare(
      `
    SELECT accounts.id, accounts.name, p.bio, p.journey, p.type_scores, p.share_personality,
      CASE WHEN accounts.id = ? OR p.share_personality = 1
        THEN accounts.type_scores
      END AS current_type_scores
    FROM accounts
    LEFT JOIN world_profiles p ON p.account_id = accounts.id
    WHERE accounts.role = 'player' AND accounts.onboarding_complete = 1
    ORDER BY accounts.created_at, accounts.id
  `,
    )
    .all(account.id);
  const players = users.map((row) => {
    const own = row.id === account.id;
    const scores = JSON.parse(row.current_type_scores);
    const personalityCode =
      Array.isArray(scores) &&
      traits.every(
        (_, index) => Number.isFinite(scores[index]) && scores[index] !== 0,
      )
        ? typeCode(scores)
        : null;
    let journey;
    if (own) {
      journey = ownJourney(row, scores);
    } else {
      const stored = JSON.parse(row.journey ?? "null");
      const shared =
        account.role === "admin"
          ? stored?.goals.filter((goal) => goal.shared)
          : [];
      journey = {
        house: stored?.house ?? null,
        goals: (shared ?? []).map(({ id, text, action, shared }) => ({
          id,
          text,
          action,
          shared,
        })),
      };
    }
    return {
      id: row.id,
      name: row.name,
      role: "Speler",
      av: "fern",
      base: 0,
      desc: row.bio ?? "",
      registered: true,
      journey,
      ...(personalityCode && { personalityCode }),
      ...(own && { sharePersonality: row.share_personality === 1 }),
    };
  });
  const npcs = await db
    .prepare(
      `
    SELECT id, name, role, avatar AS av, description AS desc FROM world_npcs ORDER BY rowid
  `,
    )
    .all();
  return [
    ...players,
    ...npcs.map((npc) => ({
      ...npc,
      npc: true,
      base: 0,
      journey: { goals: [] },
    })),
  ];
}

async function readGame(db, account) {
  const players = await readPlayers(db, account);
  const isAdmin = account.role === "admin";
  const roster = new Set(players.map((player) => player.id));
  const questRows = await db
    .prepare("SELECT * FROM world_quests ORDER BY rowid")
    .all();
  const quests = questRows
    .filter((row) => roster.has(row.player_id))
    .map((row) => {
      const own = row.player_id === account.id;
      const canReadSubmission = own || isAdmin;
      return {
        id: row.id,
        playerId: row.player_id,
        name: row.name,
        state: row.state,
        plus: row.plus,
        minus: row.minus,
        icon: "flag",
        style: "",
        ...(own && row.goal_id && { goalId: row.goal_id }),
        ...(own &&
          row.private_steps && { privateSteps: JSON.parse(row.private_steps) }),
        ...(canReadSubmission && {
          desc: row.description,
          evidence: row.evidence,
          feedback: row.feedback,
          ...(row.submission_prompt && {
            submissionPrompt: row.submission_prompt,
          }),
          ...(row.completion_criteria && {
            completionCriteria: row.completion_criteria,
          }),
        }),
        ...(isAdmin &&
          row.shared_goal_id && { sharedGoalId: row.shared_goal_id }),
      };
    });
  const voter = account.role === "admin" ? "gm" : account.id;
  const postRows = await db
    .prepare(
      `
    SELECT p.id, p.player_id, p.message, count(v.account_id) AS total,
      max(CASE WHEN v.account_id = ? THEN 1 ELSE 0 END) AS voted
    FROM world_posts p LEFT JOIN world_votes v ON v.post_id = p.id
    GROUP BY p.id, p.player_id, p.message, p.rowid ORDER BY p.rowid DESC
  `,
    )
    .all(account.id);
  const posts = postRows.map((row) => ({
    id: row.id,
    playerId: row.player_id,
    msg: row.message,
    likes: Number(row.total) - row.voted,
    votes: row.voted ? { [voter]: true } : {},
  }));
  const game = { players, quests, posts };
  if (isAdmin) {
    const drafts = await db
      .prepare(
        "SELECT content FROM world_quest_drafts WHERE admin_id = ? ORDER BY updated_at DESC, rowid DESC",
      )
      .all(account.id);
    game.questDrafts = drafts.map(({ content }) => JSON.parse(content));
  }
  return game;
}

function findQuestOwner(db, owner) {
  return db
    .prepare(
      `
    SELECT id FROM accounts WHERE id = ? AND role = 'player' AND onboarding_complete = 1
    UNION ALL SELECT id FROM world_npcs WHERE id = ?
  `,
    )
    .get(owner, owner);
}

function ensureFound(row) {
  if (!row) throw new ApiError(404, "not_found");
  return row;
}

function ensureChanged(result) {
  if (!result.changes) throw new ApiError(409, "conflict");
}

async function saveProfile(db, account, body) {
  requirePlayer(account);
  const bio = shortText(body.bio, 300, true);
  await db
    .prepare(
      `
    INSERT INTO world_profiles (account_id, bio) VALUES (?, ?)
    ON CONFLICT(account_id) DO UPDATE SET bio = excluded.bio
  `,
    )
    .run(account.id, bio);
}

async function savePersonalitySharing(db, account, body) {
  requirePlayer(account);
  requireInput(typeof body.shared === "boolean");
  await db
    .prepare(
      `
    INSERT INTO world_profiles (account_id, share_personality) VALUES (?, ?)
    ON CONFLICT(account_id) DO UPDATE SET share_personality = excluded.share_personality
  `,
    )
    .run(account.id, Number(body.shared));
}

async function saveJourney(db, account, body) {
  requirePlayer(account);
  const journey = validatedJourney(body.journey);
  await db
    .prepare(
      `
    INSERT INTO world_profiles (account_id, journey, type_scores) VALUES (?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET journey = excluded.journey, type_scores = excluded.type_scores
  `,
    )
    .run(
      account.id,
      JSON.stringify(journey),
      JSON.stringify(account.typeScores),
    );
}

async function toggleVote(db, account, body) {
  const postId = id(body.id);
  ensureFound(
    await db.prepare("SELECT id FROM world_posts WHERE id = ?").get(postId),
  );
  const removed = await db
    .prepare("DELETE FROM world_votes WHERE post_id = ? AND account_id = ?")
    .run(postId, account.id);
  if (!removed.changes) {
    await db
      .prepare("INSERT INTO world_votes (post_id, account_id) VALUES (?, ?)")
      .run(postId, account.id);
  }
}

async function addPost(db, account, body) {
  const postId = id(body.id);
  const actor = account.role === "admin" ? "gm" : account.id;
  const message = shortText(body.text, 600);
  ensureChanged(
    await db
      .prepare(
        `
    INSERT INTO world_posts (id, player_id, message) VALUES (?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `,
      )
      .run(postId, actor, message),
  );
}

function optionalId(value) {
  return value == null || value === "" ? null : id(value);
}

function questInput(value, draft = false) {
  const quest = record(value);
  const structured =
    Object.hasOwn(quest, "submissionPrompt") ||
    Object.hasOwn(quest, "completionCriteria");
  return {
    id: id(quest.id),
    playerId: draft ? optionalId(quest.playerId) : id(quest.playerId),
    name: shortText(draft ? (quest.name ?? "") : quest.name, 60, draft),
    desc: shortText(draft ? (quest.desc ?? "") : quest.desc, 450, draft),
    submissionPrompt: shortText(
      quest.submissionPrompt ?? "",
      300,
      draft || !structured,
    ),
    completionCriteria: shortText(
      quest.completionCriteria ?? "",
      300,
      draft || !structured,
    ),
    sharedGoalId: optionalId(quest.sharedGoalId),
    plus: integer(draft ? (quest.plus ?? 10) : quest.plus, 0, 999),
    minus: integer(draft ? (quest.minus ?? 2) : quest.minus, 0, 999),
  };
}

async function saveQuestDraft(db, account, body) {
  requireAdmin(account);
  const draft = questInput(body.quest, true);
  if (draft.playerId) ensureFound(await findQuestOwner(db, draft.playerId));
  if (
    await db.prepare("SELECT 1 FROM world_quests WHERE id = ?").get(draft.id)
  ) {
    throw new ApiError(409, "conflict");
  }
  ensureChanged(
    await db
      .prepare(
        `
      INSERT INTO world_quest_drafts (id, admin_id, content, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content, updated_at = excluded.updated_at
      WHERE world_quest_drafts.admin_id = excluded.admin_id
    `,
      )
      .run(draft.id, account.id, JSON.stringify(draft), Date.now()),
  );
}

async function deleteQuestDraft(db, account, body) {
  requireAdmin(account);
  await db
    .prepare("DELETE FROM world_quest_drafts WHERE id = ? AND admin_id = ?")
    .run(id(body.id), account.id);
}

async function addQuest(db, account, body) {
  requireAdmin(account);
  const quest = questInput(body.quest);
  const fields = {
    player_id: quest.playerId,
    name: quest.name,
    description: quest.desc,
    submission_prompt: quest.submissionPrompt || null,
    completion_criteria: quest.completionCriteria || null,
    shared_goal_id: quest.sharedGoalId,
    plus: quest.plus,
    minus: quest.minus,
    assigned_by: account.id,
  };
  const existing = await db
    .prepare("SELECT * FROM world_quests WHERE id = ?")
    .get(quest.id);
  if (existing) {
    if (
      Object.entries(fields).every(([key, value]) => existing[key] === value)
    ) {
      return quest.id;
    }
    throw new ApiError(409, "conflict");
  }
  const draft = await db
    .prepare("SELECT admin_id FROM world_quest_drafts WHERE id = ?")
    .get(quest.id);
  if (draft && draft.admin_id !== account.id)
    throw new ApiError(409, "conflict");
  ensureFound(await findQuestOwner(db, quest.playerId));
  if (quest.sharedGoalId) {
    const profile = await db
      .prepare("SELECT journey FROM world_profiles WHERE account_id = ?")
      .get(quest.playerId);
    const goals = JSON.parse(profile?.journey ?? "null")?.goals;
    if (!goals?.some((goal) => goal.id === quest.sharedGoalId && goal.shared)) {
      throw new ApiError(409, "conflict");
    }
  }
  await db
    .prepare(
      `
    INSERT INTO world_quests (
      id, player_id, name, description, submission_prompt, completion_criteria,
      shared_goal_id, plus, minus, assigned_by, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
  `,
    )
    .run(quest.id, ...Object.values(fields));
  if (draft) await deleteQuestDraft(db, account, quest);
  return quest.id;
}

async function submitQuest(db, account, body) {
  const questId = id(body.id);
  const quest = ensureFound(
    await db
      .prepare("SELECT player_id FROM world_quests WHERE id = ?")
      .get(questId),
  );
  const npcSubmission =
    account.role === "admin" &&
    (await db
      .prepare("SELECT id FROM world_npcs WHERE id = ?")
      .get(quest.player_id));
  if (quest.player_id !== account.id && !npcSubmission)
    throw new ApiError(403, "forbidden");
  ensureChanged(
    await db
      .prepare(
        `
    UPDATE world_quests SET state = 'Ingeleverd', evidence = ? WHERE id = ? AND state = 'Open'
  `,
      )
      .run(shortText(body.text, 500), questId),
  );
}

async function reviewQuest(db, account, body) {
  requireAdmin(account);
  const questId = id(body.id);
  ensureFound(
    await db.prepare("SELECT id FROM world_quests WHERE id = ?").get(questId),
  );
  requireInput(typeof body.passed === "boolean");
  ensureChanged(
    await db
      .prepare(
        `
    UPDATE world_quests SET state = ?, feedback = ? WHERE id = ? AND state = 'Ingeleverd'
  `,
      )
      .run(
        body.passed ? "Behaald" : "Niet behaald",
        shortText(body.text, 400),
        questId,
      ),
  );
}

async function addNpc(db, account, body) {
  requireAdmin(account);
  const npc = record(body.player);
  const npcId = id(npc.id);
  requireInput(npcId !== "gm" && npc.npc === true && avatars.has(npc.av));
  requireInput(
    !(await db.prepare("SELECT id FROM accounts WHERE id = ?").get(npcId)),
  );
  ensureChanged(
    await db
      .prepare(
        `
    INSERT INTO world_npcs (id, name, role, avatar, description) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `,
      )
      .run(
        npcId,
        shortText(npc.name, 36),
        shortText(npc.role, 45),
        npc.av,
        shortText(npc.desc, 300),
      ),
  );
}

async function addExercise(db, account, body) {
  requirePlayer(account);
  const questId = id(body.id);
  const goalId = id(body.goalId);
  const stored = await db
    .prepare(
      "SELECT journey, type_scores FROM world_profiles WHERE account_id = ?",
    )
    .get(account.id);
  const journey = ownJourney(stored, account.typeScores);
  const goal = ensureFound(currentGoal(journey));
  if (goal.id !== goalId) throw new ApiError(409, "conflict");
  const opened = await db
    .prepare(
      `
    SELECT id FROM world_quests WHERE state = 'Open' AND player_id = ? AND goal_id = ?
  `,
    )
    .get(account.id, goalId);
  if (opened) return opened.id;

  const kind = goalKinds[goal.kind];
  ensureChanged(
    await db
      .prepare(
        `
    INSERT INTO world_quests (
      id, player_id, goal_id, name, description, state, plus, minus, private_steps
    ) VALUES (?, ?, ?, ?, ?, 'Open', 10, 2, ?) ON CONFLICT(id) DO NOTHING
  `,
      )
      .run(
        questId,
        account.id,
        goalId,
        kind.title,
        kind.step,
        JSON.stringify(exerciseSteps(journey, goal)),
      ),
  );
  return questId;
}

const actions = new Map([
  ["bio", saveProfile],
  ["personalitySharing", savePersonalitySharing],
  ["journey", saveJourney],
  ["like", toggleVote],
  ["post", addPost],
  ["saveQuestDraft", saveQuestDraft],
  ["deleteQuestDraft", deleteQuestDraft],
  ["quest", addQuest],
  ["submit", submitQuest],
  ["review", reviewQuest],
  ["npc", addNpc],
  ["exercise", addExercise],
]);

export async function handleWorld({ req, account, db, body, send, path }) {
  if (path !== "/api/world") return false;
  if (!account) throw new ApiError(401, "unauthenticated");
  if (account.role === "player" && !account.onboardingComplete) {
    throw new ApiError(403, "onboarding_required");
  }
  const writing = req.method === "POST";
  if (!writing && req.method !== "GET")
    throw new ApiError(405, "method_not_allowed");

  const response = await withTransaction(db, writing, async (transaction) => {
    let questId;
    if (writing) {
      const action = actions.get(record(body).action);
      if (!action) throw new ApiError(400, "invalid_input");
      questId = await action(transaction, account, body);
    }
    return {
      game: await readGame(transaction, account),
      ...(questId && { questId }),
    };
  });
  send(200, response);
  return true;
}
