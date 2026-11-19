import { createContext, useContext, useEffect, useRef, useState } from "react";
import { statements } from "./content.js";
import { emptyJourney } from "./game.js";
import { api } from "./api.js";

const GameContext = createContext(null);
const defaultView = { page: "home", test: null };

export function GameProvider({ account, onAccount, onExpired, children }) {
  const [game, setGame] = useState(null);
  const [view, setView] = useState(defaultView);
  const [modal, setModal] = useState(null);
  const [warning, setWarning] = useState("");
  const latest = useRef(null);
  const actions = useRef(Promise.resolve());
  const mounted = useRef(false);
  const gm = account.role === "admin";
  const player = gm
    ? { id: account.id, name: account.name, journey: emptyJourney() }
    : game?.players.find((p) => p.id === account.id);

  function loadState(response) {
    if (!mounted.current) return;
    latest.current = response.game;
    setGame(response.game);
    setWarning("");
  }

  function report(error) {
    if (!mounted.current) return;
    if (error.status === 401) onExpired();
    else setWarning(error.message || "server_error");
  }

  function refresh() {
    return enqueue(async () => loadState(await api("/world")));
  }

  useEffect(() => {
    mounted.current = true;
    refresh();
    const check = () => {
      if (document.visibilityState !== "hidden") refresh();
    };
    const timer = setInterval(check, 20000);
    window.addEventListener("focus", check);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, []);

  function enqueue(work) {
    const task = actions.current.then(async () => {
      if (!mounted.current) return null;
      try {
        return await work();
      } catch (error) {
        report(error);
        return null;
      }
    });
    actions.current = task;
    return task;
  }

  async function saveWorld(action, data) {
    const response = await api("/world", {
      method: "POST",
      data: { action, ...data },
    });
    loadState(response);
    return response;
  }

  const mutate = (action, data) => enqueue(() => saveWorld(action, data));
  function navigate(page, overrides = {}) {
    setModal(null);
    setView({ ...defaultView, page, ...overrides });
  }

  function editJourney(change) {
    return enqueue(() => {
      const journey = structuredClone(
        latest.current.players.find((p) => p.id === account.id).journey,
      );
      change(journey);
      return saveWorld("journey", { journey });
    });
  }

  async function stage(name, patch = {}) {
    const response = await editJourney((journey) =>
      Object.assign(journey, patch, { stage: name }),
    );
    if (response && mounted.current) navigate("home");
  }

  function startTest() {
    navigate("test", {
      test: { answers: Array(statements.length).fill(null) },
    });
  }

  function retake(answers) {
    return enqueue(async () => {
      const response = await api("/onboarding", {
        method: "POST",
        data: { answers },
      });
      const fresh = await api("/world");
      loadState(fresh);
      onAccount(response.account);
      return response;
    });
  }

  return (
    <GameContext.Provider
      value={{
        account,
        game,
        player,
        view,
        gm,
        modal,
        warning,
        setModal,
        mutate,
        editJourney,
        stage,
        navigate,
        startTest,
        retake,
        refresh,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
