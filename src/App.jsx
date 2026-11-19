import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { houses } from "./content.js";
import { I18nProvider, useI18n } from "./i18n.jsx";
import { GameProvider, useGame } from "./store.jsx";
import { Button, Heading, Icon } from "./components/ui.jsx";
import { Entry, LanguageSelector, QuizForm } from "./components/Entry.jsx";
import { BioDialog, Profile } from "./components/Profile.jsx";
import { Journey, JourneyDialog } from "./components/Journey.jsx";
import {
  CommunityDialog,
  Feed,
  Overview,
  Players,
  QuestPage,
} from "./components/Community.jsx";

const chrome = {
  en: {
    loading: "Loading…",
    loadFailed: "We couldn’t connect to the game.",
    retry: "Try again",
    logOut: "Log out",
    nav: "Main navigation",
    home: "Overview",
    quests: "Quests",
    players: "Players",
    feed: "Campfire",
    profile: "My profile",
    accounts: "Accounts",
    admin: "Admin",
    player: "Player",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Signup",
    complete: "Complete",
    incomplete: "In progress",
    welcome: "Back to the game",
    retake: "Retake the personality quiz",
    save: "Save my results",
    error: "Something went wrong. Please try again.",
    quitFailed: "We couldn’t log you out. Please try again.",
    empty: "There are no accounts yet.",
    about: "How to play",
    aboutText:
      "Choose a goal to practise in the Listening Valley. The Game Master can assign quests, review your submissions and give you feedback and points. Share what you’re learning around the Campfire.",
    details: "My personal answers",
    hobbies: "Hobbies",
    job: "Work or study",
    goals: "Life goals",
    interests: "Interests",
  },
  nl: {
    loading: "Laden…",
    loadFailed: "We konden geen verbinding maken met het spel.",
    retry: "Probeer opnieuw",
    logOut: "Uitloggen",
    nav: "Hoofdnavigatie",
    home: "Overzicht",
    quests: "Opdrachten",
    players: "Spelers",
    feed: "Kampvuur",
    profile: "Mijn profiel",
    accounts: "Accounts",
    admin: "Beheerder",
    player: "Speler",
    name: "Naam",
    email: "E-mail",
    role: "Rol",
    status: "Aanmelding",
    complete: "Afgerond",
    incomplete: "Bezig",
    welcome: "Terug naar het spel",
    retake: "Doe de persoonlijkheidstest opnieuw",
    save: "Bewaar mijn uitslag",
    error: "Er ging iets mis. Probeer het opnieuw.",
    quitFailed: "Uitloggen is mislukt. Probeer het opnieuw.",
    empty: "Er zijn nog geen accounts.",
    about: "Hoe speel je?",
    aboutText:
      "Kies een doel om aan te werken in de Luistervallei. De spelleider kan opdrachten toewijzen, inzendingen beoordelen en feedback en punten geven. Bij het kampvuur deel je wat je leert.",
    details: "Mijn persoonlijke antwoorden",
    hobbies: "Hobby’s",
    job: "Werk of studie",
    goals: "Levensdoelen",
    interests: "Interesses",
  },
};
const tabs = [
  ["home", "compass"],
  ["quests", "flag"],
  ["players", "people"],
  ["feed", "fire"],
];
const routes = {
  landing: "",
  auth: "#/login",
  onboard: "#/setup",
  game: "#/play",
};

function getLocale() {
  try {
    const language = localStorage.getItem("rootspiree.language");
    return language === "en" || language === "nl" ? language : null;
  } catch {
    return null;
  }
}
function getRoute() {
  return (
    Object.keys(routes).find((key) => routes[key] === window.location.hash) ||
    "landing"
  );
}

function Brand() {
  return (
    <div className="brand">
      <svg aria-hidden="true" className="mark" viewBox="0 0 42 48">
        <path fill="#173f33" d="M21 1 40 12v24L21 47 2 36V12z" />
        <g fill="none" stroke="#d8bc83" strokeWidth="1.4">
          <path d="m21 7 13 8v17l-13 8-13-8V15z" />
          <path d="m10 30 8-14 5 9 3-5 7 12M16 32l5-9 5 9" />
        </g>
      </svg>
      <span>
        <b>LevelUp</b>
        <small>WORLD</small>
      </span>
    </div>
  );
}

function AdminAccounts({ words }) {
  const [state, setState] = useState({ accounts: null, error: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api("/admin/accounts", { signal: controller.signal })
      .then((result) => setState({ accounts: result.accounts, error: false }))
      .catch((error) => {
        if (error.name !== "AbortError")
          setState({ accounts: null, error: true });
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <>
      <Heading label={words.admin} title={words.accounts} />
      {state.error ? (
        <p role="alert">
          {words.loadFailed}{" "}
          <Button kind="textbtn" onClick={() => setAttempt((n) => n + 1)}>
            {words.retry}
          </Button>
        </p>
      ) : !state.accounts ? (
        <p role="status">{words.loading}</p>
      ) : !state.accounts.length ? (
        <p>{words.empty}</p>
      ) : (
        <div className="panel accounts-panel">
          <table className="accounts-table">
            <thead>
              <tr>
                {[words.name, words.email, words.role, words.status].map(
                  (text) => (
                    <th key={text} scope="col">
                      {text}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {state.accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{words[a.role]}</td>
                  <td>
                    {a.onboardingComplete ? words.complete : words.incomplete}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Retake({ words, language }) {
  const { view, navigate, retake } = useGame();
  const [answers, setAnswers] = useState(view.test.answers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    setBusy(true);
    const result = await retake(answers);
    if (result) navigate("profile");
    else {
      setError(words.error);
      setBusy(false);
    }
  }
  return (
    <>
      <Heading label={words.profile} title={words.retake} />
      <QuizForm
        language={language}
        answers={answers}
        onAnswers={setAnswers}
        onSubmit={submit}
        busy={busy}
        error={error}
        onBack={() => navigate("profile")}
        finishLabel={words.save}
      />
    </>
  );
}

function ProfileDetails({ profile, words }) {
  const fields = ["hobbies", "job", "goals", "interests"].filter(
    (key) => profile?.[key],
  );
  if (!fields.length) return null;
  return (
    <section className="guide panel personal-details">
      <h2>{words.details}</h2>
      <dl>
        {fields.map((key) => (
          <div key={key}>
            <dt>{words[key]}</dt>
            <dd>{profile[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Game({ language, setLanguage, onLogout, authError }) {
  const { account, game, player, gm, view, modal, warning, navigate, refresh } =
    useGame();
  const { t } = useI18n();
  const words = chrome[language];
  const content = useRef(null);
  const { page } = view;
  const j = player?.journey;
  const step =
    page === "home" && !gm && j
      ? [j.stage, j.index, j.letterIndex].join("/")
      : "";
  useEffect(() => {
    const title = content.current?.querySelector("h1");
    if (!title) return;
    window.scrollTo(0, 0);
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }, [page, step, Boolean(game)]);
  if (!game || !player)
    return (
      <main className="app-loading">
        <p role={warning ? "alert" : "status"}>
          {warning ? words.loadFailed : words.loading}
        </p>
        {warning && <Button onClick={refresh}>{words.retry}</Button>}
        <Button kind="textbtn" onClick={onLogout}>
          {words.logOut}
        </Button>
      </main>
    );

  const links = [...tabs, gm ? ["accounts", "list"] : ["profile", "book"]];
  const house = !gm && houses[j.house];
  const screens = {
    home: gm ? <Overview /> : <Journey />,
    quests: <QuestPage />,
    players: <Players />,
    feed: <Feed />,
    accounts: gm ? <AdminAccounts words={words} /> : null,
    profile: gm ? null : (
      <>
        <Profile />
        <ProfileDetails profile={account.profile} words={words} />
      </>
    ),
    test:
      !gm && view.test ? <Retake words={words} language={language} /> : null,
    guide: (
      <>
        <Heading label="LevelUp World" title={words.about} />
        <section className="guide panel">
          <p>{words.aboutText}</p>
        </section>
      </>
    ),
  };
  return (
    <div
      className="shell"
      style={house ? { "--pine": house.tint, "--soft": house.soft } : undefined}
    >
      <aside className="rail">
        <Brand />
        <nav aria-label={words.nav}>
          {links.map(([id, icon]) => (
            <button
              key={id}
              className={"navbtn " + (page === id ? "on" : "")}
              aria-current={page === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon name={icon === "list" ? "people" : icon} />
              {words[id]}
            </button>
          ))}
        </nav>
        <div className="railfoot">
          <Button
            kind={"guidebtn " + (page === "guide" ? "on" : "")}
            icon="layers"
            onClick={() => navigate("guide")}
          >
            {words.about}
          </Button>
        </div>
      </aside>
      <main className="main">
        <div className="top">
          <div className="toplabel">
            <Icon name={gm ? "layers" : "fern"} />{" "}
            <span>
              {account.name}
              {gm ? " · " + words.admin : ""}
            </span>
          </div>
          <div className="rolepick game-actions">
            <Button
              kind="topdesign"
              icon="info"
              aria-label={words.about}
              onClick={() => navigate("guide")}
            />
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <Button kind="textbtn" onClick={onLogout}>
              {words.logOut}
            </Button>
          </div>
        </div>
        <div className="wrap" ref={content}>
          {(warning || authError) && (
            <p role="alert" className="detailbox">
              {authError ||
                (warning === "server_error"
                  ? words.error
                  : t("Deze wijziging kon niet worden opgeslagen."))}
            </p>
          )}
          <div className="flow" key={page}>
            {screens[page] || screens.home}
          </div>
        </div>
      </main>
      {modal &&
        (modal.kind === "bio" ? (
          <BioDialog />
        ) : ["house", "retake", "exercise"].includes(modal.kind) ? (
          <JourneyDialog key={modal.kind} />
        ) : (
          <CommunityDialog key={modal.kind + ":" + modal.id} />
        ))}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [language, setLang] = useState(() => getLocale() || "en");
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("loading");
  const [authError, setAuthError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const words = chrome[language];
  const go = (screen) => {
    if (location.hash !== routes[screen]) location.hash = routes[screen];
    setRoute(screen);
  };

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const controller = new AbortController();
    api("/session", { signal: controller.signal })
      .then((result) => {
        setAccount(result.account);
        if (!getLocale() && result.account) setLang(result.account.language);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [attempt]);

  function setLanguage(value) {
    setLang(value);
    try {
      localStorage.setItem("rootspiree.language", value);
    } catch {
      /* Language remains available for this visit. */
    }
    if (account)
      api("/profile", { method: "PATCH", data: { language: value } }).catch(
        () => {},
      );
  }
  function signedOut() {
    setAccount(null);
    go("landing");
  }
  async function logout() {
    setAuthError("");
    try {
      await api("/logout", { method: "POST", data: {} });
      signedOut();
    } catch (error) {
      if (error.status === 401) signedOut();
      else setAuthError(words.quitFailed);
    }
  }

  let screen;
  if (account)
    screen =
      route === "landing"
        ? "landing"
        : account.onboardingComplete
          ? "game"
          : "onboard";
  else screen = route === "landing" ? "landing" : "auth";
  useEffect(() => {
    if (status === "ready" && route !== screen) go(screen);
  }, [status, route, screen]);

  if (status !== "ready")
    return (
      <main className="app-loading">
        <p role={status === "error" ? "alert" : "status"}>
          {status === "error" ? words.loadFailed : words.loading}
        </p>
        {status === "error" && (
          <Button
            onClick={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          >
            {words.retry}
          </Button>
        )}
      </main>
    );
  return (
    <I18nProvider language={language}>
      {screen === "game" ? (
        <GameProvider
          key={account.id}
          account={account}
          onAccount={setAccount}
          onExpired={signedOut}
        >
          <Game
            language={language}
            setLanguage={setLanguage}
            onLogout={logout}
            authError={authError}
          />
        </GameProvider>
      ) : (
        <Entry
          screen={screen}
          go={go}
          account={account}
          language={language}
          setLanguage={setLanguage}
          onAccount={setAccount}
          onLogout={logout}
          authError={authError}
        />
      )}
    </I18nProvider>
  );
}
