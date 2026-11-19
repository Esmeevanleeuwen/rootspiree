import { useEffect, useState } from "react";
import { api } from "./api.js";
import { landingCopy } from "./landing-copy.js";
import { I18nProvider } from "./i18n.jsx";
import { GameProvider } from "./store.jsx";
import { workspaceCopy } from "./workspace-copy.js";
import { Button } from "./components/ui.jsx";
import { Entry } from "./components/Entry.jsx";
import { GameWorkspace } from "./components/GameWorkspace.jsx";

const routes = {
  landing: "",
  auth: "#/login",
  register: "#/signup",
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

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [language, setLang] = useState(() => getLocale() || "en");
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("loading");
  const [authError, setAuthError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const words = workspaceCopy[language];
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
    document.title = landingCopy[language].pageTitle;
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

  let screen = route;
  if (route !== "landing") {
    if (account) screen = account.onboardingComplete ? "game" : "onboard";
    else if (route !== "register") screen = "auth";
  }
  useEffect(() => {
    if (status === "ready" && route !== screen) go(screen);
  }, [status, route, screen]);

  if (status !== "ready" && screen !== "landing")
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
          <GameWorkspace
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
