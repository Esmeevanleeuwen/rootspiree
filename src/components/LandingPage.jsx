import { useId } from "react";
import { landingCopy } from "../landing-copy.js";
import { AetherHero, AetherRegions } from "./AetherShowcase.jsx";
import { QuestBrief } from "./QuestBrief.jsx";
import { Button, Icon } from "./ui.jsx";

export function LandingNavigation({ language }) {
  const words = landingCopy[language];
  const links = [
    ["#welcome", words.home],
    ["#world-preview", words.worldNav],
    ["#how-it-works", words.how],
    ["#example-quest", words.exampleNav],
  ];
  const current = window.location.hash || "#welcome";
  return (
    <nav className="landing-nav" aria-label={words.navLabel}>
      {links.map(([href, label]) => (
        <a
          key={href}
          href={href}
          aria-current={current === href ? "location" : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function LandingPage({ language, account, go, accountCopy }) {
  const words = landingCopy[language];
  const stepsHeading = useId();
  const exampleHeading = useId();
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
        <AetherHero
          id="welcome"
          eyebrow={words.heroEyebrow}
          title={words.heroTitle}
          description={words.heroDescription}
        >
          <Button onClick={start}>{startLabel}</Button>
          <a className="secondary" href="#how-it-works">
            {words.how}
          </a>
        </AetherHero>

        <AetherRegions
          id="world-preview"
          title={words.worldTitle}
          description={words.worldIntro}
          action={
            <a className="secondary" href="#/play/world">
              {words.openMap}
            </a>
          }
          regionHref={({ key }) => `#/play/world?region=${key}`}
        />

        <div className="landing-detail-grid">
          <section
            className="landing-panel"
            id="how-it-works"
            aria-labelledby={stepsHeading}
          >
            <h2 id={stepsHeading}>{words.stepsTitle}</h2>
            <p className="landing-details-intro">{words.stepsIntro}</p>
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
            className="landing-panel landing-quest"
            id="example-quest"
            aria-labelledby={exampleHeading}
          >
            <h2 id={exampleHeading}>{words.exampleTitle}</h2>
            <p className="landing-details-intro">{words.exampleIntro}</p>
            <article className="landing-quest-example">
              <div className="landing-quest-label">
                <Icon name="flag" />
                <span>{words.exampleLabel}</span>
              </div>
              <h3>{words.questTitle}</h3>
              <QuestBrief quest={sampleQuest} heading="h4" />
            </article>
          </section>
        </div>

        <section className="landing-join">
          <div>
            <h2>{words.ctaTitle}</h2>
            <p>{account ? words.memberCtaBody : words.ctaBody}</p>
          </div>
          <Button onClick={start}>{startLabel}</Button>
        </section>
      </main>
      <footer className="landing-footer">
        <p>LevelUp World · Aether Edition · {words.footerText}</p>
      </footer>
    </>
  );
}
