/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,tsx}", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        "surface-weak": "var(--color-surface-weak)",
        "surface-strong": "var(--color-surface-strong)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        accent2: "var(--color-accent2)",
        accent3: "var(--color-accent3)",
        danger: "var(--color-danger)",
        modal: "var(--color-modal)",
        codebg: "var(--color-codebg)",
        input: "var(--color-input-bg)",
        "btn-bg": "var(--color-btn-bg)",
        "on-accent": "var(--color-on-accent)",
        backdrop: "var(--color-backdrop)",
        "shadow-hard": "var(--color-shadow-hard)",
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
