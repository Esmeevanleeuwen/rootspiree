import { useEffect, useRef } from "react";
import { LanguageSelector } from "./Entry.jsx";
import { BrandLockup, Icon } from "./ui.jsx";

function GameNavigation({ gm, page, navigate, words }) {
  const activePage = page === "questEditor" ? "quests" : page;
  const links = [
    ["home", gm ? words.homeShort : words.journey],
    ["world", words.worldShort],
    ["players", words.characters],
    ["quests", words.quests],
    ["feed", words.community],
  ];
  if (gm) links.push(["accounts", words.adminNav]);
  return (
    <nav className="app-navigation" aria-label={words.nav}>
      {links.map(([id, title]) => (
        <button
          key={id}
          type="button"
          className="app-nav-link"
          aria-current={activePage === id ? "page" : undefined}
          onClick={() => navigate(id)}
        >
          {title}
        </button>
      ))}
    </nav>
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
    <header className="app-masthead">
      <div className="app-top">
        <button
          type="button"
          className="app-wordmark"
          onClick={() => openPage("home")}
        >
          <BrandLockup />
        </button>
        <GameNavigation gm={gm} page={page} navigate={openPage} words={words} />
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
              {gm ? <Icon name="crown" /> : initial}
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
      </div>
    </header>
  );
}
