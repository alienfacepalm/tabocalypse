import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { ITodoItem } from "../lib/settings";

export function TodoWidget({
  items,
  onChange,
}: {
  items: ITodoItem[];
  onChange: (next: ITodoItem[]) => void;
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
              className="btn ghost icon-only sm"
              aria-label="Remove todo"
              title="Remove"
              onClick={() => onChange(items.filter((x) => x.id !== it.id))}
            >
              <Trash2 size={18} strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="row mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs text-accent">
            USER_LOG@TAB:&gt;
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task you'll push to tomorrow."
            className="w-full pl-36"
            aria-label="New todo"
          />
        </div>
        <button type="submit" className="btn primary icon-only" aria-label="Add todo" title="Add">
          <Plus size={20} strokeWidth={2} aria-hidden />
        </button>
      </form>
    </section>
  );
}
