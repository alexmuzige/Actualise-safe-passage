// Mock operational data for SITREP-NK — Nord-Kivu route risk platform.
// All coordinates are schematic (0-100 grid) for the SVG map, not real GPS.

export type IncidentCategory =
  | "affrontement"
  | "embuscade"
  | "enlevement"
  | "engin_explosif"
  | "pillage"
  | "manifestation"
  | "barrage_illegal"
  | "autre";

export type Severity = 1 | 2 | 3 | 4 | 5;
export type RiskClass = "low" | "moderate" | "high" | "critical";
export type Recommendation = "go" | "reroute" | "postpone";

export interface HealthZone {
  id: string;
  name: string;
  territory: string;
  x: number;
  y: number;
  areas: string[];
}

export interface Incident {
  id: string;
  zoneId: string;
  area: string;
  category: IncidentCategory;
  severity: Severity;
  description: string;
  reporter: string;
  createdAt: string;
  x: number;
  y: number;
  segmentId?: string;
  attachments?: number;
  status: "verified" | "unverified" | "resolved";
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  path: Array<{ x: number; y: number }>;
}

export interface Itinerary {
  id: string;
  label: string;
  segments: string[];
}

export const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  affrontement: "Affrontement armé",
  embuscade: "Embuscade",
  enlevement: "Enlèvement",
  engin_explosif: "Engin explosif",
  pillage: "Pillage",
  manifestation: "Manifestation",
  barrage_illegal: "Barrage illégal",
  autre: "Autre",
};

export const healthZones: HealthZone[] = [
  { id: "gom", name: "Goma", territory: "Nyiragongo", x: 55, y: 82, areas: ["Katindo", "Himbi", "Majengo", "Kyeshero"] },
  { id: "sak", name: "Sake", territory: "Masisi", x: 44, y: 78, areas: ["Sake-Centre", "Kirotshe"] },
  { id: "mas", name: "Masisi", territory: "Masisi", x: 36, y: 66, areas: ["Masisi-Centre", "Nyabiondo", "Lushebere"] },
  { id: "rut", name: "Rutshuru", territory: "Rutshuru", x: 62, y: 58, areas: ["Rutshuru-Centre", "Kiwanja", "Rugari"] },
  { id: "kib", name: "Kibirizi", territory: "Rutshuru", x: 54, y: 46, areas: ["Kibirizi", "Bambo"] },
  { id: "kan", name: "Kanyabayonga", territory: "Lubero", x: 60, y: 36, areas: ["Kanyabayonga", "Kayna"] },
  { id: "lub", name: "Lubero", territory: "Lubero", x: 66, y: 22, areas: ["Lubero-Centre", "Kipese"] },
  { id: "ben", name: "Beni", territory: "Beni", x: 72, y: 10, areas: ["Beni-Centre", "Mabalako", "Oicha"] },
  { id: "wal", name: "Walikale", territory: "Walikale", x: 18, y: 54, areas: ["Walikale-Centre", "Mubi"] },
];

export const routeSegments: RouteSegment[] = [
  { id: "s1", from: "gom", to: "sak", distanceKm: 27, path: [{ x: 55, y: 82 }, { x: 44, y: 78 }] },
  { id: "s2", from: "sak", to: "mas", distanceKm: 46, path: [{ x: 44, y: 78 }, { x: 36, y: 66 }] },
  { id: "s3", from: "gom", to: "rut", distanceKm: 72, path: [{ x: 55, y: 82 }, { x: 58, y: 70 }, { x: 62, y: 58 }] },
  { id: "s4", from: "rut", to: "kib", distanceKm: 38, path: [{ x: 62, y: 58 }, { x: 54, y: 46 }] },
  { id: "s5", from: "kib", to: "kan", distanceKm: 44, path: [{ x: 54, y: 46 }, { x: 60, y: 36 }] },
  { id: "s6", from: "kan", to: "lub", distanceKm: 68, path: [{ x: 60, y: 36 }, { x: 66, y: 22 }] },
  { id: "s7", from: "lub", to: "ben", distanceKm: 82, path: [{ x: 66, y: 22 }, { x: 72, y: 10 }] },
  { id: "s8", from: "mas", to: "wal", distanceKm: 96, path: [{ x: 36, y: 66 }, { x: 18, y: 54 }] },
];

export const itineraries: Itinerary[] = [
  { id: "i1", label: "Goma → Rutshuru → Kanyabayonga → Beni", segments: ["s3", "s4", "s5", "s6", "s7"] },
  { id: "i2", label: "Goma → Sake → Masisi", segments: ["s1", "s2"] },
  { id: "i3", label: "Masisi → Walikale", segments: ["s8"] },
  { id: "i4", label: "Goma → Sake → Masisi → Walikale", segments: ["s1", "s2", "s8"] },
];

const SEED_EPOCH = new Date("2026-08-01T00:00:00.000Z").getTime();

function daysAgo(d: number): string {
  // Deterministic offsets so SSR and client hydrate the same seed data.
  const jitter = ((d * 397) % 3600000);
  return new Date(SEED_EPOCH - d * 86400000 - jitter).toISOString();
}

export const seedIncidents: Incident[] = [
  { id: "r-1042", zoneId: "rut", area: "Kiwanja", category: "affrontement", severity: 5, description: "Échanges de tirs prolongés sur l'axe principal, circulation interrompue depuis l'aube.", reporter: "IN-014", createdAt: daysAgo(0.3), x: 63, y: 56, segmentId: "s3", attachments: 2, status: "verified" },
  { id: "r-1041", zoneId: "kib", area: "Bambo", category: "barrage_illegal", severity: 3, description: "Groupe armé non identifié, contrôle des véhicules et prélèvements.", reporter: "IN-007", createdAt: daysAgo(0.8), x: 53, y: 48, segmentId: "s4", attachments: 0, status: "verified" },
  { id: "r-1040", zoneId: "kan", area: "Kayna", category: "embuscade", severity: 4, description: "Attaque d'un convoi commercial hier soir, deux véhicules endommagés.", reporter: "IN-021", createdAt: daysAgo(1.2), x: 61, y: 34, segmentId: "s5", attachments: 1, status: "verified" },
  { id: "r-1039", zoneId: "mas", area: "Nyabiondo", category: "pillage", severity: 3, description: "Pillage de commerces en périphérie, tension persistante.", reporter: "IN-003", createdAt: daysAgo(2.1), x: 34, y: 68, segmentId: "s2", attachments: 0, status: "unverified" },
  { id: "r-1038", zoneId: "ben", area: "Mabalako", category: "engin_explosif", severity: 5, description: "IED découvert sur la route, équipe de déminage en route.", reporter: "IN-030", createdAt: daysAgo(2.6), x: 73, y: 12, segmentId: "s7", attachments: 3, status: "verified" },
  { id: "r-1037", zoneId: "wal", area: "Mubi", category: "affrontement", severity: 4, description: "Combats entre groupes armés autour d'un site minier.", reporter: "IN-018", createdAt: daysAgo(3.4), x: 20, y: 52, segmentId: "s8", attachments: 0, status: "verified" },
  { id: "r-1036", zoneId: "sak", area: "Kirotshe", category: "manifestation", severity: 2, description: "Manifestation pacifique bloquant la RN2 pendant 3 heures.", reporter: "IN-005", createdAt: daysAgo(4.0), x: 45, y: 79, segmentId: "s1", attachments: 0, status: "resolved" },
  { id: "r-1035", zoneId: "rut", area: "Rugari", category: "enlevement", severity: 4, description: "Deux civils enlevés sur l'axe secondaire, revendication en attente.", reporter: "IN-011", createdAt: daysAgo(5.2), x: 60, y: 62, segmentId: "s3", attachments: 1, status: "verified" },
  { id: "r-1034", zoneId: "lub", area: "Kipese", category: "barrage_illegal", severity: 2, description: "Barrage informel, taxation routière signalée.", reporter: "IN-025", createdAt: daysAgo(6.1), x: 65, y: 24, segmentId: "s6", attachments: 0, status: "resolved" },
];

// --- Scoring engine ---

export function severityWeight(s: Severity): number {
  return [0, 10, 22, 40, 62, 85][s] ?? 0;
}

export function categoryWeight(c: IncidentCategory): number {
  const map: Record<IncidentCategory, number> = {
    engin_explosif: 1.3,
    embuscade: 1.25,
    affrontement: 1.2,
    enlevement: 1.15,
    barrage_illegal: 0.9,
    pillage: 0.85,
    manifestation: 0.5,
    autre: 0.7,
  };
  return map[c];
}

export function ageDecay(iso: string): number {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  return Math.exp(-days / 7);
}

export function segmentScore(segmentId: string, incidents: Incident[]): number {
  const relevant = incidents.filter((i) => i.segmentId === segmentId && i.status !== "resolved");
  if (relevant.length === 0) return 4;
  const raw = relevant.reduce(
    (acc, i) => acc + severityWeight(i.severity) * categoryWeight(i.category) * ageDecay(i.createdAt),
    0,
  );
  return Math.min(100, Math.round(raw));
}

export function classify(score: number): RiskClass {
  if (score < 25) return "low";
  if (score < 50) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

export function itineraryScore(itineraryId: string, incidents: Incident[]): number {
  const it = itineraries.find((i) => i.id === itineraryId);
  if (!it) return 0;
  const scores = it.segments.map((s) => segmentScore(s, incidents));
  // Weighted: max dominates but average matters
  const max = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(max * 0.65 + avg * 0.35);
}

export function recommend(score: number): Recommendation {
  if (score < 40) return "go";
  if (score < 70) return "reroute";
  return "postpone";
}

export const RECOMMENDATION_LABEL: Record<
  Recommendation,
  { label: string; labelEn: string; detail: string }
> = {
  go: { label: "PASSAGE", labelEn: "GO", detail: "Circulation autorisée avec vigilance standard." },
  reroute: {
    label: "DÉVIATION",
    labelEn: "REROUTE",
    detail: "Contourner les tronçons à risque élevé, revoir l'itinéraire.",
  },
  postpone: { label: "REPORT", labelEn: "POSTPONE", detail: "Report immédiat, ne pas engager la mission." },
};

export const RISK_LABEL: Record<RiskClass, string> = {
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
  critical: "Critique",
};
