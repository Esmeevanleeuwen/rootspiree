import { examples } from "../examples.js";
import { exampleText, exerciseStepText, questText, useI18n } from "../i18n.jsx";
import { useState } from "react";
import { useGame } from "../store.jsx";
import { newId, points, typeCode } from "../game.js";
import { houses } from "../content.js";
import {
  Avatar,
  Button,
  Chips,
  Dialog,
  Field,
  Heading,
  Icon,
  Section,
} from "./ui.jsx";

const finished = ["Behaald", "Niet behaald"];
function Status({ value }) {
  const { t } = useI18n();
  return (
    <span
      className={
        "status " +
        (value === "Ingeleverd"
          ? "wait"
          : value === "Niet behaald"
            ? "bad"
            : "")
      }
    >
      {t(value)}
    </span>
  );
}
export function QuestList({ items }) {
  const { t } = useI18n();
  const { game, setModal } = useGame();
  return items.length ? (
    items.map((q) => (
      <button
        className="item"
        key={q.id}
        onClick={() => setModal({ kind: "quest", id: q.id })}
      >
        <span className={"tile " + q.style}>
          <Icon name={q.icon} />
        </span>
        <span className="body">
          <strong>{questText(t, q, "name")}</strong>
          <span className="meta">
            {exampleText(
              t,
              examples.players,
              game.players.find((p) => p.id === q.playerId),
              "name",
            )}{" "}
            · +{q.plus} / −{q.minus} pt
          </span>
        </span>
        <span className="badgewrap">
          <Status value={q.state} />
        </span>
      </button>
    ))
  ) : (
    <div className="empty">{t("Geen opdrachten in deze selectie.")}</div>
  );
}
function Roster({ items }) {
  const { t } = useI18n();
  const { game, setModal } = useGame();
  return (
    <div className="panel">
      {items.map((p, i) => (
        <button
          className="person"
          key={p.id}
          onClick={() => setModal({ kind: "player", id: p.id })}
        >
          <span className="rank">{String(i + 1).padStart(2, "0")}</span>
          <Avatar player={p} />
          <span className="identity">
            <span>
              <b>{exampleText(t, examples.players, p, "name")}</b>
              <span className="small">
                {p.npc
                  ? t("NPC · Evil")
                  : p.registered
                    ? t("Speler")
                    : exampleText(t, examples.players, p, "role")}
              </span>
            </span>
          </span>
          <span className="score">
            {points(game, p)} <small>pt</small>
          </span>
        </button>
      ))}
    </div>
  );
}
const ranked = (game) =>
  [...game.players].sort((a, b) => points(game, b) - points(game, a));
export function Overview() {
  const { t } = useI18n();
  const { game, navigate, setModal } = useGame();
  const pending = game.quests.filter((q) => q.state === "Ingeleverd");
  return (
    <>
      <Heading label={t("Spelleider")} title={t("Speloverzicht")}>
        <Button icon="plus" onClick={() => setModal({ kind: "addQuest" })}>
          {t("Nieuwe opdracht")}
        </Button>
      </Heading>
      <section className="hero">
        <span className="tag">
          <Icon name="book" /> {t("Hoofdstuk I")}
        </span>
        <h2 className="chapter">{t("De Luistervallei")}</h2>
        <p>{t("Oefen samen met luisteren, doorvragen en ruimte geven.")}</p>
        <Button
          kind="pale"
          icon="book"
          onClick={() => setModal({ kind: "chapter" })}
        >
          {t("Bekijk het hoofdstuk")}
        </Button>
      </section>
      <div className="cols">
        <section>
          <Section title={t("Te beoordelen")}>
            <Button kind="textbtn" onClick={() => navigate("quests")}>
              {t("Alle opdrachten")}
            </Button>
          </Section>
          {pending.length ? (
            <QuestList items={pending.slice(0, 3)} />
          ) : (
            <p className="empty">{t("Je hebt alle inzendingen beoordeeld.")}</p>
          )}
        </section>
        <section>
          <Section title={t("Ranglijst")}>
            <Button kind="textbtn" onClick={() => navigate("players")}>
              {t("Alle spelers")}
            </Button>
          </Section>
          <Roster items={ranked(game).slice(0, 3)} />
        </section>
      </div>
    </>
  );
}
export function QuestPage() {
  const { t } = useI18n();
  const { game, player, gm, setModal } = useGame();
  const [filter, setFilter] = useState("Alles");
  const items = game.quests.filter(
    (q) =>
      filter === "Alles" ||
      (filter === "Van mij"
        ? q.playerId === player.id
        : filter === "Afgerond"
          ? finished.includes(q.state)
          : q.state === filter),
  );
  return (
    <>
      <Heading label={t("Spelwereld")} title={t("Opdrachten")}>
        {gm && (
          <Button icon="plus" onClick={() => setModal({ kind: "addQuest" })}>
            {t("Nieuwe opdracht")}
          </Button>
        )}
      </Heading>
      <Chips
        items={[
          "Alles",
          ...(gm ? [] : ["Van mij"]),
          "Open",
          "Ingeleverd",
          "Afgerond",
        ]}
        value={filter}
        onChange={setFilter}
      />
      <div className="single">
        <QuestList items={items} />
      </div>
    </>
  );
}
export function Players() {
  const { t } = useI18n();
  const { game, gm, setModal } = useGame();
  const [filter, setFilter] = useState("Alles");
  return (
    <>
      <Heading label={t("Spelwereld")} title={t("Spelers")}>
        {gm && (
          <Button icon="plus" onClick={() => setModal({ kind: "addPlayer" })}>
            {t("Personage toevoegen")}
          </Button>
        )}
      </Heading>
      <Chips
        items={["Alles", "Goede kant", "NPC · Evil"]}
        value={filter}
        onChange={setFilter}
      />
      <div className="single">
        <Roster
          items={ranked(game).filter(
            (p) => filter === "Alles" || !!p.npc === (filter === "NPC · Evil"),
          )}
        />
      </div>
    </>
  );
}
export function Feed() {
  const { t } = useI18n();
  const { game, gm, player, mutate, setModal } = useGame();
  const voter = gm ? "gm" : player.id;
  return (
    <>
      <Heading label="Community" title={t("Kampvuur")}>
        <Button icon="pen" onClick={() => setModal({ kind: "post" })}>
          {t("Schrijf iets")}
        </Button>
      </Heading>
      <div className="single">
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
      <p>{questText(t, quest, "desc")}</p>
      <div className="detailbox">
        {t("Behaald")} <b>+{quest.plus} pt</b> · {t("Niet behaald")}{" "}
        <b>−{quest.minus} pt</b>
      </div>
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
          <Field label={t("Wat heb je gedaan?")}>
            <textarea name="text" required maxLength={500} />
          </Field>
          <Button type="submit">{t("Inleveren")}</Button>
        </form>
      )}
    </Dialog>
  );
}
function PlayerDialog({ target, close }) {
  const { t } = useI18n();
  const { gm, player, game, navigate, setModal } = useGame();
  const own = !gm && player.id === target.id,
    j = target.journey;
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
          {j.typeScores ? typeCode(j.typeScores) + " · " : ""}
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
          <Button
            icon="plus"
            onClick={() => setModal({ kind: "addQuest", id: target.id })}
          >
            {t("Opdracht toewijzen")}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
function AddDialog({ kind, id, close }) {
  const { t } = useI18n();
  const { game, gm, player, mutate, setModal, navigate } = useGame();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const post = kind === "post",
    quest = kind === "addQuest";
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
    } else if (quest) {
      const result = await mutate("quest", {
        quest: {
          id: key,
          playerId: f.person,
          name: f.title,
          desc: f.desc,
          plus: Number(f.plus),
          minus: Number(f.minus),
        },
      });
      if (result) {
        navigate("quests");
        setModal({ kind: "quest", id: key });
      }
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
        navigate("players");
        setModal({ kind: "player", id: key });
      }
    }
    setBusy(false);
  }
  return (
    <Dialog
      label={post ? t("Kampvuur") : t("Spelleider")}
      title={
        post
          ? t("Schrijf iets")
          : quest
            ? t("Nieuwe opdracht")
            : t("Personage toevoegen")
      }
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
        ) : quest ? (
          <>
            <Field label={t("Voor wie?")}>
              <select
                name="person"
                required
                defaultValue={
                  id ||
                  game.players.find((p) => !p.npc)?.id ||
                  game.players[0]?.id
                }
              >
                {game.players.map((p) => (
                  <option value={p.id} key={p.id}>
                    {exampleText(t, examples.players, p, "name")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Titel")}>
              <input name="title" maxLength={60} required />
            </Field>
            <Field label={t("Wat gaat de speler doen?")}>
              <textarea name="desc" maxLength={450} required />
            </Field>
            <div className="pair">
              {[
                ["plus", "Pluspunten", 10],
                ["minus", "Minpunten", 2],
              ].map(([name, label, value]) => (
                <Field key={name} label={t(label)}>
                  <input
                    name={name}
                    type="number"
                    min="0"
                    max="999"
                    defaultValue={value}
                    required
                  />
                </Field>
              ))}
            </div>
          </>
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
          {post
            ? t("Plaatsen")
            : quest
              ? t("Opdracht toewijzen")
              : t("Personage toevoegen")}
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
