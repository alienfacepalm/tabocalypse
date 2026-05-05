import type { THumorIntensity } from "../settings";

/** Built-in pack used when Settings → Chaos → Gen-Z mode is on. */
export const GEN_Z_PACK_ID = "gen_z" as const;

export interface IBuiltinPack {
  id: string;
  name: string;
  maxIntensity: THumorIntensity;
  lines: string[];
}

export const BUILTIN_PACKS: IBuiltinPack[] = [
  {
    id: "office_absurd",
    name: "Office absurd",
    maxIntensity: "mild",
    lines: [
      "Sync-up about the sync-up: courage.",
      "Your calendar is a museum of good intentions.",
      "Another tab? Bold. Another meeting? Bolder.",
      "Another tab? Bold. Another window? Bolder.",
      "Inbox zero? Bold. Inbox archeology? Bolder.",
      "A “quick question”? Bold. A “quick sync”? Bolder.",
      "Snooze the alarm? Bold. Snooze accountability? Bolder.",
      "One more scroll? Bold. One more status report? Bolder.",
      "Read the docs? Bold. Read the room? Bolder.",
      "Ship on Friday? Bold. “We’ll hotfix weekend”? Bolder.",
      "Reply today? Bold. Reply-all with thoughts? Bolder.",
      "Stand-up honest? Bold. Stand-up performance art? Bolder.",
      "Debug with prints? Bold. Debug with vibes? Bolder.",
      "Refactor later? Bold. Refactor in your heart? Bolder.",
      "Add a shortcut? Bold. Add a dependency? Bolder.",
      "Dark mode? Bold. Dark night of the soul for legacy code? Bolder.",
      "Slack react? Bold. Slack manifesto? Bolder.",
      "Bookmark this? Bold. Bookmark tab 200? Bolder.",
      "Close some tabs? Bold. Close the laptop? Bolder.",
      "Work from home? Bold. Work from bed? Bolder.",
      "Camera on? Bold. Virtual background a crime scene? Bolder.",
      "Unmute to speak? Bold. Unmute to eat chips? Bolder.",
      "Shared screen? Bold. Shared screen with 40 tabs? Bolder.",
      "Pomodoro 25? Bold. Pomodoro “just one more”? Bolder.",
      "Calendar blocked? Bold. Calendar theater? Bolder.",
      "Mute notifications? Bold. Mute your conscience? Bolder.",
      "Async updates? Bold. Async avoidance? Bolder.",
      "LGTM in chat? Bold. LGTM on prod without tests? Bolder.",
      "Rubber duck debug? Bold. Rubber duck middle manager? Bolder.",
      "Git blame someone else? Bold. Git blame past you? Bolder.",
      "New keyboard shortcut? Bold. New Chrome extension? Bolder.",
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
  {
    id: GEN_Z_PACK_ID,
    name: "Gen Z",
    maxIntensity: "mild",
    lines: [
      "Another tab? That’s giving main-character energy. No cap.",
      "Your tab bar is doing the most, and it’s not the serve you think.",
      "Bookmark who? Bestie, you’re not even bookmarking focus.",
      "The way you’re hoarding tabs is… a choice. Respectfully.",
      "Touch grass? You’re choosing Chrome tabs. Vibe check: failed.",
      "This ain’t it — it’s giving procrastination lore.",
      "You’re not built different; you’re built like tab 87.",
      "Rent free in your browser and still no clarity? Wild.",
      "Slay? More like slay your RAM. Those tabs are not it.",
      "Lowkey you’re speedrunning burnout with extra tabs.",
      "NPC arc: open tab, pretend you’ll read it, repeat.",
      "It’s giving ‘I’ll read this later’ since forever.",
      "You’re cooking… absolutely nothing. Mid workflow energy.",
      "Fr fr your backlog is the real final boss.",
      "Skill issue (tabs edition).",
      "She’s not girlbossing; she’s tab-hoarding in HD.",
      "Main character syndrome, supporting cast tab count.",
      "That tab pile is sending me — and not in a good way.",
      "Delulu is the solulu, except for this tab count: still real.",
      "Clock app who? You live here now. Stay hydrated.",
    ],
  },
];
