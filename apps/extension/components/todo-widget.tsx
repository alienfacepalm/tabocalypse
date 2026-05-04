import React, { useState } from "react";
import type { TodoItem } from "../lib/settings";

export function TodoWidget({
  items,
  onChange,
}: {
  items: TodoItem[];
  onChange: (next: TodoItem[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, { id: crypto.randomUUID(), text: t, done: false }]);
    setDraft("");
  };
  return (
    <section className="card">
      <h3>Todos</h3>
      <ul className="todo-list">
        {items.map((it) => (
          <li key={it.id} className="todo-row">
            <label className="row">
              <input
                type="checkbox"
                checked={it.done}
                onChange={() =>
                  onChange(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))
                }
              />
              <span className={it.done ? "done" : ""}>{it.text}</span>
            </label>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => onChange(items.filter((x) => x.id !== it.id))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New item"
          style={{ flex: 1 }}
        />
        <button type="button" className="btn primary" onClick={add}>
          Add
        </button>
      </div>
    </section>
  );
}
