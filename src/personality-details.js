import { analystDetails } from "./personality-details-analysts.js";
import { diplomatDetails } from "./personality-details-diplomats.js";
import { explorerDetails } from "./personality-details-explorers.js";
import { sentinelDetails } from "./personality-details-sentinels.js";

export const personalityDetails = {
  ...analystDetails,
  ...diplomatDetails,
  ...sentinelDetails,
  ...explorerDetails,
};
