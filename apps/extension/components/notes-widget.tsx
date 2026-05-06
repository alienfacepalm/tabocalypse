import { ExternalLink, Lock, Pencil, Pin, PinOff, Plus, Trash2, Unlock, X } from "lucide-react";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { INote, INotePanel, TNotePersistPatch } from "../lib/settings";
import { HudPanelBody, HudPanelTitle } from "./hud-panel-drag-context";
import { HudTip } from "./hud-tip";

type TNotesWidgetSwitcherProps = {
  variant: "switcher";
  notes: INote[];
  notePanels: INotePanel[];
  onToggleNotePanel: (noteId: string) => void;
  onCreateNote: (draft: { name: string; tags: string[] }) => void;
  onUpdateNote: (noteId: string, patch: TNotePersistPatch) => void;
  onDeleteNote: (noteId: string) => void;
};

type TNotesWidgetPanelProps = {
  variant: "panel";
  notes: INote[];
  panelNoteId: string;
  /** When false, the HUD row has a saved pixel height — fill it like other resizable panels. */
  panelElasticHeight?: boolean;
  onUpdateNote: (noteId: string, patch: TNotePersistPatch) => void;
  onDeleteNote: (noteId: string) => void;
  onClosePanel?: () => void;
};

/** Stops draggable title bar (`HudPanelTitle`) from capturing pointer → drag when using header actions */
function stopDragSurfacePropagation(e: React.PointerEvent): void {
  e.stopPropagation();
}

function NotesElasticTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    const active = document.activeElement === ta;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    if (!active || selStart === null || selEnd === null) return;
    ta.setSelectionRange(selStart, selEnd);
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type here…"
      rows={1}
      className="min-h-[2.75rem] w-full resize-none overflow-hidden"
    />
  );
}

export type TNotesWidgetProps = TNotesWidgetSwitcherProps | TNotesWidgetPanelProps;

export function NotesWidget(props: TNotesWidgetProps) {
  const { variant } = props;

  if (variant === "switcher") {
    return <NotesSwitcher {...props} />;
  }
  return <NotesDetachedPanel {...props} />;
}

function NotesSwitcher({
  notes,
  notePanels,
  onToggleNotePanel,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: TNotesWidgetSwitcherProps) {
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");

  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const requestDeleteNote = (note: INote) => {
    if (note.locked) return;
    const ok = window.confirm(
      `Delete “${note.name}”? This cannot be undone, and its panel will close if open.`,
    );
    if (!ok) return;
    onDeleteNote(note.id);
  };

  const toggleNoteLock = (note: INote) => {
    onUpdateNote(note.id, { locked: !note.locked });
  };

  const openRename = (note: INote) => {
    if (note.locked) return;
    setEditName(note.name);
    setEditNoteId(note.id);
  };

  return (
    <section className="card">
      <HudPanelTitle>Notes</HudPanelTitle>
      <HudPanelBody className="flex min-h-0 flex-col">
        <div className="row mb-2 flex-wrap gap-2">
          <HudTip tip="Create a note and open it in a draggable panel">
            <button
              type="button"
              className="btn ghost icon-only sm"
              aria-label="New note"
              onClick={() => {
                setShowCreate(true);
                setCreateName("");
              }}
            >
              <Plus size={18} strokeWidth={2} aria-hidden />
            </button>
          </HudTip>
          <span className="muted sm grow self-center">
            Pin a note to open its panel on the canvas. Lock to prevent edits or deletion — you can
            still hide a panel. Notes without a panel stay in this list only.
          </span>
        </div>

        {showCreate ? (
          <form
            className="mb-2 grid grid-cols-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = createName.trim();
              if (!name) return;
              onCreateNote({ name, tags: [] });
              setShowCreate(false);
            }}
          >
            <label className="block">
              <span className="muted sm">Name</span>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Work, Game plan, Shopping"
              />
            </label>
            <div className="row justify-end gap-2">
              <button type="button" className="btn ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!createName.trim()}>
                Create
              </button>
            </div>
          </form>
        ) : null}

        {editNoteId ? (
          <form
            className="mb-2 grid grid-cols-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = editName.trim();
              if (!name) return;
              onUpdateNote(editNoteId, { name });
              setEditNoteId(null);
            }}
          >
            <label className="block">
              <span className="muted sm">Rename</span>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <div className="row justify-end gap-2">
              <button type="button" className="btn ghost" onClick={() => setEditNoteId(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!editName.trim()}>
                Save
              </button>
            </div>
          </form>
        ) : null}

        <div className="row mb-2 flex-wrap gap-2">
          <span className="muted sm">Local only.</span>
          <span className="muted sm"> · </span>
          <span className="muted sm row gap-1">
            <ExternalLink size={14} strokeWidth={2} aria-hidden />
            Stored on this device
          </span>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-4">
            <p className="muted sm">
              No notes yet. Tap <span className="font-semibold">New note</span> to add one.
            </p>
          </div>
        ) : (
          <ul
            className="hud-scrollbar flex min-h-0 flex-col gap-1 overflow-y-auto pr-1"
            aria-label="Notes list"
          >
            {sortedNotes.map((n) => {
              const open = notePanels.some((p) => p.noteId === n.id);
              return (
                <li key={n.id}>
                  <div className="row min-h-[2rem] gap-2 rounded border border-solid border-accent/35 bg-black/25 px-2 py-1">
                    <HudTip
                      tip={
                        open ? "Hide notes panel from the canvas" : "Show notes panel on the canvas"
                      }
                    >
                      <button
                        type="button"
                        className={["btn", open ? "primary" : "ghost", "icon-only", "sm"].join(" ")}
                        aria-pressed={open}
                        aria-label={open ? `Hide panel for ${n.name}` : `Show panel for ${n.name}`}
                        onClick={() => onToggleNotePanel(n.id)}
                      >
                        {open ? (
                          <Pin size={18} strokeWidth={2} aria-hidden />
                        ) : (
                          <PinOff size={18} strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    </HudTip>
                    <HudTip
                      tip={
                        n.locked
                          ? "Unlock to edit or delete (you can still hide the panel)"
                          : "Lock — no edits or deletes; you can still hide the panel"
                      }
                    >
                      <button
                        type="button"
                        className={["btn", n.locked ? "primary" : "ghost", "icon-only", "sm"].join(
                          " ",
                        )}
                        aria-pressed={n.locked}
                        aria-label={n.locked ? `Unlock ${n.name}` : `Lock ${n.name}`}
                        onClick={() => toggleNoteLock(n)}
                      >
                        {n.locked ? (
                          <Unlock size={18} strokeWidth={2} aria-hidden />
                        ) : (
                          <Lock size={18} strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    </HudTip>
                    <span className="min-w-0 flex-1 truncate self-center text-sm" title={n.name}>
                      {n.name}
                    </span>
                    <HudTip tip={n.locked ? "Unlock to rename" : "Rename this note"}>
                      <button
                        type="button"
                        className="btn ghost icon-only sm"
                        aria-label={`Rename ${n.name}`}
                        onClick={() => openRename(n)}
                        disabled={n.locked}
                      >
                        <Pencil size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </HudTip>
                    <HudTip tip={n.locked ? "Unlock to delete" : "Delete this note"}>
                      <button
                        type="button"
                        className="btn ghost icon-only sm"
                        aria-label={`Delete ${n.name}`}
                        onClick={() => requestDeleteNote(n)}
                        disabled={n.locked}
                      >
                        <Trash2 size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </HudTip>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </HudPanelBody>
    </section>
  );
}

function NotesDetachedPanel({
  notes,
  panelNoteId,
  panelElasticHeight,
  onUpdateNote,
  onDeleteNote,
  onClosePanel,
}: TNotesWidgetPanelProps) {
  const elastic = panelElasticHeight ?? true;

  const selected = useMemo(
    () => notes.find((n) => n.id === panelNoteId) ?? null,
    [notes, panelNoteId],
  );

  const requestDeleteSelected = () => {
    if (!selected || selected.locked) return;
    const ok = window.confirm(
      `Delete “${selected.name}”? This cannot be undone, and this panel will close.`,
    );
    if (!ok) return;
    onDeleteNote(selected.id);
  };

  return (
    <section
      className={["card", elastic ? "hud-notes-detached-panel" : ""].filter(Boolean).join(" ")}
    >
      <HudPanelTitle>
        <span className="row min-w-0 justify-between gap-2">
          <span className="min-w-0 flex-1 truncate" title={selected?.name}>
            {selected?.name.trim() ? selected.name : "Untitled note"}
          </span>
          {onClosePanel ? (
            <span className="row gap-1" onPointerDown={stopDragSurfacePropagation}>
              <HudTip
                tip={
                  selected?.locked
                    ? "Unlock to edit or delete (you can still hide the panel)"
                    : "Lock — no edits or deletes; you can still hide the panel"
                }
              >
                <button
                  type="button"
                  className={[
                    "btn",
                    selected?.locked ? "primary" : "ghost",
                    "icon-only",
                    "sm",
                  ].join(" ")}
                  aria-pressed={selected?.locked}
                  aria-label={
                    selected?.locked
                      ? `Unlock ${selected.name}`
                      : selected
                        ? `Lock ${selected.name}`
                        : "Lock note"
                  }
                  onClick={() =>
                    selected && onUpdateNote(selected.id, { locked: !selected.locked })
                  }
                  disabled={!selected}
                >
                  {selected?.locked ? (
                    <Unlock size={18} strokeWidth={2} aria-hidden />
                  ) : (
                    <Lock size={18} strokeWidth={2} aria-hidden />
                  )}
                </button>
              </HudTip>
              <HudTip tip={selected?.locked ? "Unlock to delete" : "Delete this note"}>
                <button
                  type="button"
                  className="btn ghost icon-only sm"
                  aria-label="Delete note"
                  onClick={requestDeleteSelected}
                  disabled={!selected || selected.locked}
                >
                  <Trash2 size={18} strokeWidth={2} aria-hidden />
                </button>
              </HudTip>
              <HudTip tip="Hide this notes panel">
                <button
                  type="button"
                  className="btn ghost icon-only sm"
                  aria-label="Hide notes panel"
                  onClick={onClosePanel}
                >
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
              </HudTip>
            </span>
          ) : null}
        </span>
      </HudPanelTitle>
      <HudPanelBody sizeToContent={elastic} bodyOverflow={false} className="flex min-h-0 flex-col">
        {selected ? (
          <>
            <div className="row mb-2 shrink-0 flex-wrap gap-2">
              {selected.locked ? <span className="muted sm">Locked — reading only.</span> : null}
              {selected.locked ? <span className="muted sm"> · </span> : null}
              <span className="muted sm">Local only.</span>
              <span className="muted sm"> · </span>
              <span className="muted sm row gap-1">
                <ExternalLink size={14} strokeWidth={2} aria-hidden />
                Stored on this device
              </span>
            </div>

            {selected.locked ? (
              <div className="hud-scrollbar min-h-0 flex-1 overflow-y-auto font-sans text-sm">
                <div className="whitespace-pre-wrap break-words">{selected.text}</div>
              </div>
            ) : elastic ? (
              <div className="hud-scrollbar min-h-0 flex-1 overflow-y-auto">
                <NotesElasticTextarea
                  value={selected.text}
                  onChange={(next) => onUpdateNote(selected.id, { text: next })}
                />
              </div>
            ) : (
              <div className="hud-scrollbar min-h-0 flex-1 overflow-y-auto">
                <textarea
                  value={selected.text}
                  onChange={(e) => onUpdateNote(selected.id, { text: e.target.value })}
                  placeholder="Type here…"
                  rows={6}
                  className="min-h-[12rem] w-full resize-none"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-2 py-4">
            <p className="muted sm">This panel no longer matches a saved note.</p>
            {onClosePanel ? (
              <button type="button" className="btn ghost sm self-start" onClick={onClosePanel}>
                Close panel
              </button>
            ) : null}
          </div>
        )}
      </HudPanelBody>
    </section>
  );
}
