import { useI18n } from "../i18n.jsx";
import {
  houses,
  quizScoreLimit,
  quizTraits,
  statements,
  traits,
} from "../content.js";
import { currentGoal, preference, typeCode } from "../game.js";
import { useGame } from "../store.jsx";
import { Avatar, Button, Dialog, Field } from "./ui.jsx";
import "../player-ui.css";

const personalAnswerCopy = {
  en: {
    heading: "Personal answers",
    visibility: "Only you can see these answers.",
    hobbies: "Hobbies",
    job: "Work or study",
    goals: "Life goals",
    interests: "Interests",
  },
  nl: {
    heading: "Persoonlijke antwoorden",
    visibility: "Alleen jij kunt deze antwoorden zien.",
    hobbies: "Hobby’s",
    job: "Werk of studie",
    goals: "Levensdoelen",
    interests: "Interesses",
  },
};
const answerFields = ["hobbies", "job", "goals", "interests"];

function Results({ scores }) {
  const { t } = useI18n();
  const typeScores = scores.slice(0, traits.length);
  const tied = typeScores.every((s) => s === 0);
  return (
    <div className="player-quiz-result">
      <h3>{tied ? t("In evenwicht") : typeCode(scores)}</h3>
      <p>
        {tied
          ? t(
              "Bij alle vier de voorkeuren wegen beide kanten even zwaar in je antwoorden.",
            )
          : typeScores
              .flatMap((s, i) => (s ? [t(traits[i].notes[preference(s)])] : []))
              .join(" ")}
      </p>
      {!tied && typeScores.includes(0) && (
        <p className="note">
          {t(
            "Een X betekent dat beide kanten even zwaar wegen in je antwoorden.",
          )}
        </p>
      )}
      <div className="trait-list">
        {quizTraits.slice(0, scores.length).map((trait, i) => (
          <div className="trait" key={trait.letters}>
            <div className="trait-heading">
              <b>{t(trait.title)}</b>
              <span>
                {scores[i]
                  ? t(trait.labels[preference(scores[i])])
                  : t("In evenwicht")}
              </span>
            </div>
            <div className="trait-track" aria-hidden="true">
              <i
                style={{ left: 50 - (scores[i] / quizScoreLimit) * 50 + "%" }}
              />
            </div>
            <div className="trait-ends">
              {trait.labels.map((label, n) => (
                <span key={label}>
                  {i < traits.length && trait.letters[n] + " · "}
                  {t(label)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Profile({ personalAnswers }) {
  const { t, language } = useI18n();
  const { player, startTest, navigate, setModal } = useGame();
  const j = player.journey;
  const fields = answerFields.filter((field) => personalAnswers?.[field]);
  const copy = personalAnswerCopy[language];

  return (
    <div className="player-profile">
      <header className="player-page-heading">
        <h1>{t("Mijn profiel")}</h1>
      </header>
      <section
        className="player-surface player-profile-card"
        aria-labelledby="profile-name"
      >
        <div className="player-profile-identity">
          <Avatar player={player} large />
          <div>
            <h2 id="profile-name">{player.name}</h2>
            <p className="player-muted">{t(player.role)}</p>
          </div>
        </div>
        {player.desc && <p className="player-bio">{player.desc}</p>}
        <div className="actions">
          <Button
            icon="pen"
            kind="textbtn"
            onClick={() => setModal({ kind: "bio" })}
          >
            {t("Over mij bewerken")}
          </Button>
          {j.typeScores && !j.house && (
            <Button
              icon="compass"
              kind="textbtn"
              onClick={() => navigate("home")}
            >
              {t("Ontdek mijn huis")}
            </Button>
          )}
        </div>
        <dl className="player-profile-facts">
          <div>
            <dt>{t("Mijn huis")}</dt>
            <dd>{t(houses[j.house]?.name) || t("Nog te ontdekken")}</dd>
          </div>
          <div>
            <dt>{t("Mijn huidige doel")}</dt>
            <dd>{currentGoal(j)?.text || t("Nog te kiezen")}</dd>
          </div>
        </dl>
      </section>

      <div
        className={
          fields.length
            ? "player-profile-sections has-answers"
            : "player-profile-sections"
        }
      >
        <section
          className="player-surface player-quiz"
          aria-labelledby="profile-quiz"
        >
          <div className="player-section-heading">
            <h2 id="profile-quiz">{t("Mijn persoonlijkheidstest")}</h2>
            <Button
              icon="pen"
              kind={j.typeScores ? "textbtn" : "primary"}
              onClick={startTest}
            >
              {j.typeScores
                ? t("Test opnieuw doen")
                : t("Start de persoonlijkheidstest")}
            </Button>
          </div>
          {j.typeScores ? (
            <Results scores={j.typeScores} />
          ) : (
            <p>
              {t("Ontdek je voorkeuren met {count} korte stellingen.", {
                count: statements.length,
              })}
            </p>
          )}
          <p className="player-muted player-quiz-note">
            {t(
              "Eigen speltest, geïnspireerd op MBTI. De uitslag beschrijft je antwoorden op dit moment.",
            )}
          </p>
        </section>
        {fields.length > 0 && (
          <section
            className="player-surface player-answers"
            aria-labelledby="personal-answers"
          >
            <h2 id="personal-answers">{copy.heading}</h2>
            <p className="player-muted">{copy.visibility}</p>
            <dl>
              {fields.map((field) => (
                <div key={field}>
                  <dt>{copy[field]}</dt>
                  <dd>{personalAnswers[field]}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}

export function BioDialog() {
  const { t } = useI18n();
  const { player, setModal, mutate } = useGame();
  return (
    <Dialog
      title={t("Over mij")}
      label={t("Mijn profiel")}
      close={() => setModal(null)}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const bio = new FormData(e.currentTarget).get("bio").trim();
          if (await mutate("bio", { bio })) setModal(null);
        }}
      >
        <Field label={t("Over mij")}>
          <textarea name="bio" defaultValue={player.desc} maxLength={300} />
        </Field>
        <p className="note">
          {t("Deze tekst is zichtbaar op je spelersprofiel.")}
        </p>
        <Button type="submit">{t("Opslaan")}</Button>
      </form>
    </Dialog>
  );
}
