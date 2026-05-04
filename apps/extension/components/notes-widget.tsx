import React from "react";
import { HudPanelTitle } from "./hud-panel-drag-context";

export function NotesWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section className="card">
      <HudPanelTitle>Notes</HudPanelTitle>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scratch pad — local only."
        rows={6}
        className="w-full resize-y"
      />
    </section>
  );
}
