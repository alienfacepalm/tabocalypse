import type { HumorIntensity } from "../settings";

export interface BuiltinPack {
  id: string;
  name: string;
  maxIntensity: HumorIntensity;
  lines: string[];
}

export const BUILTIN_PACKS: BuiltinPack[] = [
  {
    id: "office_absurd",
    name: "Office absurd",
    maxIntensity: "mild",
    lines: [
      "Sync-up about the sync-up: courage.",
      "Your calendar is a museum of good intentions.",
      "Another tab? Bold. Another meeting? Bolder.",
      "Reply-all is not a personality trait.",
      "Coffee first. Questions never.",
    ],
  },
  {
    id: "dev_snark",
    name: "Dev snark",
    maxIntensity: "spicy",
    lines: [
      "It works on my machine™ — now a UNESCO site.",
      "semver is just vibes with extra steps.",
      "Your rubber duck filed for emotional damages.",
      "I’ll fix it in post… said the backend, lying.",
      "Merge conflict: you vs past you. Past you was worse.",
    ],
  },
  {
    id: "demotivation",
    name: "Demotivation",
    maxIntensity: "spicy",
    lines: [
      "Shoot for the moon. Miss. Orbit debris forever.",
      "Teamwork makes the dream work — the dream is nap time.",
      "You miss 100% of the naps you don’t take.",
      "Rise and grind? More like rise and find tab 47.",
      "Believe in yourself — statistically risky, but brave.",
    ],
  },
  {
    id: "tab_shame",
    name: "Tab shame",
    maxIntensity: "mild",
    lines: [
      "New tab energy: chaotic neutral.",
      "You opened a new tab like you pay rent here.",
      "Procrastination speedrun: any% WR pace.",
      "Bookmark it? Never heard of her.",
      "Focus is a spectrum. You’re exploring the whole rainbow.",
    ],
  },
  {
    id: "error_messages",
    name: "Error messages",
    maxIntensity: "mild",
    lines: [
      "404: Motivation not found.",
      "Success: undefined",
      "Stack overflow: tabs > RAM > dignity",
      "NullPointerException: attention span",
      "HTTP 418: I’m a teapot. You’re a tab hoarder.",
    ],
  },
  {
    id: "spicy_safe",
    name: "Spicy (reviewed)",
    maxIntensity: "spicy",
    lines: [
      "This tab count is not a flex. It’s a cry for help.",
      "Ship it? Buddy, you can’t even ship yourself to bed on time.",
      "Touch grass? You can’t even touch ‘Save’.",
      "Your backlog has a backlog. Inception, but stupid.",
      "Zero inbox is a myth. Like ‘just one more tab’.",
    ],
  },
];
