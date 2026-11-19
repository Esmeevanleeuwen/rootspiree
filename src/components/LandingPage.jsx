import { useId } from "react";
import turntide from "../assets/keer.webp";
import copperspark from "../assets/koper.webp";
import nightglass from "../assets/nacht.webp";
import reedcircle from "../assets/riet.webp";
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
        <section
          className="landing-section landing-hero"
          aria-labelledby="landing-title"
        >
          <div className="landing-hero-copy">
            <h1 id="landing-title">
              {words.heroTitle} <em>{words.heroAccent}</em>
            </h1>
            <p>{words.heroDescription}</p>
            <div className="landing-actions">
              <Button kind="landing-primary" onClick={start}>
                {startLabel}
              </Button>
              <a className="landing-hero-link" href="#how-it-works">
                {words.how}
              </a>
            </div>
          </div>
          <img
            className="landing-hero-art"
            src={reedcircle}
            alt=""
            width="768"
            height="512"
            fetchPriority="high"
          />
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
            {words.steps.map(({ title, description }) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="landing-section landing-example-layout"
          id="example-quest"
          aria-labelledby={exampleHeading}
        >
          <div className="landing-intro">
            <h2 id={exampleHeading}>{words.exampleTitle}</h2>
            <p>{words.exampleIntro}</p>
          </div>
          <article className="landing-quest">
            <div className="landing-quest-label">
              <Icon name="flag" />
              <span>{words.exampleLabel}</span>
            </div>
            <h3>{words.questTitle}</h3>
            <QuestBrief quest={sampleQuest} heading="h4" />
          </article>
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
              <li key={key}>
                <img
                  src={landscape[key]}
                  alt=""
                  width="768"
                  height="512"
                  loading="lazy"
                />
                <div className="landing-house-name">
                  <h3>{t(house.name)}</h3>
                  <p>{t(house.place)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-section landing-join">
          <div className="landing-join-copy">
            <h2>{words.ctaTitle}</h2>
            <p>{account ? words.memberCtaBody : words.ctaBody}</p>
          </div>
          <Button kind="landing-primary" onClick={start}>
            {startLabel}
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <strong>LevelUp World</strong>
        <p>{words.footerText}</p>
      </footer>
    </>
  );
}
