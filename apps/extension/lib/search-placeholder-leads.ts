import type { THumorIntensity } from "./settings";

/**
 * Maps humor settings to how spicy search placeholder copy may be.
 * Aligns with {@link THumorIntensity} ordering used by the humor engine.
 */
export function searchPlaceholderHumorRank(
  humorEnabled: boolean,
  humorIntensity: THumorIntensity,
): 0 | 1 | 2 | 3 {
  if (!humorEnabled || humorIntensity === "off") return 0;
  switch (humorIntensity) {
    case "mild":
      return 1;
    case "spicy":
      return 2;
    case "unhinged":
      return 3;
    default:
      return 0;
  }
}

/** Lead text only; UI adds `? (EngineName)`. */
const ENTRIES: ReadonlyArray<{ minRank: 0 | 1 | 2 | 3; lead: string }> = [
  // Rank 0 — humor off / intensity off: plain copy
  { minRank: 0, lead: "What are you looking for" },
  { minRank: 0, lead: "Enter your search query" },
  { minRank: 0, lead: "Type a query to search the web" },
  { minRank: 0, lead: "Search for something on the web" },
  { minRank: 0, lead: "What should we look up" },
  { minRank: 0, lead: "Look something up" },

  // Rank 1 — mild
  { minRank: 1, lead: "What rabbit hole earns your afternoon" },
  { minRank: 1, lead: "What fact will you forget in five minutes" },
  { minRank: 1, lead: "Research how long ‘one quick search’ actually takes" },
  { minRank: 1, lead: "Which wiki walk officially starts… now" },
  { minRank: 1, lead: "What problem gets outsourced to autocomplete today" },
  { minRank: 1, lead: "What did that song actually say before you misheard it forever" },
  { minRank: 1, lead: "Find the exact clip you only half-remember from 2009" },

  // Rank 2 — spicy
  { minRank: 2, lead: "Summon answers from the hive mind" },
  { minRank: 2, lead: "Type the thing you’d explain badly at a party" },
  { minRank: 2, lead: "What are you pretending is real work right now" },
  { minRank: 2, lead: "The tab bar demands tribute—give it a query" },
  { minRank: 2, lead: "Which lore will you unsolicited-explain tomorrow" },
  { minRank: 2, lead: "What slang are you decoding for ‘research’" },
  { minRank: 2, lead: "Ask the indexed void something unnecessary" },
  { minRank: 2, lead: "Which hyperfixation are we responsibly feeding" },
  { minRank: 2, lead: "Look up the thing you’ll confidently misremember later" },
  { minRank: 2, lead: "Recipe, existential doubt, or cursed animal fact—pick your fighter" },
  { minRank: 2, lead: "Decide whether this is procrastination or ‘due diligence’" },
  { minRank: 2, lead: "Peek outside the walled garden—with maximum drama" },
  { minRank: 2, lead: "What will you skim, screenshot, then never revisit" },
  { minRank: 2, lead: "Consult the oracle (it has ads and drama in equal measure)" },
  { minRank: 2, lead: "Which answer do you already know but refuse to admit" },
  { minRank: 2, lead: "Type the question that births twelve follow-ups minimum" },
  { minRank: 2, lead: "What acronym is gatekeeping your entire industry today" },
  { minRank: 2, lead: "Be honest: are you shopping, stalking, or ‘learning’" },
  { minRank: 2, lead: "What error code are you about to blame on the router" },
  { minRank: 2, lead: "How deep is this stack overflow before you admit defeat" },
  { minRank: 2, lead: "Which country’s flag are you about to misidentify boldly" },
  { minRank: 2, lead: "What’s the canonical order of a franchise you’ll never finish" },
  { minRank: 2, lead: "What’s the difference between these two almost-identical GPUs" },
  { minRank: 2, lead: "Is it a bug, a feature, or user error—place your bets" },
  { minRank: 2, lead: "Innocent question → fourteen tabs → sudden dawn" },

  // Rank 3 — unhinged
  { minRank: 3, lead: "What useless trivia validates your fragile ego today" },
  { minRank: 3, lead: "Which celebrity drama do you need summarized in one tab" },
  { minRank: 3, lead: "Name the symptom you should probably not Web-MD" },
  { minRank: 3, lead: "Who had the worst take this week—let’s validate that" },
  { minRank: 3, lead: "Translate millennial panic into Gen-Alpha vocabulary" },
];

/** All placeholder leads permitted at this humor rank (cumulative: includes lower tiers). */
export function searchPlaceholderLeadsForHumorRank(rank: 0 | 1 | 2 | 3): readonly string[] {
  return ENTRIES.filter((e) => e.minRank <= rank).map((e) => e.lead);
}

/**
 * Pick a random placeholder lead allowed for this humor rank.
 * Caller should memoize per rank if the line should stay stable until settings change.
 */
export function pickSearchPlaceholderLeadForHumorRank(rank: 0 | 1 | 2 | 3): string {
  const pool = searchPlaceholderLeadsForHumorRank(rank);
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice ?? ENTRIES[0].lead;
}
