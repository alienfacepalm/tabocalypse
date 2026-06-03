import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  outDir: "output",
  manifest: () => ({
    name: "Tabocalypse",
    description:
      "New tab by AlienFacepalm — utility widgets, humor packs, optional user imports. No publisher backend.",
    permissions: ["storage", "alarms", "notifications"],
    optional_permissions: ["bookmarks", "topSites", "tabs"],
    host_permissions: [
      "https://api.open-meteo.com/*",
      "https://api.coingecko.com/*",
      "https://speed.cloudflare.com/*",
      "https://peapix.com/*",
      "https://img.peapix.com/*",
      "https://2lakes.app/*",
    ],
    optional_host_permissions: ["https://api.openai.com/*"],
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
