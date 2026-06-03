import { Lock, Trash2, Unlock, X } from "lucide-react";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { deriveNoteTitle, type INote, type TNotePersistPatch } from "../../lib/settings";
import { useDebouncedCallback } from "../../lib/use-debounced-callback";
import { HudTip } from "../hud-tip";

function stopToolbarButtonDrag(e: React.PointerEvent): void {
  e.stopPropagation();
}

function StickyNoteTextarea({
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (next: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    const active = document.activeElement === ta;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 48)}px`;
    if (!active || selStart === null || selEnd === null) return;
    ta.setSelectionRange(selStart, selEnd);
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder="Type here…"
      rows={3}
      className="sticky-note-textarea min-h-[3rem] w-full resize-none"
    />
  );
}

export function StickyNoteEditor({
  note,
  onUpdateNote,
  onDeleteNote,
  onMarkInactive,
}: {
  note: INote;
  onUpdateNote: (noteId: string, patch: TNotePersistPatch) => void;
  onDeleteNote: (noteId: string) => void;
  onMarkInactive: () => void;
}): React.JSX.Element {
  const noteText = note.text ?? "";
  const [draftText, setDraftText] = useState(noteText);
  const [editing, setEditing] = useState(false);

  const debouncedSaveText = useDebouncedCallback(
    (noteId: string, text: string) => onUpdateNote(noteId, { text }),
    300,
  );

  const flushSaveText = () => {
    debouncedSaveText.cancel();
    onUpdateNote(note.id, { text: draftText });
  };

  const onTextChange = (next: string) => {
    setDraftText(next);
    debouncedSaveText.call(note.id, next);
  };

  useEffect(() => {
    debouncedSaveText.cancel();
    setDraftText(note.text ?? "");
    setEditing(false);
  }, [debouncedSaveText, note.id]);

  useEffect(() => {
    if (editing) return;
    setDraftText(note.text ?? "");
  }, [editing, note.text]);

  const requestDelete = () => {
    if (note.locked) return;
    const label = deriveNoteTitle(noteText);
    const ok = window.confirm(`Delete “${label}”? This cannot be undone.`);
    if (!ok) return;
    onDeleteNote(note.id);
  };

  const title = useMemo(() => deriveNoteTitle(noteText), [noteText]);

  return (
    <div className="sticky-note-editor flex min-h-0 flex-1 flex-col">
      <div className="sticky-note-content hud-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-5 pr-5 pt-1">
        {note.locked ? (
          <div className="whitespace-pre-wrap break-words text-sm">{note.text ?? ""}</div>
        ) : (
          <StickyNoteTextarea
            value={draftText}
            onChange={onTextChange}
            onFocus={() => setEditing(true)}
            onBlur={() => {
              setEditing(false);
              flushSaveText();
            }}
          />
        )}
      </div>
      <div className="sticky-note-footer sticky-note-toolbar row shrink-0 items-center justify-between gap-0.5 border-t border-solid px-1 pb-1 pt-0.5">
        <div className="row gap-0.5">
          <HudTip
            tip={
              note.locked
                ? "Unlock to edit or delete (you can still mark inactive)"
                : "Lock — no edits or deletes; you can still mark inactive"
            }
          >
            <button
              type="button"
              className={["btn", note.locked ? "primary" : "ghost", "icon-only", "sm"].join(" ")}
              aria-pressed={note.locked}
              aria-label={note.locked ? `Unlock ${title}` : `Lock ${title}`}
              onPointerDown={stopToolbarButtonDrag}
              onClick={() => onUpdateNote(note.id, { locked: !note.locked })}
            >
              {note.locked ? (
                <Lock size={16} strokeWidth={2} aria-hidden />
              ) : (
                <Unlock size={16} strokeWidth={2} aria-hidden />
              )}
            </button>
          </HudTip>
          <HudTip tip={note.locked ? "Unlock to delete" : "Delete this note"}>
            <button
              type="button"
              className="btn ghost icon-only sm"
              aria-label={`Delete ${title}`}
              onPointerDown={stopToolbarButtonDrag}
              onClick={requestDelete}
              disabled={note.locked}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden />
            </button>
          </HudTip>
          <HudTip tip="Mark inactive (hide from canvas)">
            <button
              type="button"
              className="btn ghost icon-only sm"
              aria-label="Mark inactive"
              onPointerDown={stopToolbarButtonDrag}
              onClick={onMarkInactive}
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </HudTip>
        </div>
      </div>
    </div>
  );
}
