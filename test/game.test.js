import test from "node:test";
import assert from "node:assert/strict";
import { agreement, quizScoreLimit, statements } from "../src/content.js";
import {
  describePersonality,
  personalityProfiles,
  profileCodes,
} from "../src/personality-reports.js";
import {
  houseCandidates,
  initialGame,
  points,
  registerPlayer,
  scoreTest,
  typeCode,
  typePreferences,
} from "../src/game.js";
import { quizPageCount, restoreQuizDraft } from "../src/quiz-draft.js";

test("de zestig aangeleverde vragen staan in volgorde en komen één keer voor", () => {
  const english = statements.map(([, , sentence]) => sentence);
  assert.equal(english.length, 60);
  assert.equal(new Set(english).size, 60);
  assert.equal(quizPageCount, 10);
  assert.equal(english[0], "You regularly make new friends.");
  assert.equal(
    english[42],
    "You can easily connect with people you have just met.",
  );
  assert.equal(
    english[53],
    "If a decision feels right to you, you often act on it without needing further proof.",
  );
  assert.equal(
    english[54],
    "Even a small mistake can cause you to doubt your overall abilities and knowledge.",
  );
  assert.equal(
    english[59],
    "You feel confident that things will work out for you.",
  );
});

test("opgeslagen quizantwoorden blijven bij de juiste stellingen na de update", () => {
  const original = Array(16).fill(6);
  const complete = statements.map((_, index) => index % agreement.length);
  const withGap = [...complete.slice(0, 42), ...complete.slice(54)];
  const inProgress = [...complete.slice(0, 24), ...Array(36).fill(null)];
  assert.deepEqual(restoreQuizDraft({ answers: original }), {
    page: 0,
    answers: Array(60).fill(null),
  });
  assert.deepEqual(restoreQuizDraft({ answers: [...original, ...withGap] }), {
    page: 7,
    answers: [
      ...complete.slice(0, 42),
      ...Array(12).fill(null),
      ...complete.slice(54),
    ],
  });
  assert.deepEqual(restoreQuizDraft({ answers: [...original, ...inProgress] }), {
    page: 4,
    answers: inProgress,
  });
  assert.deepEqual(restoreQuizDraft({ answers: [...original, ...complete] }), {
    page: 9,
    answers: complete,
  });
  const current = { page: 2, answers: inProgress };
  assert.deepEqual(restoreQuizDraft(current), current);
});

test("alle zestien typen en neutrale uitkomsten worden correct berekend", () => {
  for (const e of "EI")
    for (const s of "SN")
      for (const t of "TF")
        for (const j of "JP") {
          const type = e + s + t + j;
          const scores = scoreTest(
            statements.map(([letter]) => (type.includes(letter) ? 6 : 0)),
          );
          assert.equal(typeCode(scores), type);
          assert.ok(
            scores.slice(0, 4).every((s) => Math.abs(s) === quizScoreLimit),
          );
        }
  const neutral = statements.map(() => 3);
  assert.equal(typeCode(scoreTest(neutral)), "XXXX");
  assert.throws(() => scoreTest(neutral.slice(0, -1)));
});

test("overal hetzelfde antwoord blijft neutraal ondanks ongelijke aantallen stellingen", () => {
  for (const rating of agreement.keys()) {
    assert.deepEqual(scoreTest(statements.map(() => rating)), [0, 0, 0, 0, 0]);
  }
});

test("vertrouwen krijgt een eigen score naast de vier spelvoorkeuren", () => {
  const answers = statements.map(([letter]) =>
    letter === "A" ? 6 : letter === "U" ? 0 : 3,
  );
  const scores = scoreTest(answers);
  assert.deepEqual(scores, [0, 0, 0, 0, quizScoreLimit]);
  assert.deepEqual(scoreTest(answers.map((answer) => 6 - answer)), [
    0,
    0,
    0,
    0,
    -quizScoreLimit,
  ]);
  assert.equal(typeCode(scores), "XXXX");
  assert.equal(typeCode([3, -5, -1, 7]), "ENFJ");
  assert.deepEqual(typePreferences(scores), [2, 2, 2, 2]);
});

test("het persoonlijkheidsrapport toont alle types en bewaart gemengde uitslagen", () => {
  assert.equal(profileCodes.length, 16);
  assert.equal(new Set(profileCodes).size, 16);
  for (const code of profileCodes) {
    for (const language of ["en", "nl"]) {
      assert.ok(personalityProfiles[code][language].name);
      assert.ok(personalityProfiles[code][language].introduction);
    }
  }
  const intj = [-4, -6, 7, 2];
  assert.equal(describePersonality(intj).displayCode, "INTJ");
  assert.equal(describePersonality([...intj, 5]).displayCode, "INTJ-A");
  assert.equal(describePersonality([...intj, -5]).displayCode, "INTJ-T");
  assert.equal(describePersonality([...intj, 0]).displayCode, "INTJ");
  const blended = describePersonality([-4, -6, 0, 2, -5]);
  assert.equal(blended.displayCode, "INXJ");
  assert.deepEqual(blended.matches, ["INTJ", "INFJ"]);
  assert.deepEqual(describePersonality([0, 0, 0, 0, 0]).matches, profileCodes);
});

test("registratie maakt één zelfstandig profiel en controleert een dubbele naam", () => {
  const game = initialGame();
  registerPlayer(game, " Esmee ", "Mijn doel", [2, -3, -8, 4], "new-player");
  const p = game.players.at(-1);
  assert.equal(p.name, "Esmee");
  assert.deepEqual(p.journey.prefs, [0, 1, 1, 0]);
  assert.equal(points(game, p), 0);
  assert.throws(() =>
    registerPlayer(game, " esmee ", "", [0, 0, 0, 0], "duplicate"),
  );
  assert.equal(game.players.length, 4);
  assert.deepEqual(
    houseCandidates(["nacht", "riet", "nacht", "riet", "koper"]),
    ["nacht", "riet"],
  );
});

test("alleen een beoordeelde opdracht telt mee voor de score", () => {
  const game = initialGame();
  const p = game.players[0],
    q = game.quests[0],
    before = points(game, p);
  q.state = "Behaald";
  assert.equal(points(game, p), before + q.plus);
  q.state = "Niet behaald";
  assert.equal(points(game, p), before - q.minus);
});
