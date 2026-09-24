// Deterministic mock newsroom feed per health zone (frontend-only).
import { healthZones } from "./mock-data";

export interface ZoneNews {
  id: string;
  zoneId: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  tag: "securite" | "sante" | "logistique" | "humanitaire";
}

export const NEWS_TAG_LABEL: Record<ZoneNews["tag"], string> = {
  securite: "Sécurité",
  sante: "Santé",
  logistique: "Logistique",
  humanitaire: "Humanitaire",
};

const TEMPLATES: Array<Omit<ZoneNews, "id" | "zoneId" | "publishedAt"> & { days: number }> = [
  {
    title: "Reprise des activités de vaccination",
    source: "Division Provinciale de la Santé",
    summary:
      "Les équipes mobiles ont repris les tournées dans les aires accessibles ; couverture estimée en hausse.",
    tag: "sante",
    days: 1,
  },
  {
    title: "Mouvements de population signalés",
    source: "OCHA · Rapport de situation",
    summary:
      "Des déplacements internes ont été observés vers les centres urbains, augmentant la pression sur les structures de santé.",
    tag: "humanitaire",
    days: 3,
  },
  {
    title: "Axe routier partiellement praticable",
    source: "Cluster Logistique",
    summary:
      "Le tronçon principal reste ouvert aux convois humanitaires en journée, avec escorte recommandée.",
    tag: "logistique",
    days: 5,
  },
  {
    title: "Tensions localisées rapportées",
    source: "Réseau d'alerte communautaire",
    summary:
      "Des incidents isolés ont été rapportés en périphérie ; vigilance recommandée sur les déplacements matinaux.",
    tag: "securite",
    days: 8,
  },
  {
    title: "Approvisionnement en intrants médicaux",
    source: "Coordination provinciale",
    summary:
      "Un lot de kits d'urgence a été prépositionné dans les centres de santé de référence de la zone.",
    tag: "sante",
    days: 12,
  },
];

export function newsForZone(zoneId: string): ZoneNews[] {
  const zone = healthZones.find((z) => z.id === zoneId);
  if (!zone) return [];
  const seed = zoneId.charCodeAt(0) + zoneId.length;
  return TEMPLATES.map((t, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (t.days + ((seed + i) % 3)));
    return {
      id: `${zoneId}-news-${i}`,
      zoneId,
      title: `${t.title} — ${zone.name}`,
      source: t.source,
      summary: t.summary,
      tag: t.tag,
      publishedAt: d.toISOString(),
    };
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
