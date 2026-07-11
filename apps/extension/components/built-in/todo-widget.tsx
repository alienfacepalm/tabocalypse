import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { ITodoItem } from "../../lib/settings";
import { PanelBody, PanelTip, PanelTitle } from "../panel-sdk";

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
      <PanelTitle>Todos</PanelTitle>
      <PanelBody>
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
              <PanelTip tip="Remove this task from the list">
                <button
                  type="button"
                  className="btn ghost icon-only shrink-0"
                  aria-label="Remove todo"
                  onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                >
                  <Trash2 size={14} strokeWidth={2} aria-hidden />
                </button>
              </PanelTip>
            </li>
          ))}
        </ul>
      </PanelBody>
      <form
        className="row mt-2 shrink-0"
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
        <PanelTip tip="Add the task in the field to your list">
          <button type="submit" className="btn primary icon-only" aria-label="Add todo">
            <Plus size={20} strokeWidth={2} aria-hidden />
          </button>
        </PanelTip>
      </form>
    </section>
  );
}
