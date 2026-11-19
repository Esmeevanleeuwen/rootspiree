import { useState } from "react";
import { useGame } from "../store.jsx";
import { emptyJourney, newId, points, typeCode } from "../game.js";
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
      {value}
    </span>
  );
}
export function QuestList({ items }) {
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
          <strong>{q.name}</strong>
          <span className="meta">
            {game.players.find((p) => p.id === q.playerId).name} · +{q.plus} / −
            {q.minus} pt
          </span>
        </span>
        <span className="badgewrap">
          <Status value={q.state} />
        </span>
      </button>
    ))
  ) : (
    <div className="empty">Geen opdrachten in deze selectie.</div>
  );
}
function Roster({ items }) {
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
              <b>{p.name}</b>
              <span className="small">{p.npc ? "NPC · Evil" : p.role}</span>
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
  const { game, navigate, setModal } = useGame();
  const pending = game.quests.filter((q) => q.state === "Ingeleverd");
  return (
    <>
      <Heading label="Spelleider" title="Speloverzicht">
        <Button icon="plus" onClick={() => setModal({ kind: "addQuest" })}>
          Nieuwe opdracht
        </Button>
      </Heading>
      <section className="hero">
        <span className="tag">
          <Icon name="book" /> Hoofdstuk I
        </span>
        <h2 className="chapter">De Luistervallei</h2>
        <p>Oefen samen met luisteren, doorvragen en ruimte geven.</p>
        <Button
          kind="pale"
          icon="book"
          onClick={() => setModal({ kind: "chapter" })}
        >
          Bekijk het hoofdstuk
        </Button>
      </section>
      <div className="cols">
        <section>
          <Section title="Te beoordelen">
            <Button kind="textbtn" onClick={() => navigate("quests")}>
              Alle opdrachten
            </Button>
          </Section>
          {pending.length ? (
            <QuestList items={pending.slice(0, 3)} />
          ) : (
            <p className="empty">Je hebt alle inzendingen beoordeeld.</p>
          )}
        </section>
        <section>
          <Section title="Ranglijst">
            <Button kind="textbtn" onClick={() => navigate("players")}>
              Alle spelers
            </Button>
          </Section>
          <Roster items={ranked(game).slice(0, 3)} />
        </section>
      </div>
    </>
  );
}
export function QuestPage() {
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
      <Heading label="Spelwereld" title="Opdrachten">
        {gm && (
          <Button icon="plus" onClick={() => setModal({ kind: "addQuest" })}>
            Nieuwe opdracht
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
  const { game, gm, setModal } = useGame();
  const [filter, setFilter] = useState("Alles");
  return (
    <>
      <Heading label="Spelwereld" title="Spelers">
        {gm && (
          <Button icon="plus" onClick={() => setModal({ kind: "addPlayer" })}>
            Speler toevoegen
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
  const { game, gm, player, update, setModal } = useGame();
  const voter = gm ? "gm" : player.id;
  return (
    <>
      <Heading label="Community" title="Kampvuur">
        <Button icon="pen" onClick={() => setModal({ kind: "post" })}>
          Schrijf iets
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
                  <b>{author.name}</b>
                  <span className="small">{author.role}</span>
                </span>
              </div>
              <p>{post.msg}</p>
              <button
                className="like"
                aria-label={"Waardering geven, " + likes + " waarderingen"}
                aria-pressed={!!post.votes[voter]}
                onClick={() =>
                  update((d) => {
                    const votes = d.posts.find((p) => p.id === post.id).votes;
                    votes[voter] = !votes[voter];
                  })
                }
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
  const { game, player, gm, update, setModal } = useGame();
  const owner = game.players.find((p) => p.id === quest.playerId);
  const own = !gm && player.id === owner.id;
  function save(e) {
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
    update((d) => {
      const q = d.quests.find((item) => item.id === quest.id);
      if (review && q.state === "Ingeleverd")
        Object.assign(q, {
          state: passed ? "Behaald" : "Niet behaald",
          feedback: text,
        });
      else if ((own || (gm && owner.npc)) && q.state === "Open")
        Object.assign(q, { state: "Ingeleverd", evidence: text });
    });
    if (review) setModal({ kind: "reviewed", id: quest.id });
  }
  return (
    <Dialog label="Persoonlijke opdracht" title={quest.name} close={close}>
      <div className="identity">
        <Avatar player={owner} />
        <span>{owner.name}</span>
        <Status value={quest.state} />
      </div>
      <p>{quest.desc}</p>
      <div className="detailbox">
        Behaald <b>+{quest.plus} pt</b> · Niet behaald <b>−{quest.minus} pt</b>
      </div>
      {own && quest.privateSteps && (
        <>
          <h3>Mijn aanpak</h3>
          <ol className="stepList">
            {quest.privateSteps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </>
      )}
      {(gm || own) && quest.evidence && (
        <>
          <h3>Inzending van {owner.name}</h3>
          <blockquote>{quest.evidence}</blockquote>
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
              Behaald · +{quest.plus} pt
            </Button>
            <Button kind="warn" type="submit" value="fail">
              Niet behaald · −{quest.minus} pt
            </Button>
          </div>
        </form>
      )}
      {quest.state === "Open" && (own || (gm && owner.npc)) && (
        <form onSubmit={save}>
          <Field label="Wat heb je gedaan?">
            <textarea name="text" required maxLength={500} />
          </Field>
          <Button type="submit">Inleveren</Button>
        </form>
      )}
    </Dialog>
  );
}
function PlayerDialog({ target, close }) {
  const { gm, player, game, navigate, setModal } = useGame();
  const own = !gm && player.id === target.id,
    j = target.journey;
  return (
    <Dialog label="Spelersprofiel" title={target.name} close={close}>
      <div className="identity">
        <Avatar player={target} large />
        <span>
          <b>{target.role}</b>
          <span className="meta">
            {target.npc ? "NPC · Evil" : "Speler · Goede kant"}
          </span>
        </span>
        <span className="score">
          {points(game, target)} <small>pt</small>
        </span>
      </div>
      <p>{target.desc}</p>
      {j.house && (
        <p>
          <b>Huis {houses[j.house].name}</b> · {houses[j.house].place}
        </p>
      )}
      {own && (
        <Button kind="textbtn" onClick={() => navigate("profile")}>
          {j.typeScores ? typeCode(j.typeScores) + " · " : ""}Bekijk mijn
          profiel
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
      {gm && !target.npc && (
        <Button
          kind="textbtn"
          onClick={() =>
            navigate("home", { mode: "player", playerId: target.id })
          }
        >
          Speel als {target.name}
        </Button>
      )}
      <div className="foot">
        <h3>Persoonlijke opdrachten</h3>
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
            Opdracht toewijzen
          </Button>
        )}
      </div>
    </Dialog>
  );
}
function AddDialog({ kind, id, close }) {
  const { game, gm, player, update, setModal, navigate } = useGame();
  const [error, setError] = useState("");
  const post = kind === "post",
    quest = kind === "addQuest";
  if (!gm && !post) return null;
  function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of Object.keys(f)) f[key] = f[key].trim();
    if (Object.values(f).some((v) => !v)) {
      setError("Vul alle velden in.");
      return;
    }
    const key = newId();
    if (post) {
      update((d) =>
        d.posts.unshift({
          id: key,
          playerId: gm ? "gm" : player.id,
          msg: f.msg,
          likes: 0,
          votes: {},
        }),
      );
      navigate("feed");
    } else if (quest) {
      update((d) =>
        d.quests.push({
          id: key,
          playerId: f.person,
          name: f.title,
          desc: f.desc,
          plus: +f.plus,
          minus: +f.minus,
          state: "Open",
          icon: "flag",
          style: "",
        }),
      );
      navigate("quests");
      setModal({ kind: "quest", id: key });
    } else {
      if (
        game.players.some(
          (p) =>
            p.name.toLocaleLowerCase("nl") === f.name.toLocaleLowerCase("nl"),
        )
      ) {
        setError("Deze spelersnaam is al in gebruik.");
        return;
      }
      update((d) =>
        d.players.push({
          id: key,
          name: f.name,
          role: f.role,
          desc: f.desc,
          av: f.av,
          base: 0,
          npc: f.type === "npc",
          journey: emptyJourney(),
        }),
      );
      navigate("players");
      setModal({ kind: "player", id: key });
    }
  }
  return (
    <Dialog
      label={post ? "Kampvuur" : "Spelleider"}
      title={
        post ? "Schrijf iets" : quest ? "Nieuwe opdracht" : "Speler toevoegen"
      }
      close={close}
    >
      <form onSubmit={submit}>
        {post ? (
          <Field label={"Bericht als " + (gm ? "Spelleider" : player.name)}>
            <textarea required name="msg" maxLength={600} />
          </Field>
        ) : quest ? (
          <>
            <Field label="Voor wie?">
              <select name="person" defaultValue={id || player.id}>
                {game.players.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titel">
              <input name="title" maxLength={60} required />
            </Field>
            <Field label="Wat gaat de speler doen?">
              <textarea name="desc" maxLength={450} required />
            </Field>
            <div className="pair">
              {[
                ["plus", "Pluspunten", 10],
                ["minus", "Minpunten", 2],
              ].map(([name, label, value]) => (
                <Field key={name} label={label}>
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
            <Field label="Type">
              <select name="type">
                <option value="real">Echte speler · Goede kant</option>
                <option value="npc">Fictieve NPC · Evil</option>
              </select>
            </Field>
            <Field label="Naam">
              <input name="name" required maxLength={36} />
            </Field>
            <Field label="Rol">
              <input name="role" required maxLength={45} />
            </Field>
            <Field label="Beschrijving">
              <textarea name="desc" required maxLength={300} />
            </Field>
            <fieldset className="avatar-choice">
              <legend>Avatar</legend>
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
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <Button type="submit">
          {post
            ? "Plaatsen"
            : quest
              ? "Opdracht toewijzen"
              : "Speler toevoegen"}
        </Button>
      </form>
    </Dialog>
  );
}
export function CommunityDialog() {
  const { game, modal, setModal } = useGame();
  const close = () => setModal(null);
  const quest = game.quests.find((q) => q.id === modal.id);
  if (modal.kind === "reviewed") {
    const owner = game.players.find((p) => p.id === quest.playerId);
    return (
      <Dialog label="Beoordeling vastgelegd" title={quest.state} close={close}>
        <p className="delta">
          {quest.state === "Behaald" ? "+" + quest.plus : "−" + quest.minus} pt
        </p>
        <p>
          {owner.name} heeft nu <b>{points(game, owner)} punten</b>.
        </p>
        <Button onClick={close}>Terug naar overzicht</Button>
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
      <Dialog label="Hoofdstuk I" title="De Luistervallei" close={close}>
        <p>
          In dit hoofdstuk oefenen Nova en Mika met aandacht voor elkaar. Elke
          opdracht geeft ze één klein gesprek om mee te beginnen.
        </p>
        <QuestList items={game.quests.slice(0, 3)} />
      </Dialog>
    );
  return <AddDialog {...modal} close={close} />;
}
