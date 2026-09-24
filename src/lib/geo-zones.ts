// Real GPS coordinates (approx.) for Nord-Kivu health zones + framed health areas.
import { healthZones } from "./mock-data";

export interface GeoZone {
  id: string;
  name: string;
  territory: string;
  lat: number;
  lng: number;
  areas: Array<{
    name: string;
    bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  }>;
}

const ZONE_COORDS: Record<string, [number, number]> = {
  gom: [-1.6792, 29.2228],
  sak: [-1.5736, 29.0494],
  mas: [-1.4009, 28.8134],
  rut: [-1.1836, 29.4472],
  kib: [-0.9833, 29.1833],
  kan: [-0.4833, 29.1833],
  lub: [-0.1561, 29.2403],
  ben: [0.4917, 29.4722],
  wal: [-1.4183, 28.0553],
};

const AREA_SPAN = 0.055; // ~6 km box side
const RING = 0.075; // distance of areas around the zone centre

export const geoZones: GeoZone[] = healthZones.map((z) => {
  const [lat, lng] = ZONE_COORDS[z.id] ?? [-1.5, 29.0];
  const n = z.areas.length;
  return {
    id: z.id,
    name: z.name,
    territory: z.territory,
    lat,
    lng,
    areas: z.areas.map((name, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const cLat = lat + Math.sin(angle) * RING;
      const cLng = lng + Math.cos(angle) * RING;
      const h = AREA_SPAN / 2;
      return {
        name,
        bounds: [
          [cLat - h, cLng - h],
          [cLat + h, cLng + h],
        ] as [[number, number], [number, number]],
      };
    }),
  };
});

export const NORD_KIVU_CENTER: [number, number] = [-0.9, 29.1];
