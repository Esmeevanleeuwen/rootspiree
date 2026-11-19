import { useEffect, useRef } from "react";
import { LanguageSelector } from "./Entry.jsx";
import { BrandMark, Icon } from "./ui.jsx";

function GameBrand() {
  return (
    <div className="app-wordmark">
      <BrandMark />
      <span>
        LevelUp <small>WORLD</small>
      </span>
    </div>
  );
}

export function GameNavigation({ gm, page, navigate, words }) {
  const activePage =
    page === "questEditor" ? "quests" : page === "accounts" ? "players" : page;
  const links = [
    [
      "home",
      gm ? "home" : "compass",
      gm ? words.home : words.journey,
      gm ? words.homeShort : words.journey,
    ],
    ["world", "map", words.world, words.worldShort],
    ["players", "shield", gm ? words.people : words.players],
    ["quests", "swords", words.quests],
    ["feed", "firelight", words.feed],
    ["settings", "settings", words.settings],
  ];
  return (
    <aside className="app-sidebar">
      <GameBrand />
      <nav className="app-navigation" aria-label={words.nav}>
        {links.map(([id, icon, title, compact]) => (
          <button
            key={id}
            type="button"
            className={
              "app-nav-link" + (id === "settings" ? " app-nav-settings" : "")
            }
            aria-current={activePage === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon name={icon} />
            <span className={compact ? "app-nav-full" : undefined}>
              {title}
            </span>
            {compact && <span className="app-nav-compact">{compact}</span>}
          </button>
        ))}
      </nav>
      {gm && (
        <section className="app-admin-card">
          <h2>
            <Icon name="royal" />
            {words.gameMaster}
          </h2>
          <p>{words.gameMasterHelp}</p>
          <button type="button" onClick={() => navigate("guide")}>
            {words.about}
          </button>
        </section>
      )}
    </aside>
  );
}

export function GameTopBar({
  account,
  gm,
  page,
  language,
  setLanguage,
  navigate,
  onLogout,
  words,
}) {
  const menu = useRef(null);
  const trigger = useRef(null);
  const displayName = account.name.trim();
  const initial =
    Array.from(displayName)[0]?.toLocaleUpperCase(language) || "?";

  useEffect(() => {
    function dismiss(event) {
      if (menu.current?.open && !menu.current.contains(event.target)) {
        menu.current.open = false;
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  function close() {
    if (menu.current?.open) menu.current.open = false;
  }

  function openPage(page) {
    close();
    navigate(page);
  }

  const accountPage = ["profile", "settings", "guide"].includes(page);

  return (
    <header className="app-top">
      <div className="app-mobile-brand">
        <GameBrand />
      </div>
      <details
        className="app-account"
        ref={menu}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !menu.current.open) return;
          event.preventDefault();
          close();
          trigger.current.focus({ preventScroll: true });
        }}
        onBlur={(event) => {
          const nextFocus = event.relatedTarget;
          if (nextFocus && !event.currentTarget.contains(nextFocus)) close();
        }}
      >
        <summary
          className="app-account-trigger"
          ref={trigger}
          aria-label={words.accountMenu}
          data-account-page={accountPage || undefined}
        >
          <span className="app-initial" aria-hidden="true">
            {gm ? <Icon name="royal" /> : initial}
          </span>
          <span className="app-account-name">{displayName}</span>
          <span className="app-account-chevron">
            <Icon name="chev" />
          </span>
        </summary>
        <div className="app-account-panel">
          {!gm && (
            <button
              type="button"
              aria-current={page === "profile" ? "page" : undefined}
              onClick={() => openPage("profile")}
            >
              <Icon name="book" />
              {words.profile}
            </button>
          )}
          <button
            type="button"
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => openPage("settings")}
          >
            <Icon name="settings" />
            {words.settings}
          </button>
          <button
            type="button"
            aria-current={page === "guide" ? "page" : undefined}
            onClick={() => openPage("guide")}
          >
            <Icon name="info" />
            {words.about}
          </button>
          <div className="app-account-options">
            <p>{words.language}</p>
            <LanguageSelector language={language} setLanguage={setLanguage} />
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <Icon name="logOut" />
            {words.logOut}
          </button>
        </div>
      </details>
    </header>
  );
}
