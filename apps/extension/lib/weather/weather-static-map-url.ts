/**
 * Yandex static map (free, no API key).
 * Keep in sync with `../2lakes.app/src/components/StaticMap.tsx` (same as seattle-two-lakes-monitor).
 */

/** Same query string as `../2lakes.app/src/components/StaticMap.tsx`. */
export function buildWeatherStaticMapUrl(lat: number, lon: number, zoom: number): string {
  const z = Math.min(17, Math.max(1, Math.round(zoom)));
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${z}&l=map&size=450,260&pt=${lon},${lat},pm2rdm&lang=en_US`;
}
