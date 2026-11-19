import { useEffect, useId, useRef, useState } from "react";
import { examples } from "../examples.js";
import { newId } from "../game.js";
import { exampleText, questText, useI18n } from "../i18n.jsx";
import { useGame } from "../store.jsx";
import { QuestBrief } from "./QuestBrief.jsx";
import { Avatar, Button, Field, Heading, Icon } from "./ui.jsx";
import "../quest-editor.css";

const copy = {
  en: {
    newQuest: "New quest",
    editDraft: "Edit quest draft",
    back: "Back",
    player: "Player",
    choosePlayer: "Choose a player",
    players: "Players",
    characters: "Characters",
    title: "Quest title",
    action: "What should they try?",
    submission: "What should they send back?",
    criteria: "What counts as done?",
    points: "Points",
    plus: "Points for completion",
    minus: "Points to deduct if not completed",
    playerPreview: "Player preview",
    untitled: "Untitled quest",
    previewHint: "The quest will appear here as you write.",
    sharedGoal: "Shared goal",
    noGoalLinked: "Choose a shared goal (optional)",
    noSharedGoals: "This player hasn’t shared a goal.",
    openQuests: "Open quests",
    noOpenQuests: "This player has no open quests.",
    assign: "Assign quest",
    assignTo: (name) => "Assign to " + name,
    save: "Save draft",
    saved: "Draft saved",
    saving: "Saving draft…",
    assigning: "Assigning quest…",
    deleting: "Deleting draft…",
    localEdits: "Unsaved edits are kept in this tab.",
    discard: "Discard edits",
    draftChanged:
      "The saved draft has changed. Choose which version to continue with.",
    reviewUpdatedDraft: "Review the updated draft before trying again.",
    useSaved: "Use saved version",
    keepEdits: "Keep my edits",
    remove: "Delete draft",
    confirmRemove: "Delete this quest draft?",
    confirmBack: "Discard your unsaved changes?",
    missingPlayer: "Choose the player who should receive this quest.",
    missingTitle: "Enter a quest title.",
    missingAction: "Describe what the player should try.",
    missingSubmission: "Describe what the player should send back.",
    missingCriteria: "Describe what counts as done.",
    invalidPoints: "Enter a whole number from 0 to 999 in each points field.",
    draftMissing: "This draft is no longer available.",
    goalUnavailable:
      "This goal is no longer shared. Choose another goal or leave the quest unlinked.",
    error: "We couldn’t save this change. Please try again.",
    actionExample: "Ask one follow-up question in your next conversation.",
    submissionExample:
      "Share the question you asked and one thing you learned.",
    criteriaExample:
      "The question follows up on something the other person said.",
  },
  nl: {
    newQuest: "Nieuwe opdracht",
    editDraft: "Concept bewerken",
    back: "Terug",
    player: "Speler",
    choosePlayer: "Kies een speler",
    players: "Spelers",
    characters: "Personages",
    title: "Titel van de opdracht",
    action: "Wat moet de speler proberen?",
    submission: "Wat moet de speler terugsturen?",
    criteria: "Wanneer is de opdracht klaar?",
    points: "Punten",
    plus: "Punten bij voltooiing",
    minus: "Minpunten als de opdracht niet is voltooid",
    playerPreview: "Voorbeeld voor de speler",
    untitled: "Opdracht zonder titel",
    previewHint: "De opdracht verschijnt hier terwijl je schrijft.",
    sharedGoal: "Gedeeld doel",
    noGoalLinked: "Kies een gedeeld doel (optioneel)",
    noSharedGoals: "Deze speler heeft geen doel gedeeld.",
    openQuests: "Open opdrachten",
    noOpenQuests: "Deze speler heeft geen open opdrachten.",
    assign: "Opdracht toewijzen",
    assignTo: (name) => "Toewijzen aan " + name,
    save: "Concept opslaan",
    saved: "Concept opgeslagen",
    saving: "Concept wordt opgeslagen…",
    assigning: "Opdracht wordt toegewezen…",
    deleting: "Concept wordt verwijderd…",
    localEdits: "Je wijzigingen worden in dit tabblad bewaard.",
    discard: "Wijzigingen verwijderen",
    draftChanged:
      "Het opgeslagen concept is gewijzigd. Kies met welke versie je verdergaat.",
    reviewUpdatedDraft:
      "Bekijk het bijgewerkte concept en probeer het opnieuw.",
    useSaved: "Gebruik opgeslagen versie",
    keepEdits: "Behoud mijn wijzigingen",
    remove: "Concept verwijderen",
    confirmRemove: "Dit concept verwijderen?",
    confirmBack: "Je wijzigingen verwijderen?",
    missingPlayer: "Kies de speler die deze opdracht krijgt.",
    missingTitle: "Vul een titel in.",
    missingAction: "Beschrijf wat de speler moet proberen.",
    missingSubmission: "Beschrijf wat de speler moet terugsturen.",
    missingCriteria: "Beschrijf wanneer de opdracht klaar is.",
    invalidPoints:
      "Vul in beide puntenvelden een geheel getal van 0 tot 999 in.",
    draftMissing: "Dit concept is niet meer beschikbaar.",
    goalUnavailable:
      "Dit doel wordt niet meer gedeeld. Kies een ander doel of laat de koppeling leeg.",
    error: "We konden deze wijziging niet opslaan. Probeer het opnieuw.",
    actionExample: "Stel in je volgende gesprek één vervolgvraag.",
    submissionExample: "Deel de vraag die je stelde en één ding dat je leerde.",
    criteriaExample: "Je vraag gaat verder op iets dat de ander zei.",
  },
};

function initialForm(draft, playerId, sharedGoalId, id) {
  return {
    id: draft?.id ?? id ?? newId(),
    playerId: draft ? (draft.playerId ?? "") : (playerId ?? ""),
    sharedGoalId: draft ? (draft.sharedGoalId ?? "") : (sharedGoalId ?? ""),
    name: draft?.name ?? "",
    desc: draft?.desc ?? "",
    submissionPrompt: draft?.submissionPrompt ?? "",
    completionCriteria: draft?.completionCriteria ?? "",
    plus: String(draft?.plus ?? 10),
    minus: String(draft?.minus ?? 2),
  };
}

const editorFields = [
  "id",
  "playerId",
  "sharedGoalId",
  "name",
  "desc",
  "submissionPrompt",
  "completionCriteria",
  "plus",
  "minus",
];

function sameForm(first, second) {
  return editorFields.every((key) => first[key] === second[key]);
}

function readEdits(key, draftId) {
  try {
    const edits = JSON.parse(sessionStorage.getItem(key));
    if (
      !edits ||
      !["form", "baseline"].every((part) =>
        editorFields.every((field) => typeof edits[part]?.[field] === "string"),
      )
    )
      return null;
    if (
      edits.form.id !== edits.baseline.id ||
      (draftId && edits.form.id !== draftId)
    )
      return null;
    return edits;
  } catch {
    return null;
  }
}

function writeEdits(key, edits) {
  try {
    if (edits) sessionStorage.setItem(key, JSON.stringify(edits));
    else sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function isValidPoints(value) {
  const points = Number(value);
  return (
    value.trim() !== "" &&
    Number.isInteger(points) &&
    points >= 0 &&
    points <= 999
  );
}

export function QuestEditor(props) {
  const { account } = useGame();
  const context = props.draftId
    ? ["draft", props.draftId]
    : ["new", props.playerId ?? "", props.sharedGoalId ?? ""];
  const recoveryKey =
    "rootspiree.quest-edits.v1:" + JSON.stringify([account.id, ...context]);
  return (
    <QuestEditorForm key={recoveryKey} recoveryKey={recoveryKey} {...props} />
  );
}

function QuestEditorForm({
  recoveryKey,
  playerId,
  sharedGoalId,
  draftId,
  returnPage = "quests",
}) {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, navigate, mutate, refresh, setModal } = useGame();
  const [edits, setEdits] = useState(() => {
    const recovered = readEdits(recoveryKey, draftId);
    return recovered &&
      !game.quests.some((quest) => quest.id === recovered.form.id)
      ? recovered
      : null;
  });
  const [newForm] = useState(() =>
    initialForm(null, playerId, sharedGoalId, edits?.form.id),
  );
  const draft = game.questDrafts?.find(
    (item) => item.id === (draftId ?? edits?.form.id),
  );
  const savedForm = draft ? initialForm(draft) : newForm;
  const hasDraft = Boolean(draft);
  const missingDraft = Boolean(draftId && !draft);
  const dirty = Boolean(edits && !sameForm(edits.form, savedForm));
  const form = dirty ? edits.form : savedForm;
  const conflict = dirty && hasDraft && !sameForm(edits.baseline, savedForm);
  const [retained, setRetained] = useState(Boolean(edits));
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [operation, setOperation] = useState("");
  const pending = Boolean(operation);
  const submitLock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const formRef = useRef(null);
  const pointsRef = useRef(null);
  const goalRef = useRef(null);
  const sectionId = useId();
  const errorId = useId();
  const player = game.players.find((person) => person.id === form.playerId);
  const sharedGoals =
    player?.journey?.goals?.filter((goal) => goal.shared) ?? [];
  const selectedGoal = sharedGoals.find(
    (goal) => goal.id === form.sharedGoalId,
  );
  const displayGoal = selectedGoal ?? sharedGoals[0];
  const openQuests = game.quests.filter(
    (quest) => quest.playerId === player?.id && quest.state === "Open",
  );
  const nameOf = (person) => exampleText(t, examples.players, person, "name");

  function syncEdits(next) {
    setEdits(next);
    setRetained(writeEdits(recoveryKey, next));
  }

  function change(event) {
    const { name, value } = event.target;
    setError("");
    setInvalidField("");
    const next = {
      ...form,
      [name]: value,
      ...(name === "playerId" && { sharedGoalId: "" }),
    };
    syncEdits(
      sameForm(next, savedForm)
        ? null
        : { form: next, baseline: dirty ? edits.baseline : savedForm },
    );
  }

  function resolveConflict(keepEdits) {
    syncEdits(keepEdits ? { form, baseline: savedForm } : null);
    setError("");
    setInvalidField("");
  }

  function discard() {
    if (!window.confirm(words.confirmBack)) return false;
    syncEdits(null);
    setError("");
    setInvalidField("");
    return true;
  }

  function leave() {
    if (dirty && !retained && !discard()) return;
    if (hasDraft && returnPage === "quests") {
      navigate("quests", { questFilter: "Concepten" });
    } else {
      navigate(returnPage);
    }
  }

  function invalid(field, errorKey) {
    setError(errorKey);
    setInvalidField(field);
    if (field === "plus" || field === "minus") pointsRef.current.open = true;
    const input =
      field === "sharedGoalId"
        ? goalRef.current
        : formRef.current.elements.namedItem(field);
    input?.focus();
  }

  function validation(field) {
    return field === invalidField
      ? { "aria-invalid": true, "aria-describedby": errorId }
      : null;
  }

  function clearSavedEdits() {
    const stored = readEdits(recoveryKey, draftId);
    if (!stored || sameForm(stored.form, form)) writeEdits(recoveryKey, null);
    if (mounted.current) setEdits(null);
  }

  async function draftIsCurrent() {
    if (!hasDraft) return true;
    const response = await refresh();
    if (!mounted.current) return false;
    if (!response) {
      setError("error");
      return false;
    }
    const latestDraft = response.game.questDrafts?.find(
      ({ id }) => id === form.id,
    );
    if (latestDraft && sameForm(initialForm(latestDraft), savedForm))
      return true;
    setError("reviewUpdatedDraft");
    return false;
  }

  async function save(assign) {
    if (submitLock.current || conflict || missingDraft) return;
    const quest = {
      ...form,
      playerId: player?.id ?? null,
      sharedGoalId: selectedGoal?.id ?? null,
      name: form.name.trim(),
      desc: form.desc.trim(),
      submissionPrompt: form.submissionPrompt.trim(),
      completionCriteria: form.completionCriteria.trim(),
      plus: Number(form.plus),
      minus: Number(form.minus),
    };
    if (assign) {
      const required = [
        ["playerId", "missingPlayer"],
        ["name", "missingTitle"],
        ["desc", "missingAction"],
        ["submissionPrompt", "missingSubmission"],
        ["completionCriteria", "missingCriteria"],
      ];
      const missing = required.find(([field]) => !quest[field]);
      if (missing) return invalid(...missing);
    }
    if (form.sharedGoalId && !selectedGoal && player)
      return invalid("sharedGoalId", "goalUnavailable");
    const badScore = ["plus", "minus"].find(
      (field) => !isValidPoints(form[field]),
    );
    if (badScore) return invalid(badScore, "invalidPoints");

    submitLock.current = true;
    setError("");
    setInvalidField("");
    setOperation(assign ? "assigning" : "saving");
    try {
      if (!(await draftIsCurrent()) || !mounted.current) return;
      const response = await mutate(assign ? "quest" : "saveQuestDraft", {
        quest,
      });
      if (!response) {
        if (mounted.current) setError("error");
        return;
      }
      clearSavedEdits();
      if (!mounted.current) return;
      if (assign) {
        navigate("quests");
        setModal({ kind: "quest", id: response.questId ?? quest.id });
      } else if (!draftId) {
        navigate(
          "questEditor",
          { questEditor: { draftId: quest.id, returnPage } },
          { replace: true },
        );
      }
    } finally {
      submitLock.current = false;
      if (mounted.current) setOperation("");
    }
  }

  async function remove() {
    if (submitLock.current || conflict || !window.confirm(words.confirmRemove))
      return;
    submitLock.current = true;
    setError("");
    setInvalidField("");
    setOperation("deleting");
    try {
      if (!(await draftIsCurrent()) || !mounted.current) return;
      if (await mutate("deleteQuestDraft", { id: form.id })) {
        clearSavedEdits();
        if (mounted.current) navigate("quests", { questFilter: "Concepten" });
      } else if (mounted.current) setError("error");
    } finally {
      submitLock.current = false;
      if (mounted.current) setOperation("");
    }
  }

  const descriptions = [
    ["desc", "action", "actionExample", 450],
    ["submissionPrompt", "submission", "submissionExample", 300],
    ["completionCriteria", "criteria", "criteriaExample", 300],
  ];
  const preview = {
    ...form,
    name: form.name.trim(),
    desc: form.desc.trim(),
    submissionPrompt: form.submissionPrompt.trim(),
    completionCriteria: form.completionCriteria.trim(),
    plus: isValidPoints(form.plus) ? Number(form.plus) : 0,
    minus: isValidPoints(form.minus) ? Number(form.minus) : 0,
  };

  return (
    <div className="quest-editor">
      <Heading
        label={t("Spelleider")}
        title={hasDraft || missingDraft ? words.editDraft : words.newQuest}
      >
        <Button kind="secondary" onClick={leave} disabled={pending}>
          {words.back}
        </Button>
      </Heading>
      {conflict && (
        <div className="quest-editor-conflict" role="status">
          <p>{words.draftChanged}</p>
          <div className="quest-editor-buttons">
            <Button kind="secondary" onClick={() => resolveConflict(false)}>
              {words.useSaved}
            </Button>
            <Button kind="textbtn" onClick={() => resolveConflict(true)}>
              {words.keepEdits}
            </Button>
          </div>
        </div>
      )}
      {missingDraft ? (
        <p className="empty">{words.draftMissing}</p>
      ) : (
        <form
          className="quest-editor-layout"
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save(true);
          }}
        >
          <section className="quest-editor-fields" aria-label={words.newQuest}>
            <Field label={words.player}>
              <select
                name="playerId"
                {...validation("playerId")}
                value={form.playerId}
                onChange={change}
                required
                disabled={pending}
              >
                <option value="">{words.choosePlayer}</option>
                {[false, true].map((npc) => {
                  const choices = game.players.filter(
                    (person) => Boolean(person.npc) === npc,
                  );
                  return (
                    choices.length > 0 && (
                      <optgroup
                        key={String(npc)}
                        label={npc ? words.characters : words.players}
                      >
                        {choices.map((person) => (
                          <option key={person.id} value={person.id}>
                            {nameOf(person)}
                          </option>
                        ))}
                      </optgroup>
                    )
                  );
                })}
              </select>
            </Field>
            <Field label={words.title}>
              <input
                name="name"
                {...validation("name")}
                value={form.name}
                onChange={change}
                maxLength={60}
                required
                disabled={pending}
              />
            </Field>
            {descriptions.map(([name, label, hint, limit]) => (
              <Field key={name} label={words[label]}>
                <textarea
                  name={name}
                  {...validation(name)}
                  value={form[name]}
                  onChange={change}
                  placeholder={words[hint]}
                  maxLength={limit}
                  rows={name === "desc" ? 3 : 2}
                  required
                  disabled={pending}
                />
              </Field>
            ))}
            <details className="quest-editor-points" ref={pointsRef}>
              <summary>
                <span>{words.points}</span>
                <span className="quest-editor-score">
                  +{form.plus || 0} / −{form.minus || 0}
                </span>
              </summary>
              <div className="pair">
                {["plus", "minus"].map((field) => (
                  <Field key={field} label={words[field]}>
                    <input
                      name={field}
                      {...validation(field)}
                      type="number"
                      min="0"
                      max="999"
                      step="1"
                      value={form[field]}
                      onChange={change}
                      required
                      disabled={pending}
                    />
                  </Field>
                ))}
              </div>
            </details>
          </section>

          <aside className="quest-editor-aside">
            {player && (
              <section
                className="quest-editor-context"
                aria-label={nameOf(player)}
              >
                <div className="quest-editor-person">
                  <Avatar player={player} />
                  <strong>{nameOf(player)}</strong>
                </div>
                <div className="quest-editor-goal">
                  {sharedGoals.length || form.sharedGoalId ? (
                    <Field label={words.sharedGoal}>
                      <select
                        name="sharedGoalId"
                        {...validation("sharedGoalId")}
                        ref={goalRef}
                        value={form.sharedGoalId}
                        onChange={change}
                        disabled={pending}
                      >
                        <option value="">{words.noGoalLinked}</option>
                        {form.sharedGoalId && !selectedGoal && (
                          <option value={form.sharedGoalId} disabled>
                            {words.goalUnavailable}
                          </option>
                        )}
                        {sharedGoals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.text}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <p className="quest-editor-muted">{words.noSharedGoals}</p>
                  )}
                  {displayGoal && (
                    <div className="quest-editor-goal-detail">
                      <strong>{displayGoal.text}</strong>
                      <p>{displayGoal.action}</p>
                    </div>
                  )}
                </div>
                <section className="quest-editor-open">
                  <h3>{words.openQuests}</h3>
                  {openQuests.length ? (
                    <ul>
                      {openQuests.map((quest) => (
                        <li key={quest.id}>{questText(t, quest, "name")}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="quest-editor-muted">{words.noOpenQuests}</p>
                  )}
                </section>
              </section>
            )}
            <section
              className="quest-editor-preview"
              aria-labelledby={sectionId}
            >
              <h2 id={sectionId}>
                <Icon name="book" />
                {words.playerPreview}
              </h2>
              <div className="quest-editor-preview-inner">
                <div className="quest-editor-preview-header">
                  <h3>{preview.name || words.untitled}</h3>
                  <span className="status">{t("Open")}</span>
                </div>
                {player && (
                  <div className="quest-editor-preview-person">
                    <Avatar player={player} />
                    <span>{nameOf(player)}</span>
                  </div>
                )}
                {!preview.desc &&
                  !preview.submissionPrompt &&
                  !preview.completionCriteria && (
                    <p className="quest-editor-muted">{words.previewHint}</p>
                  )}
                <QuestBrief quest={preview} />
              </div>
            </section>
          </aside>
          <div className="quest-editor-footer">
            {error && (
              <p id={errorId} className="quest-editor-error" role="alert">
                {words[error]}
              </p>
            )}
            <div className="quest-editor-buttons">
              <Button
                type="submit"
                icon="swords"
                disabled={pending || conflict}
              >
                {operation === "assigning"
                  ? words.assigning
                  : player
                    ? words.assignTo(nameOf(player))
                    : words.assign}
              </Button>
              <Button
                kind="secondary"
                icon="pen"
                onClick={() => void save(false)}
                disabled={pending || conflict}
              >
                {operation === "saving" ? words.saving : words.save}
              </Button>
              {hasDraft && (
                <Button
                  kind="textbtn quest-editor-delete"
                  onClick={remove}
                  disabled={pending || conflict}
                >
                  {operation === "deleting" ? words.deleting : words.remove}
                </Button>
              )}
            </div>
            {dirty && !pending && !conflict && (
              <div className="quest-editor-local">
                {retained && <p role="status">{words.localEdits}</p>}
                <Button kind="textbtn" onClick={discard}>
                  {words.discard}
                </Button>
              </div>
            )}
            {hasDraft && !dirty && (
              <p className="quest-editor-saved" role="status">
                <Icon name="check" />
                {words.saved}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
