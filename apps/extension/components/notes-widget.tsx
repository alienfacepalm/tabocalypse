import React from "react";

export function NotesWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section className="card">
      <h3>Notes</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scratch pad — local only."
        rows={6}
        style={{ width: "100%", resize: "vertical" }}
      />
    </section>
  );
}
