import React from "react";
import { HudPanelBody, HudPanelTitle } from "./hud-panel-drag-context";

export function NotesWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section className="card">
      <HudPanelTitle>Notes</HudPanelTitle>
      <HudPanelBody className="flex min-h-0 flex-col">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Scratch pad — local only."
          rows={6}
          className="min-h-[12rem] w-full flex-1 resize-y"
        />
      </HudPanelBody>
    </section>
  );
}
