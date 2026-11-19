import { useI18n } from "../i18n.jsx";
import { useId, useLayoutEffect, useRef } from "react";
import { useGame } from "../store.jsx";
import { paths } from "../icons.js";
import { houses } from "../content.js";

export function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 48">
      <path
        fill="var(--color-surface-raised)"
        d="M21 1 40 12v24L21 47 2 36V12z"
      />
      <g fill="none" stroke="var(--color-accent)" strokeWidth="1.4">
        <path d="m21 7 13 8v17l-13 8-13-8V15z" />
        <path d="m10 30 8-14 5 9 3-5 7 12M16 32l5-9 5 9" />
      </g>
    </svg>
  );
}
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
        {label && <span className="eyebrow">{label}</span>}
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
  const titleId = useId();
  const dismissing = useRef(false);
  const backdropPress = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    const document = dialog.ownerDocument;
    const opener = document.activeElement;
    dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      if (document.querySelector("dialog[open]")) return;
      if (
        opener instanceof HTMLElement &&
        opener !== document.body &&
        opener.isConnected &&
        !opener.closest("dialog:not([open])")
      ) {
        opener.focus({ preventScroll: true });
        return;
      }

      // The opener may have been replaced when a dialog also changed the page.
      requestAnimationFrame(() => {
        if (
          document.activeElement !== document.body ||
          document.querySelector("dialog[open]")
        )
          return;
        const heading = document.querySelector(".app-content h1");
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      });
    };
  }, []);

  function dismiss() {
    if (dismissing.current) return;
    dismissing.current = true;
    close();
  }

  function isBackdrop(event) {
    if (event.target !== event.currentTarget) return false;
    const { left, right, top, bottom } =
      event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom
    );
  }

  return (
    <dialog
      ref={ref}
      className="workspace-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onPointerDown={(event) => {
        backdropPress.current =
          event.isPrimary && event.button === 0 && isBackdrop(event);
      }}
      onPointerCancel={() => {
        backdropPress.current = false;
      }}
      onClick={(event) => {
        const clickedBackdrop = backdropPress.current && isBackdrop(event);
        backdropPress.current = false;
        if (clickedBackdrop) dismiss();
      }}
    >
      <div className="dialogin">
        <div className="minihead">
          <span className="eyebrow">{label}</span>
          <Button
            kind="x"
            aria-label={t("Sluiten")}
            icon="x"
            onClick={dismiss}
          />
        </div>
        <h2 id={titleId}>{title}</h2>
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
