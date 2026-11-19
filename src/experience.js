const levelSize = 100;

export function experience(game, player) {
  const xp = game.quests.reduce(
    (total, quest) =>
      quest.playerId === player.id && quest.state === "Behaald"
        ? total + quest.plus
        : total,
    0,
  );

  return {
    xp,
    level: 1 + Math.floor(xp / levelSize),
    progress: xp % levelSize,
    goal: levelSize,
  };
}
