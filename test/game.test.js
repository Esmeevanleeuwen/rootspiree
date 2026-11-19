import test from "node:test";
import assert from "node:assert/strict";
import { statements } from "../src/content.js";
import {
  houseCandidates,
  initialGame,
  points,
  registerPlayer,
  scoreTest,
  typeCode,
} from "../src/game.js";

test("alle zestien typen en neutrale uitkomsten worden correct berekend", () => {
  for (const e of "EI")
    for (const s of "SN")
      for (const t of "TF")
        for (const j of "JP") {
          const type = e + s + t + j;
          assert.equal(
            typeCode(
              scoreTest(
                statements.map(([letter]) => (type.includes(letter) ? 6 : 0)),
              ),
            ),
            type,
          );
        }
  assert.equal(typeCode(scoreTest(Array(16).fill(3))), "XXXX");
  assert.throws(() => scoreTest(Array(15).fill(1)));
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
