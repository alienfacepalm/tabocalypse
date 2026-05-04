/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,tsx}", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        // Keep these semantic keys stable; values follow `design/` ("Glitch-Core Terminal").
        bg: "#050505",
        surface: "rgb(5 5 5 / 0.80)",
        surface2: "rgb(0 0 0 / 0.60)",
        border: "#27272a", // zinc-800-ish
        text: "#dae6d0",
        muted: "#71717a", // zinc-500-ish
        // Acid Green / Glitch Magenta
        accent: "#39ff14",
        accent2: "#ff00ff",
        accent3: "#efffe3",
        danger: "#ffb4ab",
        modal: "rgb(5 5 5 / 0.86)",
        codebg: "#000000",
      },
      borderRadius: {
        card: "0px",
      },
      fontFamily: {
        // `design/`: Space Mono (loud), JetBrains Mono (body)
        sans: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ['"Space Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
