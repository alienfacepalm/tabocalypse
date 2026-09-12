import type { IRewardCatalogEntry } from "./reward-catalog-logic";

const AUTHOR = "Tabocalypse";

/**
 * Bundled rewards unlocked with quiz XP. Every entry is an ordinary v1 declarative plugin
 * (no code, no ads, https-only links) and is validated by `reward-catalog-logic.test.ts`.
 */
export const REWARD_CATALOG: readonly IRewardCatalogEntry[] = [
  {
    id: "reward-focus-mantras",
    title: "Focus mantras",
    description: "A rotating card of short reminders for getting one thing done at a time.",
    costXp: 30,
    plugin: {
      schemaVersion: 1,
      id: "reward-focus-mantras",
      name: "Focus mantras",
      version: "1.0.0",
      author: AUTHOR,
      permissionsRequested: ["none"],
      widgets: [
        {
          id: "mantras",
          type: "RotatingQuotes",
          props: {
            quotes: [
              "One tab. One task. Then the next one.",
              "Done beats perfect. Ship the small thing.",
              "If it takes two minutes, do it now.",
              "Close the tab you are not reading.",
              "Write the next step down before you switch.",
              "Rest is part of the work, not a break from it.",
              "Decide once. Stop re-deciding.",
              "Start ugly. Fix it after it exists.",
            ],
          },
        },
      ],
    },
  },
  {
    id: "reward-keyboard-cheatsheet",
    title: "Browser keyboard cheat-sheet",
    description: "The tab and window shortcuts most people forget, on one card.",
    costXp: 60,
    plugin: {
      schemaVersion: 1,
      id: "reward-keyboard-cheatsheet",
      name: "Keyboard cheat-sheet",
      version: "1.0.0",
      author: AUTHOR,
      permissionsRequested: ["none"],
      widgets: [
        {
          id: "shortcuts",
          type: "StaticText",
          props: {
            text: [
              "Ctrl/Cmd+T new tab · Ctrl/Cmd+W close tab · Ctrl/Cmd+Shift+T reopen closed tab",
              "Ctrl/Cmd+Tab next tab · Ctrl/Cmd+Shift+Tab previous tab · Ctrl/Cmd+1…8 jump to tab",
              "Ctrl/Cmd+L focus address bar · Ctrl/Cmd+F find in page · Ctrl/Cmd+D bookmark page",
              "Ctrl/Cmd+Shift+N private window · Ctrl/Cmd+H history · Ctrl/Cmd+J downloads",
            ].join("\n"),
          },
        },
      ],
    },
  },
  {
    id: "reward-reference-desk",
    title: "Reference desk",
    description: "Quick links to three public reference libraries.",
    costXp: 90,
    plugin: {
      schemaVersion: 1,
      id: "reward-reference-desk",
      name: "Reference desk",
      version: "1.0.0",
      author: AUTHOR,
      permissionsRequested: ["none"],
      widgets: [
        {
          id: "links",
          type: "LinkGrid",
          props: {
            links: [
              { label: "Wikipedia", url: "https://en.wikipedia.org/" },
              { label: "MDN Web Docs", url: "https://developer.mozilla.org/" },
              { label: "Internet Archive", url: "https://archive.org/" },
              { label: "Project Gutenberg", url: "https://www.gutenberg.org/" },
            ],
          },
        },
      ],
    },
  },
  {
    id: "reward-fortune-deck",
    title: "Fortune deck",
    description: "Dry, mildly encouraging fortunes that rotate through the day.",
    costXp: 120,
    plugin: {
      schemaVersion: 1,
      id: "reward-fortune-deck",
      name: "Fortune deck",
      version: "1.0.0",
      author: AUTHOR,
      permissionsRequested: ["none"],
      widgets: [
        {
          id: "fortunes",
          type: "RotatingQuotes",
          props: {
            quotes: [
              "The email you are dreading is shorter than you think.",
              "A bug you fixed last month is quietly still fixed.",
              "Someone will thank you for the comment you almost deleted.",
              "Your future self approves of the water you are about to drink.",
              "The meeting could have been an email. It will still be fine.",
              "You will find the setting. It is under the other menu.",
              "Today's smallest task is the one worth finishing first.",
              "A tab you closed weeks ago is not coming back to haunt you.",
            ],
          },
        },
      ],
    },
  },
  {
    id: "reward-unit-cheatsheet",
    title: "Unit conversion cheat-sheet",
    description: "Everyday conversions for length, mass, and temperature.",
    costXp: 150,
    plugin: {
      schemaVersion: 1,
      id: "reward-unit-cheatsheet",
      name: "Unit conversions",
      version: "1.0.0",
      author: AUTHOR,
      permissionsRequested: ["none"],
      widgets: [
        {
          id: "units",
          type: "StaticText",
          props: {
            text: [
              "1 inch = 2.54 cm · 1 foot = 30.48 cm · 1 mile = 1.609 km · 1 km = 0.621 mi",
              "1 pound = 0.454 kg · 1 kg = 2.205 lb · 1 ounce = 28.35 g",
              "1 US gallon = 3.785 L · 1 litre = 1.057 US qt · 1 cup ≈ 240 mL",
              "°F = °C × 9⁄5 + 32 · °C = (°F − 32) × 5⁄9 · 0 °C = 32 °F · 100 °C = 212 °F",
            ].join("\n"),
          },
        },
      ],
    },
  },
];
