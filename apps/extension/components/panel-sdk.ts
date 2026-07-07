import React from "react";
import type { IHudPanelDragContextValue } from "./hud-panel-drag-context";
import {
  HudPanelBody as _HudPanelBody,
  HudPanelDragContext as _HudPanelDragContext,
  HudPanelTitle as _HudPanelTitle,
  HudPanelTitleInline as _HudPanelTitleInline,
  isHudPanelDragExcluded as _isHudPanelDragExcluded,
  useHudPanelDrag as _useHudPanelDrag,
} from "./hud-panel-drag-context";
import { HudTip as _HudTip } from "./hud-tip";
import type { THudToastHandle, THudToastShowOptions } from "./hud-toast";
import { HudToastProvider as _HudToastProvider, useHudToast as _useHudToast } from "./hud-toast";
import { PrivilegedFetchErrorPanel as _PrivilegedFetchErrorPanel } from "./privileged-fetch-error-panel";
export {
  TabocalypseSettingsProvider as PanelSettingsProvider,
  useTabocalypsePersist as usePanelPersist,
  useTabocalypseSettings as usePanelSettings,
} from "./tabocalypse-settings-context";

/**
 * Panel SDK: shared primitives that are broadly applicable to all panels.
 * Panel-specific helpers should live with the panel even if similar elsewhere.
 */

export type TPanelDragContextValue = IHudPanelDragContextValue;

export const PanelDragContext = _HudPanelDragContext;
export const isPanelDragExcluded = _isHudPanelDragExcluded;
export const usePanelDrag = _useHudPanelDrag;

export function PanelBody(props: React.ComponentProps<typeof _HudPanelBody>): React.ReactElement {
  return React.createElement(_HudPanelBody, props);
}

export function PanelTitle(props: React.ComponentProps<typeof _HudPanelTitle>): React.ReactElement {
  return React.createElement(_HudPanelTitle, props);
}

export function PanelTitleInline(
  props: React.ComponentProps<typeof _HudPanelTitleInline>,
): React.ReactElement {
  return React.createElement(_HudPanelTitleInline, props);
}

export function PanelTip(props: React.ComponentProps<typeof _HudTip>): React.ReactElement {
  return React.createElement(_HudTip, props);
}

export type TPanelToastHandle = THudToastHandle;
export type TPanelToastShowOptions = THudToastShowOptions;
export const PanelToastProvider = _HudToastProvider;
export const usePanelToast = _useHudToast;

export function PanelFetchError(
  props: React.ComponentProps<typeof _PrivilegedFetchErrorPanel>,
): React.ReactElement {
  return React.createElement(_PrivilegedFetchErrorPanel, props);
}
