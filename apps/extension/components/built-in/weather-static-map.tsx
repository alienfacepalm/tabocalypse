/** Weather panel location map (Yandex hybrid) — 115% crop hides footer branding; HUD pin overlay marks center. */
import { Crosshair, LocateFixed, Lock, MapPin, Minus, Plus, Unlock } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PanelTip } from "../panel-sdk";
import { getHudDisplayLayoutKey } from "../../lib/hud-layout";
import {
  WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  WEATHER_STATIC_MAP_VISIBLE_HEIGHT,
  WEATHER_STATIC_MAP_WIDTH,
  buildWeatherStaticMapUrl,
  offsetWeatherStaticMapCenter,
  type TWeatherStaticMapDimensions,
} from "../../lib/weather/weather-static-map-url";
import {
  WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS,
  areWeatherStaticMapLayoutsEqual,
  attachWeatherStaticMapRecalibrationListeners,
  isWeatherStaticMapImageDimensionallySynced,
  resolveWeatherStaticMapLayout,
  type TWeatherStaticMapLayout,
  weatherStaticMapRetryDelayMs,
} from "../../lib/weather/weather-static-map-measure";

const WEATHER_STATIC_MAP_DRAG_THRESHOLD_PX = 4;
const WEATHER_STATIC_MAP_ANCHOR_EPSILON = 0.00015;

function isWeatherStaticMapNearAnchor(
  lat: number,
  lon: number,
  anchorLat: number,
  anchorLon: number,
): boolean {
  return (
    Math.abs(lat - anchorLat) < WEATHER_STATIC_MAP_ANCHOR_EPSILON &&
    Math.abs(lon - anchorLon) < WEATHER_STATIC_MAP_ANCHOR_EPSILON
  );
}

type TWeatherStaticMapPanDrag = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originOffsetX: number;
  originOffsetY: number;
};

export function WeatherStaticMap({
  lat,
  lon,
  zoom = WEATHER_STATIC_MAP_DEFAULT_ZOOM,
  scrollZoomEnabled = false,
  doubleClickZoomEnabled = false,
  dragEnabled = true,
  showZoomControls = true,
  locked = false,
  anchorLat,
  anchorLon,
  onZoomIn,
  onZoomOut,
  onCenterChange,
  onRecenter,
  onUseMyLocationOnce,
  onToggleLocked,
  useMyLocationDetecting = false,
  className = "",
}: {
  lat: number;
  lon: number;
  zoom?: number;
  scrollZoomEnabled?: boolean;
  doubleClickZoomEnabled?: boolean;
  dragEnabled?: boolean;
  showZoomControls?: boolean;
  locked?: boolean;
  anchorLat?: number;
  anchorLon?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCenterChange?: (lat: number, lon: number) => void;
  onRecenter?: () => void;
  onUseMyLocationOnce?: () => void;
  onToggleLocked?: () => void;
  useMyLocationDetecting?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panDragRef = useRef<TWeatherStaticMapPanDrag | null>(null);
  const suppressDoubleClickRef = useRef(false);
  const displayKeyRef = useRef(getHudDisplayLayoutKey());
  const [layout, setLayout] = useState<TWeatherStaticMapLayout | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const dimensions: TWeatherStaticMapDimensions | null = layout?.dimensions ?? null;

  const markLoadedIfReady = useCallback(
    (img: HTMLImageElement | null, activeLayout: TWeatherStaticMapLayout | null): void => {
      if (activeLayout && isWeatherStaticMapImageDimensionallySynced(activeLayout, img)) {
        setLoaded(true);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = (): void => {
      const nextDisplayKey = getHudDisplayLayoutKey();
      const displayChanged = nextDisplayKey !== displayKeyRef.current;
      if (displayChanged) {
        displayKeyRef.current = nextDisplayKey;
        setLoaded(false);
      }

      const next = resolveWeatherStaticMapLayout(el.clientWidth, nextDisplayKey);
      setLayout((prev) => (areWeatherStaticMapLayoutsEqual(prev, next) ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const detachWindowListeners = attachWeatherStaticMapRecalibrationListeners(measure);
    return () => {
      ro.disconnect();
      detachWindowListeners();
    };
  }, []);

  const src = useMemo(() => {
    if (!layout) return null;
    return buildWeatherStaticMapUrl(lat, lon, zoom, layout.dimensions);
  }, [layout, lat, lon, zoom]);

  const imageSynced = layout
    ? isWeatherStaticMapImageDimensionallySynced(layout, imgRef.current)
    : false;

  useEffect(() => {
    setLoadAttempt(0);
    setLoaded(false);
    setPanOffset({ x: 0, y: 0 });
    panDragRef.current = null;
    setIsPanning(false);
  }, [lat, lon, zoom]);

  useEffect(() => {
    setLoaded(false);
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    markLoadedIfReady(imgRef.current, layout);
  }, [layout, markLoadedIfReady, src]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      markLoadedIfReady(node, layout);
    },
    [layout, markLoadedIfReady],
  );

  const handleImageLoad = useCallback(() => {
    if (layout && isWeatherStaticMapImageDimensionallySynced(layout, imgRef.current)) {
      setLoaded(true);
    }
  }, [layout]);

  const handleImageError = useCallback(() => {
    setLoaded(false);
    if (loadAttempt + 1 >= WEATHER_STATIC_MAP_MAX_LOAD_ATTEMPTS) {
      return;
    }
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
    }
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setLoadAttempt((attempt) => attempt + 1);
    }, weatherStaticMapRetryDelayMs(loadAttempt));
  }, [loadAttempt]);

  const finishPanDrag = useCallback(
    (pointerId: number, clientX: number, clientY: number): void => {
      const drag = panDragRef.current;
      if (!drag || drag.pointerId !== pointerId) return;

      const finalX = drag.originOffsetX + (clientX - drag.startClientX);
      const finalY = drag.originOffsetY + (clientY - drag.startClientY);
      const moved =
        Math.hypot(clientX - drag.startClientX, clientY - drag.startClientY) >=
        WEATHER_STATIC_MAP_DRAG_THRESHOLD_PX;

      panDragRef.current = null;
      setIsPanning(false);
      setPanOffset({ x: 0, y: 0 });

      if (moved) {
        suppressDoubleClickRef.current = true;
        if (typeof onCenterChange === "function") {
          const next = offsetWeatherStaticMapCenter(lat, lon, zoom, finalX, finalY);
          onCenterChange(next.lat, next.lon);
        }
      }
    },
    [lat, lon, onCenterChange, zoom],
  );

  const handlePanPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragEnabled || e.button !== 0) return;
      const el = containerRef.current;
      if (!el) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      panDragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originOffsetX: panOffset.x,
        originOffsetY: panOffset.y,
      };
      setIsPanning(true);
    },
    [dragEnabled, panOffset.x, panOffset.y],
  );

  const handlePanPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    setPanOffset({
      x: drag.originOffsetX + (e.clientX - drag.startClientX),
      y: drag.originOffsetY + (e.clientY - drag.startClientY),
    });
  }, []);

  const handlePanPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = panDragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      finishPanDrag(e.pointerId, e.clientX, e.clientY);
    },
    [finishPanDrag],
  );

  const handlePanPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishPanDrag(e.pointerId, e.clientX, e.clientY);
    },
    [finishPanDrag],
  );

  const showMapImage = loaded && imageSynced;
  const mapImageKey = layout
    ? `${layout.displayKey}-${src ?? "pending"}-${loadAttempt}`
    : "pending";

  const mapInteractive = !locked;
  const canPan = mapInteractive && dragEnabled;
  const canZoom =
    mapInteractive && typeof onZoomIn === "function" && typeof onZoomOut === "function";
  const showUseMyLocation = mapInteractive && typeof onUseMyLocationOnce === "function";
  const showRecenter =
    mapInteractive &&
    typeof onRecenter === "function" &&
    typeof anchorLat === "number" &&
    typeof anchorLon === "number" &&
    !isWeatherStaticMapNearAnchor(lat, lon, anchorLat, anchorLon);
  const showLockToggle = typeof onToggleLocked === "function";
  const showTopControls =
    (showZoomControls && typeof onZoomIn === "function" && typeof onZoomOut === "function") ||
    showRecenter ||
    showUseMyLocation;

  return (
    <div
      ref={containerRef}
      className={[
        "weather-location-map",
        canPan ? "weather-location-map--draggable" : "",
        isPanning ? "weather-location-map--panning" : "",
        locked ? "weather-location-map--locked" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onWheel={
        scrollZoomEnabled && canZoom
          ? (e) => {
              e.preventDefault();
              if (e.deltaY < 0) onZoomIn();
              else if (e.deltaY > 0) onZoomOut();
            }
          : undefined
      }
      onDoubleClick={
        doubleClickZoomEnabled && canZoom
          ? (e) => {
              if (suppressDoubleClickRef.current) {
                suppressDoubleClickRef.current = false;
                return;
              }
              e.preventDefault();
              onZoomIn();
            }
          : undefined
      }
      onPointerDown={canPan ? handlePanPointerDown : undefined}
      onPointerMove={canPan ? handlePanPointerMove : undefined}
      onPointerUp={canPan ? handlePanPointerUp : undefined}
      onPointerCancel={canPan ? handlePanPointerCancel : undefined}
      style={
        dimensions
          ? { height: dimensions.visibleHeight }
          : {
              aspectRatio: `${WEATHER_STATIC_MAP_WIDTH} / ${WEATHER_STATIC_MAP_VISIBLE_HEIGHT}`,
            }
      }
      aria-label={
        locked
          ? "Map showing your saved weather location (locked)"
          : "Map showing your saved weather location"
      }
    >
      {src ? (
        <div
          className="weather-location-map-crop"
          style={
            panOffset.x !== 0 || panOffset.y !== 0
              ? { transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }
              : undefined
          }
        >
          <img
            key={mapImageKey}
            ref={handleImageRef}
            src={src}
            alt=""
            className={
              showMapImage ? "weather-location-map-img is-loaded" : "weather-location-map-img"
            }
            draggable={false}
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      ) : null}
      {showTopControls ? (
        <div
          className="weather-location-map-controls"
          role="group"
          aria-label="Map controls"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {showRecenter ? (
            <PanelTip tip="Recenter on saved weather location">
              <button
                type="button"
                className="weather-location-map-control-btn"
                aria-label="Recenter map on saved weather location"
                onClick={onRecenter}
              >
                <Crosshair size={14} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          ) : null}
          {showUseMyLocation ? (
            <PanelTip tip="Use your current location once (does not enable automatic location on future tabs).">
              <button
                type="button"
                className="weather-location-map-control-btn"
                disabled={useMyLocationDetecting}
                aria-label="Use location once to set shared HUD coordinates"
                onClick={onUseMyLocationOnce}
              >
                <LocateFixed size={14} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          ) : null}
          {showZoomControls && typeof onZoomIn === "function" && typeof onZoomOut === "function" ? (
            <div className="weather-location-map-zoom" role="group" aria-label="Map zoom">
              <PanelTip tip={locked ? "Unlock the map to zoom" : "Zoom in"}>
                <button
                  type="button"
                  className="weather-location-map-control-btn"
                  disabled={locked}
                  aria-label="Zoom in on the weather location map"
                  onClick={onZoomIn}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden />
                </button>
              </PanelTip>
              <PanelTip tip={locked ? "Unlock the map to zoom" : "Zoom out"}>
                <button
                  type="button"
                  className="weather-location-map-control-btn"
                  disabled={locked}
                  aria-label="Zoom out on the weather location map"
                  onClick={onZoomOut}
                >
                  <Minus size={14} strokeWidth={2} aria-hidden />
                </button>
              </PanelTip>
            </div>
          ) : null}
        </div>
      ) : null}
      {showLockToggle ? (
        <div className="weather-location-map-lock" onPointerDown={(e) => e.stopPropagation()}>
          <PanelTip
            tip={
              locked
                ? "Unlock to pan, zoom, or change location"
                : "Lock pan, zoom, and location on this map"
            }
          >
            <button
              type="button"
              className={
                locked
                  ? "weather-location-map-control-btn is-locked"
                  : "weather-location-map-control-btn"
              }
              aria-pressed={locked}
              aria-label={locked ? "Unlock weather map" : "Lock weather map"}
              onClick={onToggleLocked}
            >
              {locked ? (
                <Lock size={14} strokeWidth={2} aria-hidden />
              ) : (
                <Unlock size={14} strokeWidth={2} aria-hidden />
              )}
            </button>
          </PanelTip>
        </div>
      ) : null}
      <MapPin className="weather-location-map-pin" aria-hidden size={28} strokeWidth={2} />
    </div>
  );
}
