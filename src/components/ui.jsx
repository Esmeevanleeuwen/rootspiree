import { useI18n } from "../i18n.jsx";
import { useId, useLayoutEffect, useRef } from "react";
import { useGame } from "../store.jsx";
import { avatarIcon, houseIcon, illustratedIcons, paths } from "../icons.js";
import { personalityPortraits } from "../personality-portraits.js";

export function BrandLockup() {
  return (
    <span className="brand-lockup">
      <svg className="brand-mark" aria-hidden="true" viewBox="0 0 32 32">
        <path
          fillRule="evenodd"
          d="M16 1c1.4 9 5.9 13.6 15 15-9.1 1.4-13.6 6-15 15-1.4-9-5.9-13.6-15-15C10.1 14.6 14.6 10 16 1Zm0 7c-1.3 3.7-4.3 6.7-8 8 3.7 1.3 6.7 4.3 8 8 1.3-3.7 4.3-6.7 8-8-3.7-1.3-6.7-4.3-8-8Z"
        />
      </svg>
      <span>
        LevelUp <span className="brand-world">World</span>
        <small>Grow into legend</small>
      </span>
    </span>
  );
}
export function Icon({ name }) {
  if (Object.hasOwn(illustratedIcons, name)) {
    return (
      <span className="ico ico-illustrated" aria-hidden="true">
        {illustratedIcons[name]}
      </span>
    );
  }
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
export function Avatar({
  player,
  large = false,
  personalityCode = player.personalityCode,
}) {
  const portrait = personalityPortraits[personalityCode];
  const avatarClass = portrait ? "avatar-portrait" : player.av;
  return (
    <span className={"avatar " + avatarClass + (large ? " bigavatar" : "")}>
      {portrait ? (
        <img src={portrait} alt="" loading="lazy" decoding="async" />
      ) : (
        <Icon name={avatarIcon(player)} />
      )}
    </span>
  );
}
export function Stamp({ house }) {
  return (
    <span className="sigil" aria-hidden="true">
      <Icon name={houseIcon(house)} />
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
          <Icon name={houseIcon(house)} />
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
