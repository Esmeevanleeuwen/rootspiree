import { createContext, useContext, useEffect, useRef, useState } from "react";
import { statements } from "./content.js";
import { initialGame } from "./game.js";

const GameContext = createContext(null);
const gameKey = "rootspiree.world.v1";
const viewKey = "rootspiree.view.v1";

function readStored(storageName, key) {
  try {
    return JSON.parse(window[storageName].getItem(key));
  } catch {
    return null;
  }
}
function writeStored(storageName, key, value) {
  try {
    if (value == null) window[storageName].removeItem(key);
    else window[storageName].setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const defaultView = {
  page: "home",
  playerId: "nova",
  mode: "player",
  test: null,
};
export function GameProvider({ children }) {
  const [game, setGame] = useState(
    () => readStored("localStorage", gameKey) || initialGame(),
  );
  const [view, setView] = useState(() => {
    const saved = readStored("sessionStorage", viewKey);
    return saved && game.players.some((p) => p.id === saved.playerId && !p.npc)
      ? { ...defaultView, ...saved }
      : defaultView;
  });
  const [modal, setModal] = useState(null);
  const [warning, setWarning] = useState("");
  const latest = useRef(game);
  const memoryOnly = useRef(false);
  const player =
    game.players.find((p) => p.id === view.playerId) || game.players[0];
  function update(change) {
    const fresh = memoryOnly.current
      ? latest.current
      : readStored("localStorage", gameKey) || latest.current;
    const next = structuredClone(fresh);
    change(next);
    const saved = writeStored("localStorage", gameKey, next);
    memoryOnly.current = !saved;
    setWarning(
      saved
        ? ""
        : "Opslaan in deze browser lukt niet. Je kunt deze sessie verder spelen.",
    );
    latest.current = next;
    setGame(next);
  }
  useEffect(() => {
    const sync = (e) => {
      if (e.key !== gameKey || !e.newValue) return;
      const fresh = readStored("localStorage", gameKey);
      if (fresh) {
        latest.current = fresh;
        setGame(fresh);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    writeStored("sessionStorage", viewKey, view);
  }, [view]);
  const navigate = (page, overrides = {}) => {
    setModal(null);
    setView((v) => ({ ...v, test: null, page, ...overrides }));
  };
  function editJourney(change) {
    update((d) => change(d.players.find((p) => p.id === player.id).journey));
  }
  const stage = (name, patch = {}) => {
    editJourney((j) => Object.assign(j, patch, { stage: name }));
    navigate("home");
  };
  function startTest(fresh = false) {
    navigate("test", {
      mode: "player",
      test: {
        fresh,
        step: fresh ? -1 : 0,
        name: "",
        bio: "",
        answers: Array(statements.length).fill(null),
      },
    });
  }
  const changeTest = (patch) =>
    setView((v) => ({ ...v, test: { ...v.test, ...patch } }));
  return (
    <GameContext.Provider
      value={{
        game,
        player,
        view,
        gm: view.mode === "gm",
        modal,
        warning,
        setModal,
        update,
        editJourney,
        stage,
        navigate,
        startTest,
        changeTest,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
export function useGame() {
  return useContext(GameContext);
}
