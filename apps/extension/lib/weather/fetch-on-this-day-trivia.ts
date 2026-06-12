import { privilegedExtensionFetchJson } from "../privileged-extension-fetch";
import {
  buildWikimediaOnThisDayUrl,
  pickOnThisDayFacts,
  type IOnThisDayFact,
} from "./parse-on-this-day-trivia";

export type { IOnThisDayFact } from "./parse-on-this-day-trivia";
export { buildWikimediaOnThisDayUrl, pickOnThisDayFacts } from "./parse-on-this-day-trivia";

const TABOCALYPSE_WIKIMEDIA_USER_AGENT =
  "Tabocalypse/1.0 (https://github.com/AlienFacepalm/tabocalypse; new-tab extension)";

export async function fetchOnThisDayTrivia(
  when = new Date(),
  language = "en",
): Promise<IOnThisDayFact[]> {
  const month = when.getMonth() + 1;
  const day = when.getDate();
  const url = buildWikimediaOnThisDayUrl(month, day, language);
  const data = (await privilegedExtensionFetchJson(url, undefined, {
    "User-Agent": TABOCALYPSE_WIKIMEDIA_USER_AGENT,
    Accept: "application/json",
  })) as Parameters<typeof pickOnThisDayFacts>[0];
  return pickOnThisDayFacts(data);
}
