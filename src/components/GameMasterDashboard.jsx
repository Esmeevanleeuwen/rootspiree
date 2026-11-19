import { houses } from "../content.js";
import { experience } from "../experience.js";
import { points } from "../game.js";
import { questText, useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { AetherHero, AetherRegions } from "./AetherShowcase.jsx";
import { Avatar, Button } from "./ui.jsx";
import "../dashboard.css";

const copy = {
  en: {
    welcome: "Welcome to LevelUp World",
    hero: "A world where growth becomes an adventure.",
    intro:
      "Discover your strengths, help other heroes grow, and build a living fantasy world together. Every small step counts.",
    enter: "Enter the world",
    meet: "Meet the characters",
    regions: "Discover your adventure",
    regionIntro: "Four regions, four ways to grow",
    openMap: "View world map",
    featured: "Featured heroes",
    allPeople: "All characters",
    noPlayers: "Players appear here after completing setup.",
    activity: "What’s happening now?",
    openCampfire: "Open Campfire",
    noActivity: "Submitted and reviewed quests will appear here.",
    submitted: "submitted a quest",
    passed: "completed a quest",
    failed: "received feedback on a quest",
    desk: "Your Game Master dashboard",
    actions: "Give the story direction.",
    players: ["hero", "heroes"],
    npcs: ["NPC", "NPCs"],
    active: ["open quest", "open quests"],
    review: ["awaiting review", "awaiting review"],
    drafts: ["draft", "drafts"],
    growth: "How the world grows",
    steps: [
      ["World & story", "Read the story of the Listening Valley."],
      ["Characters", "Meet players and fictional characters."],
      ["Quests & growth", "Turn personal goals into small, practical quests."],
      ["Community", "Share what you learn around the Campfire."],
      ["Game Master", "See how quests, feedback, and scoring work."],
    ],
  },
  nl: {
    welcome: "Welkom in LevelUp World",
    hero: "Een wereld waarin groei een avontuur wordt.",
    intro:
      "Ontdek je eigen kracht, help andere helden groeien en bouw samen aan een levende fantasywereld. Elke kleine stap telt.",
    enter: "Betreed de wereld",
    meet: "Ontdek de personages",
    regions: "Ontdek jouw avontuur",
    regionIntro: "Vier regio’s, vier manieren om te groeien",
    openMap: "Bekijk wereldkaart",
    featured: "Uitgelichte helden",
    allPeople: "Alle personages",
    noPlayers:
      "Spelers verschijnen hier zodra ze hun account hebben ingesteld.",
    activity: "Wat gebeurt er nu?",
    openCampfire: "Open het kampvuur",
    noActivity: "Ingeleverde en beoordeelde opdrachten verschijnen hier.",
    submitted: "leverde een opdracht in",
    passed: "voltooide een opdracht",
    failed: "kreeg feedback op een opdracht",
    desk: "Jouw spelleiderdashboard",
    actions: "Geef het verhaal richting.",
    players: ["held", "helden"],
    npcs: ["NPC", "NPC’s"],
    active: ["open opdracht", "open opdrachten"],
    review: ["wacht op beoordeling", "wachten op beoordeling"],
    drafts: ["concept", "concepten"],
    growth: "Hoe de wereld verder groeit",
    steps: [
      ["Wereld & verhaal", "Lees het verhaal van de Luistervallei."],
      ["Personages", "Ontmoet spelers en fictieve personages."],
      [
        "Opdrachten & groei",
        "Maak kleine opdrachten rond persoonlijke doelen.",
      ],
      ["Community", "Deel bij het kampvuur wat je leert."],
      ["Spelleider", "Lees hoe opdrachten, feedback en punten werken."],
    ],
  },
};

function FeaturedHeroes({ entries, words, showPlayer, showPeople }) {
  const { t } = useI18n();
  return (
    <section
      className="aether-dashboard-panel"
      aria-labelledby="featured-title"
    >
      <div className="aether-dashboard-panel-heading">
        <h2 id="featured-title">{words.featured}</h2>
        <Button kind="secondary" onClick={showPeople}>
          {words.allPeople}
        </Button>
      </div>
      {entries.length ? (
        <ul className="aether-featured-heroes">
          {entries.map(({ player, score, level }) => (
            <li key={player.id}>
              <button type="button" onClick={() => showPlayer(player.id)}>
                <Avatar player={player} large />
                <strong>{player.name}</strong>
                <span className="aether-hero-role">
                  {t(houses[player.journey?.house]?.name ?? player.role)}
                </span>
                <span className="aether-hero-score">
                  {score} pt · Lv {level}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aether-dashboard-empty">{words.noPlayers}</p>
      )}
    </section>
  );
}

function QuestActivity({ entries, words, showQuest, showFeed }) {
  const { t } = useI18n();
  return (
    <section
      className="aether-dashboard-panel"
      aria-labelledby="activity-title"
    >
      <div className="aether-dashboard-panel-heading">
        <h2 id="activity-title">{words.activity}</h2>
        <Button kind="secondary" onClick={showFeed}>
          {words.openCampfire}
        </Button>
      </div>
      {entries.length ? (
        <ul className="aether-quest-activity">
          {entries.map(({ quest, player }) => {
            const pending = quest.state === "Ingeleverd";
            const passed = quest.state === "Behaald";
            const message = pending
              ? words.submitted
              : passed
                ? words.passed
                : words.failed;
            const status = pending
              ? t("Ingeleverd")
              : passed
                ? "+" + quest.plus + " pt"
                : "−" + quest.minus + " pt";

            return (
              <li key={quest.id}>
                <button type="button" onClick={() => showQuest(quest.id)}>
                  <Avatar player={player} />
                  <span className="aether-quest-activity-copy">
                    <strong>{player.name}</strong>
                    <span>
                      {message} · {questText(t, quest, "name")}
                    </span>
                  </span>
                  <span className="aether-quest-delta" data-state={quest.state}>
                    {status}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="aether-dashboard-empty">{words.noActivity}</p>
      )}
    </section>
  );
}

export function GameMasterDashboard() {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, navigate, setModal } = useGame();
  const players = game.players.filter((player) => !player.npc);
  const playersById = new Map(
    game.players.map((player) => [player.id, player]),
  );
  const active = game.quests.filter((quest) => quest.state === "Open");
  const pending = game.quests.filter((quest) => quest.state === "Ingeleverd");
  const reviewed = game.quests.filter((quest) =>
    ["Behaald", "Niet behaald"].includes(quest.state),
  );
  const activity = [...pending.reverse(), ...reviewed.reverse()]
    .filter((quest) => playersById.has(quest.playerId))
    .slice(0, 2)
    .map((quest) => ({ quest, player: playersById.get(quest.playerId) }));
  const featured = players
    .map((player) => ({ player, score: points(game, player) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => ({
      ...entry,
      level: experience(game, entry.player).level,
    }));

  const showWorld = () => navigate("world");
  const showPeople = () => navigate("players");
  const showFeed = () => navigate("feed");
  const showQuests = (questFilter) => navigate("quests", { questFilter });
  const stats = [
    [
      words.players,
      players.length,
      () => navigate("players", { peopleFilter: "players" }),
    ],
    [
      words.npcs,
      game.players.length - players.length,
      () => navigate("players", { peopleFilter: "characters" }),
    ],
    [words.active, active.length, () => showQuests("Open")],
    [words.review, pending.length, () => showQuests("Ingeleverd")],
    [
      words.drafts,
      game.questDrafts?.length ?? 0,
      () => showQuests("Concepten"),
    ],
  ];
  const guideLinks = [
    () => setModal({ kind: "chapter" }),
    showPeople,
    () => navigate("quests"),
    showFeed,
    () => navigate("guide"),
  ];

  return (
    <div className="aether-dashboard">
      <AetherHero
        eyebrow={words.welcome + " · " + t("Hoofdstuk I")}
        title={words.hero}
        description={words.intro}
      >
        <Button onClick={showWorld}>{words.enter}</Button>
        <Button kind="secondary" onClick={showPeople}>
          {words.meet}
        </Button>
      </AetherHero>

      <AetherRegions
        title={words.regions}
        description={words.regionIntro}
        action={
          <Button kind="secondary" onClick={showWorld}>
            {words.openMap}
          </Button>
        }
        onSelect={(_, region) => navigate("world", { region })}
      />

      <div className="aether-dashboard-grid">
        <FeaturedHeroes
          entries={featured}
          words={words}
          showPlayer={(id) => setModal({ kind: "player", id })}
          showPeople={showPeople}
        />
        <QuestActivity
          entries={activity}
          words={words}
          showQuest={(id) => setModal({ kind: "quest", id })}
          showFeed={showFeed}
        />
      </div>

      <section
        className="aether-dashboard-panel aether-game-master"
        aria-labelledby="game-master-title"
      >
        <div>
          <p className="eyebrow">{words.desk}</p>
          <h2 id="game-master-title">{words.actions}</h2>
          <ul className="aether-admin-stats">
            {stats.map(([labels, count, open]) => (
              <li key={labels[1]}>
                <button type="button" onClick={open}>
                  {count} {labels[count === 1 ? 0 : 1]}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="aether-admin-actions">
          <Button
            icon="plus"
            onClick={() =>
              navigate("questEditor", { questEditor: { returnPage: "home" } })
            }
          >
            {t("Nieuwe opdracht")}
          </Button>
          <Button
            kind="secondary"
            icon="plus"
            onClick={() => setModal({ kind: "addPlayer" })}
          >
            {t("Personage toevoegen")}
          </Button>
        </div>
      </section>

      <section
        className="aether-dashboard-panel"
        aria-labelledby="growth-title"
      >
        <h2 id="growth-title">{words.growth}</h2>
        <ul className="aether-growth">
          {words.steps.map(([label, description], index) => (
            <li key={label}>
              <button type="button" onClick={guideLinks[index]}>
                <strong>{label}</strong>
                <span>{description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
