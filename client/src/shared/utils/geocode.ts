const LOCATION_MAP: Record<string, [number, number]> = {
  "sector norte": [-26.0, -60.0],
  "sector sur": [-38.0, -62.0],
  "sector este": [-32.0, -58.0],
  "sector oeste": [-35.0, -66.0],
  "zona norte": [-25.0, -59.5],
  "zona sur": [-39.0, -62.5],
  "zona este": [-31.0, -57.5],
  "zona oeste": [-36.0, -65.5],
};

const ARGENTINA_CENTER: [number, number] = [-38.4161, -63.6167];

/**
 * Parses a parcel location text into approximate latitude/longitude coordinates.
 * Known region keywords are matched against a hardcoded map.
 * Falls back to the center of Argentina for unknown locations.
 */
export function geocodeLocation(location: string): [number, number] {
  const lower = location.toLowerCase().trim();
  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return ARGENTINA_CENTER;
}

/**
 * Spread multiple parcels slightly so markers don't overlap.
 * Adds a small deterministic offset based on the parcel index.
 */
export function spreadCoords(
  baseCoords: [number, number],
  index: number,
  total: number,
): [number, number] {
  if (total <= 1) return baseCoords;
  const angle = (index / total) * 2 * Math.PI;
  const radius = 0.02 * Math.min(total, 10);
  return [
    baseCoords[0] + radius * Math.cos(angle),
    baseCoords[1] + radius * Math.sin(angle),
  ];
}
