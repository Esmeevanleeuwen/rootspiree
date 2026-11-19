import { useId } from "react";
import panorama from "../assets/aether-world.webp";
import { aetherRegions } from "../aether-regions.js";
import { useI18n } from "../i18n.jsx";
import { Icon } from "./ui.jsx";
import "../landing.css";

const labels = {
  en: { region: "Region", quest: "Growth quest" },
  nl: { region: "Gebied", quest: "Groeimissie" },
};

export function AetherHero({ id, eyebrow, title, description, children }) {
  const heading = useId();
  return (
    <section className="aether-hero" id={id} aria-labelledby={heading}>
      <img
        className="aether-hero-art"
        src={panorama}
        alt=""
        width={1200}
        height={686}
        fetchPriority="high"
      />
      <div className="aether-hero-copy">
        <p className="aether-kicker">
          <span aria-hidden="true">✦</span> {eyebrow}
        </p>
        <h1 id={heading}>{title}</h1>
        <p className="aether-hero-description">{description}</p>
        <div className="aether-hero-actions">{children}</div>
      </div>
    </section>
  );
}

export function AetherRegions({
  id,
  title,
  description,
  action,
  onSelect,
  regionHref,
}) {
  const heading = useId();
  const { language } = useI18n();
  const words = labels[language];
  return (
    <section className="aether-regions" id={id} aria-labelledby={heading}>
      <div className="aether-section-heading">
        <div>
          <h2 id={heading}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      <ul className="aether-region-grid">
        {aetherRegions.map((region, index) => {
          const { title, skill } = region[language];
          const content = (
            <>
              <span
                className={`aether-region-image aether-region-image-${region.key}`}
              >
                <span className="aether-region-label">
                  {words.region} {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="aether-region-body">
                <span className="aether-region-text">
                  <strong>{title}</strong>
                  <small>
                    {skill} · {words.quest}
                  </small>
                </span>
                <span className="aether-region-arrow" aria-hidden="true">
                  <Icon name="chev" />
                </span>
              </span>
            </>
          );
          return (
            <li key={region.key}>
              {regionHref ? (
                <a className="aether-region-card" href={regionHref(region)}>
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  className="aether-region-card"
                  onClick={() => onSelect(region.house, region.key)}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
