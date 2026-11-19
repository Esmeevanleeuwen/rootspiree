import { useEffect, useId, useRef, useState } from "react";
import { api } from "../api.js";
import { agreement, originalQuizLength, statements } from "../content.js";
import { translate } from "../i18n.jsx";
import { BrandLockup, Button, Field, Icon } from "./ui.jsx";
import { LandingNavigation, LandingPage } from "./LandingPage.jsx";
import "../entry.css";

const copy = {
  en: {
    language: "Language",
    home: "Back to the homepage",
    login: "Log in",
    logout: "Log out",
    loggingIn: "Logging in…",
    creatingAccount: "Creating your account…",
    savingAnswers: "Saving your answers…",
    savingQuiz: "Saving your quiz…",
    create: "Create an account",
    enter: "Enter the game",
    resume: "Continue setup",
    email: "Email",
    name: "Name",
    password: "Password",
    passwordHint: "Use 12 to 128 characters.",
    accountStep: "Account",
    profileStep: "About you",
    quizStep: "Personality quiz",
    progress: "Account setup",
    profileIntro:
      "A few details help make your experience more personal. You can leave any question blank.",
    hobbies: "What do you like to do in your free time?",
    job: "What do you do for work or study?",
    goals: "What are your personal goals in life?",
    interests: "What topics or ideas interest you?",
    continue: "Continue",
    back: "Back",
    finish: "Finish setup",
    answerRequired: "Choose one answer for each statement on this page.",
    part: (current, pages) => `Part ${current} of ${pages}`,
    range: (start, end, total) => `Statements ${start}–${end} of ${total}`,
  },
  nl: {
    language: "Taal",
    home: "Terug naar de homepage",
    login: "Inloggen",
    logout: "Uitloggen",
    loggingIn: "Bezig met inloggen…",
    creatingAccount: "Je account aanmaken…",
    savingAnswers: "Je antwoorden opslaan…",
    savingQuiz: "Je quiz opslaan…",
    create: "Account aanmaken",
    enter: "Open het spel",
    resume: "Ga verder met instellen",
    email: "E-mailadres",
    name: "Naam",
    password: "Wachtwoord",
    passwordHint: "Gebruik 12 tot 128 tekens.",
    accountStep: "Account",
    profileStep: "Over jou",
    quizStep: "Persoonlijkheidsquiz",
    progress: "Account instellen",
    profileIntro:
      "Met een paar details maak je het spel persoonlijker. Je kunt elke vraag leeg laten.",
    hobbies: "Wat doe je graag in je vrije tijd?",
    job: "Wat doe je voor werk of studie?",
    goals: "Wat zijn je persoonlijke doelen in het leven?",
    interests: "Welke onderwerpen of ideeën interesseren je?",
    continue: "Verder",
    back: "Terug",
    finish: "Instellen afronden",
    answerRequired: "Kies een antwoord voor elke stelling op deze pagina.",
    part: (current, pages) => `Deel ${current} van ${pages}`,
    range: (start, end, total) => `Stellingen ${start}–${end} van ${total}`,
  },
};

const errors = {
  invalid_input: [
    "Check your details and try again.",
    "Controleer je gegevens en probeer het opnieuw.",
  ],
  invalid_email: [
    "Enter a valid email address.",
    "Vul een geldig e-mailadres in.",
  ],
  invalid_name: ["Enter a name.", "Vul een naam in."],
  invalid_password: [
    "Use a password with 12 to 128 characters.",
    "Gebruik een wachtwoord met 12 tot 128 tekens.",
  ],
  email_in_use: [
    "An account with this email already exists. Log in to continue.",
    "Er bestaat al een account met dit e-mailadres. Log in om verder te gaan.",
  ],
  invalid_credentials: [
    "Check your email and password and try again.",
    "Controleer je e-mailadres en wachtwoord en probeer het opnieuw.",
  ],
  unauthenticated: [
    "Your session ended. Log in to continue.",
    "Je sessie is verlopen. Log in om verder te gaan.",
  ],
  profile_required: [
    "Save the about-you step before starting the quiz.",
    "Sla de stap ‘Over jou’ op voordat je met de quiz begint.",
  ],
  invalid_answers: [
    "Answer every statement before finishing.",
    "Beantwoord alle stellingen voordat je afrondt.",
  ],
  rate_limited: [
    "Too many attempts. Wait a few minutes and try again.",
    "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.",
  ],
};

const profileFields = ["hobbies", "job", "goals", "interests"];
const pageSize = 6;
const pageCount = Math.ceil(statements.length / pageSize);
const previousQuizLength = originalQuizLength + 48;
// The previous draft jumps from supplied statement 42 to 55.
const previousQuizGapIndex = originalQuizLength + 42;

export function LanguageSelector({ language, setLanguage }) {
  const strings = copy[language];
  return (
    <div className="entry-language" role="group" aria-label={strings.language}>
      <button
        type="button"
        lang="en"
        onClick={() => setLanguage("en")}
        aria-label="English"
        aria-pressed={language === "en"}
      >
        <span className="entry-language-full">English</span>
        <span className="entry-language-short" aria-hidden="true">
          EN
        </span>
      </button>
      <button
        type="button"
        lang="nl"
        onClick={() => setLanguage("nl")}
        aria-label="Nederlands"
        aria-pressed={language === "nl"}
      >
        <span className="entry-language-full">Nederlands</span>
        <span className="entry-language-short" aria-hidden="true">
          NL
        </span>
      </button>
    </div>
  );
}

function Wordmark({ onHome, label }) {
  return (
    <button
      className="entry-brand"
      type="button"
      onClick={onHome}
      aria-label={label}
    >
      <BrandLockup />
    </button>
  );
}

function Problem({ error, language }) {
  const message = useRef(null);
  useEffect(() => {
    if (error) message.current?.focus();
  }, [error]);
  if (!error) return null;
  const localized = errors[error] ?? [
    "Something went wrong. Please try again.",
    "Er ging iets mis. Probeer het opnieuw.",
  ];
  return (
    <p className="entry-error" role="alert" ref={message} tabIndex="-1">
      {localized[language === "nl" ? 1 : 0]}
    </p>
  );
}

function Auth({ strings, language, go, onAccount, mode }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "register";
  const title = isSignup ? strings.create : strings.login;
  const submitLock = useRef(false);
  const pendingLabel = isSignup ? strings.creatingAccount : strings.loggingIn;
  useEffect(() => setError(""), [isSignup]);
  async function submit(event) {
    event.preventDefault();
    if (submitLock.current) return;
    const fields = new FormData(event.currentTarget);
    const email = fields.get("email").trim();
    const password = fields.get("password");
    const name = fields.get("name")?.trim();
    if (isSignup && !name) {
      setError("invalid_name");
      return;
    }
    if (isSignup && ([...password].length < 12 || [...password].length > 128)) {
      setError("invalid_password");
      return;
    }
    submitLock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = isSignup
        ? { email, name, password, language }
        : { email, password };
      const { account } = await api("/" + mode, { method: "POST", data });
      onAccount(account);
      go(account.onboardingComplete ? "game" : "onboard");
    } catch (error) {
      setError(error.message);
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  function choose(nextMode) {
    if (nextMode === mode) return;
    go(nextMode === "register" ? "register" : "auth");
  }
  return (
    <main className="entry-auth">
      <div className="entry-auth-art" aria-hidden="true" />
      <div className="entry-auth-content">
        <div
          className="entry-auth-picker"
          role="group"
          aria-label={strings.accountStep}
        >
          <button
            type="button"
            aria-pressed={!isSignup}
            onClick={() => choose("login")}
            disabled={busy}
          >
            {strings.login}
          </button>
          <button
            type="button"
            aria-pressed={isSignup}
            onClick={() => choose("register")}
            disabled={busy}
          >
            {strings.create}
          </button>
        </div>
        <form className="entry-form" aria-label={title} onSubmit={submit}>
          <h1>{title}</h1>
          <Field label={strings.email}>
            <input
              name="email"
              type="email"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete={isSignup ? "email" : "username"}
              required
              maxLength={254}
              disabled={busy}
            />
          </Field>
          {isSignup && (
            <Field label={strings.name}>
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                disabled={busy}
              />
            </Field>
          )}
          <Field label={strings.password}>
            <input
              key={mode}
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              disabled={busy}
              aria-describedby={isSignup ? "entry-password-hint" : undefined}
            />
          </Field>
          {isSignup && (
            <p className="entry-hint" id="entry-password-hint">
              {strings.passwordHint}
            </p>
          )}
          <Problem error={error} language={language} />
          <Button
            type="submit"
            kind="primary entry-action"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? pendingLabel : title}
          </Button>
          <span className="entry-announcement" role="status">
            {busy ? pendingLabel : ""}
          </span>
        </form>
      </div>
    </main>
  );
}

export function QuizForm({
  language,
  answers,
  onAnswers,
  onSubmit,
  busy,
  error,
  initialPage = 0,
  onPageChange,
  onBack,
  finishLabel,
}) {
  const strings = copy[language];
  const t = (value) => translate(language, value);
  const [page, setPage] = useState(initialPage);
  const [missing, setMissing] = useState(null);
  const intro = useRef(null);
  const previousPage = useRef(initialPage);
  const questions = useRef(new Map());
  const missingId = useId();
  const start = page * pageSize;
  const end = Math.min(start + pageSize, statements.length);
  const finalPage = page === pageCount - 1;
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    intro.current?.focus();
  }, [page]);
  useEffect(() => {
    if (missing !== null) questions.current.get(missing)?.focus();
  }, [missing]);

  function changePage(next) {
    setPage(next);
    onPageChange?.(next);
    setMissing(null);
  }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    for (let i = start; i < end; i++) {
      if (!Number.isInteger(answers[i])) {
        if (missing === i) questions.current.get(i)?.focus();
        setMissing(i);
        return;
      }
    }
    if (finalPage) onSubmit();
    else changePage(page + 1);
  }
  return (
    <form className="test-sheet entry-quiz" onSubmit={submit} noValidate>
      <div className="test-progress" ref={intro} tabIndex="-1">
        <span>{strings.part(page + 1, pageCount)}</span>
        <span>{strings.range(start + 1, end, statements.length)}</span>
      </div>
      <progress
        max={pageCount}
        value={page + 1}
        aria-label={t("Pagina van de persoonlijkheidstest")}
      />
      <p>
        {t("In hoeverre herken je jezelf? De middelste keuze is neutraal.")}
      </p>
      {statements.slice(start, end).map(([, sentence, english], offset) => {
        const index = start + offset;
        return (
          <fieldset
            className="statement"
            key={index}
            disabled={busy}
            ref={(element) => {
              if (element) questions.current.set(index, element);
              else questions.current.delete(index);
            }}
            tabIndex="-1"
            aria-describedby={missing === index ? missingId : undefined}
          >
            <legend>
              {index + 1}.{" "}
              {language === "en" && english ? english : t(sentence)}
            </legend>
            <div className="rating">
              {agreement.map((label, value) => (
                <label key={label} title={t(label)}>
                  <input
                    type="radio"
                    name={"statement-" + index}
                    required
                    aria-label={t(label)}
                    checked={answers[index] === value}
                    onChange={() => {
                      if (missing === index) setMissing(null);
                      onAnswers(
                        answers.map((answer, i) =>
                          i === index ? value : answer,
                        ),
                      );
                    }}
                  />
                  <span aria-hidden="true" />
                </label>
              ))}
            </div>
            <div className="rating-caption" aria-hidden="true">
              <span>{t(agreement[0])}</span>
              <span>{t(agreement.at(-1))}</span>
            </div>
            <output className="answer-word" aria-live="polite">
              {answers[index] == null ? "" : t(agreement[answers[index]])}
            </output>
            {missing === index && (
              <p className="entry-error" id={missingId} role="alert">
                {strings.answerRequired}
              </p>
            )}
          </fieldset>
        );
      })}
      <Problem error={error} language={language} />
      <div className="actions">
        <Button type="submit" disabled={busy} aria-busy={busy}>
          {busy
            ? strings.savingQuiz
            : finalPage
              ? (finishLabel ?? strings.finish)
              : strings.continue}
        </Button>
        {(page > 0 || onBack) && (
          <Button
            kind="textbtn"
            disabled={busy}
            onClick={() => (page > 0 ? changePage(page - 1) : onBack())}
          >
            {strings.back}
          </Button>
        )}
      </div>
      <span className="entry-announcement" role="status">
        {busy ? strings.savingQuiz : ""}
      </span>
    </form>
  );
}

function readEntryDraft(kind, accountId) {
  try {
    return JSON.parse(
      sessionStorage.getItem("rootspiree-" + kind + ":" + accountId),
    );
  } catch {
    return null;
  }
}

function writeEntryDraft(kind, accountId, draft) {
  const key = "rootspiree-" + kind + ":" + accountId;
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch {
    // Storage may be blocked; edits remain available for this visit.
  }
}

function loadProfileDraft(account) {
  const draft = readEntryDraft("profile", account.id);
  const saved = Object.fromEntries(
    profileFields.map((key) => [key, account.profile?.[key] ?? ""]),
  );
  const canRestore =
    draft &&
    profileFields.every(
      (key) => typeof draft[key] === "string" && draft[key].length <= 500,
    ) &&
    profileFields.some((key) => draft[key] !== saved[key]);
  return canRestore
    ? { fields: draft, restored: true }
    : { fields: saved, restored: false };
}

function loadQuizDraft(accountId) {
  const empty = { page: 0, answers: Array(statements.length).fill(null) };
  const draft = readEntryDraft("quiz", accountId);
  if (
    !Array.isArray(draft?.answers) ||
    ![originalQuizLength, previousQuizLength, statements.length].includes(
      draft.answers.length,
    ) ||
    draft.answers.some(
      (answer) =>
        answer !== null &&
        (!Number.isInteger(answer) || answer < 0 || answer >= agreement.length),
    )
  )
    return empty;

  if (draft.answers.length !== statements.length) {
    const insertionIndex =
      draft.answers.length === originalQuizLength
        ? originalQuizLength
        : previousQuizGapIndex;
    const answers = [
      ...draft.answers.slice(0, insertionIndex),
      ...Array(statements.length - draft.answers.length).fill(null),
      ...draft.answers.slice(insertionIndex),
    ];
    return { answers, page: Math.floor(answers.indexOf(null) / pageSize) };
  }
  if (
    !Number.isInteger(draft.page) ||
    draft.page < 0 ||
    draft.page >= pageCount ||
    draft.answers.slice(0, draft.page * pageSize).includes(null)
  )
    return empty;
  return draft;
}

function Onboarding({ account, language, strings, onAccount, go }) {
  const [initialProfile] = useState(() => loadProfileDraft(account));
  const [profile, setProfile] = useState(initialProfile.fields);
  const [step, setStep] = useState(
    account.profileComplete && !initialProfile.restored ? "quiz" : "profile",
  );
  const [draft, setDraft] = useState(() => loadQuizDraft(account.id));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitLock = useRef(false);
  const heading = useRef(null);
  const onQuiz = step === "quiz";
  useEffect(() => heading.current?.focus(), [step]);
  function changeDraft(nextDraft) {
    setDraft(nextDraft);
    writeEntryDraft("quiz", account.id, nextDraft);
  }
  async function submit(path, method, data) {
    if (submitLock.current) return;
    submitLock.current = true;
    setError("");
    setBusy(true);
    try {
      const { account: updated } = await api(path, { method, data });
      onAccount(updated);
      if (path === "/onboarding") {
        writeEntryDraft("quiz", updated.id, null);
        writeEntryDraft("profile", updated.id, null);
        go("game");
      } else {
        writeEntryDraft("profile", updated.id, null);
        setProfile(updated.profile);
        setStep("quiz");
      }
    } catch (error) {
      setError(error.message);
      if (error.message === "unauthenticated") {
        onAccount(null);
        go("auth");
      } else if (error.message === "profile_required") {
        setStep("profile");
      }
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  function changeProfile(event) {
    const { name, value } = event.target;
    const next = { ...profile, [name]: value };
    setProfile(next);
    writeEntryDraft("profile", account.id, next);
  }
  function saveProfile(event) {
    event.preventDefault();
    const answers = Object.fromEntries(
      profileFields.map((key) => [key, profile[key].trim()]),
    );
    void submit("/profile", "PATCH", { profile: answers });
  }
  return (
    <main className="entry-setup">
      <ol className="entry-steps" aria-label={strings.progress}>
        <li>
          <Icon name="check" />
          {strings.accountStep}
        </li>
        <li aria-current={onQuiz ? undefined : "step"}>
          {onQuiz && <Icon name="check" />}
          {strings.profileStep}
        </li>
        <li aria-current={onQuiz ? "step" : undefined}>{strings.quizStep}</li>
      </ol>
      <h1 ref={heading} tabIndex="-1">
        {onQuiz ? strings.quizStep : strings.profileStep}
      </h1>
      {onQuiz ? (
        <QuizForm
          language={language}
          answers={draft.answers}
          initialPage={draft.page}
          onPageChange={(page) => changeDraft({ ...draft, page })}
          onAnswers={(answers) => changeDraft({ ...draft, answers })}
          onBack={() => {
            setStep("profile");
            setError("");
          }}
          onSubmit={() =>
            submit("/onboarding", "POST", { answers: draft.answers })
          }
          busy={busy}
          error={error}
          finishLabel={strings.finish}
        />
      ) : (
        <form className="entry-form entry-profile-form" onSubmit={saveProfile}>
          <p>{strings.profileIntro}</p>
          {profileFields.map((name) => (
            <Field key={name} label={strings[name]}>
              <textarea
                name={name}
                rows={2}
                maxLength={500}
                value={profile[name]}
                onChange={changeProfile}
                disabled={busy}
              />
            </Field>
          ))}
          <Problem error={error} language={language} />
          <Button
            type="submit"
            kind="primary entry-action"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? strings.savingAnswers : strings.continue}
          </Button>
          <span className="entry-announcement" role="status">
            {busy ? strings.savingAnswers : ""}
          </span>
        </form>
      )}
    </main>
  );
}

export function Entry({
  account,
  language,
  setLanguage,
  onAccount,
  screen,
  go,
  onLogout,
  authError,
}) {
  const strings = copy[language];
  const focus = useRef(null);
  const logoutAccount = useRef(null);
  const isLanding = screen === "landing";
  const authMode = screen === "register" ? "register" : "login";
  const accountId = account?.id;
  useEffect(() => {
    if (logoutAccount.current && logoutAccount.current !== accountId) {
      writeEntryDraft("profile", logoutAccount.current, null);
      logoutAccount.current = null;
    }
  }, [accountId]);
  useEffect(() => {
    const sectionId = isLanding ? window.location.hash.slice(1) : "";
    const section = [
      "welcome",
      "world-preview",
      "how-it-works",
      "example-quest",
    ].includes(sectionId)
      ? document.getElementById(sectionId)
      : null;
    const heading =
      section?.querySelector("h1, h2") ?? focus.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    if (section) section.scrollIntoView?.();
    else window.scrollTo(0, 0);
  }, [screen, isLanding]);
  function openHome() {
    go("landing");
    if (isLanding) {
      window.scrollTo(0, 0);
      focus.current?.querySelector("h1")?.focus({ preventScroll: true });
    }
  }
  function logout() {
    logoutAccount.current = accountId;
    onLogout();
  }
  return (
    <div
      className={"entry-site" + (isLanding ? " landing-site" : "")}
      ref={focus}
    >
      <header className="entry-masthead">
        <div className="entry-header">
          <Wordmark label={strings.home} onHome={openHome} />
          {isLanding && <LandingNavigation language={language} />}
          <div className="entry-header-actions">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            {isLanding && !account && (
              <Button kind="landing-login" onClick={() => go("auth")}>
                {strings.login}
              </Button>
            )}
            {account && onLogout && (
              <Button kind="textbtn" onClick={logout}>
                {strings.logout}
              </Button>
            )}
          </div>
        </div>
      </header>
      {authError && (
        <p className="entry-error entry-session-error" role="alert">
          {authError}
        </p>
      )}
      {isLanding && (
        <LandingPage
          account={account}
          language={language}
          accountCopy={strings}
          go={go}
        />
      )}
      {(screen === "auth" || screen === "register") && (
        <Auth
          strings={strings}
          language={language}
          go={go}
          onAccount={onAccount}
          mode={authMode}
        />
      )}
      {screen === "onboard" && account && (
        <Onboarding
          key={account.id}
          account={account}
          language={language}
          strings={strings}
          onAccount={onAccount}
          go={go}
        />
      )}
    </div>
  );
}
