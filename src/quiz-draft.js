import { agreement, statements } from "./content.js";
import {
  legacyFullQuizLength,
  legacyQuizPrefixLength,
} from "./personality-questions.js";

export const quizPageSize = 6;
export const quizPageCount = Math.ceil(statements.length / quizPageSize);

const legacyPartialQuizLength = 64;
const questionsBeforeGap = 42;

export function restoreQuizDraft(draft) {
  const empty = { page: 0, answers: Array(statements.length).fill(null) };
  const answers = draft?.answers;
  if (
    !Array.isArray(answers) ||
    ![statements.length, legacyPartialQuizLength, legacyFullQuizLength].includes(
      answers.length,
    ) ||
    answers.some(
      (answer) =>
        answer !== null &&
        (!Number.isInteger(answer) || answer < 0 || answer >= agreement.length),
    )
  )
    return empty;

  if (answers.length !== statements.length) {
    const kept = answers.slice(legacyQuizPrefixLength);
    // The 64-question version was missing supplied statements 43–54.
    if (answers.length === legacyPartialQuizLength) {
      kept.splice(
        questionsBeforeGap,
        0,
        ...Array(statements.length - kept.length).fill(null),
      );
    }
    const firstMissing = kept.indexOf(null);
    const page =
      firstMissing === -1
        ? quizPageCount - 1
        : Math.floor(firstMissing / quizPageSize);
    return { page, answers: kept };
  }

  if (
    !Number.isInteger(draft.page) ||
    draft.page < 0 ||
    draft.page >= quizPageCount ||
    answers.slice(0, draft.page * quizPageSize).includes(null)
  )
    return empty;
  return draft;
}
