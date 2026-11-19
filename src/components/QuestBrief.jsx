import { questText, useI18n } from "../i18n.jsx";

export function QuestBrief({ quest, submissionId }) {
  const { t } = useI18n();
  const action = questText(t, quest, "desc");
  const structured = Boolean(
    quest.submissionPrompt || quest.completionCriteria,
  );
  return (
    <div className="quest-brief">
      {action && (
        <div>
          {structured && <h3>{t("Wat je gaat proberen")}</h3>}
          <p>{action}</p>
        </div>
      )}
      {quest.submissionPrompt && (
        <div>
          <h3>{t("Wat je instuurt")}</h3>
          <p id={submissionId}>{quest.submissionPrompt}</p>
        </div>
      )}
      {quest.completionCriteria && (
        <div>
          <h3>{t("Je bent klaar als")}</h3>
          <p>{quest.completionCriteria}</p>
        </div>
      )}
      <div className="detailbox">
        {t("Behaald")} <b>+{quest.plus} pt</b> · {t("Niet behaald")}{" "}
        <b>−{quest.minus} pt</b>
      </div>
    </div>
  );
}
