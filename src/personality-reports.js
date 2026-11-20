import { typeCode } from "./game.js";
import { intuitiveProfiles } from "./personality-profiles-intuitive.js";
import { observantProfiles } from "./personality-profiles-observant.js";

export const personalityProfiles = {
  ...intuitiveProfiles,
  ...observantProfiles,
};

export const profileFamilies = {
  analysts: ["INTJ", "INTP", "ENTJ", "ENTP"],
  diplomats: ["INFJ", "INFP", "ENFJ", "ENFP"],
  sentinels: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  explorers: ["ISTP", "ISFP", "ESTP", "ESFP"],
};

export const profileCodes = Object.values(profileFamilies).flat();

export function officialTypeUrl(code, language) {
  if (!profileCodes.includes(code)) return null;
  const slug = code.toLowerCase();
  const path =
    language === "nl" ? `/nl/${slug}-persoonlijkheid` : `/${slug}-personality`;
  return "https://www.16personalities.com" + path;
}

export function describePersonality(scores) {
  const code = typeCode(scores);
  const profile = personalityProfiles[code] ?? null;
  const pressure = scores[4];
  const suffix = pressure > 0 ? "A" : pressure < 0 ? "T" : "";
  const matches = profileCodes.filter((candidate) =>
    Array.from(code).every(
      (letter, index) => letter === "X" || letter === candidate[index],
    ),
  );
  return {
    code,
    matches,
    displayCode: profile && suffix ? `${code}-${suffix}` : code,
  };
}
