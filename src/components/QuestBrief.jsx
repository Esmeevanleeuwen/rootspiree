import { questText, useI18n } from "../i18n.jsx";

export function QuestBrief({ quest, submissionId, heading: Heading = "h3" }) {
  const { t } = useI18n();
  const action = questText(t, quest, "desc");
  const structured = Boolean(
    quest.submissionPrompt || quest.completionCriteria,
  );
  return (
    <div className="quest-brief">
      {action && (
        <div>
          {structured && <Heading>{t("Wat je gaat proberen")}</Heading>}
          <p>{action}</p>
        </div>
      )}
      {quest.submissionPrompt && (
        <div>
          <Heading>{t("Wat je instuurt")}</Heading>
          <p id={submissionId}>{quest.submissionPrompt}</p>
        </div>
      )}
      {quest.completionCriteria && (
        <div>
          <Heading>{t("Je bent klaar als")}</Heading>
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
