import { StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "@/App";
import { applyDocumentTheme, loadAppearance } from "@/lib/theme";
import "@/styles/globals.css";

applyDocumentTheme(loadAppearance());

type StaleCheck = {
  stale: boolean;
  reasons: string[];
  fix?: string;
};

function PmStaleBanner() {
  const [stale, setStale] = useState<StaleCheck | null>(null);

  useEffect(() => {
    fetch("/.projocalypse/stale-check.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: StaleCheck) => {
        if (data.stale) setStale(data);
      })
      .catch(() => {
        /* board still usable if stale endpoint fails */
      });
  }, []);

  if (!stale) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-semibold">PM board sync is stale</p>
      <ul className="mt-1 list-disc pl-5">
        {stale.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-xs opacity-90">
        Fix in terminal: {stale.fix ?? "pnpm pm:sync"}
      </p>
    </div>
  );
}

/** Tabocalypse host: embedded mode so HostSetupWizard imports pending JSON from the bridge. */
const embed = {
  embedded: true,
  hostProjectId: null,
  packageName: "tabocalypse-roadmap",
  hostEntityId: null,
  productName: "Tabocalypse roadmap",
  tagline: "Future enhancements — synced from doc/PLAN",
  hideSidebar: false,
  hideProjectSwitcher: false,
  pendingSyncUrl: "/.projocalypse/pending/tabocalypse-roadmap.json",
};

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root element for Tabocalypse PM board");
}

const rootKey = "__tabocalypsePmBoardRoot";
const existingRoot = (container as HTMLElement & { [rootKey]?: Root })[rootKey];
const root = existingRoot ?? createRoot(container);
(container as HTMLElement & { [rootKey]?: Root })[rootKey] = root;

root.render(
  <StrictMode>
    <PmStaleBanner />
    <App embed={embed} />
  </StrictMode>,
);
