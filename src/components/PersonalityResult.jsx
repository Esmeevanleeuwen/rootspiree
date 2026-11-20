import { useEffect, useRef, useState } from "react";
import { quizScoreLimit, traits as typeTraits } from "../content.js";
import { useI18n } from "../i18n.jsx";
import { personalityDetails } from "../personality-details.js";
import { reportCopy } from "../personality-report-copy.js";
import { personalityPortraits } from "../personality-portraits.js";
import {
  describePersonality,
  officialTypeUrl,
  personalityProfiles,
  profileFamilies,
} from "../personality-reports.js";
import "../personality-report.css";

const dimensions = ["energy", "mind", "nature", "tactics", "identity"];
const topics = [
  "romance",
  "friends",
  "parenting",
  "careers",
  "workplace",
  "conclusion",
];
const sectionId = (id) => "personality-" + id;

function jumpTo(id) {
  const target = document.getElementById(sectionId(id));
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: "start" });
}

function TraitBreakdown({ scores, words }) {
  const { language } = useI18n();
  const formatPercent = new Intl.NumberFormat(language, { style: "percent" });
  return (
    <section
      className="personality-panel"
      aria-labelledby={sectionId("traitsNav")}
    >
      <h2 id={sectionId("traitsNav")} tabIndex={-1}>
        {words.traitsNav}
      </h2>
      <p className="personality-muted">{words.traitsIntro}</p>
      <dl className="personality-scales">
        {dimensions.slice(0, scores.length).map((dimension, index) => {
          const score = scores[index];
          const position = (1 - score / quizScoreLimit) * 50;
          const poles = words.poles.slice(index * 2, index * 2 + 2);
          const strength = formatPercent.format(
            0.5 + Math.abs(score) / (2 * quizScoreLimit),
          );
          return (
            <div
              className={"personality-scale scale-" + dimension}
              key={dimension}
            >
              <div className="personality-scale-title">
                <dt>{words[dimension]}</dt>
                <dd>
                  {strength}{" "}
                  {score === 0 ? words.balanced : poles[Number(score < 0)]}
                </dd>
              </div>
              <div className="personality-scale-track" aria-hidden="true">
                <span style={{ left: position + "%" }} />
              </div>
              <div className="personality-scale-poles" aria-hidden="true">
                <span>{poles[0]}</span>
                <span>{poles[1]}</span>
              </div>
            </div>
          );
        })}
      </dl>
      {scores.length < dimensions.length && (
        <p className="personality-muted">{words.noIdentity}</p>
      )}
    </section>
  );
}

function ReportSection({ id, title, children }) {
  return (
    <section className="personality-panel" aria-labelledby={sectionId(id)}>
      <h2 id={sectionId(id)} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PersonalityResult({
  scores,
  onContinue,
  onProfile,
  onRetake,
}) {
  const { language } = useI18n();
  const words = reportCopy[language];
  const heading = useRef(null);
  const [previewCode, setPreviewCode] = useState("");
  const result = describePersonality(scores);
  const profileCode = previewCode || result.code;
  const profile = personalityProfiles[profileCode]?.[language];
  const details = personalityDetails[profileCode]?.[language];
  const officialUrl = officialTypeUrl(profileCode, language);
  const family = Object.keys(profileFamilies).find((key) =>
    profileFamilies[key].includes(profileCode),
  );
  const nav = profile
    ? [
        "intro",
        ...(!previewCode ? ["traitsNav"] : []),
        "strengthsChallenges",
        ...topics,
      ]
    : ["traitsNav", "matches"];
  const displayedCode = previewCode || result.displayCode;
  const image = personalityPortraits[profileCode];
  const traits = [...profileCode]
    .map((letter, index) => {
      const offset = typeTraits[index].letters.indexOf(letter);
      return offset === -1 ? null : words.poles[index * 2 + offset];
    })
    .filter(Boolean);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  function selectType(code) {
    setPreviewCode(code === result.code ? "" : code);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    });
  }

  return (
    <div className="personality-report" data-family={family}>
      <header className={"personality-hero" + (image ? " has-art" : "")}>
        <div className="personality-hero-copy">
          <p className="eyebrow">
            {previewCode ? words.preview : words.result}
          </p>
          <p className="personality-code">
            {displayedCode}
            {family && <span>{words.families[family]}</span>}
          </p>
          <h1 tabIndex={-1} ref={heading}>
            {profile?.name || words.blend}
          </h1>
          <p className="personality-summary">
            {profile?.summary || words.blendSummary}
          </p>
          {traits.length > 0 && (
            <ul className="personality-tags" aria-label={words.traitsNav}>
              {traits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          )}
          <div className="personality-actions">
            {previewCode ? (
              <button
                className="primary"
                type="button"
                onClick={() => selectType("")}
              >
                {words.myResult}
              </button>
            ) : (
              <button className="primary" type="button" onClick={onContinue}>
                {words.continue}
              </button>
            )}
            {profile && (
              <button
                className="secondary"
                type="button"
                onClick={() => jumpTo("identity")}
              >
                {words.compare(profileCode)}
              </button>
            )}
          </div>
        </div>
        {image && <img className="personality-portrait" src={image} alt="" />}
      </header>

      <div className="personality-layout">
        <aside className="personality-sidebar">
          <nav className="personality-nav" aria-label={words.typeNav}>
            <h2>{words.typeNav}</h2>
            {nav.map((id) => (
              <button key={id} type="button" onClick={() => jumpTo(id)}>
                {words[id]}
              </button>
            ))}
          </nav>
          <div className="personality-picker">
            <label htmlFor="personality-type-picker">{words.explore}</label>
            <select
              id="personality-type-picker"
              value={previewCode}
              onChange={(event) => selectType(event.target.value)}
            >
              <option value="">
                {previewCode ? words.myResult : words.choose}
              </option>
              {Object.entries(profileFamilies).map(([group, codes]) => (
                <optgroup key={group} label={words.families[group]}>
                  {codes.map((code) => (
                    <option key={code} value={code}>
                      {code} · {personalityProfiles[code][language].name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {officialUrl && (
              <a
                className="personality-source-link"
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
              >
                {words.externalReport(profileCode)}{" "}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </aside>

        <div className="personality-body">
          {profile && (
            <ReportSection id="intro" title={words.intro}>
              <p>{profile.introduction}</p>
              <p>{details.introduction}</p>
            </ReportSection>
          )}
          {!previewCode && <TraitBreakdown scores={scores} words={words} />}
          {profile ? (
            <>
              <ReportSection id="identity" title={words.compare(profileCode)}>
                <p>{words.compareIntro}</p>
                <div className="personality-columns">
                  <div>
                    <h3>{words.assertive}</h3>
                    <p>{words.assertiveDetails}</p>
                    <p>{details.assertive}</p>
                  </div>
                  <div>
                    <h3>{words.turbulent}</h3>
                    <p>{words.turbulentDetails}</p>
                    <p>{details.turbulent}</p>
                  </div>
                </div>
              </ReportSection>
              <ReportSection
                id="strengthsChallenges"
                title={words.strengthsChallenges}
              >
                <div className="personality-columns">
                  {["strengths", "challenges"].map((key) => (
                    <div key={key}>
                      <h3>{words[key]}</h3>
                      <ul>
                        {profile[key].map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                        <li>{details[key]}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              </ReportSection>
              {topics.map((id) => (
                <ReportSection key={id} id={id} title={words[id]}>
                  <p>{profile[id]}</p>
                  <p>{details[id]}</p>
                </ReportSection>
              ))}
            </>
          ) : (
            <ReportSection id="matches" title={words.matches}>
              <div className="personality-matches">
                {result.matches.map((code) => (
                  <button
                    className="secondary"
                    key={code}
                    type="button"
                    onClick={() => selectType(code)}
                  >
                    {code} · {personalityProfiles[code][language].name}
                  </button>
                ))}
              </div>
            </ReportSection>
          )}
          <p className="personality-muted">{words.note}</p>
          <div className="personality-actions">
            <button className="primary" type="button" onClick={onContinue}>
              {words.continue}
            </button>
            <button className="secondary" type="button" onClick={onProfile}>
              {words.profile}
            </button>
            <button className="textbtn" type="button" onClick={onRetake}>
              {words.retake}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
