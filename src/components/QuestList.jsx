import { examples } from "../examples.js";
import { exampleText, questText, useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { Icon } from "./ui.jsx";

export function Status({ value }) {
  const { t } = useI18n();
  return (
    <span
      className={
        "status " +
        (value === "Ingeleverd"
          ? "wait"
          : value === "Niet behaald"
            ? "bad"
            : "")
      }
    >
      {t(value)}
    </span>
  );
}

export function QuestList({ items }) {
  const { t } = useI18n();
  const { game, setModal } = useGame();
  return items.length ? (
    items.map((q) => (
      <button
        className="item"
        key={q.id}
        onClick={() => setModal({ kind: "quest", id: q.id })}
      >
        <span className={"tile " + q.style}>
          <Icon name={q.icon} />
        </span>
        <span className="body">
          <strong>{questText(t, q, "name")}</strong>
          <span className="meta">
            {exampleText(
              t,
              examples.players,
              game.players.find((p) => p.id === q.playerId),
              "name",
            )}{" "}
            · +{q.plus} / −{q.minus} pt
          </span>
        </span>
        <span className="badgewrap">
          <Status value={q.state} />
        </span>
      </button>
    ))
  ) : (
    <div className="empty">{t("Geen opdrachten in deze selectie.")}</div>
  );
}
