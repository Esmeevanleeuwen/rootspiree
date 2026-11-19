import { houses } from "../content.js";
import { useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { Heading, Stamp } from "./ui.jsx";

export function WorldGuide({ title, intro }) {
  const { t } = useI18n();
  const { setModal, player } = useGame();
  return (
    <div className="world-guide">
      <Heading title={title} />
      <p className="world-intro">{intro}</p>
      <div className="houseGrid world-houses">
        {Object.entries(houses).map(([key, house]) => (
          <button
            className="houseTile world-house"
            key={key}
            type="button"
            onClick={() => setModal({ kind: "house", key })}
          >
            <span className={"houseArt tile-" + key} aria-hidden="true" />
            <span className="houseText">
              <Stamp house={key} />
              <span>
                <b>{t(house.name)}</b>
                <small>{t(house.place)}</small>
              </span>
            </span>
            <span className="world-house-description">{t(house.trait)}</span>
            {player.journey.house === key && (
              <span className="world-membership">{t("Mijn huis")}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
