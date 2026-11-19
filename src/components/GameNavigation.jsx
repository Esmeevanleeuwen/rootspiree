import { useEffect, useRef } from "react";
import { LanguageSelector } from "./Entry.jsx";
import { Icon } from "./ui.jsx";

function GameBrand() {
  return (
    <div className="app-wordmark">
      <svg aria-hidden="true" viewBox="0 0 42 48">
        <path fill="#173f33" d="M21 1 40 12v24L21 47 2 36V12z" />
        <g fill="none" stroke="#d8bc83" strokeWidth="1.4">
          <path d="m21 7 13 8v17l-13 8-13-8V15z" />
          <path d="m10 30 8-14 5 9 3-5 7 12M16 32l5-9 5 9" />
        </g>
      </svg>
      <span>
        LevelUp <small>WORLD</small>
      </span>
    </div>
  );
}

export function GameNavigation({ gm, page, navigate, words }) {
  const activePage =
    page === "questEditor" ? "quests" : page === "accounts" ? "players" : page;
  const groups = gm
    ? [
        {
          label: words.manage,
          links: [
            ["home", "home", words.home],
            ["quests", "flag", words.quests],
            ["players", "people", words.people],
          ],
        },
        { label: words.community, links: [["feed", "fire", words.feed]] },
      ]
    : [
        {
          label: words.play,
          links: [
            ["home", "compass", words.journey],
            ["quests", "flag", words.quests],
          ],
        },
        {
          label: words.community,
          links: [
            ["players", "people", words.players],
            ["feed", "fire", words.feed],
          ],
        },
      ];
  return (
    <aside className="app-sidebar">
      <GameBrand />
      <nav className="app-navigation" aria-label={words.nav}>
        {groups.map(({ label, links }) => (
          <div className="app-nav-group" key={label}>
            <p className="app-nav-label">{label}</p>
            {links.map(([id, icon, title]) => (
              <button
                key={id}
                type="button"
                className="app-nav-link"
                aria-current={activePage === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon name={icon} />
                <span>{title}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function GameTopBar({
  account,
  gm,
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
    menu.current.open = false;
  }
  function openPage(page) {
    close();
    navigate(page);
  }

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
          close();
          trigger.current.focus();
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) close();
        }}
      >
        <summary
          className="app-account-trigger"
          ref={trigger}
          aria-label={words.accountMenu}
        >
          <span className="app-initial" aria-hidden="true">
            {initial}
          </span>
          <span className="app-account-name">{displayName}</span>
          <span className="app-account-chevron">
            <Icon name="chev" />
          </span>
        </summary>
        <div className="app-account-panel">
          {!gm && (
            <button type="button" onClick={() => openPage("profile")}>
              <Icon name="book" />
              {words.profile}
            </button>
          )}
          <button type="button" onClick={() => openPage("guide")}>
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
            <Icon name="chev" />
            {words.logOut}
          </button>
        </div>
      </details>
    </header>
  );
}
