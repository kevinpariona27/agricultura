const LOCATION_MAP: Record<string, [number, number]> = {
  "sector norte": [-13.15, -74.21],
  "sector sur": [-13.18, -74.23],
  "sector este": [-13.16, -74.20],
  "sector oeste": [-13.17, -74.25],
  "centro del campo": [-13.1631, -74.2244],
  "bajo cubierta": [-13.1600, -74.2220],
  "zona norte": [-13.1450, -74.2050],
  "zona sur": [-13.1850, -74.2350],
  "zona este": [-13.1580, -74.1950],
  "zona oeste": [-13.1750, -74.2550],
};

const AYACUCHO_CENTER: [number, number] = [-13.1631, -74.2244];

/**
 * Parses a parcel location text into approximate latitude/longitude coordinates.
 * Known region keywords are matched against a hardcoded map.
 * Falls back to Ayacucho, Peru center for unknown locations.
 */
export function geocodeLocation(location: string): [number, number] {
  const lower = location.toLowerCase().trim();
  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return AYACUCHO_CENTER;
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
