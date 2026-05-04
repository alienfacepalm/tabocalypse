import "webextension-polyfill";
import "@fontsource/audiowide";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./tailwind.css";
import { defaultSettings, loadSettings, type ISettings } from "../../lib/settings";
import { applyDocumentTheme } from "../../lib/theme";

void (async () => {
  let initialSettings: ISettings;
  try {
    initialSettings = await loadSettings();
  } catch {
    initialSettings = defaultSettings();
  }
  applyDocumentTheme(initialSettings.themeMode, initialSettings.themePalette, {
    accent: initialSettings.themeCustomAccent,
    accent2: initialSettings.themeCustomAccent2,
  });

  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App initialSettings={initialSettings} />
    </React.StrictMode>,
  );
})();
