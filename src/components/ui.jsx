import { useI18n } from "../i18n.jsx";
import { useEffect, useRef } from "react";
import { useGame } from "../store.jsx";
import { paths } from "../icons.js";
import { houses } from "../content.js";

export function Icon({ name }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
export function Button({
  children,
  onClick,
  kind = "primary",
  icon,
  type = "button",
  ...props
}) {
  return (
    <button type={type} className={kind} onClick={onClick} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
export function Heading({ label, title, children }) {
  return (
    <header className="heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export function Section({ title, children }) {
  return (
    <div className="sectionhead">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Avatar({ player, large = false }) {
  return (
    <span className={"avatar " + player.av + (large ? " bigavatar" : "")}>
      <Icon name={player.av} />
    </span>
  );
}
export function Stamp({ house }) {
  return (
    <span className="sigil" aria-hidden="true">
      <Icon name={houses[house].icon} />
    </span>
  );
}
export function Plate({
  house = "port",
  label,
  title,
  description,
  large,
  children,
}) {
  return (
    <section className={"plate plate-" + house + (large ? " opening" : "")}>
      <div className="platecopy">
        <span className="tag">
          <Icon name={houses[house]?.icon || "compass"} />
          {label}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
export function Dialog({ label, title, close, children }) {
  const { warning } = useGame() || {};
  const { t } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialogTitle"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialogin">
        <div className="minihead">
          <span className="eyebrow">{label}</span>
          <Button kind="x" aria-label={t("Sluiten")} icon="x" onClick={close} />
        </div>
        <h2 id="dialogTitle">{title}</h2>
        {warning && (
          <p role="alert">{t("Deze wijziging kon niet worden opgeslagen.")}</p>
        )}
        {children}
      </div>
    </dialog>
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
export function Chips({ items, value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="filter">
      {items.map((item) => (
        <button
          key={item}
          aria-pressed={value === item}
          className={"chip " + (value === item ? "on" : "")}
          onClick={() => onChange(item)}
        >
          {t(item)}
        </button>
      ))}
    </div>
  );
}
