import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  outDir: "output",
  vite: () => ({
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  }),
  manifest: () => ({
    name: "Tabocalypse",
    description:
      "New tab by AlienFacepalm — utility widgets, humor packs, optional user imports. No publisher backend.",
    permissions: ["storage", "alarms", "notifications"],
    optional_permissions: ["bookmarks", "topSites", "tabs"],
    host_permissions: [
      "https://api.open-meteo.com/*",
      "https://geocoding-api.open-meteo.com/*",
      "https://freequicknews.com/*",
      "https://api.coingecko.com/*",
      "https://coin-images.coingecko.com/*",
      "https://speed.cloudflare.com/*",
      "https://peapix.com/*",
      "https://img.peapix.com/*",
      "https://green2.kingcounty.gov/*",
      "https://www.unsuck-it.com/*",
      "https://duckduckgo.com/*",
      "https://suggestqueries.google.com/*",
      "https://api.bing.com/*",
      "https://smtp.elasticemail.com/*",
      "https://api.wikimedia.org/*",
    ],
    optional_host_permissions: [
      "https://api.openai.com/*",
      "https://generativelanguage.googleapis.com/*",
      "https://*/*",
      "http://127.0.0.1/*",
      "http://localhost/*",
    ],
    action: {},
    browser_specific_settings: {
      gecko: {
        id:
          process.env.WXT_TABOCALYPSE_FIREFOX_GECKO_ID?.trim() ||
          "tabocalypse@alienfacepalm.invalid",
        strict_min_version: "109.0",
      },
    },
    chrome_url_overrides: {
      newtab: "newtab.html",
    },
  }),
  runner: {
    disabled: true,
  },
});
