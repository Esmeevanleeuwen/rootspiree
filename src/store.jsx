import { createContext, useContext, useEffect, useRef, useState } from "react";
import { emptyJourney } from "./game.js";
import { api } from "./api.js";
import {
  onHistoryChange,
  screenForHash,
  workspaceHash,
  workspaceView,
  writeHash,
} from "./navigation.js";

const GameContext = createContext(null);

export function GameProvider({ account, onAccount, onExpired, children }) {
  const gm = account.role === "admin";
  const [game, setGame] = useState(null);
  const [view, setView] = useState(() =>
    workspaceView(window.location.hash, gm),
  );
  const [modal, setModal] = useState(null);
  const [warning, setWarning] = useState("");
  const [syncWarning, setSyncWarning] = useState(false);
  const refreshing = useRef(null);
  const latest = useRef(null);
  const actions = useRef(Promise.resolve());
  const mounted = useRef(false);
  const player = gm
    ? { id: account.id, name: account.name, journey: emptyJourney() }
    : game?.players.find((p) => p.id === account.id);

  function loadState(response, clearWarning = true) {
    if (!mounted.current) return;
    latest.current = response.game;
    setGame(response.game);
    setSyncWarning(false);
    if (clearWarning) setWarning("");
  }

  function report(error) {
    if (!mounted.current) return;
    if (error.status === 401) onExpired();
    else setWarning(error.message || "server_error");
  }

  function refresh() {
    if (refreshing.current) return refreshing.current;
    const request = enqueue(async () => {
      try {
        const response = await api("/world");
        loadState(response, false);
        return response;
      } catch (error) {
        if (error.status === 401) report(error);
        else if (mounted.current) setSyncWarning(true);
        return null;
      }
    });
    refreshing.current = request;
    request.then(() => {
      if (refreshing.current === request) refreshing.current = null;
    });
    return request;
  }

  useEffect(() => {
    mounted.current = true;
    refresh();
    function updateView() {
      if (screenForHash(window.location.hash) !== "game") return;
      const next = workspaceView(window.location.hash, gm);
      writeHash(workspaceHash(next.page, next), { replace: true });
      setView(next);
      setModal(null);
      setWarning("");
    }
    const stopHistory = onHistoryChange(updateView);
    updateView();
    const check = () => {
      if (document.visibilityState !== "hidden") refresh();
    };
    const timer = setInterval(check, 20000);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      stopHistory();
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [gm]);

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
  function navigate(page, overrides = {}, options) {
    const next = workspaceView(workspaceHash(page, overrides), gm);
    writeHash(workspaceHash(next.page, next), options);
    setModal(null);
    setWarning("");
    setView(next);
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
    const sourceHash = window.location.hash;
    const response = await editJourney((journey) =>
      Object.assign(journey, patch, { stage: name }),
    );
    if (response && mounted.current && window.location.hash === sourceHash)
      navigate("home");
  }

  function startTest() {
    navigate("test");
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
        syncWarning,
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
