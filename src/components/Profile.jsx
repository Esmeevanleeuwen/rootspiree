import { useI18n } from "../i18n.jsx";
import { houses, traits } from "../content.js";
import { currentGoal, preference, typeCode } from "../game.js";
import { useGame } from "../store.jsx";
import { Avatar, Button, Dialog, Field, Heading } from "./ui.jsx";

function Results({ scores }) {
  const { t } = useI18n();
  const tied = scores.every((s) => s === 0);
  return (
    <section className="test-result">
      <span className="eyebrow">{t("Mijn persoonlijkheidstest")}</span>
      <h2>{tied ? t("In evenwicht") : typeCode(scores)}</h2>
      <p>
        {tied
          ? t(
              "Bij alle vier de voorkeuren wegen beide kanten even zwaar in je antwoorden.",
            )
          : scores
              .flatMap((s, i) => (s ? [t(traits[i].notes[preference(s)])] : []))
              .join(" ")}
      </p>
      {!tied && scores.includes(0) && (
        <p className="note">
          {t(
            "Een X betekent dat beide kanten even zwaar wegen in je antwoorden.",
          )}
        </p>
      )}
      <div className="trait-list">
        {traits.map((trait, i) => (
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
              <i style={{ left: 50 - (scores[i] / 12) * 50 + "%" }} />
            </div>
            <div className="trait-ends">
              {trait.labels.map((label, n) => (
                <span key={label}>
                  {trait.letters[n]} · {t(label)}
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
  const { t } = useI18n();
  const { player, startTest, navigate, setModal } = useGame();
  const j = player.journey;
  return (
    <>
      <Heading label={t("Spelersprofiel")} title={player.name} />
      <div className="profile-layout">
        <div className="profile-primary">
          {j.typeScores ? (
            <Results scores={j.typeScores} />
          ) : (
            <section className="test-result">
              <h2>{t("Hoe speel jij het liefst?")}</h2>
              <p>{t("Ontdek je voorkeuren met zestien korte stellingen.")}</p>
            </section>
          )}
          <div className="actions">
            {j.typeScores && (
              <Button icon="compass" onClick={() => navigate("home")}>
                {j.house ? t("Naar mijn spel") : t("Ontdek mijn huis")}
              </Button>
            )}
            <Button
              icon="pen"
              kind={j.typeScores ? "textbtn" : "primary"}
              onClick={() => startTest()}
            >
              {j.typeScores
                ? t("Test opnieuw doen")
                : t("Start de persoonlijkheidstest")}
            </Button>
          </div>
          <p className="note">
            {t(
              "Eigen speltest, geïnspireerd op MBTI. De uitslag beschrijft je antwoorden op dit moment.",
            )}
          </p>
        </div>
        <aside className="guide panel profile-aside">
          <div className="identity">
            <Avatar player={player} large />
            <div>
              <b>{player.name}</b>
              <span className="small">{t(player.role)}</span>
            </div>
          </div>
          {player.desc && <p>{player.desc}</p>}
          <Button
            icon="pen"
            kind="textbtn"
            onClick={() => setModal({ kind: "bio" })}
          >
            {t("Over mij bewerken")}
          </Button>
          <div className="profile-fact">
            <span>{t("Mijn huis")}</span>
            <b>{t(houses[j.house]?.name) || t("Nog te ontdekken")}</b>
          </div>
          <div className="profile-fact">
            <span>{t("Mijn huidige doel")}</span>
            <b>{currentGoal(j)?.text || t("Nog te kiezen")}</b>
          </div>
        </aside>
      </div>
    </>
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
