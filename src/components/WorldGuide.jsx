import { aetherRegions, getAetherRegion } from "../aether-regions.js";
import { houses } from "../content.js";
import { useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { Button, Icon } from "./ui.jsx";
import "../aether-world.css";

const copy = {
  en: {
    pageTitle: "The world map",
    eyebrow: "LevelUp World / The Awakening",
    chapter: "Chapter I",
    world: "The world",
    map: "World map",
    people: "Inhabitants",
    quests: "Quests",
    feed: "Community",
    guide: "How to play",
    intro: "Explore four regions and the skills you can practise in each.",
    explore: (name) => "Explore " + name,
    mission: "Growth quest",
    create: "Create this quest",
    ownQuests: "My quests",
    region: "Discover the region",
  },
  nl: {
    pageTitle: "De wereldkaart",
    eyebrow: "LevelUp World / Het Ontwaken",
    chapter: "Hoofdstuk I",
    world: "De wereld",
    map: "Wereldkaart",
    people: "Bewoners",
    quests: "Opdrachten",
    feed: "Gebeurtenissen",
    guide: "Hoe speel je?",
    intro:
      "Verken vier regio’s en ontdek welke vaardigheid je er kunt oefenen.",
    explore: (name) => "Ontdek " + name,
    mission: "Groeimissie",
    create: "Maak deze quest",
    ownQuests: "Mijn opdrachten",
    region: "Ontdek de regio",
  },
};

const worldLinks = [
  ["world", "compass", "map"],
  ["players", "people", "people"],
  ["quests", "flag", "quests"],
  ["feed", "chat", "feed"],
  ["guide", "book", "guide"],
];

export function WorldGuide() {
  const { language, t } = useI18n();
  const { setModal, player, gm, view, navigate } = useGame();
  const words = copy[language];
  const selected = getAetherRegion(view.region) ?? aetherRegions[0];
  const region = selected[language];
  const house = houses[selected.house];
  const member = player.journey.house === selected.house;

  return (
    <div className="aether-world">
      <header className="aether-world-page-head">
        <div>
          <p className="eyebrow">{words.eyebrow}</p>
          <h1>{words.pageTitle}</h1>
        </div>
        <span className="eyebrow aether-world-chapter">
          <span aria-hidden="true">✦</span> {words.chapter}
        </span>
      </header>
      <div className="aether-map-layout">
        <nav className="aether-map-nav" aria-label={words.world}>
          <p>{words.world}</p>
          {worldLinks.map(([page, icon, label]) => (
            <button
              key={page}
              type="button"
              aria-current={page === "world" ? "page" : undefined}
              onClick={() => page !== "world" && navigate(page)}
            >
              <Icon name={icon} />
              {words[label]}
            </button>
          ))}
        </nav>
        <section
          className="aether-map-content"
          aria-labelledby="aether-map-title"
        >
          <div className="aether-map-heading">
            <div>
              <h2 id="aether-map-title">{words.map}</h2>
              <p>{words.intro}</p>
            </div>
            <span className="aether-map-chapter">
              <span aria-hidden="true">✦ </span>
              {words.chapter}
            </span>
          </div>
          <div className="aether-map-frame">
            <div className="aether-map-pins">
              <svg
                className="aether-map-path"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M18 26 Q48 10 78 28 Q94 53 45 75 T82 80" />
              </svg>
              {aetherRegions.map((item) => {
                const details = item[language];
                return (
                  <button
                    key={item.key}
                    className={"aether-map-pin aether-map-pin-" + item.key}
                    type="button"
                    aria-label={details.title}
                    aria-pressed={item.key === selected.key}
                    aria-controls="aether-region-details"
                    aria-describedby={"map-pin-" + item.key}
                    onClick={() => {
                      if (selected.key !== item.key)
                        navigate("world", { region: item.key });
                    }}
                  >
                    <span className="aether-map-pin-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="aether-map-pin-label">
                      <strong>{details.title}</strong>
                      <small id={"map-pin-" + item.key}>
                        {details.subtitle}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div id="aether-region-details" className="aether-region-details">
            <article className="aether-region-panel">
              <p className="eyebrow">{words.region}</p>
              <h3 aria-live="polite">
                <span aria-hidden="true">{selected.icon}</span>
                {region.title}
              </h3>
              <p>{region.description}</p>
              <div className="aether-region-actions">
                <span className="aether-region-skill">
                  <span aria-hidden="true">{selected.skillIcon} </span>
                  {region.skill}
                </span>
                {member && (
                  <span className="aether-region-membership">
                    {t("Mijn huis")}
                  </span>
                )}
                <Button
                  kind="textbtn"
                  onClick={() =>
                    setModal({ kind: "house", key: selected.house })
                  }
                >
                  {words.explore(t(house.name))}
                </Button>
              </div>
            </article>
            <article className="aether-region-panel">
              <p className="eyebrow">{words.mission}</p>
              <h3>{region.quest.name}</h3>
              <p>
                {region.quest.desc} {region.quest.submissionPrompt}
              </p>
              <Button
                icon={gm ? "plus" : "flag"}
                onClick={() => {
                  if (gm) {
                    navigate("questEditor", {
                      questEditor: {
                        returnPage: "world",
                        template: selected.key,
                      },
                    });
                  } else {
                    navigate("quests");
                  }
                }}
              >
                {gm ? words.create : words.ownQuests}
              </Button>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
