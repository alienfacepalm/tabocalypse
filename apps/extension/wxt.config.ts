import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: "output",
  manifest: () => ({
    name: "Tabocalypse",
    description:
      "New tab by AlienFacepalm — utility widgets, humor packs, optional user imports. No publisher backend.",
    permissions: ["storage", "alarms", "notifications"],
    optional_permissions: ["bookmarks", "topSites", "tabs"],
    host_permissions: ["https://api.open-meteo.com/*"],
    optional_host_permissions: ["https://api.openai.com/*"],
    action: {},
    browser_specific_settings: {
      gecko: {
        id: "tabocalypse@alienfacepalm.invalid",
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
