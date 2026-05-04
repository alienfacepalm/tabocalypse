import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";
import React from "react";
import { HudTip } from "./hud-tip";
import type { IUserBackgroundImage } from "../lib/settings";

export interface IUserBackgroundGalleryProps {
  images: IUserBackgroundImage[];
  activeId: string | null;
  backgroundRotate: boolean;
  onPickFiles: (files: FileList | null) => void;
  onSetActiveId: (id: string) => void;
  onDeleteId: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

export function UserBackgroundGallery({
  images,
  activeId,
  backgroundRotate,
  onPickFiles,
  onSetActiveId,
  onDeleteId,
  onMove,
}: IUserBackgroundGalleryProps): React.JSX.Element {
  return (
    <div className="mt-4 flex flex-col gap-3 border border-outline/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm uppercase tracking-wide">Photo library</span>
        <HudTip tip="Pick images from your device to add to your photo library">
          <label className="btn has-icon sm">
            <ImagePlus size={18} strokeWidth={2} aria-hidden />
            <span>Add photos</span>
            <input
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </HudTip>
      </div>

      {images.length === 0 ? (
        <p className="muted sm">
          No uploaded photos yet. Use Add photos to pick images from your device.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {images.map((im, index) => {
            const isActive = activeId === im.id || (activeId === null && index === 0);
            return (
              <li
                key={im.id}
                className="flex flex-wrap items-center gap-2 border border-outline/30 p-2"
              >
                <img
                  src={im.dataUrl}
                  alt=""
                  className="h-14 w-20 shrink-0 border border-outline/40 object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm">Photo {index + 1}</span>
                  {isActive && !backgroundRotate ? (
                    <span className="muted sm uppercase tracking-wide">
                      Shown while rotation is off
                    </span>
                  ) : isActive && backgroundRotate ? (
                    <span className="muted sm uppercase tracking-wide">
                      Still target when you turn rotation off
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn ghost sm self-start"
                      onClick={() => onSetActiveId(im.id)}
                    >
                      Use as still background
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <HudTip tip="Move earlier in the rotation order">
                    <button
                      type="button"
                      className="btn ghost icon-only sm"
                      aria-label="Move photo earlier in rotation"
                      disabled={index === 0}
                      onClick={() => onMove(im.id, "up")}
                    >
                      <ChevronUp size={18} strokeWidth={2} aria-hidden />
                    </button>
                  </HudTip>
                  <HudTip tip="Move later in the rotation order">
                    <button
                      type="button"
                      className="btn ghost icon-only sm"
                      aria-label="Move photo later in rotation"
                      disabled={index >= images.length - 1}
                      onClick={() => onMove(im.id, "down")}
                    >
                      <ChevronDown size={18} strokeWidth={2} aria-hidden />
                    </button>
                  </HudTip>
                  <HudTip tip="Remove this photo from your library">
                    <button
                      type="button"
                      className="btn ghost icon-only sm"
                      aria-label="Delete this photo"
                      onClick={() => onDeleteId(im.id)}
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
    </div>
  );
}
