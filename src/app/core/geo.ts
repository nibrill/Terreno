export interface LatLon {
  lat: number;
  lon: number;
}

export interface Utm {
  /** Norte (m) */
  northing: number;
  /** Este (m) */
  easting: number;
  zone: number;
  hemisphere: 'N' | 'S';
}

/** Extracts "lat, lon" (decimal degrees) from free text. */
export function parseLatLon(text: string): LatLon | null {
  const m = /(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/.exec(text ?? '');
  if (!m) return null;
  const lat = parseFloat(m[1].replace(',', '.'));
  const lon = parseFloat(m[2].replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/**
 * WGS84 / SIRGAS-Chile → UTM (Krüger series). Chile mainland falls in zones
 * 18 and 19 (south); the zone is derived from the longitude.
 */
export function toUtm({ lat, lon }: LatLon): Utm {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = ep2 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lam - lon0);
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
        Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));

  const easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) +
    500000;
  let northing =
    k0 *
    (M +
      N *
        Math.tan(phi) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
  const hemisphere = lat >= 0 ? 'N' : 'S';
  if (hemisphere === 'S') northing += 10000000;
  return { northing, easting, zone, hemisphere };
}

export function formatUtm(u: Utm): string {
  return `N ${Math.round(u.northing)} · E ${Math.round(u.easting)} · ${u.zone}${u.hemisphere}`;
}

/** Convenience: UTM for a stored "lat, lon" string, or null. */
export function utmFromText(text: string): Utm | null {
  const p = parseLatLon(text);
  return p ? toUtm(p) : null;
}
