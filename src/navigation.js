import { getAetherRegion } from "./aether-regions.js";

const entryPaths = {
  landing: "",
  auth: "/login",
  register: "/signup",
  onboard: "/setup",
};

const gamePaths = {
  home: "/play",
  world: "/play/world",
  quests: "/play/quests",
  questEditor: "/play/quests/edit",
  players: "/play/people",
  accounts: "/play/people/accounts",
  feed: "/play/campfire",
  profile: "/play/profile",
  test: "/play/profile/quiz",
  settings: "/play/settings",
  guide: "/play/guide",
};
const gamePages = Object.fromEntries(
  Object.entries(gamePaths).map(([page, path]) => [path, page]),
);
const entryScreens = Object.fromEntries(
  Object.entries(entryPaths).map(([screen, path]) => [path, screen]),
);
const questFilters = {
  open: "Open",
  review: "Ingeleverd",
  completed: "Afgerond",
  drafts: "Concepten",
};
const editorParams = {
  player: "playerId",
  goal: "sharedGoalId",
  draft: "draftId",
};

function parseHash(hash) {
  const separator = hash.indexOf("?");
  return separator === -1
    ? { path: hash.slice(1), params: new URLSearchParams() }
    : {
        path: hash.slice(1, separator),
        params: new URLSearchParams(hash.slice(separator + 1)),
      };
}
function joinHash(path, params) {
  const query = params?.toString();
  return "#" + path + (query ? "?" + query : "");
}

export function screenForHash(hash) {
  const { path } = parseHash(hash);
  if (path === gamePaths.home || path.startsWith(gamePaths.home + "/"))
    return "game";
  return Object.hasOwn(entryScreens, path) ? entryScreens[path] : "landing";
}

export function screenHash(screen, currentHash) {
  if (screen === "landing") return "";
  const currentScreen = screenForHash(currentHash);
  const next =
    currentScreen === "game"
      ? currentHash
      : parseHash(currentHash).params.get("next");
  const workspace =
    next?.startsWith("#/play") && screenForHash(next) === "game" ? next : null;
  if (screen === "game") return workspace || joinHash(gamePaths.home);
  return joinHash(
    entryPaths[screen],
    workspace && new URLSearchParams({ next: workspace }),
  );
}

export function workspaceView(hash, gm) {
  const { path, params } = parseHash(hash);
  const page = Object.hasOwn(gamePages, path) ? gamePages[path] : "home";
  if (
    (!gm && ["accounts", "questEditor"].includes(page)) ||
    (gm && ["profile", "test"].includes(page))
  ) {
    return { page: "home" };
  }
  const view = { page };
  if (page === "quests") {
    const filter = params.get("status");
    if (Object.hasOwn(questFilters, filter) && (gm || filter !== "drafts")) {
      view.questFilter = questFilters[filter];
    }
    if (!gm && params.get("scope") === "all") view.questScope = "all";
  }
  if (page === "world") {
    const region = getAetherRegion(params.get("region"));
    if (region) view.region = region.key;
  }
  if (page === "players") {
    const peopleFilter = params.get("show");
    if (["players", "characters", "all"].includes(peopleFilter))
      view.peopleFilter = peopleFilter;
  }
  if (page === "questEditor") {
    const questEditor = {};
    for (const [key, field] of Object.entries(editorParams)) {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9_-]{1,64}$/.test(value))
        questEditor[field] = value;
    }
    const template = getAetherRegion(params.get("template"));
    if (template) questEditor.template = template.key;
    const returnPage = params.get("from");
    if (["home", "players", "world"].includes(returnPage))
      questEditor.returnPage = returnPage;
    view.questEditor = questEditor;
  }
  return view;
}

export function workspaceHash(page, view = {}) {
  const path = Object.hasOwn(gamePaths, page)
    ? gamePaths[page]
    : gamePaths.home;
  const params = new URLSearchParams();
  if (page === "quests") {
    const status = Object.keys(questFilters).find(
      (key) => questFilters[key] === view.questFilter,
    );
    if (status) params.set("status", status);
    if (view.questScope === "all") params.set("scope", "all");
  }
  if (page === "world" && getAetherRegion(view.region)) {
    params.set("region", view.region);
  }
  if (page === "players" && view.peopleFilter) {
    params.set("show", view.peopleFilter);
  }
  if (page === "questEditor") {
    const editor = view.questEditor;
    for (const [key, field] of Object.entries(editorParams)) {
      if (editor?.[field]) params.set(key, editor[field]);
    }
    if (getAetherRegion(editor?.template))
      params.set("template", editor.template);
    if (editor?.returnPage && editor.returnPage !== "quests")
      params.set("from", editor.returnPage);
  }
  return joinHash(path, params);
}

export function writeHash(hash, { replace = false } = {}) {
  if (window.location.hash === hash) return;
  const url = window.location.pathname + window.location.search + hash;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export function onHistoryChange(listener) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}
