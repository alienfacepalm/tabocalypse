/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,tsx}", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        // Keep these semantic keys stable; values follow DESIGN.md ("Neon Satire").
        bg: "#131318",
        surface: "#1f1f24",
        surface2: "#2a292f",
        border: "#444933",
        text: "#e4e1e9",
        muted: "#c4c9ac",
        // Electric Lime / Acid Purple / Cyber Cyan
        accent: "#c3f400",
        accent2: "#9d05ff",
        accent3: "#7df4ff",
        danger: "#ffb4ab",
        modal: "#1b1b20",
        codebg: "#0e0e13",
      },
      borderRadius: {
        card: "0px",
      },
      fontFamily: {
        // DESIGN.md: Space Grotesk (headlines), Be Vietnam Pro (body)
        sans: ['"Be Vietnam Pro"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
