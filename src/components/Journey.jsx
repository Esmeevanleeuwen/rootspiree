import { exerciseStepText, useI18n } from "../i18n.jsx";
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
  const { t } = useI18n();
  const { player, stage, setModal } = useGame();
  return (
    <>
      <Plate
        large
        label={t("Aankomst in de Luistervallei")}
        title={t("De haven onder de mist")}
        description={t(
          "Eén nacht per jaar trekt de zee zich terug en verschijnt er een vergeten haven. Vanavond ligt er een roeispaan voor jou klaar, {name}.",
          { name: player.name },
        )}
      >
        <div className="actions">
          <Button
            kind="pale"
            onClick={() => stage("story", { index: 0, answers: [] })}
          >
            {t("Stap aan boord")}
          </Button>
        </div>
      </Plate>
      <div className="minihead voyageHead">
        <h2>{t("De vier huizen")}</h2>
        <span className="small">{t("Jouw keuzes wijzen de weg")}</span>
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
                <b>{t(h.name)}</b>
                <small>{t(h.verb)}</small>
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="journeyNote">
        {t(
          "Vijf keuzes brengen je naar een huis. Daarna geef je je eigen doel een plek in de wereld.",
        )}
      </p>
    </>
  );
}
function StoryQuestion({ deep }) {
  const { t } = useI18n();
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
          {deep ? t("De post van morgen") : t("De laagwaterreis")}
        </span>
      </div>
      <div className="questionCopy">
        <div className="progressmeta">
          <span>
            {t(
              deep
                ? "Brief {current} van {total}"
                : "Keuze {current} van {total}",
              { current: index + 1, total: list.length },
            )}
          </span>
          <Button kind="textbtn" onClick={back}>
            {t("Terug")}
          </Button>
        </div>
        <div className="segments" aria-hidden="true">
          {list.map((_, n) => (
            <i key={n} className={n <= index ? "filled" : ""} />
          ))}
        </div>
        <h1>{t(deep ? scene[1] : scene.title)}</h1>
        <p>{t(deep ? scene[2] : scene.story)}</p>
        <div className="options">
          {options.map(([value, text]) => (
            <button
              className="choice"
              key={value}
              aria-pressed={current[index] === value}
              onClick={() => answer(value)}
            >
              <i />
              {t(text)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
function HouseResult({ tie }) {
  const { t } = useI18n();
  const { player, stage } = useGame();
  const j = player.journey,
    h = houses[j.house];
  const back = () => stage("story", { index: scenes.length - 1 });
  if (tie)
    return (
      <>
        <Heading
          label={t("De laagwaterreis")}
          title={t("Twee oevers trekken aan je")}
        />
        <p>
          {t(
            "Je antwoorden passen even goed bij deze huizen. Van welke plek wil jij je thuis maken?",
          )}
        </p>
        <div className="tieGrid">
          {houseCandidates(j.answers).map((k) => (
            <button
              className="tieOpt"
              key={k}
              onClick={() => stage("reveal", { house: k })}
            >
              <span className={"houseArt tile-" + k} />
              <b>{t(houses[k].name)}</b>
              <span>{t(houses[k].motto)}</span>
            </button>
          ))}
        </div>
        <Button kind="textbtn" onClick={back}>
          {t("Terug naar mijn laatste keuze")}
        </Button>
      </>
    );
  const clueIndex = j.answers.findIndex((a) => a === j.house);
  return (
    <>
      <Plate
        house={j.house}
        large
        label={t("Jouw huis")}
        title={t(h.name)}
        description={t(h.motto)}
      />
      <div className="revealBox">
        <div>
          <Stamp house={j.house} />
        </div>
        <div>
          <h2>
            {t("Welkom in {place}", {
              place: t(h.place).replace(/^(De|Het|The) /, (article) =>
                article.toLowerCase(),
              ),
            })}
          </h2>
          <p>
            {t(h.trait)} {t(h.ritual)}
          </p>
          {clueIndex >= 0 && (
            <>
              <p className="note">{t("Een keuze die hierop wees")}</p>
              <blockquote>
                {t(scenes[clueIndex].opts.find(([k]) => k === j.house)[1])}
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
                ? t("Terug naar mijn kamer")
                : t("Geef je doel een plek")}
            </Button>
            <Button kind="textbtn" onClick={back}>
              {t("Bekijk mijn laatste keuze")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
function GoalForm() {
  const { t } = useI18n();
  const { player, editJourney, stage } = useGame();
  const j = player.journey,
    old = j.goals.find((g) => g.id === j.editGoal);
  const [kind, setKind] = useState(old?.kind || "voice");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const goal = { id: old?.id || newId(), kind, shared: data.has("shared") };
    for (const k of ["text", "situation", "action", "sign"])
      goal[k] = data.get(k).trim();
    if (!goal.text || !goal.action || !goal.sign) {
      setError("Vul je doel, je eerste actie en een teken van vooruitgang in.");
      return;
    }
    setError("");
    setBusy(true);
    await editJourney((next) => {
      const found = next.goals.find((g) => g.id === goal.id);
      if (found) Object.assign(found, goal);
      else next.goals.push(goal);
      next.activeGoal = goal.id;
      next.editGoal = null;
      next.stage =
        !next.prefs && next.goals.length === 1 && !old ? "letterIntro" : "room";
    });
    setBusy(false);
  }
  return (
    <>
      <Heading
        label={t("Mijn veldboek")}
        title={old ? t("Doel bijstellen") : t("Wat wil jij oefenen?")}
      />
      <section className="formpanel">
        <form onSubmit={submit}>
          <Field label={t("Welke richting past hierbij?")}>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(goalKinds).map(([k, v]) => (
                <option key={k} value={k}>
                  {t(v.label)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Mijn doel, in mijn eigen woorden")}>
            <textarea
              name="text"
              required
              maxLength={220}
              defaultValue={old?.text}
              placeholder={t(goalKinds[kind].example)}
            />
          </Field>
          <Field label={t("Wanneer of waar wil je dit oefenen?")}>
            <input
              name="situation"
              maxLength={150}
              defaultValue={old?.situation}
              placeholder={t("Bijvoorbeeld tijdens het volgende teamoverleg")}
            />
          </Field>
          <Field label={t("Wat wordt je eerste kleine actie?")}>
            <input
              name="action"
              required
              maxLength={170}
              defaultValue={old?.action}
              placeholder={t(
                "Bijvoorbeeld één vraag stellen voordat ik advies geef",
              )}
            />
          </Field>
          <Field label={t("Ik merk vooruitgang als…")}>
            <input
              name="sign"
              required
              maxLength={170}
              defaultValue={old?.sign}
              placeholder={t("Bijvoorbeeld ik de ander heb laten uitpraten")}
            />
          </Field>
          <label className="sharing">
            <input type="checkbox" name="shared" defaultChecked={old?.shared} />{" "}
            {t("Laat de spelleider dit doel en mijn eerste stap zien")}
          </label>
          {error && <p role="alert">{t(error)}</p>}
          <div className="actions">
            <Button type="submit" disabled={busy}>
              {t("Bewaar mijn doel")}
            </Button>
            <Button
              kind="textbtn"
              onClick={() => stage(j.goals.length ? "goals" : "reveal")}
            >
              {j.goals.length ? t("Annuleren") : t("Terug")}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
function Goals() {
  const { t } = useI18n();
  const { player, stage } = useGame(),
    j = player.journey;
  return (
    <>
      <Heading label={t("Mijn veldboek")} title={t("Mijn doelen")}>
        <Button onClick={() => stage("goal", { editGoal: null })}>
          {t("Nieuw doel")}
        </Button>
      </Heading>
      <div className="single">
        {j.goals.map((g) => (
          <article key={g.id} className="guide panel">
            {g.id === j.activeGoal && (
              <span className="eyebrow">{t("Huidig doel")}</span>
            )}
            <h2>{g.text}</h2>
            <p>{g.action}</p>
            <p className="note">
              {t("Ik merk vooruitgang als {sign}.", { sign: g.sign })}
            </p>
            <div className="actions">
              {g.id !== j.activeGoal && (
                <Button
                  kind="secondary"
                  onClick={() => stage("room", { activeGoal: g.id })}
                >
                  {t("Hieraan werken")}
                </Button>
              )}
              <Button
                kind="textbtn"
                onClick={() => stage("goal", { editGoal: g.id })}
              >
                {t("Bijstellen")}
              </Button>
            </div>
          </article>
        ))}
        <Button kind="textbtn" onClick={() => stage("room")}>
          {t("Terug naar mijn kamer")}
        </Button>
      </div>
    </>
  );
}
function LettersIntro() {
  const { t } = useI18n();
  const { stage } = useGame();
  return (
    <>
      <Plate
        large
        house="nacht"
        label={t("Tweede verhaal · Acht brieven")}
        title={t("De post van morgen")}
        description={t(
          "Aan de overkant van de haven staat een brievenbus die post uit morgen ontvangt. Deze week ben jij de bezorger. Hoe pak jij het aan?",
        )}
      >
        <Button
          kind="pale"
          onClick={() =>
            stage("letters", { letterIndex: 0, letterAnswers: [] })
          }
        >
          {t("Open de eerste brief")}
        </Button>
      </Plate>
      <section className="guide panel">
        <h2>{t("Jouw speelstijl")}</h2>
        <p>
          {t(
            "Acht keuzes geven je vier voorkeuren voor je opdrachten. Je kunt ze zelf bijstellen.",
          )}
        </p>
        <Button kind="textbtn" onClick={() => stage("room")}>
          {t("Ga naar mijn kamer")}
        </Button>
      </section>
    </>
  );
}
function Tune() {
  const { t } = useI18n();
  const { player, stage } = useGame();
  return (
    <>
      <Heading
        label={t("Mijn speelstijl")}
        title={t("Herken jij jezelf hierin?")}
      />
      <section className="formpanel">
        <p>
          {t(
            "Kies per regel de aanpak die je voor jouw opdrachten wilt gebruiken. Ook een combinatie kan.",
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            stage("room", { prefs: axes.map((a) => Number(data.get(a.key))) });
          }}
        >
          {axes.map((a, i) => (
            <Field label={t(a.title)} key={a.key}>
              <select name={a.key} defaultValue={player.journey.prefs[i]}>
                {[0, 1, 2].map((n) => (
                  <option key={n} value={n}>
                    {t(prefLabel(a, n))}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Button type="submit">{t("Gebruik deze speelstijl")}</Button>
        </form>
      </section>
    </>
  );
}
function Room() {
  const { t } = useI18n();
  const { player, game, navigate, setModal, stage } = useGame(),
    j = player.journey,
    h = houses[j.house],
    g = currentGoal(j);
  return (
    <>
      <Plate
        house={j.house}
        label={t("Huis {house} · {name}", {
          house: t(h.name),
          name: player.name,
        })}
        title={t(h.place)}
        description={t(h.motto)}
      >
        <Button
          kind="pale"
          onClick={() => setModal({ kind: "house", key: j.house })}
        >
          {t("Bekijk mijn huis")}
        </Button>
      </Plate>
      <div className="cols">
        <section>
          <Section title={t("Mijn volgende stap")} />
          {g ? (
            <article className="guide panel focusCard">
              <span className="eyebrow">{t(goalKinds[g.kind].label)}</span>
              <h2>{g.text}</h2>
              <p>{g.action}</p>
              {j.prefs && (
                <p className="note">
                  {t(
                    j.prefs[0] === 2 ? axes[0].blend : axes[0].tips[j.prefs[0]],
                  )}
                </p>
              )}
              <div className="actions">
                <Button onClick={() => setModal({ kind: "exercise" })}>
                  {t("Bekijk mijn oefening")}
                </Button>
                <Button kind="textbtn" onClick={() => stage("goals")}>
                  {t("Mijn doelen")}
                </Button>
              </div>
            </article>
          ) : (
            <Button onClick={() => stage("goal", { editGoal: null })}>
              {t("Stel een doel in")}
            </Button>
          )}
          <Section title={t("Mijn opdrachten")}>
            <Button kind="textbtn" onClick={() => navigate("quests")}>
              {t("Alle opdrachten")}
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
          <Section title={t("Mijn speelstijl")} />
          <div className="guide panel">
            {j.prefs ? (
              <>
                {axes.map((a, i) => (
                  <div key={a.key} className="prefline">
                    <span>{t(a.title)}</span>
                    <b>{t(prefLabel(a, j.prefs[i]))}</b>
                  </div>
                ))}
                <div className="actions">
                  <Button kind="textbtn" onClick={() => stage("tune")}>
                    {t("Bijstellen")}
                  </Button>
                  <Button kind="textbtn" onClick={() => stage("letterIntro")}>
                    {j.letterAnswers.length
                      ? t("Brieven opnieuw lezen")
                      : t("Ontdek de brieven")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3>{t("De post van morgen")}</h3>
                <p>
                  {t(
                    "Ontdek in acht brieven hoe je het liefst aan een opdracht begint.",
                  )}
                </p>
                <Button kind="textbtn" onClick={() => stage("letterIntro")}>
                  {t("Open de brievenbus")}
                </Button>
              </>
            )}
          </div>
          <Section title={t("Mijn huis")} />
          <div className="panel guide">
            <div className="identity">
              <Stamp house={j.house} />
              <div>
                <b>{t(h.name)}</b>
                <span className="small">{t(h.verb)}</span>
              </div>
            </div>
            <p>{t(h.memento)}</p>
            <Button kind="textbtn" onClick={() => setModal({ kind: "retake" })}>
              {t("De laagwaterreis herbeleven")}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

export function JourneyDialog() {
  const { t } = useI18n();
  const { modal, setModal, player, stage, game, mutate } = useGame(),
    close = () => setModal(null);
  if (modal.kind === "house") {
    const h = houses[modal.key];
    return (
      <Dialog label={t("Huisgids")} title={t(h.name)} close={close}>
        <div className={"houseBanner tile-" + modal.key} />
        <p>
          <b>{t(h.place)}</b>
          <br />
          {t(h.motto)}
        </p>
        <p>{t(h.trait)}</p>
        <div className="detailbox">{t(h.memento)}</div>
      </Dialog>
    );
  }
  if (modal.kind === "retake")
    return (
      <Dialog
        label={t("Laagwaterreis")}
        title={t("Nog eens uitvaren?")}
        close={close}
      >
        <p>
          {t(
            "Je kunt opnieuw kiezen. Je doelen en opdrachten neem je mee naar het huis waar je uitkomt.",
          )}
        </p>
        <Button onClick={() => stage("story", { answers: [], index: 0 })}>
          {t("Begin de reis opnieuw")}
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
  async function accept() {
    const response = await mutate("exercise", { id: newId(), goalId: g.id });
    if (response) setModal({ kind: "quest", id: response.questId });
  }

  return (
    <Dialog
      label={t("Oefening uit {place}", {
        place: t(houses[j.house].place).replace(/^(De|Het|The) /, (article) =>
          article.toLowerCase(),
        ),
      })}
      title={t(kind.title)}
      close={close}
    >
      <div className="detailbox">
        <b>{g.text}</b>
        <br />
        {g.action}
      </div>
      <p>
        <b>{t("Opdracht")}</b>
        <br />
        {t(kind.step)}
      </p>
      <ol className="stepList">
        {steps
          .filter((_, i) => i !== 1)
          .map((s, i) => (
            <li key={i}>{exerciseStepText(t, s, i + (i === 0 ? 0 : 1))}</li>
          ))}
      </ol>
      <p className="note">{t(houses[j.house].ritual)}</p>
      <p className="small">
        {t(
          "De groep ziet de titel en de score. Je persoonlijke uitwerking zie je in je eigen veldboek.",
        )}
      </p>
      <Button onClick={accept}>
        {existing(game)
          ? t("Open mijn opdracht")
          : t("Neem op in mijn opdrachten")}
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
