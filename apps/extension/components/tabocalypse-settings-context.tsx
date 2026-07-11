import React, { createContext, useContext } from "react";
import { defaultSettings, type ISettings } from "../lib/settings";

type TPersist = (next: ISettings | ((current: ISettings) => ISettings)) => Promise<boolean>;

const TabocalypseSettingsContext = createContext<ISettings>(defaultSettings());
const TabocalypsePersistContext = createContext<TPersist>(async () => false);

export function TabocalypseSettingsProvider({
  settings,
  persist,
  children,
}: {
  settings: ISettings;
  persist: TPersist;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <TabocalypseSettingsContext.Provider value={settings}>
      <TabocalypsePersistContext.Provider value={persist}>
        {children}
      </TabocalypsePersistContext.Provider>
    </TabocalypseSettingsContext.Provider>
  );
}

export function useTabocalypseSettings(): ISettings {
  return useContext(TabocalypseSettingsContext);
}

export function useTabocalypsePersist(): TPersist {
  return useContext(TabocalypsePersistContext);
}
