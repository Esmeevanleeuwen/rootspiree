import { useId } from "react";
import turntide from "../assets/keer.webp";
import copperspark from "../assets/koper.webp";
import nightglass from "../assets/nacht.webp";
import reedcircle from "../assets/riet.webp";
import valley from "../assets/vallei.webp";
import { houses } from "../content.js";
import { useI18n } from "../i18n.jsx";
import { landingCopy } from "../landing-copy.js";
import { QuestBrief } from "./QuestBrief.jsx";
import { Button, Icon } from "./ui.jsx";
import "../landing.css";

const landscape = {
  nacht: nightglass,
  koper: copperspark,
  riet: reedcircle,
  keer: turntide,
};
const stepIcons = ["compass", "flag", "chat"];

export function LandingNavigation({ language }) {
  const words = landingCopy[language];
  return (
    <nav className="landing-nav" aria-label={words.navLabel}>
      <a href="#how-it-works">{words.how}</a>
      <a href="#example-quest">{words.exampleNav}</a>
    </nav>
  );
}

export function LandingPage({ language, account, go, accountCopy }) {
  const words = landingCopy[language];
  const { t } = useI18n();
  const stepsHeading = useId();
  const exampleHeading = useId();
  const worldHeading = useId();
  const destination = account
    ? account.onboardingComplete
      ? "game"
      : "onboard"
    : "register";
  const startLabel = account
    ? account.onboardingComplete
      ? accountCopy.enter
      : accountCopy.resume
    : words.start;
  const start = () => go(destination);
  const sampleQuest = {
    desc: words.questAction,
    submissionPrompt: words.submission,
    completionCriteria: words.completion,
    plus: 10,
    minus: 2,
  };

  return (
    <>
      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-art" aria-hidden="true">
            <img
              src={reedcircle}
              alt=""
              width="768"
              height="512"
              fetchPriority="high"
            />
          </div>
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <h1 id="landing-title">
                {words.heroTitle} <em>{words.heroAccent}</em>
              </h1>
              <p>{words.heroDescription}</p>
              <div className="landing-actions">
                <Button kind="landing-primary" icon="compass" onClick={start}>
                  {startLabel}
                </Button>
                <a className="landing-hero-link" href="#how-it-works">
                  {words.how} <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-steps"
          id="how-it-works"
          aria-labelledby={stepsHeading}
        >
          <div className="landing-intro">
            <h2 id={stepsHeading}>{words.stepsTitle}</h2>
            <p>{words.stepsIntro}</p>
          </div>
          <ol className="landing-steps-list">
            {words.steps.map(({ title, description }, index) => (
              <li key={stepIcons[index]}>
                <span className="landing-step-icon">
                  <Icon name={stepIcons[index]} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="landing-example"
          id="example-quest"
          aria-labelledby={exampleHeading}
        >
          <div className="landing-section landing-example-layout">
            <div className="landing-intro">
              <h2 id={exampleHeading}>{words.exampleTitle}</h2>
              <p>{words.exampleIntro}</p>
            </div>
            <article className="landing-quest">
              <div className="landing-quest-label">
                <Icon name="flag" />
                <span>{words.exampleLabel}</span>
                <span className="landing-quest-skill">{words.questTag}</span>
              </div>
              <h3>{words.questTitle}</h3>
              <QuestBrief quest={sampleQuest} heading="h4" />
            </article>
          </div>
        </section>

        <section
          className="landing-section landing-world"
          aria-labelledby={worldHeading}
        >
          <div className="landing-intro">
            <h2 id={worldHeading}>{words.worldTitle}</h2>
            <p>{words.worldIntro}</p>
          </div>
          <ul className="landing-houses">
            {Object.entries(houses).map(([key, house]) => (
              <li key={key} style={{ "--house-tint": house.tint }}>
                <img
                  src={landscape[key]}
                  alt=""
                  width="768"
                  height="512"
                  loading="lazy"
                />
                <div className="landing-house-name">
                  <Icon name={house.icon} />
                  <div>
                    <h3>{t(house.name)}</h3>
                    <p>{t(house.place)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-join">
          <img src={valley} alt="" width="1760" height="510" loading="lazy" />
          <div className="landing-join-copy">
            <h2>{words.ctaTitle}</h2>
            <p>{account ? words.memberCtaBody : words.ctaBody}</p>
            <Button kind="landing-primary" icon="compass" onClick={start}>
              {startLabel}
            </Button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <strong>LevelUp World</strong>
        <p>{words.footerText}</p>
      </footer>
    </>
  );
}
