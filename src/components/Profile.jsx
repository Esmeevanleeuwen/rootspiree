import { useState } from "react";
import { agreement, houses, statements, traits } from "../content.js";
import {
  currentGoal,
  newId,
  preference,
  registerPlayer,
  scoreTest,
  typeCode,
} from "../game.js";
import { useGame } from "../store.jsx";
import { Avatar, Button, Dialog, Field, Heading } from "./ui.jsx";

export function PersonalityTest() {
  const {
    game,
    player,
    view: { test },
    changeTest,
    navigate,
    update,
  } = useGame();
  const [error, setError] = useState("");
  const perPage = 4,
    pages = Math.ceil(statements.length / perPage);
  const start = test.step * perPage;
  const finalPage = test.step === pages - 1;
  function submit(e) {
    e.preventDefault();
    setError("");
    if (test.step === -1) {
      const name = test.name.trim();
      if (
        !name ||
        game.players.some(
          (p) =>
            p.name.toLocaleLowerCase("nl") === name.toLocaleLowerCase("nl"),
        )
      ) {
        setError(
          name
            ? "Deze spelersnaam is al in gebruik."
            : "Vul een spelersnaam in.",
        );
        return;
      }
      changeTest({ step: 0, name });
      return;
    }
    if (!finalPage) {
      changeTest({ step: test.step + 1 });
      return;
    }
    const scores = scoreTest(test.answers);
    const id = test.fresh ? newId() : player.id;
    try {
      update((d) => {
        if (test.fresh) registerPlayer(d, test.name, test.bio, scores, id);
        else
          Object.assign(d.players.find((p) => p.id === id).journey, {
            typeScores: scores,
            prefs: scores.map(preference),
          });
      });
      navigate("profile", { playerId: id });
    } catch (err) {
      changeTest({ step: -1 });
      setError(err.message);
    }
  }
  if (test.step === -1)
    return (
      <>
        <Heading label="Nieuw spelersprofiel" title="Account aanmaken" />
        <section className="formpanel signup">
          <form onSubmit={submit}>
            <p>
              Kies je spelersnaam. Daarna ontdek je met zestien stellingen hoe
              je het liefst speelt.
            </p>
            <Field label="Spelersnaam">
              <input
                autoComplete="off"
                required
                maxLength={36}
                value={test.name}
                onChange={(e) => {
                  changeTest({ name: e.target.value });
                  setError("");
                }}
              />
            </Field>
            <Field label="Over mij (optioneel)">
              <textarea
                maxLength={300}
                value={test.bio}
                onChange={(e) => changeTest({ bio: e.target.value })}
                placeholder="Wat mogen andere spelers over je weten?"
              />
            </Field>
            <p className="note">
              Dit demoprofiel wordt bewaard in deze browser.
            </p>
            {error && <p role="alert">{error}</p>}
            <div className="actions">
              <Button type="submit">Naar de persoonlijkheidstest</Button>
              <Button kind="textbtn" onClick={() => navigate("home")}>
                Annuleren
              </Button>
            </div>
          </form>
        </section>
      </>
    );
  return (
    <>
      <Heading
        label={test.fresh ? "Account aanmaken" : "Mijn profiel"}
        title="Persoonlijkheidstest"
      />
      <form className="test-sheet" onSubmit={submit} key={test.step}>
        <div className="test-progress">
          <span>
            Deel {test.step + 1} van {pages}
          </span>
          <span>
            Stelling {start + 1}–{start + perPage} van {statements.length}
          </span>
        </div>
        <progress
          max={pages}
          value={test.step + 1}
          aria-label="Pagina van de persoonlijkheidstest"
        />
        <p>In hoeverre herken je jezelf? De middelste keuze is neutraal.</p>
        {statements
          .slice(start, start + perPage)
          .map(([, sentence], offset) => {
            const i = start + offset;
            return (
              <fieldset className="statement" key={i}>
                <legend>
                  {i + 1}. {sentence}
                </legend>
                <div className="rating">
                  {agreement.map((label, v) => (
                    <label key={label} title={label}>
                      <input
                        type="radio"
                        name={"s" + i}
                        required
                        aria-label={label}
                        checked={test.answers[i] === v}
                        onChange={() => {
                          const answers = [...test.answers];
                          answers[i] = v;
                          changeTest({ answers });
                        }}
                      />
                      <span aria-hidden="true" />
                    </label>
                  ))}
                </div>
                <div className="rating-caption" aria-hidden="true">
                  <span>Helemaal oneens</span>
                  <span>Helemaal eens</span>
                </div>
                <output className="answer-word" aria-live="polite">
                  {agreement[test.answers[i]]}
                </output>
              </fieldset>
            );
          })}
        <div className="actions">
          <Button type="submit">
            {finalPage
              ? test.fresh
                ? "Maak mijn profiel aan"
                : "Bewaar mijn uitslag"
              : "Volgende"}
          </Button>
          <Button
            kind="textbtn"
            onClick={() =>
              test.step === 0 && !test.fresh
                ? navigate("profile")
                : changeTest({ step: test.step - 1 })
            }
          >
            Terug
          </Button>
        </div>
      </form>
    </>
  );
}

function Results({ scores }) {
  const tied = scores.every((s) => s === 0);
  return (
    <section className="test-result">
      <span className="eyebrow">Mijn persoonlijkheidstest</span>
      <h2>{tied ? "In evenwicht" : typeCode(scores)}</h2>
      <p>
        {tied
          ? "Bij alle vier de voorkeuren wegen beide kanten even zwaar in je antwoorden."
          : scores
              .flatMap((s, i) => (s ? [traits[i].notes[preference(s)]] : []))
              .join(" ")}
      </p>
      {!tied && scores.includes(0) && (
        <p className="note">
          Een X betekent dat beide kanten even zwaar wegen in je antwoorden.
        </p>
      )}
      <div className="trait-list">
        {traits.map((t, i) => (
          <div className="trait" key={t.letters}>
            <div className="trait-heading">
              <b>{t.title}</b>
              <span>
                {scores[i] ? t.labels[preference(scores[i])] : "In evenwicht"}
              </span>
            </div>
            <div className="trait-track" aria-hidden="true">
              <i style={{ left: 50 - (scores[i] / 12) * 50 + "%" }} />
            </div>
            <div className="trait-ends">
              {t.labels.map((label, n) => (
                <span key={label}>
                  {t.letters[n]} · {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Profile() {
  const { player, startTest, navigate, setModal } = useGame();
  const j = player.journey;
  return (
    <>
      <Heading label="Spelersprofiel" title={player.name} />
      <div className="profile-layout">
        <div className="profile-primary">
          {j.typeScores ? (
            <Results scores={j.typeScores} />
          ) : (
            <section className="test-result">
              <h2>Hoe speel jij het liefst?</h2>
              <p>Ontdek je voorkeuren met zestien korte stellingen.</p>
            </section>
          )}
          <div className="actions">
            {j.typeScores && (
              <Button icon="compass" onClick={() => navigate("home")}>
                {j.house ? "Naar mijn spel" : "Ontdek mijn huis"}
              </Button>
            )}
            <Button
              icon="pen"
              kind={j.typeScores ? "textbtn" : "primary"}
              onClick={() => startTest()}
            >
              {j.typeScores
                ? "Test opnieuw doen"
                : "Start de persoonlijkheidstest"}
            </Button>
          </div>
          <p className="note">
            Eigen speltest, geïnspireerd op MBTI. De uitslag beschrijft je
            antwoorden op dit moment.
          </p>
        </div>
        <aside className="guide panel profile-aside">
          <div className="identity">
            <Avatar player={player} large />
            <div>
              <b>{player.name}</b>
              <span className="small">{player.role}</span>
            </div>
          </div>
          {player.desc && <p>{player.desc}</p>}
          <Button
            icon="pen"
            kind="textbtn"
            onClick={() => setModal({ kind: "bio" })}
          >
            Over mij bewerken
          </Button>
          <div className="profile-fact">
            <span>Mijn huis</span>
            <b>{houses[j.house]?.name || "Nog te ontdekken"}</b>
          </div>
          <div className="profile-fact">
            <span>Mijn huidige doel</span>
            <b>{currentGoal(j)?.text || "Nog te kiezen"}</b>
          </div>
        </aside>
      </div>
    </>
  );
}

export function BioDialog() {
  const { player, setModal, update } = useGame();
  return (
    <Dialog title="Over mij" label="Mijn profiel" close={() => setModal(null)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const bio = new FormData(e.currentTarget).get("bio").trim();
          update((d) => {
            d.players.find((p) => p.id === player.id).desc = bio;
          });
          setModal(null);
        }}
      >
        <Field label="Over mij">
          <textarea name="bio" defaultValue={player.desc} maxLength={300} />
        </Field>
        <p className="note">Deze tekst is zichtbaar op je spelersprofiel.</p>
        <Button type="submit">Opslaan</Button>
      </form>
    </Dialog>
  );
}
