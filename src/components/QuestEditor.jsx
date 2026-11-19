import { useId, useRef, useState } from "react";
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
    remove: "Concept verwijderen",
    confirmRemove: "Dit concept verwijderen?",
    confirmBack: "Je wijzigingen zonder opslaan sluiten?",
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

function initialForm(draft, playerId, sharedGoalId) {
  return {
    id: draft?.id ?? newId(),
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

function isValidPoints(value) {
  const points = Number(value);
  return (
    value.trim() !== "" &&
    Number.isInteger(points) &&
    points >= 0 &&
    points <= 999
  );
}

export function QuestEditor({
  playerId,
  sharedGoalId,
  draftId,
  returnPage = "quests",
}) {
  const { language, t } = useI18n();
  const words = copy[language];
  const { game, navigate, mutate, setModal } = useGame();
  const initialDraft = game.questDrafts?.find((draft) => draft.id === draftId);
  const [form, setForm] = useState(() =>
    initialForm(initialDraft, playerId, sharedGoalId),
  );
  const [baseline, setBaseline] = useState(form);
  const [hasDraft, setHasDraft] = useState(Boolean(initialDraft));
  const [missingDraft] = useState(Boolean(draftId && !initialDraft));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitLock = useRef(false);
  const formRef = useRef(null);
  const pointsRef = useRef(null);
  const goalRef = useRef(null);
  const sectionId = useId();
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
  const dirty = Object.keys(form).some(
    (field) => form[field] !== baseline[field],
  );
  const nameOf = (person) => exampleText(t, examples.players, person, "name");

  function change(event) {
    const { name, value } = event.target;
    setError("");
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "playerId" && { sharedGoalId: "" }),
    }));
  }

  function leave() {
    if (!dirty || window.confirm(words.confirmBack)) {
      if (hasDraft && returnPage === "quests") {
        navigate("quests", { questFilter: "Concepten" });
      } else {
        navigate(returnPage);
      }
    }
  }

  function invalid(field, errorKey) {
    setError(errorKey);
    if (field === "plus" || field === "minus") pointsRef.current.open = true;
    const input =
      field === "sharedGoalId"
        ? goalRef.current
        : formRef.current.elements.namedItem(field);
    input?.focus();
  }

  async function save(assign) {
    if (submitLock.current) return;
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
    setPending(true);
    try {
      const response = await mutate(assign ? "quest" : "saveQuestDraft", {
        quest,
      });
      if (!response) {
        setError("error");
        return;
      }
      if (assign) {
        navigate("quests");
        setModal({ kind: "quest", id: response.questId ?? quest.id });
        return;
      }
      const saved =
        response.game.questDrafts?.find((draft) => draft.id === quest.id) ??
        quest;
      const result = initialForm(saved);
      setForm(result);
      setBaseline(result);
      setHasDraft(true);
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  async function remove() {
    if (submitLock.current || !window.confirm(words.confirmRemove)) return;
    submitLock.current = true;
    setError("");
    setPending(true);
    try {
      if (await mutate("deleteQuestDraft", { id: form.id })) {
        navigate("quests", { questFilter: "Concepten" });
      } else setError("error");
    } finally {
      submitLock.current = false;
      setPending(false);
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
              <p className="quest-editor-error" role="alert">
                {words[error]}
              </p>
            )}
            <div className="quest-editor-buttons">
              <Button type="submit" icon="flag" disabled={pending}>
                {player ? words.assignTo(nameOf(player)) : words.assign}
              </Button>
              <Button
                kind="secondary"
                icon="pen"
                onClick={() => void save(false)}
                disabled={pending}
              >
                {words.save}
              </Button>
              {hasDraft && (
                <Button
                  kind="textbtn quest-editor-delete"
                  onClick={remove}
                  disabled={pending}
                >
                  {words.remove}
                </Button>
              )}
            </div>
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
