import { useEffect, useRef } from "react";
import { houses } from "./content.js";
import { useGame } from "./store.jsx";
import { Button, Heading, Icon } from "./components/ui.jsx";
import { BioDialog, PersonalityTest, Profile } from "./components/Profile.jsx";
import { Journey, JourneyDialog } from "./components/Journey.jsx";
import {
  CommunityDialog,
  Feed,
  Overview,
  Players,
  QuestPage,
} from "./components/Community.jsx";

const tabs = [
  ["home", "Overzicht", "compass"],
  ["quests", "Opdrachten", "flag"],
  ["players", "Spelers", "people"],
  ["feed", "Kampvuur", "fire"],
];
function Guide() {
  return (
    <>
      <Heading label="LevelUp World" title="Over dit ontwerp" />
      <div className="single">
        <section className="guide panel">
          <h2>Een veldboek voor de groep</h2>
          <p>
            In de Luistervallei werk je aan persoonlijke doelen. De spelleider
            geeft opdrachten, leest je inzending en geeft feedback en punten.
            Bij het kampvuur kun je ervaringen met de groep delen.
          </p>
        </section>
        <section className="guide panel">
          <h2>Kleuren in je veldboek</h2>
          <div className="colors">
            <span
              className="color"
              style={{ background: "#163e34", color: "white" }}
            >
              Woudgroen
            </span>
            <span
              className="color"
              style={{ background: "#f4e8cd", color: "#774e1a" }}
            >
              Oker
            </span>
            <span
              className="color"
              style={{ background: "#e5ddeb", color: "#564463" }}
            >
              Schemerpaars
            </span>
          </div>
          <p className="note">
            Oker markeert iets dat jouw aandacht vraagt. Een fictief personage
            herken je in de ranglijst en op het profiel aan ‘NPC · Evil’.
          </p>
        </section>
        <section className="guide panel">
          <h2>Huis, doel en speelstijl</h2>
          <p>
            Vijf keuzes wijzen je naar een huis. Bij een gelijke stand kies je
            zelf. De persoonlijkheidstest beschrijft vier voorkeuren. Die helpen
            om een aanpak voor je opdrachten te kiezen. In je kamer kun je deze
            aanpak bijstellen of de acht brieven van de nachtpost lezen.
          </p>
        </section>
        <section className="guide panel">
          <h2>Probeer beide rollen</h2>
          <p>
            Kies bovenaan een speler of wissel naar Spelleider. Kies ‘Account
            aanmaken’ voor een eigen demoprofiel. Op dit apparaat worden je
            profiel, opdrachten, doelen en berichten in de browser bewaard.
            Iedereen die deze demo op dit apparaat opent, kan van rol wisselen.
          </p>
        </section>
      </div>
    </>
  );
}
function Brand() {
  return (
    <div className="brand">
      <svg aria-hidden="true" className="mark" viewBox="0 0 42 48">
        <path fill="#173f33" d="M21 1 40 12v24L21 47 2 36V12z" />
        <g fill="none" stroke="#d8bc83" strokeWidth="1.4">
          <path d="m21 7 13 8v17l-13 8-13-8V15z" />
          <path d="m10 30 8-14 5 9 3-5 7 12M16 32l5-9 5 9" />
        </g>
      </svg>
      <span>
        <b>LevelUp</b>
        <small>WORLD</small>
      </span>
    </div>
  );
}
export default function App() {
  const { game, player, gm, view, modal, warning, navigate, startTest } =
    useGame();
  const { page } = view;
  const content = useRef(null);
  const firstRender = useRef(true);
  const j = player.journey;
  const step =
    page === "test"
      ? view.test?.step
      : page === "home" && !gm
        ? [j.stage, j.index, j.letterIndex].join("/")
        : "";
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
    const title = content.current?.querySelector("h1");
    if (title) {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  }, [page, step, player.id, gm]);
  const house = !gm && houses[j.house];
  const links = gm ? tabs : [...tabs, ["profile", "Mijn profiel", "book"]];
  let screen;
  switch (page) {
    case "profile":
      screen = <Profile />;
      break;
    case "test":
      screen = view.test ? <PersonalityTest /> : <Profile />;
      break;
    case "quests":
      screen = <QuestPage />;
      break;
    case "players":
      screen = <Players />;
      break;
    case "feed":
      screen = <Feed />;
      break;
    case "guide":
      screen = <Guide />;
      break;
    default:
      screen = gm ? <Overview /> : <Journey />;
  }
  return (
    <div
      className="shell"
      style={house ? { "--pine": house.tint, "--soft": house.soft } : undefined}
    >
      <aside className="rail">
        <Brand />
        <nav aria-label="Hoofdnavigatie">
          {links.map(([id, label, icon]) => (
            <button
              key={id}
              className={"navbtn " + (id === page ? "on" : "")}
              aria-current={id === page ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon name={icon} />
              {label}
            </button>
          ))}
        </nav>
        <div className="railfoot">
          <Button
            kind={"guidebtn " + (page === "guide" ? "on" : "")}
            icon="layers"
            onClick={() => navigate("guide")}
          >
            Over dit ontwerp
          </Button>
        </div>
      </aside>
      <main className="main">
        <div className="top">
          <div className="toplabel">
            <Icon name="layers" />
            Ontwerpvoorbeeld
          </div>
          <div className="rolepick">
            {!gm && (
              <label>
                Speler{" "}
                <select
                  id="who"
                  aria-label="Kies een speler of maak een account aan"
                  value={player.id}
                  onChange={(e) =>
                    e.target.value === "new"
                      ? startTest(true)
                      : navigate("home", { playerId: e.target.value })
                  }
                >
                  {game.players
                    .filter((p) => !p.npc)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  <option value="new">＋ Account aanmaken</option>
                </select>
              </label>
            )}
            <Button
              kind="topdesign"
              icon="info"
              aria-label="Over dit ontwerp"
              onClick={() => navigate("guide")}
            />
            <div className="seg" aria-label="Voorbeeldrol">
              {[
                ["gm", "Spelleider"],
                ["player", "Speler"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={id === view.mode}
                  className={id === view.mode ? "on" : ""}
                  onClick={() => navigate("home", { mode: id })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="wrap" ref={content}>
          {warning && (
            <p role="status" className="detailbox">
              {warning}
            </p>
          )}
          <div className="flow" key={[page, player.id, gm].join("/")}>
            {screen}
          </div>
        </div>
      </main>
      {modal &&
        (modal.kind === "bio" ? (
          <BioDialog />
        ) : ["house", "retake", "exercise"].includes(modal.kind) ? (
          <JourneyDialog key={modal.kind} />
        ) : (
          <CommunityDialog key={modal.kind + ":" + modal.id} />
        ))}
    </div>
  );
}
