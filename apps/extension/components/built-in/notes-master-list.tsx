import { Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";
import React, { useMemo } from "react";
import {
  deriveNoteTitle,
  isNoteActive,
  newNoteId,
  type INote,
  type INotePanel,
  type TNotePersistPatch,
} from "../../lib/settings";
import { PanelBody, PanelTip, PanelTitleInline } from "../panel-sdk";

function stopTitleControlPropagation(e: React.PointerEvent): void {
  e.stopPropagation();
}

export function NotesMasterList({
  notes,
  notePanels,
  onSetNoteActive,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onHideListPanel,
  canHideListPanel,
}: {
  notes: INote[];
  notePanels: INotePanel[];
  onSetNoteActive: (noteId: string, active: boolean) => void;
  onCreateNote: (draft: { id: string; tags: string[] }) => void;
  onUpdateNote: (noteId: string, patch: TNotePersistPatch) => void;
  onDeleteNote: (noteId: string) => void;
  onHideListPanel: () => void;
  canHideListPanel: boolean;
}): React.JSX.Element {
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);

  const requestDeleteNote = (note: INote) => {
    if (note.locked) return;
    const label = deriveNoteTitle(note.text);
    const ok = window.confirm(
      `Delete “${label}”? This cannot be undone. Active stickies will close too.`,
    );
    if (!ok) return;
    onDeleteNote(note.id);
  };

  const toggleNoteLock = (note: INote) => {
    onUpdateNote(note.id, { locked: !note.locked });
  };

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PanelTitleInline>Notes</PanelTitleInline>
        <span className="row shrink-0 gap-1" onPointerDown={stopTitleControlPropagation}>
          <PanelTip tip="New note">
            <button
              type="button"
              className="btn ghost icon-only sm"
              aria-label="New note"
              onClick={() => onCreateNote({ id: newNoteId(), tags: [] })}
            >
              <Plus size={16} strokeWidth={2} aria-hidden />
            </button>
          </PanelTip>
          {canHideListPanel ? (
            <PanelTip tip="Hide the notes list (active stickies stay on the canvas)">
              <button
                type="button"
                className="btn ghost icon-only sm"
                aria-label="Hide notes list"
                onClick={onHideListPanel}
              >
                <EyeOff size={16} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          ) : null}
        </span>
      </div>
      <PanelBody bodyOverflow={false} className="flex min-h-0 flex-col">
        <div className="hud-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          {sortedNotes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-4">
              <p className="muted sm px-2 text-center">
                No notes yet. Press <span className="font-semibold">New note (+)</span> to add one.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1" aria-label="Notes list">
              {sortedNotes.map((n) => {
                const active = isNoteActive(n.id, notePanels);
                const title = deriveNoteTitle(n.text);
                return (
                  <li key={n.id}>
                    <div className="row min-h-[2.5rem] gap-2 rounded border border-solid border-accent/35 bg-black/25 px-2 py-1">
                      <PanelTip
                        tip={
                          active
                            ? "Mark inactive (hide sticky from canvas)"
                            : "Mark active (show sticky on canvas)"
                        }
                      >
                        <button
                          type="button"
                          className={["btn", active ? "primary" : "ghost", "icon-only", "sm"].join(
                            " ",
                          )}
                          aria-pressed={active}
                          aria-label={active ? `Mark ${title} inactive` : `Mark ${title} active`}
                          onClick={() => onSetNoteActive(n.id, !active)}
                        >
                          {active ? (
                            <Eye size={18} strokeWidth={2} aria-hidden />
                          ) : (
                            <EyeOff size={18} strokeWidth={2} aria-hidden />
                          )}
                        </button>
                      </PanelTip>
                      <PanelTip
                        tip={
                          n.locked
                            ? "Unlock to edit or delete (you can still mark inactive)"
                            : "Lock — no edits or deletes; you can still mark inactive"
                        }
                      >
                        <button
                          type="button"
                          className={[
                            "btn",
                            n.locked ? "primary" : "ghost",
                            "icon-only",
                            "sm",
                          ].join(" ")}
                          aria-pressed={n.locked}
                          aria-label={n.locked ? `Unlock ${title}` : `Lock ${title}`}
                          onClick={() => toggleNoteLock(n)}
                        >
                          {n.locked ? (
                            <Lock size={18} strokeWidth={2} aria-hidden />
                          ) : (
                            <Unlock size={18} strokeWidth={2} aria-hidden />
                          )}
                        </button>
                      </PanelTip>
                      <div className="min-w-0 flex-1 self-center">
                        <div className="truncate text-sm font-semibold" title={title}>
                          {title}
                        </div>
                        <div className="muted truncate text-xs">
                          {active ? "Active" : "Inactive"}
                        </div>
                      </div>
                      <PanelTip tip={n.locked ? "Unlock to delete" : "Delete this note"}>
                        <button
                          type="button"
                          className="btn ghost icon-only sm"
                          aria-label={`Delete ${title}`}
                          onClick={() => requestDeleteNote(n)}
                          disabled={n.locked}
                        >
                          <Trash2 size={18} strokeWidth={2} aria-hidden />
                        </button>
                      </PanelTip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PanelBody>
    </section>
  );
}
