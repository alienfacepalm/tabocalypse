import React, { useCallback, useMemo, useState } from "react";
import { DraggableStickyNote } from "../draggable-sticky-note";
import type { INote, INotePanel, IStickyNotePosition, TNotePersistPatch } from "../../lib/settings";
import { StickyNoteEditor } from "./sticky-note";

const STICKY_Z_BASE = 52;

export function StickyNoteLayer({
  canvasRef,
  notes,
  notePanels,
  onCommitPosition,
  onTogglePin,
  onToggleNotesList,
  notesListPanelVisible,
  onMarkInactive,
  onUpdateNote,
  onDeleteNote,
}: {
  canvasRef: React.RefObject<HTMLElement | null>;
  notes: INote[];
  notePanels: readonly INotePanel[];
  onCommitPosition: (noteId: string, position: IStickyNotePosition) => void;
  onTogglePin: (noteId: string) => void;
  onToggleNotesList: () => void;
  notesListPanelVisible: boolean;
  onMarkInactive: (noteId: string) => void;
  onUpdateNote: (noteId: string, patch: TNotePersistPatch) => void;
  onDeleteNote: (noteId: string) => void;
}): React.JSX.Element {
  const notesById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [zEpoch, setZEpoch] = useState(0);

  const bringToFront = useCallback((noteId: string) => {
    setFocusedNoteId(noteId);
    setZEpoch((e) => e + 1);
  }, []);

  return (
    <>
      {notePanels.map((np, index) => {
        const note = notesById.get(np.noteId);
        if (!note) return null;
        const zIndexBase = STICKY_Z_BASE + index + (focusedNoteId === np.noteId ? zEpoch * 10 : 0);
        return (
          <DraggableStickyNote
            key={`sticky-${np.noteId}`}
            canvasRef={canvasRef}
            position={np.position}
            pinned={np.pinned === true}
            zIndexBase={zIndexBase}
            onFocus={() => bringToFront(np.noteId)}
            onCommit={(pos) => onCommitPosition(np.noteId, pos)}
            onTogglePin={() => onTogglePin(np.noteId)}
            onToggleNotesList={onToggleNotesList}
            notesListPanelVisible={notesListPanelVisible}
          >
            {({ resizeControl }) => (
              <StickyNoteEditor
                note={note}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onMarkInactive={() => onMarkInactive(np.noteId)}
                footerEnd={resizeControl}
              />
            )}
          </DraggableStickyNote>
        );
      })}
    </>
  );
}
