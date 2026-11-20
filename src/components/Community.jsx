import { examples } from "../examples.js";
import { experience } from "../experience.js";
import { exampleText, exerciseStepText, questText, useI18n } from "../i18n.jsx";
import { useState } from "react";
import { useGame } from "../store.jsx";
import { newId, points, typeCode } from "../game.js";
import { houses } from "../content.js";
import { personalityProfiles } from "../personality-reports.js";
import { QuestBrief } from "./QuestBrief.jsx";
import { QuestList, Status } from "./QuestList.jsx";
import { Avatar, Button, Dialog, Field, Heading, Icon } from "./ui.jsx";
import "../community-ui.css";
import "../aether-people.css";

export { GameMasterDashboard as Overview } from "./GameMasterDashboard.jsx";
export { QuestList } from "./QuestList.jsx";

const finished = ["Behaald", "Niet behaald"];
const adminFilters = ["Alles", "Ingeleverd", "Open", "Concepten", "Afgerond"];
const playerFilters = ["Alles", "Open", "Ingeleverd", "Afgerond"];
const questGroups = ["Ingeleverd", "Open", "Afgerond"];
const copy = {
  en: {
    allQuests: "All quests",
    myQuests: "My quests",
    questScope: "Quest scope",
    filterByStatus: "Filter by status",
    directoryFilter: "Filter people",
    allPeople: "All characters",
    players: "Real players",
    characters: "Fictional NPCs",
    noPeople: "No one in this list yet.",
    noMatches: "No characters match your search.",
    peopleTitle: "Heroes & NPCs",
    peopleIntro:
      "Meet the players and fictional characters of LevelUp World. Select a profile to see their quests.",
    search: "Search characters",
    searchPlaceholder: "Search by name, role, or type…",
    realPlayer: "Real player · Light",
    fictionalNpc: "Fictional NPC · Shadow",
    npcLevel: "Story character",
    npcInfo: "No player account",
    level: "Level",
    progress: "Next level",
    score: "Score",
    emptyBio: "No description yet.",
    profile: "View profile",
    quest: "Quest",
    questIntro:
      "Each quest is a real-life exercise. Open an assignment to see what to try and how it will be reviewed.",
    questGuide: "How quests work",
    questSteps: [
      ["Get a quest", "The Game Master assigns an exercise with a clear goal."],
      [
        "Try it and reflect",
        "Complete the exercise and send in a short reflection.",
      ],
      [
        "Get feedback",
        "The Game Master reviews your work and adjusts your score.",
      ],
    ],
    questPrivacy: "Only you and the Game Master can see your reflection.",
    campfireIntro:
      "Share what you’re learning, celebrate a small win, or support another player.",
    share: "Share with the group",
    leaderboard: "Leaderboard",
    noRankedPlayers: "Players appear here after completing setup.",
    noPosts: "No posts yet. Start the conversation.",
    adminFilters: {
      Alles: "All quests",
      Ingeleverd: "To review",
      Open: "Active",
      Concepten: "Drafts",
      Afgerond: "Completed",
    },
    playerFilters: {
      Alles: "Any status",
      Open: "Open",
      Ingeleverd: "Submitted",
      Afgerond: "Completed",
    },
  },
  nl: {
    allQuests: "Alle opdrachten",
    myQuests: "Mijn opdrachten",
    questScope: "Opdrachten weergeven",
    filterByStatus: "Filter op status",
    directoryFilter: "Filter personen",
    allPeople: "Alle personages",
    players: "Echte spelers",
    characters: "Fictieve NPC’s",
    noPeople: "Er staat nog niemand in deze lijst.",
    noMatches: "Geen personages gevonden.",
    peopleTitle: "Helden & NPC’s",
    peopleIntro:
      "Leer de spelers en fictieve personages van LevelUp World kennen. Open een profiel om de opdrachten te bekijken.",
    search: "Zoek personages",
    searchPlaceholder: "Zoek op naam, rol of type…",
    realPlayer: "Echte speler · Licht",
    fictionalNpc: "Fictieve NPC · Schaduw",
    npcLevel: "Verhaalpersonage",
    npcInfo: "Geen spelersaccount",
    level: "Level",
    progress: "Volgend level",
    score: "Score",
    emptyBio: "Nog geen beschrijving.",
    profile: "Bekijk profiel",
    quest: "Opdracht",
    questIntro:
      "Elke opdracht is een oefening in het echte leven. Open een opdracht om te zien wat je kunt proberen en hoe die wordt beoordeeld.",
    questGuide: "Zo werken opdrachten",
    questSteps: [
      [
        "Krijg een opdracht",
        "De spelleider wijst een oefening met een duidelijk doel toe.",
      ],
      [
        "Probeer en reflecteer",
        "Voer de oefening uit en stuur een korte reflectie in.",
      ],
      [
        "Krijg feedback",
        "De spelleider beoordeelt je werk en past je score aan.",
      ],
    ],
    questPrivacy: "Alleen jij en de spelleider kunnen je reflectie zien.",
    campfireIntro:
      "Deel wat je leert, vier een kleine overwinning of moedig een andere speler aan.",
    share: "Deel iets met de groep",
    leaderboard: "Ranglijst",
    noRankedPlayers: "Spelers verschijnen hier zodra hun account klaar is.",
    noPosts: "Nog geen berichten. Begin het gesprek.",
    adminFilters: {
      Alles: "Alle opdrachten",
      Ingeleverd: "Te beoordelen",
      Open: "Actief",
      Concepten: "Concepten",
      Afgerond: "Afgerond",
    },
    playerFilters: {
      Alles: "Alle statussen",
      Open: "Open",
      Ingeleverd: "Ingeleverd",
      Afgerond: "Afgerond",
    },
  },
};

function belongsToFilter(quest, filter) {
  return (
    filter === "Alles" ||
    (filter === "Afgerond"
      ? finished.includes(quest.state)
      : quest.state === filter)
  );
}

function CharacterCard({ person, name, role, typeName, words }) {
  const { t } = useI18n();
  const { game, gm, navigate, setModal } = useGame();
  const { xp, level, progress, goal } = experience(game, person);
  const score = points(game, person);
  const headingId = "character-" + person.id;

  return (
    <article
      className="character-card"
      data-npc={person.npc || undefined}
      aria-labelledby={headingId}
    >
      <div className="character-card-identity">
        <Avatar player={person} large />
        <div>
          <h2 id={headingId}>{name}</h2>
          <span className="character-badge">
            <span aria-hidden="true">{person.npc ? "☾" : "✦"}</span>
            {person.npc ? words.fictionalNpc : words.realPlayer}
          </span>
        </div>
      </div>
      <p className="character-level">
        {person.npc ? words.npcLevel : `${words.level} ${level} · ${xp} XP`}
      </p>
      <p className="character-role">
        {typeName || role}{" "}
        {typeName && (
          <span className="character-type-code">{person.personalityCode}</span>
        )}
      </p>
      <p className="character-bio">
        {exampleText(t, examples.players, person, "desc") || words.emptyBio}
      </p>
      <div className="character-growth">
        {person.npc ? (
          <span className="character-badge">{words.npcInfo}</span>
        ) : (
          <>
            <div className="character-growth-label">
              <span>{words.progress}</span>
              <span>
                {progress}/{goal} XP
              </span>
            </div>
            <progress max={goal} value={progress} aria-label={words.progress} />
          </>
        )}
      </div>
      <footer className="character-card-footer">
        <div className="character-score">
          <span>{words.score}</span>
          <strong data-negative={score < 0 || undefined}>{score} pt</strong>
        </div>
        <div className="character-card-actions">
          <Button
            kind="secondary"
            aria-label={`${words.profile}: ${name}`}
            onClick={() => setModal({ kind: "player", id: person.id })}
          >
            {words.profile}
          </Button>
          {gm && (
            <Button
              kind="secondary"
              icon="plus"
              aria-label={t("Opdracht toewijzen")}
              onClick={() =>
                navigate("questEditor", {
                  questEditor: { playerId: person.id, returnPage: "players" },
                })
              }
            >
              {words.quest}
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

const ranked = (game) =>
  [...game.players].sort((a, b) => points(game, b) - points(game, a));

function FilterBar({ label, choices, selected, onChange }) {
  return (
    <div className="work-filters" role="group" aria-label={label}>
      {Object.entries(choices).map(([key, name]) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected === key}
          onClick={() => onChange(key)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

export function QuestPage() {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, player, gm, navigate, view } = useGame();
  const availableFilters = gm ? adminFilters : playerFilters;
  const filter = availableFilters.includes(view.questFilter)
    ? view.questFilter
    : "Alles";
  const scope = gm || view.questScope === "all" ? "all" : "mine";
  const items = game.quests.filter(
    (quest) =>
      (scope === "all" || quest.playerId === player.id) &&
      belongsToFilter(quest, filter),
  );
  const byStatus = (status) =>
    items.filter((quest) => belongsToFilter(quest, status));
  return (
    <div className="quest-workspace">
      <Heading title={t("Opdrachten")}>
        {gm && (
          <Button icon="swords" onClick={() => navigate("questEditor")}>
            {t("Nieuwe opdracht")}
          </Button>
        )}
      </Heading>
      <p className="work-page-intro">{words.questIntro}</p>
      <div className="work-quest-toolbar">
        {gm ? (
          <FilterBar
            label={words.filterByStatus}
            choices={words.adminFilters}
            selected={filter}
            onChange={(questFilter) => navigate("quests", { questFilter })}
          />
        ) : (
          <>
            <FilterBar
              label={words.questScope}
              choices={{ mine: words.myQuests, all: words.allQuests }}
              selected={scope}
              onChange={(questScope) =>
                navigate("quests", { questFilter: filter, questScope })
              }
            />
            <label className="work-status-picker">
              <span>{words.filterByStatus}</span>
              <select
                value={filter}
                onChange={({ target: { value: questFilter } }) =>
                  navigate("quests", { questFilter, questScope: scope })
                }
              >
                {Object.entries(words.playerFilters).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      <div className="work-columns">
        {gm && filter === "Alles" && items.length ? (
          <div className="work-quest-groups">
            {questGroups.map((status) => {
              const quests = byStatus(status);
              if (!quests.length) return null;
              return (
                <section key={status}>
                  <div className="work-section-heading">
                    <h2>{words.adminFilters[status]}</h2>
                  </div>
                  <div className="work-list">
                    <QuestList items={quests} />
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="work-list">
            {filter === "Concepten" ? (
              <QuestDraftList />
            ) : (
              <QuestList items={items} />
            )}
          </div>
        )}
        <aside className="work-card" aria-labelledby="quest-guide-title">
          <h2 id="quest-guide-title">{words.questGuide}</h2>
          <ol className="work-steps">
            {words.questSteps.map(([title, description]) => (
              <li key={title}>
                <strong>{title}</strong>
                <p>{description}</p>
              </li>
            ))}
          </ol>
          <p className="work-callout">{words.questPrivacy}</p>
        </aside>
      </div>
    </div>
  );
}

function QuestDraftList() {
  const { t } = useI18n();
  const { game, navigate } = useGame();
  const drafts = game.questDrafts || [];
  if (!drafts.length)
    return <div className="empty">{t("Je hebt nog geen concepten.")}</div>;
  return drafts.map((draft) => {
    const recipient = game.players.find((p) => p.id === draft.playerId);
    return (
      <button
        className="item"
        key={draft.id}
        onClick={() =>
          navigate("questEditor", {
            questEditor: { draftId: draft.id, returnPage: "quests" },
          })
        }
      >
        <span className="tile">
          <Icon name="pen" />
        </span>
        <span className="body">
          <strong>{draft.name || t("Concept zonder titel")}</strong>
          <span className="meta">
            {recipient
              ? exampleText(t, examples.players, recipient, "name")
              : t("Kies nog een speler")}
          </span>
        </span>
        <span className="badgewrap">
          <Icon name="chev" />
        </span>
      </button>
    );
  });
}

export function Players({ embedded = false }) {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, gm, setModal, view, navigate } = useGame();
  const [search, setSearch] = useState("");
  const filter = view.peopleFilter ?? "all";
  const query = search.trim().toLocaleLowerCase(language);
  const characters = ranked(game)
    .filter(
      (person) =>
        filter === "all" || Boolean(person.npc) === (filter === "characters"),
    )
    .map((person) => ({
      person,
      name: exampleText(t, examples.players, person, "name"),
      role: person.registered
        ? t("Speler")
        : exampleText(t, examples.players, person, "role"),
      typeName: personalityProfiles[person.personalityCode]?.[language]?.name,
    }))
    .filter(({ person, name, role, typeName }) =>
      [name, role, typeName, person.personalityCode]
        .join(" ")
        .toLocaleLowerCase(language)
        .includes(query),
    );

  return (
    <div className="character-directory">
      {!embedded && <Heading title={words.peopleTitle} />}
      <p className="character-directory-intro">{words.peopleIntro}</p>
      <div className="character-toolbar">
        <input
          type="search"
          aria-label={words.search}
          placeholder={words.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label={words.directoryFilter}
          value={filter}
          onChange={(event) =>
            navigate("players", { peopleFilter: event.target.value })
          }
        >
          <option value="all">{words.allPeople}</option>
          <option value="players">{words.players}</option>
          <option value="characters">{words.characters}</option>
        </select>
        {gm && (
          <Button icon="plus" onClick={() => setModal({ kind: "addPlayer" })}>
            {t("Personage toevoegen")}
          </Button>
        )}
      </div>
      {characters.length ? (
        <div className="character-grid">
          {characters.map(({ person, name, role, typeName }) => (
            <CharacterCard
              key={person.id}
              person={person}
              name={name}
              role={role}
              typeName={typeName}
              words={words}
            />
          ))}
        </div>
      ) : (
        <p className="work-list empty" role="status">
          {query ? words.noMatches : words.noPeople}
        </p>
      )}
    </div>
  );
}
export function Feed() {
  const { language, t } = useI18n();
  const { game, gm, player, mutate, setModal } = useGame();
  const words = copy[language];
  const voter = gm ? "gm" : player.id;
  const leaders = ranked(game)
    .filter((person) => !person.npc)
    .slice(0, 5);
  return (
    <>
      <Heading title={t("Kampvuur")} />
      <p className="work-page-intro">{words.campfireIntro}</p>
      <div className="work-columns">
        <div className="work-feed">
          <section className="work-card work-composer">
            <h2>{words.share}</h2>
            <Button icon="pen" onClick={() => setModal({ kind: "post" })}>
              {t("Schrijf iets")}
            </Button>
          </section>
          {!game.posts.length && (
            <p className="work-list empty">{words.noPosts}</p>
          )}
          {game.posts.map((post) => {
            const author = game.players.find((p) => p.id === post.playerId) || {
              av: "tide",
              name: "Spelleider",
              role: "Beheerder",
            };
            const likes =
              post.likes + Object.values(post.votes).filter(Boolean).length;
            return (
              <article className="post" key={post.id}>
                <div className="identity">
                  <Avatar player={author} />
                  <span>
                    <b>
                      {post.playerId === "gm"
                        ? t("Spelleider")
                        : exampleText(t, examples.players, author, "name")}
                    </b>
                    <span className="small">
                      {post.playerId === "gm"
                        ? t("Beheerder")
                        : author.registered
                          ? t("Speler")
                          : exampleText(t, examples.players, author, "role")}
                    </span>
                  </span>
                </div>
                <p>{exampleText(t, examples.posts, post, "msg")}</p>
                <button
                  className="like"
                  aria-label={t("Waardering geven, {count} waarderingen", {
                    count: likes,
                  })}
                  aria-pressed={!!post.votes[voter]}
                  onClick={() => mutate("like", { id: post.id })}
                >
                  <Icon name="heart" /> {likes}
                </button>
              </article>
            );
          })}
        </div>
        <aside className="work-card" aria-labelledby="feed-leaderboard-title">
          <h2 id="feed-leaderboard-title">
            <Icon name="trophy" />
            {words.leaderboard}
          </h2>
          {leaders.length ? (
            <ol className="work-rankings">
              {leaders.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => setModal({ kind: "player", id: person.id })}
                  >
                    <Avatar player={person} />
                    <strong>
                      {exampleText(t, examples.players, person, "name")}
                    </strong>
                    <span>{points(game, person)} pt</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="work-callout">{words.noRankedPlayers}</p>
          )}
        </aside>
      </div>
    </>
  );
}
function QuestDialog({ quest, close }) {
  const { t } = useI18n();
  const { game, player, gm, mutate, setModal } = useGame();
  const owner = game.players.find((p) => p.id === quest.playerId);
  const own = !gm && player.id === owner.id;
  async function save(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const review = gm && quest.state === "Ingeleverd";
    const text = data.get("text").trim();
    if (!text) {
      const field = e.currentTarget.elements.namedItem("text");
      field.value = "";
      field.reportValidity();
      return;
    }
    const passed = e.nativeEvent.submitter?.value === "pass";
    const result = await mutate(review ? "review" : "submit", {
      id: quest.id,
      text,
      ...(review ? { passed } : {}),
    });
    if (result && review) setModal({ kind: "reviewed", id: quest.id });
  }
  return (
    <Dialog
      label={t("Persoonlijke opdracht")}
      title={questText(t, quest, "name")}
      close={close}
    >
      <div className="identity">
        <Avatar player={owner} />
        <span>{exampleText(t, examples.players, owner, "name")}</span>
        <Status value={quest.state} />
      </div>
      <QuestBrief quest={quest} submissionId="quest-submission-prompt" />
      {own && quest.privateSteps && (
        <>
          <h3>{t("Mijn aanpak")}</h3>
          <ol className="stepList">
            {quest.privateSteps.map((step, i) => (
              <li key={i}>{exerciseStepText(t, step, i)}</li>
            ))}
          </ol>
        </>
      )}
      {(gm || own) && quest.evidence && (
        <>
          <h3>{t("Inzending van {name}", { name: owner.name })}</h3>
          <blockquote>{questText(t, quest, "evidence")}</blockquote>
        </>
      )}
      {(gm || own) && quest.feedback && (
        <p>
          <b>Feedback</b>
          <br />
          {quest.feedback}
        </p>
      )}
      {gm && quest.state === "Ingeleverd" && (
        <form onSubmit={save}>
          <Field label="Feedback">
            <textarea name="text" required maxLength={400} />
          </Field>
          <div className="actions">
            <Button type="submit" value="pass">
              {t("Behaald · +{points} pt", { points: quest.plus })}
            </Button>
            <Button kind="warn" type="submit" value="fail">
              {t("Niet behaald · −{points} pt", { points: quest.minus })}
            </Button>
          </div>
        </form>
      )}
      {quest.state === "Open" && (own || (gm && owner.npc)) && (
        <form onSubmit={save}>
          <Field
            label={t(
              quest.submissionPrompt ? "Jouw inzending" : "Wat heb je gedaan?",
            )}
          >
            <textarea
              name="text"
              required
              maxLength={500}
              aria-describedby={
                quest.submissionPrompt ? "quest-submission-prompt" : undefined
              }
            />
          </Field>
          <Button type="submit">{t("Inleveren")}</Button>
        </form>
      )}
    </Dialog>
  );
}
function PlayerDialog({ target, close }) {
  const { language, t } = useI18n();
  const { gm, player, game, navigate, view } = useGame();
  const own = !gm && player.id === target.id,
    j = target.journey;
  const typeName =
    personalityProfiles[target.personalityCode]?.[language]?.name;
  function createQuest(sharedGoalId) {
    navigate("questEditor", {
      questEditor: { playerId: target.id, sharedGoalId, returnPage: view.page },
    });
  }
  return (
    <Dialog
      label={t("Spelersprofiel")}
      title={exampleText(t, examples.players, target, "name")}
      close={close}
    >
      <div className="identity">
        <Avatar player={target} large />
        <span>
          <b>
            {target.registered
              ? t("Speler")
              : exampleText(t, examples.players, target, "role")}
          </b>
          <span className="meta">
            {target.npc ? t("NPC · Evil") : t("Speler · Goede kant")}
          </span>
          {typeName && (
            <span className="character-role">
              {typeName}{" "}
              <span className="character-type-code">
                {target.personalityCode}
              </span>
            </span>
          )}
        </span>
        <span className="score">
          {points(game, target)} <small>pt</small>
        </span>
      </div>
      <p>{exampleText(t, examples.players, target, "desc")}</p>
      {j.house && (
        <p>
          <b>{t("Huis {house}", { house: t(houses[j.house].name) })}</b> ·{" "}
          {t(houses[j.house].place)}
        </p>
      )}
      {own && (
        <Button kind="textbtn" onClick={() => navigate("profile")}>
          {!typeName && j.typeScores ? typeCode(j.typeScores) + " · " : ""}
          {t("Bekijk mijn profiel")}
        </Button>
      )}
      {j.goals
        .filter((g) => own || (gm && g.shared))
        .map((g) => (
          <div key={g.id} className="detailbox">
            <b>{g.text}</b>
            <br />
            {g.action}
            {gm && (
              <div>
                <Button
                  icon="plus"
                  kind="textbtn"
                  onClick={() => createQuest(g.id)}
                  aria-label={t("Maak opdracht voor dit doel: {goal}", {
                    goal: g.text,
                  })}
                >
                  {t("Maak opdracht voor dit doel")}
                </Button>
              </div>
            )}
          </div>
        ))}
      <div className="foot">
        <h3>{t("Persoonlijke opdrachten")}</h3>
        <div className="list">
          <QuestList
            items={game.quests.filter((q) => q.playerId === target.id)}
          />
        </div>
        {gm && (
          <Button icon="plus" onClick={() => createQuest()}>
            {t("Opdracht toewijzen")}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
function AddDialog({ kind, close }) {
  const { t } = useI18n();
  const { game, gm, player, mutate, setModal, navigate } = useGame();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const post = kind === "post";
  if (!gm && !post) return null;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const f = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of Object.keys(f)) f[key] = f[key].trim();
    if (Object.values(f).some((v) => !v)) {
      setError("Vul alle velden in.");
      return;
    }
    setError("");
    setBusy(true);
    const key = newId();
    if (post) {
      if (await mutate("post", { id: key, text: f.msg })) navigate("feed");
    } else {
      const result = await mutate("npc", {
        player: {
          id: key,
          name: f.name,
          role: f.role,
          desc: f.desc,
          av: f.av,
          npc: true,
        },
      });
      if (result) {
        navigate("players", { peopleFilter: "characters" });
        setModal({ kind: "player", id: key });
      }
    }
    setBusy(false);
  }
  return (
    <Dialog
      label={post ? t("Kampvuur") : t("Spelleider")}
      title={post ? t("Schrijf iets") : t("Personage toevoegen")}
      close={close}
    >
      <form onSubmit={submit}>
        {post ? (
          <Field
            label={t("Bericht als {name}", {
              name: gm ? t("Spelleider") : player.name,
            })}
          >
            <textarea required name="msg" maxLength={600} />
          </Field>
        ) : (
          <>
            <Field label={t("Naam")}>
              <input name="name" required maxLength={36} />
            </Field>
            <Field label={t("Rol")}>
              <input name="role" required maxLength={45} />
            </Field>
            <Field label={t("Beschrijving")}>
              <textarea name="desc" required maxLength={300} />
            </Field>
            <fieldset className="avatar-choice">
              <legend>{t("Avatar")}</legend>
              <div className="radioRow">
                {[
                  ["fern", "Blad"],
                  ["sun", "Zon"],
                  ["moon", "Maan"],
                  ["tide", "Golf"],
                ].map(([av, label], i) => (
                  <label key={av}>
                    <input
                      name="av"
                      type="radio"
                      value={av}
                      defaultChecked={i === 0}
                    />
                    <Avatar player={{ av }} />
                    {t(label)}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {error && <p role="alert">{t(error)}</p>}
        <Button type="submit" disabled={busy}>
          {post ? t("Plaatsen") : t("Personage toevoegen")}
        </Button>
      </form>
    </Dialog>
  );
}
export function CommunityDialog() {
  const { t } = useI18n();
  const { game, modal, setModal } = useGame();
  const close = () => setModal(null);
  const quest = game.quests.find((q) => q.id === modal.id);
  if (modal.kind === "reviewed") {
    const owner = game.players.find((p) => p.id === quest.playerId);
    return (
      <Dialog
        label={t("Beoordeling vastgelegd")}
        title={t(quest.state)}
        close={close}
      >
        <p className="delta">
          {quest.state === "Behaald" ? "+" + quest.plus : "−" + quest.minus} pt
        </p>
        <p>
          {t("{name} heeft nu {points} punten.", {
            name: owner.name,
            points: points(game, owner),
          })}
        </p>
        <Button onClick={close}>{t("Terug naar overzicht")}</Button>
      </Dialog>
    );
  }
  if (modal.kind === "quest")
    return <QuestDialog quest={quest} close={close} />;
  if (modal.kind === "player")
    return (
      <PlayerDialog
        target={game.players.find((p) => p.id === modal.id)}
        close={close}
      />
    );
  if (modal.kind === "chapter")
    return (
      <Dialog
        label={t("Hoofdstuk I")}
        title={t("De Luistervallei")}
        close={close}
      >
        <p>
          {t(
            "In dit hoofdstuk oefenen spelers met aandacht voor elkaar. Elke opdracht geeft ze één klein gesprek om mee te beginnen.",
          )}
        </p>
        <QuestList items={game.quests.slice(0, 3)} />
      </Dialog>
    );
  return <AddDialog {...modal} close={close} />;
}
