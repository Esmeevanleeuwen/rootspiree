import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { workspaceCopy } from "../workspace-copy.js";
import {
  CommunityDialog,
  Feed,
  Overview,
  Players,
  QuestPage,
} from "./Community.jsx";
import { LanguageSelector, QuizForm } from "./Entry.jsx";
import { GameNavigation, GameTopBar } from "./GameNavigation.jsx";
import { Journey, JourneyDialog } from "./Journey.jsx";
import { BioDialog, Profile } from "./Profile.jsx";
import { QuestEditor } from "./QuestEditor.jsx";
import { WorldGuide } from "./WorldGuide.jsx";
import { Button, Heading } from "./ui.jsx";
import "../workspace.css";

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
        <div className="panel accounts-panel app-accounts">
          <table className="accounts-table" aria-label={words.accounts}>
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
                  <th scope="row">{a.name}</th>
                  <td>{a.email}</td>
                  <td>
                    <span className="app-account-cell-label" aria-hidden="true">
                      {words.role}
                    </span>
                    {words[a.role]}
                  </td>
                  <td>
                    <span className="app-account-cell-label" aria-hidden="true">
                      {words.status}
                    </span>
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

function PeopleWorkspace({ page, words, navigate }) {
  return (
    <>
      <Heading title={words.people} />
      <nav className="app-people-switch" aria-label={words.peopleViews}>
        {["players", "accounts"].map((id) => (
          <button
            key={id}
            type="button"
            aria-current={page === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            {id === "players" ? words.directory : words.accounts}
          </button>
        ))}
      </nav>
      {page === "accounts" ? (
        <AdminAccounts words={words} />
      ) : (
        <Players embedded />
      )}
    </>
  );
}

function Settings({
  account,
  gm,
  language,
  setLanguage,
  onLogout,
  navigate,
  words,
}) {
  return (
    <div className="app-settings">
      <Heading title={words.settings} />
      <section className="panel app-setting">
        <h2>{words.language}</h2>
        <LanguageSelector language={language} setLanguage={setLanguage} />
      </section>
      <section className="panel app-setting">
        <h2>{words.account}</h2>
        <p>{account.name}</p>
        <div className="actions">
          {!gm && (
            <Button kind="textbtn" onClick={() => navigate("profile")}>
              {words.profile}
            </Button>
          )}
          <Button kind="textbtn" onClick={onLogout}>
            {words.logOut}
          </Button>
        </div>
      </section>
      <Button kind="textbtn" icon="info" onClick={() => navigate("guide")}>
        {words.about}
      </Button>
    </div>
  );
}

export function GameWorkspace({ language, setLanguage, onLogout, authError }) {
  const {
    account,
    game,
    player,
    gm,
    view,
    modal,
    warning,
    navigate,
    refresh,
    setModal,
  } = useGame();
  const { t } = useI18n();
  const words = workspaceCopy[language];
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

  const screens = {
    home: gm ? <Overview /> : <Journey />,
    world: <WorldGuide title={words.world} intro={words.worldIntro} />,
    settings: (
      <Settings
        account={account}
        gm={gm}
        language={language}
        setLanguage={setLanguage}
        onLogout={onLogout}
        navigate={navigate}
        words={words}
      />
    ),
    quests: <QuestPage />,
    questEditor: gm ? <QuestEditor {...view.questEditor} /> : null,
    players: gm ? (
      <PeopleWorkspace page="players" words={words} navigate={navigate} />
    ) : (
      <Players />
    ),
    feed: <Feed />,
    accounts: gm ? (
      <PeopleWorkspace page="accounts" words={words} navigate={navigate} />
    ) : null,
    profile: gm ? null : <Profile personalAnswers={account.profile} />,
    test:
      !gm && view.test ? <Retake words={words} language={language} /> : null,
    guide: (
      <>
        <Heading title={words.about} />
        <section className="guide panel app-guide">
          <p>{words.aboutText}</p>
          {gm && (
            <Button
              kind="textbtn"
              icon="book"
              onClick={() => setModal({ kind: "chapter" })}
            >
              {words.chapter}
            </Button>
          )}
        </section>
      </>
    ),
  };
  return (
    <div className="app-shell">
      <GameNavigation gm={gm} page={page} navigate={navigate} words={words} />
      <main className="app-main">
        <GameTopBar
          account={account}
          gm={gm}
          language={language}
          setLanguage={setLanguage}
          navigate={navigate}
          onLogout={onLogout}
          words={words}
        />
        <div
          className={
            "wrap app-content" +
            (gm && page === "home" ? " app-content-dashboard" : "")
          }
          ref={content}
        >
          {(warning || authError) && (
            <p role="alert" className="detailbox">
              {authError ||
                (warning === "server_error"
                  ? words.error
                  : t("Deze wijziging kon niet worden opgeslagen."))}
            </p>
          )}
          <div key={page}>{screens[page] || screens.home}</div>
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
