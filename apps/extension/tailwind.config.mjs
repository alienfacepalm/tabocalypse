/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,tsx}", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f12",
        surface: "#1a1a22",
        border: "#2a2a36",
        text: "#ececf1",
        muted: "#9898a8",
        accent: "#c45c26",
        accent2: "#7c3aed",
        danger: "#dc2626",
        modal: "#14141c",
        codebg: "#0a0a0e",
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
