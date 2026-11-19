import {
  axes,
  goalKinds,
  houses,
  letters,
  statements,
  traits,
} from "./content.js";
import { examples } from "./examples.js";

export function emptyJourney() {
  return {
    stage: "welcome",
    index: 0,
    answers: [],
    house: null,
    goals: [],
    activeGoal: null,
    editGoal: null,
    letterIndex: 0,
    letterAnswers: [],
    prefs: null,
    typeScores: null,
  };
}

export function initialGame() {
  const game = structuredClone(examples);
  game.players.forEach((player) => {
    player.journey = emptyJourney();
  });
  return game;
}

export function newId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) =>
    n.toString(16).padStart(8, "0"),
  ).join("");
}

export function registerPlayer(game, name, bio, scores, id) {
  const trimmed = name.trim();
  if (
    !trimmed ||
    game.players.some(
      (p) => p.name.toLocaleLowerCase("nl") === trimmed.toLocaleLowerCase("nl"),
    )
  ) {
    throw new Error(
      trimmed
        ? "Deze spelersnaam is al in gebruik."
        : "Vul een spelersnaam in.",
    );
  }
  const journey = {
    ...emptyJourney(),
    typeScores: scores,
    prefs: scores.map(preference),
  };
  game.players.push({
    id,
    name: trimmed,
    desc: bio.trim(),
    role: "Speler",
    av: "fern",
    base: 0,
    registered: true,
    journey,
  });
}

export function scoreTest(answers) {
  if (
    answers.length !== statements.length ||
    statements.some(
      (_, i) =>
        !Number.isInteger(answers[i]) || answers[i] < 0 || answers[i] > 6,
    )
  ) {
    throw new Error("Beantwoord alle stellingen.");
  }
  return traits.map(({ letters: pair }) =>
    statements.reduce((sum, [letter], i) => {
      if (!pair.includes(letter)) return sum;
      return sum + (letter === pair[0] ? 1 : -1) * (answers[i] - 3);
    }, 0),
  );
}

export const preference = (score) => (score === 0 ? 2 : Number(score < 0));
export const typeCode = (scores) =>
  scores
    .map((s, i) => (s === 0 ? "X" : traits[i].letters[preference(s)]))
    .join("");
export const currentGoal = (journey) =>
  journey.goals.find((g) => g.id === journey.activeGoal);
export const prefLabel = (axis, value) =>
  value === 2 ? "Beide manieren" : axis.labels[value];
export const points = (game, player) =>
  game.quests
    .filter((q) => q.playerId === player.id)
    .reduce(
      (n, q) =>
        n +
        (q.state === "Behaald"
          ? q.plus
          : q.state === "Niet behaald"
            ? -q.minus
            : 0),
      player.base,
    );

export function houseCandidates(answers) {
  const counts = Object.fromEntries(Object.keys(houses).map((key) => [key, 0]));
  for (const house of answers)
    if (Object.hasOwn(counts, house)) counts[house]++;
  return Object.keys(counts).filter(
    (key) => counts[key] === Math.max(...Object.values(counts)),
  );
}

export function letterPreferences(answers) {
  return axes.map((_, i) =>
    preference(
      letters.reduce((total, card, n) => {
        if (card[0] !== i) return total;
        return total + (answers[n] === 0 ? 1 : -1);
      }, 0),
    ),
  );
}

export function exerciseSteps(journey, goal) {
  const tips = axes.map((axis, i) =>
    journey.prefs?.[i] === 2 ? axis.blend : axis.tips[journey.prefs?.[i]],
  );
  return [
    goal.situation || goal.text,
    goal.action || goalKinds[goal.kind].step,
    tips[0],
    tips[1],
    tips[3],
    "Je merkt vooruitgang als " + goal.sign + ".",
    tips[2],
  ].filter(Boolean);
}
