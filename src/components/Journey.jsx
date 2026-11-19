import { useState } from "react";
import { useGame } from "../store.jsx";
import { axes, goalKinds, houses, letters, scenes } from "../content.js";
import {
  currentGoal,
  exerciseSteps,
  houseCandidates,
  letterPreferences,
  newId,
  prefLabel,
} from "../game.js";
import {
  Button,
  Dialog,
  Field,
  Heading,
  Icon,
  Plate,
  Section,
  Stamp,
} from "./ui.jsx";
import { QuestList } from "./Community.jsx";

function Welcome() {
  const { player, stage, setModal, startTest } = useGame();
  return (
    <>
      <Plate
        large
        label="Aankomst in de Luistervallei"
        title="De haven onder de mist"
        description={
          "Eén nacht per jaar trekt de zee zich terug en verschijnt er een vergeten haven. Vanavond ligt er een roeispaan voor jou klaar, " +
          player.name +
          "."
        }
      >
        <div className="actions">
          {!player.registered && (
            <Button kind="pale" icon="plus" onClick={() => startTest(true)}>
              Account aanmaken
            </Button>
          )}
          <Button
            kind={player.registered ? "pale" : "entry-link"}
            onClick={() => stage("story", { index: 0, answers: [] })}
          >
            {player.registered ? "Stap aan boord" : "Speel als " + player.name}
          </Button>
        </div>
      </Plate>
      <div className="minihead voyageHead">
        <h2>De vier huizen</h2>
        <span className="small">Jouw keuzes wijzen de weg</span>
      </div>
      <div className="houseGrid">
        {Object.entries(houses).map(([key, h]) => (
          <button
            className="houseTile"
            key={key}
            onClick={() => setModal({ kind: "house", key })}
          >
            <span className={"houseArt tile-" + key} />
            <span className="houseText">
              <Stamp house={key} />
              <span>
                <b>{h.name}</b>
                <small>{h.verb}</small>
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="journeyNote">
        Vijf keuzes brengen je naar een huis. Daarna geef je je eigen doel een
        plek in de wereld.
      </p>
    </>
  );
}
function StoryQuestion({ deep }) {
  const { player, stage } = useGame();
  const j = player.journey;
  const list = deep ? letters : scenes,
    index = deep ? j.letterIndex : j.index;
  const scene = list[index],
    current = deep ? j.letterAnswers : j.answers;
  const options = deep
    ? [
        [scene[5], scene[3]],
        [1 - scene[5], scene[4]],
      ]
    : scene.opts;
  const indexKey = deep ? "letterIndex" : "index",
    answersKey = deep ? "letterAnswers" : "answers";
  function answer(value) {
    const answers = [...current];
    answers[index] = value;
    const patch = { [answersKey]: answers };
    if (index + 1 < list.length)
      stage(j.stage, { ...patch, [indexKey]: index + 1 });
    else if (deep)
      stage("tune", { ...patch, prefs: letterPreferences(answers) });
    else {
      const top = houseCandidates(answers);
      if (top.length === 1) stage("reveal", { ...patch, house: top[0] });
      else stage("tie", patch);
    }
  }
  function back() {
    if (index > 0) stage(j.stage, { [indexKey]: index - 1 });
    else
      stage(
        deep ? "letterIntro" : j.house && j.goals.length ? "room" : "welcome",
      );
  }
  return (
    <section className="question">
      <div className={"storyPic " + (deep ? "letterPic" : "scenePic")}>
        <span>
          <Icon name={deep ? "pen" : "compass"} />
          {deep ? "De post van morgen" : "De laagwaterreis"}
        </span>
      </div>
      <div className="questionCopy">
        <div className="progressmeta">
          <span>
            {deep ? "Brief" : "Keuze"} {index + 1} van {list.length}
          </span>
          <Button kind="textbtn" onClick={back}>
            Terug
          </Button>
        </div>
        <div className="segments" aria-hidden="true">
          {list.map((_, n) => (
            <i key={n} className={n <= index ? "filled" : ""} />
          ))}
        </div>
        <h1>{deep ? scene[1] : scene.title}</h1>
        <p>{deep ? scene[2] : scene.story}</p>
        <div className="options">
          {options.map(([value, text]) => (
            <button
              className="choice"
              key={value}
              aria-pressed={current[index] === value}
              onClick={() => answer(value)}
            >
              <i />
              {text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
function HouseResult({ tie }) {
  const { player, stage } = useGame();
  const j = player.journey,
    h = houses[j.house];
  const back = () => stage("story", { index: scenes.length - 1 });
  if (tie)
    return (
      <>
        <Heading label="De laagwaterreis" title="Twee oevers trekken aan je" />
        <p>
          Je antwoorden passen even goed bij deze huizen. Van welke plek wil jij
          je thuis maken?
        </p>
        <div className="tieGrid">
          {houseCandidates(j.answers).map((k) => (
            <button
              className="tieOpt"
              key={k}
              onClick={() => stage("reveal", { house: k })}
            >
              <span className={"houseArt tile-" + k} />
              <b>{houses[k].name}</b>
              <span>{houses[k].motto}</span>
            </button>
          ))}
        </div>
        <Button kind="textbtn" onClick={back}>
          Terug naar mijn laatste keuze
        </Button>
      </>
    );
  const clueIndex = j.answers.findIndex((a) => a === j.house);
  return (
    <>
      <Plate
        house={j.house}
        large
        label="Jouw huis"
        title={h.name}
        description={h.motto}
      />
      <div className="revealBox">
        <div>
          <Stamp house={j.house} />
        </div>
        <div>
          <h2>
            Welkom in {h.place.replace(/^(De|Het) /, (s) => s.toLowerCase())}
          </h2>
          <p>
            {h.trait} {h.ritual}
          </p>
          {clueIndex >= 0 && (
            <>
              <p className="note">Een keuze die hierop wees</p>
              <blockquote>
                {scenes[clueIndex].opts.find(([k]) => k === j.house)[1]}
              </blockquote>
            </>
          )}
          <div className="actions">
            <Button
              onClick={() =>
                stage(j.goals.length ? "room" : "goal", { editGoal: null })
              }
            >
              {j.goals.length
                ? "Terug naar mijn kamer"
                : "Geef je doel een plek"}
            </Button>
            <Button kind="textbtn" onClick={back}>
              Bekijk mijn laatste keuze
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
function GoalForm() {
  const { player, editJourney, stage } = useGame();
  const j = player.journey,
    old = j.goals.find((g) => g.id === j.editGoal);
  const [kind, setKind] = useState(old?.kind || "voice");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const goal = { id: old?.id || newId(), kind, shared: data.has("shared") };
    for (const k of ["text", "situation", "action", "sign"])
      goal[k] = data.get(k).trim();
    if (!goal.text || !goal.action || !goal.sign) {
      setError("Vul je doel, je eerste actie en een teken van vooruitgang in.");
      return;
    }
    editJourney((next) => {
      const found = next.goals.find((g) => g.id === goal.id);
      if (found) Object.assign(found, goal);
      else next.goals.push(goal);
      next.activeGoal = goal.id;
      next.editGoal = null;
      next.stage =
        !next.prefs && next.goals.length === 1 && !old ? "letterIntro" : "room";
    });
  }
  return (
    <>
      <Heading
        label="Mijn veldboek"
        title={old ? "Doel bijstellen" : "Wat wil jij oefenen?"}
      />
      <section className="formpanel">
        <form onSubmit={submit}>
          <Field label="Welke richting past hierbij?">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(goalKinds).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mijn doel, in mijn eigen woorden">
            <textarea
              name="text"
              required
              maxLength={220}
              defaultValue={old?.text}
              placeholder={goalKinds[kind].example}
            />
          </Field>
          <Field label="Wanneer of waar wil je dit oefenen?">
            <input
              name="situation"
              maxLength={150}
              defaultValue={old?.situation}
              placeholder="Bijvoorbeeld tijdens het volgende teamoverleg"
            />
          </Field>
          <Field label="Wat wordt je eerste kleine actie?">
            <input
              name="action"
              required
              maxLength={170}
              defaultValue={old?.action}
              placeholder="Bijvoorbeeld één vraag stellen voordat ik advies geef"
            />
          </Field>
          <Field label="Ik merk vooruitgang als…">
            <input
              name="sign"
              required
              maxLength={170}
              defaultValue={old?.sign}
              placeholder="Bijvoorbeeld ik de ander heb laten uitpraten"
            />
          </Field>
          <label className="sharing">
            <input type="checkbox" name="shared" defaultChecked={old?.shared} />{" "}
            Laat de spelleider dit doel en mijn eerste stap zien
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <Button type="submit">Bewaar mijn doel</Button>
            <Button
              kind="textbtn"
              onClick={() => stage(j.goals.length ? "goals" : "reveal")}
            >
              {j.goals.length ? "Annuleren" : "Terug"}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
function Goals() {
  const { player, stage } = useGame(),
    j = player.journey;
  return (
    <>
      <Heading label="Mijn veldboek" title="Mijn doelen">
        <Button onClick={() => stage("goal", { editGoal: null })}>
          Nieuw doel
        </Button>
      </Heading>
      <div className="single">
        {j.goals.map((g) => (
          <article key={g.id} className="guide panel">
            {g.id === j.activeGoal && (
              <span className="eyebrow">Huidig doel</span>
            )}
            <h2>{g.text}</h2>
            <p>{g.action}</p>
            <p className="note">Ik merk vooruitgang als {g.sign}.</p>
            <div className="actions">
              {g.id !== j.activeGoal && (
                <Button
                  kind="secondary"
                  onClick={() => stage("room", { activeGoal: g.id })}
                >
                  Hieraan werken
                </Button>
              )}
              <Button
                kind="textbtn"
                onClick={() => stage("goal", { editGoal: g.id })}
              >
                Bijstellen
              </Button>
            </div>
          </article>
        ))}
        <Button kind="textbtn" onClick={() => stage("room")}>
          Terug naar mijn kamer
        </Button>
      </div>
    </>
  );
}
function LettersIntro() {
  const { stage } = useGame();
  return (
    <>
      <Plate
        large
        house="nacht"
        label="Tweede verhaal · Acht brieven"
        title="De post van morgen"
        description="Aan de overkant van de haven staat een brievenbus die post uit morgen ontvangt. Deze week ben jij de bezorger. Hoe pak jij het aan?"
      >
        <Button
          kind="pale"
          onClick={() =>
            stage("letters", { letterIndex: 0, letterAnswers: [] })
          }
        >
          Open de eerste brief
        </Button>
      </Plate>
      <section className="guide panel">
        <h2>Jouw speelstijl</h2>
        <p>
          Acht keuzes geven je vier voorkeuren voor je opdrachten. Je kunt ze
          zelf bijstellen.
        </p>
        <Button kind="textbtn" onClick={() => stage("room")}>
          Ga naar mijn kamer
        </Button>
      </section>
    </>
  );
}
function Tune() {
  const { player, stage } = useGame();
  return (
    <>
      <Heading label="Mijn speelstijl" title="Herken jij jezelf hierin?" />
      <section className="formpanel">
        <p>
          Kies per regel de aanpak die je voor jouw opdrachten wilt gebruiken.
          Ook een combinatie kan.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            stage("room", { prefs: axes.map((a) => Number(data.get(a.key))) });
          }}
        >
          {axes.map((a, i) => (
            <Field label={a.title} key={a.key}>
              <select name={a.key} defaultValue={player.journey.prefs[i]}>
                {[0, 1, 2].map((n) => (
                  <option key={n} value={n}>
                    {prefLabel(a, n)}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Button type="submit">Gebruik deze speelstijl</Button>
        </form>
      </section>
    </>
  );
}
function Room() {
  const { player, game, navigate, setModal, stage } = useGame(),
    j = player.journey,
    h = houses[j.house],
    g = currentGoal(j);
  return (
    <>
      <Plate
        house={j.house}
        label={"Huis " + h.name + " · " + player.name}
        title={h.place}
        description={h.motto}
      >
        <Button
          kind="pale"
          onClick={() => setModal({ kind: "house", key: j.house })}
        >
          Bekijk mijn huis
        </Button>
      </Plate>
      <div className="cols">
        <section>
          <Section title="Mijn volgende stap" />
          {g ? (
            <article className="guide panel focusCard">
              <span className="eyebrow">{goalKinds[g.kind].label}</span>
              <h2>{g.text}</h2>
              <p>{g.action}</p>
              {j.prefs && (
                <p className="note">
                  {j.prefs[0] === 2 ? axes[0].blend : axes[0].tips[j.prefs[0]]}
                </p>
              )}
              <div className="actions">
                <Button onClick={() => setModal({ kind: "exercise" })}>
                  Bekijk mijn oefening
                </Button>
                <Button kind="textbtn" onClick={() => stage("goals")}>
                  Mijn doelen
                </Button>
              </div>
            </article>
          ) : (
            <Button onClick={() => stage("goal", { editGoal: null })}>
              Stel een doel in
            </Button>
          )}
          <Section title="Mijn opdrachten">
            <Button kind="textbtn" onClick={() => navigate("quests")}>
              Alle opdrachten
            </Button>
          </Section>
          <QuestList
            items={game.quests
              .filter((q) => q.playerId === player.id)
              .slice(-3)
              .reverse()}
          />
        </section>
        <section>
          <Section title="Mijn speelstijl" />
          <div className="guide panel">
            {j.prefs ? (
              <>
                {axes.map((a, i) => (
                  <div key={a.key} className="prefline">
                    <span>{a.title}</span>
                    <b>{prefLabel(a, j.prefs[i])}</b>
                  </div>
                ))}
                <div className="actions">
                  <Button kind="textbtn" onClick={() => stage("tune")}>
                    Bijstellen
                  </Button>
                  <Button kind="textbtn" onClick={() => stage("letterIntro")}>
                    {j.letterAnswers.length
                      ? "Brieven opnieuw lezen"
                      : "Ontdek de brieven"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3>De post van morgen</h3>
                <p>
                  Ontdek in acht brieven hoe je het liefst aan een opdracht
                  begint.
                </p>
                <Button kind="textbtn" onClick={() => stage("letterIntro")}>
                  Open de brievenbus
                </Button>
              </>
            )}
          </div>
          <Section title="Mijn huis" />
          <div className="panel guide">
            <div className="identity">
              <Stamp house={j.house} />
              <div>
                <b>{h.name}</b>
                <span className="small">{h.verb}</span>
              </div>
            </div>
            <p>{h.memento}</p>
            <Button kind="textbtn" onClick={() => setModal({ kind: "retake" })}>
              De laagwaterreis herbeleven
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

export function JourneyDialog() {
  const { modal, setModal, player, stage, game, update } = useGame(),
    close = () => setModal(null);
  if (modal.kind === "house") {
    const h = houses[modal.key];
    return (
      <Dialog label="Huisgids" title={h.name} close={close}>
        <div className={"houseBanner tile-" + modal.key} />
        <p>
          <b>{h.place}</b>
          <br />
          {h.motto}
        </p>
        <p>{h.trait}</p>
        <div className="detailbox">{h.memento}</div>
      </Dialog>
    );
  }
  if (modal.kind === "retake")
    return (
      <Dialog label="Laagwaterreis" title="Nog eens uitvaren?" close={close}>
        <p>
          Je kunt opnieuw kiezen. Je doelen en opdrachten neem je mee naar het
          huis waar je uitkomt.
        </p>
        <Button onClick={() => stage("story", { answers: [], index: 0 })}>
          Begin de reis opnieuw
        </Button>
      </Dialog>
    );
  const j = player.journey,
    g = currentGoal(j),
    kind = goalKinds[g.kind],
    steps = exerciseSteps(j, g);
  const existing = (d) =>
    d.quests.find(
      (q) =>
        q.playerId === player.id && q.goalId === g.id && q.state === "Open",
    );
  function accept() {
    let id;
    update((d) => {
      const open = existing(d);
      if (open) {
        id = open.id;
        return;
      }
      id = newId();
      d.quests.push({
        id,
        playerId: player.id,
        goalId: g.id,
        privateSteps: steps,
        name: kind.title,
        desc: kind.step,
        state: "Open",
        plus: 10,
        minus: 2,
        icon: "flag",
        style: "",
      });
    });
    setModal({ kind: "quest", id });
  }
  return (
    <Dialog
      label={"Oefening uit " + houses[j.house].place.toLowerCase()}
      title={kind.title}
      close={close}
    >
      <div className="detailbox">
        <b>{g.text}</b>
        <br />
        {g.action}
      </div>
      <p>
        <b>Opdracht</b>
        <br />
        {kind.step}
      </p>
      <ol className="stepList">
        {steps
          .filter((_, i) => i !== 1)
          .map((s, i) => (
            <li key={i}>{s}</li>
          ))}
      </ol>
      <p className="note">{houses[j.house].ritual}</p>
      <p className="small">
        De groep ziet de titel en de score. Je persoonlijke uitwerking zie je in
        je eigen veldboek.
      </p>
      <Button onClick={accept}>
        {existing(game) ? "Open mijn opdracht" : "Neem op in mijn opdrachten"}
      </Button>
    </Dialog>
  );
}
export function Journey() {
  const { player } = useGame();
  switch (player.journey.stage) {
    case "story":
      return <StoryQuestion deep={false} />;
    case "tie":
      return <HouseResult tie />;
    case "reveal":
      return <HouseResult />;
    case "goal":
      return <GoalForm />;
    case "goals":
      return <Goals />;
    case "letterIntro":
      return <LettersIntro />;
    case "letters":
      return <StoryQuestion deep />;
    case "tune":
      return <Tune />;
    case "room":
      return <Room />;
    default:
      return <Welcome />;
  }
}
