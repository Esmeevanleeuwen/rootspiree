import { createContext, useContext, useMemo } from "react";
import { contentEnglish } from "./content.en.js";
import { examples } from "./examples.js";
import { uiEnglish } from "./ui.en.js";

const english = { ...contentEnglish, ...uiEnglish };
const I18nContext = createContext({
  language: "en",
  t: (text, values) => translate("en", text, values),
});

export function translate(language, text, values) {
  if (typeof text !== "string") return text;
  const message =
    language === "en" && Object.hasOwn(english, text) ? english[text] : text;
  return values
    ? message.replace(/\{(\w+)\}/g, (part, key) =>
        Object.hasOwn(values, key) ? String(values[key]) : part,
      )
    : message;
}

export function I18nProvider({ language, children }) {
  const value = useMemo(
    () => ({
      language,
      t: (text, values) => translate(language, text, values),
    }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function exampleText(t, records, record, field) {
  return records.some(
    (sample) => sample.id === record.id && sample[field] === record[field],
  )
    ? t(record[field])
    : record[field];
}

export function questText(t, quest, field) {
  if (quest.goalId && (field === "name" || field === "desc"))
    return t(quest[field]);
  return exampleText(t, examples.quests, quest, field);
}

export function exerciseStepText(t, step, index) {
  if (index < 2) return step;
  const prefix = "Je merkt vooruitgang als ";
  return step.startsWith(prefix) && step.endsWith(".")
    ? t("Je merkt vooruitgang als {sign}.", {
        sign: step.slice(prefix.length, -1),
      })
    : t(step);
}
