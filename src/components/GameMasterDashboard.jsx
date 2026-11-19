import { houses } from "../content.js";
import { points } from "../game.js";
import { useI18n } from "../i18n.jsx";
import { houseIcon } from "../icons.js";
import { useGame } from "../store.jsx";
import { QuestList } from "./QuestList.jsx";
import { Avatar, Button, Heading, Icon } from "./ui.jsx";
import "../dashboard.css";

const copy = {
  en: {
    commandCenter: "Command Center",
    hero: "You shape their next adventure.",
    intro: "Help players grow through small, achievable quests.",
    players: "Players",
    characters: "Characters",
    activeQuests: "Active quests",
    toReview: "To review",
    needsReview: "Needs review",
    queueEmpty: "Submitted quests will appear here.",
    reviewQueue: "View review queue",
    drafts: "Drafts",
    leaderboard: "Leaderboard",
    noPlayers: "Players appear here after completing setup.",
    viewPlayers: "View players",
    world: "Journey through the world",
    openMap: "Open world map",
  },
  nl: {
    commandCenter: "Commandocentrum",
    hero: "Jij geeft vorm aan hun volgende avontuur.",
    intro: "Help spelers groeien met kleine, haalbare opdrachten.",
    players: "Spelers",
    characters: "Personages",
    activeQuests: "Actieve opdrachten",
    toReview: "Te beoordelen",
    needsReview: "Te beoordelen",
    queueEmpty: "Ingeleverde opdrachten verschijnen hier.",
    reviewQueue: "Bekijk inzendingen",
    drafts: "Concepten",
    leaderboard: "Ranglijst",
    noPlayers:
      "Spelers verschijnen hier zodra ze hun account hebben ingesteld.",
    viewPlayers: "Bekijk spelers",
    world: "Reis door de wereld",
    openMap: "Open de wereldkaart",
  },
};

function WayfinderMark() {
  return (
    <svg className="command-mark" viewBox="0 0 120 120" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M60 0C57 34 38 55 0 60c38 5 57 26 60 60 3-34 22-55 60-60C82 55 63 34 60 0Zm0 29c5 15 15 26 33 31-18 5-28 16-33 31-5-15-15-26-33-31 18-5 28-16 33-31Z"
      />
    </svg>
  );
}

function Leaderboard({ entries, words, activate }) {
  return entries.length ? (
    <ol className="command-leaderboard">
      {entries.map(({ player, score }, index) => (
        <li key={player.id}>
          <button type="button" onClick={() => activate(player.id)}>
            <span className="command-rank" aria-hidden="true">
              #{index + 1}
            </span>
            <Avatar player={player} />
            <strong>{player.name}</strong>
            <span className="command-points">{score} pt</span>
          </button>
        </li>
      ))}
    </ol>
  ) : (
    <p className="command-empty">{words.noPlayers}</p>
  );
}

export function GameMasterDashboard() {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, navigate, setModal } = useGame();
  const players = game.players.filter((player) => !player.npc);
  const pending = game.quests.filter((quest) => quest.state === "Ingeleverd");
  const leaderboard = players
    .map((player) => ({ player, score: points(game, player) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4);
  const draftCount = game.questDrafts?.length ?? 0;
  const openQuests = (questFilter) => navigate("quests", { questFilter });
  const stats = [
    {
      label: words.players,
      value: players.length,
      icon: "shield",
      open: () => navigate("players"),
    },
    {
      label: words.characters,
      value: game.players.length - players.length,
      icon: "owl",
      open: () => navigate("players", { peopleFilter: "characters" }),
    },
    {
      label: words.activeQuests,
      value: game.quests.filter((quest) => quest.state === "Open").length,
      icon: "swords",
      open: () => openQuests("Open"),
    },
    {
      label: words.toReview,
      value: pending.length,
      icon: "scroll",
      open: () => openQuests("Ingeleverd"),
    },
  ];

  return (
    <div className="command-center">
      <Heading title={words.commandCenter} />
      <section className="command-hero" aria-labelledby="command-hero-title">
        <div className="command-hero-copy">
          <button
            className="command-chapter"
            type="button"
            onClick={() => setModal({ kind: "chapter" })}
          >
            {t("Hoofdstuk I")} · {t("De Luistervallei")}
          </button>
          <h2 id="command-hero-title">{words.hero}</h2>
          <p>{words.intro}</p>
          <div className="actions">
            <Button
              icon="swords"
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
        </div>
        <WayfinderMark />
      </section>

      <div className="command-stats">
        {stats.map(({ label, value, icon, open }) => (
          <button
            key={label}
            type="button"
            className="command-stat"
            onClick={open}
          >
            <span>{label}</span>
            <Icon name={icon} />
            <strong>{value}</strong>
          </button>
        ))}
      </div>

      <div className="command-grid">
        <section
          className="command-card command-review"
          aria-labelledby="command-review-title"
        >
          <div className="command-card-head">
            <h2 id="command-review-title">
              <Icon name="lightning" />
              {words.needsReview}
            </h2>
            <Button kind="textbtn" onClick={() => openQuests("Ingeleverd")}>
              {words.reviewQueue}
            </Button>
          </div>
          {pending.length ? (
            <div className="work-list">
              <QuestList items={pending.slice(0, 3)} />
            </div>
          ) : (
            <p className="command-empty">{words.queueEmpty}</p>
          )}
          <button
            className="command-drafts"
            type="button"
            onClick={() => openQuests("Concepten")}
          >
            <Icon name="pen" />
            <span>{words.drafts}</span>
            <strong>{draftCount}</strong>
            <Icon name="chev" />
          </button>
        </section>

        <section
          className="command-card"
          aria-labelledby="command-leaderboard-title"
        >
          <div className="command-card-head">
            <h2 id="command-leaderboard-title">
              <Icon name="trophy" />
              {words.leaderboard}
            </h2>
            <Button kind="textbtn" onClick={() => navigate("players")}>
              {words.viewPlayers}
            </Button>
          </div>
          <Leaderboard
            entries={leaderboard}
            words={words}
            activate={(id) => setModal({ kind: "player", id })}
          />
        </section>
      </div>

      <section
        className="command-card command-world"
        aria-labelledby="command-world-title"
      >
        <div className="command-card-head">
          <h2 id="command-world-title">
            <Icon name="earth" />
            {words.world}
          </h2>
          <Button kind="textbtn" onClick={() => navigate("world")}>
            {words.openMap}
          </Button>
        </div>
        <div className="command-houses">
          {Object.entries(houses).map(([key, house]) => (
            <Button
              key={key}
              kind="secondary"
              icon={houseIcon(key)}
              onClick={() => setModal({ kind: "house", key })}
            >
              {t(house.name)}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
