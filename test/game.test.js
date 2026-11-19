import test from "node:test";
import assert from "node:assert/strict";
import { agreement, quizScoreLimit, statements } from "../src/content.js";
import {
  houseCandidates,
  initialGame,
  points,
  registerPlayer,
  scoreTest,
  typeCode,
  typePreferences,
} from "../src/game.js";

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
