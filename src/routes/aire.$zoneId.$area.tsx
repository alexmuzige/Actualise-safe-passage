import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { AppLayout } from "@/components/app-layout";
import { RiskBadge } from "@/components/risk-badge";
import { IncidentRow } from "@/components/incident-row";
import { useIncidents } from "@/lib/incidents-store";
import { healthZones, classify, RISK_LABEL } from "@/lib/mock-data";
import { geoZones } from "@/lib/geo-zones";
import { newsForZone, NEWS_TAG_LABEL, slugify } from "@/lib/zone-news";
import { useFeature } from "@/lib/features-store";
import { exportHistoryCsv, exportHistoryPdf } from "@/lib/export-history";
import { toast } from "sonner";
import { ArrowLeft, FileDown, FileText, MapPin, Newspaper, TrendingUp } from "lucide-react";

const areaSearchSchema = z.object({
  days: fallback(z.coerce.number().int(), 14).default(14),
});

export const Route = createFileRoute("/aire/$zoneId/$area")({
  validateSearch: zodValidator(areaSearchSchema),
  head: () => ({
    meta: [
      { title: "Aire de santé · HUMASAFE" },
      {
        name: "description",
        content:
          "Détails d'une aire de santé du Nord-Kivu : niveau de risque, historique et actualités de la zone de santé.",
      },
      { property: "og:title", content: "Aire de santé · HUMASAFE" },
      {
        property: "og:description",
        content: "Risque, historique et actualités d'une aire de santé du Nord-Kivu.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => {
    const zone = healthZones.find((z) => z.id === params.zoneId);
    const area = zone?.areas.find((a) => slugify(a) === params.area);
    if (!zone || !area) throw notFound();
    return null;
  },
  component: AreaPage,
  notFoundComponent: () => (
    <AppLayout>
      <div className="px-5 py-16 text-center lg:px-8">
        <h1 className="text-2xl font-semibold">Aire de santé introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette aire n'existe pas dans la base opérationnelle.
        </p>
        <Link to="/zones" className="mt-4 inline-block text-sm text-primary hover:underline">
          Voir les zones de santé
        </Link>
      </div>
    </AppLayout>
  ),
});

const WEIGHTS = [0, 8, 18, 32, 50, 72];

const WINDOW_OPTIONS = [7, 14, 30] as const;

function AreaPage() {
  const { zoneId, area: areaSlug } = Route.useParams();
  const { days } = Route.useSearch();
  const navigate = Route.useNavigate();
  const incidents = useIncidents();
  const canExport = useFeature("export_csv");

  const windowDays = WINDOW_OPTIONS.includes(days as 7 | 14 | 30) ? days : 14;

  const zone = healthZones.find((z) => z.id === zoneId)!;
  const areaName = zone.areas.find((a) => slugify(a) === areaSlug)!;
  const geo = geoZones.find((g) => g.id === zoneId);
  const geoArea = geo?.areas.find((a) => slugify(a.name) === areaSlug);

  const areaIncidents = useMemo(
    () => incidents.filter((i) => i.zoneId === zoneId && i.area === areaName),
    [incidents, zoneId, areaName],
  );
  const zoneIncidents = useMemo(
    () => incidents.filter((i) => i.zoneId === zoneId),
    [incidents, zoneId],
  );

  const active = areaIncidents.filter((i) => i.status !== "resolved");
  const score = Math.min(100, active.reduce((acc, i) => acc + WEIGHTS[i.severity], 0));
  const risk = classify(score);

  const history = useMemo(() => {
    const days: Array<{ label: string; score: number }> = [];
    for (let d = windowDays - 1; d >= 0; d--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - d);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const dayScore = Math.min(
        100,
        areaIncidents
          .filter((i) => {
            const t = new Date(i.createdAt).getTime();
            return t >= day.getTime() && t < next.getTime();
          })
          .reduce((acc, i) => acc + WEIGHTS[i.severity], 0),
      );
      days.push({
        label: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
        score: dayScore,
      });
    }
    return days;
  }, [areaIncidents, windowDays]);

  const news = useMemo(() => newsForZone(zoneId), [zoneId]);

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <Link
          to="/"
          hash="carte"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Retour à la carte
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Aire de santé · Zone de {zone.name} · {zone.territory}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{areaName}</h1>
          </div>
          <RiskBadge risk={risk} score={score} />
        </div>

        {/* KPIs */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Score de risque", value: String(score), sub: RISK_LABEL[risk] },
            { label: "Signaux actifs", value: String(active.length), sub: `${areaIncidents.length} au total` },
            {
              label: "Sévérité max",
              value: active.length ? String(Math.max(...active.map((i) => i.severity))) : "—",
              sub: "sur 5",
            },
            {
              label: "Zone de santé",
              value: String(zoneIncidents.filter((i) => i.status !== "resolved").length),
              sub: `signaux · ${zone.areas.length} aires`,
            },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {k.label}
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {/* Historique */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Historique de risque · {windowDays} jours</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {WINDOW_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        navigate({ search: { days: d } })
                      }
                      aria-pressed={windowDays === d}
                      className={
                        "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition " +
                        (windowDays === d
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")
                      }
                    >
                      {d}j
                    </button>
                  ))}
                  {canExport && (
                    <>
                      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
                      <button
                        onClick={() => {
                          exportHistoryCsv(history, {
                            area: areaSlug,
                            zone: zone.name,
                            days: windowDays,
                          });
                          toast.success(`Historique ${windowDays}j exporté en CSV`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                      >
                        <FileDown className="h-3 w-3" /> CSV
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await exportHistoryPdf(history, {
                              area: areaSlug,
                              zone: zone.name,
                              territory: zone.territory,
                              days: windowDays,
                              risk: RISK_LABEL[risk],
                              score,
                            });
                            toast.success(`Historique ${windowDays}j exporté en PDF`);
                          } catch {
                            toast.error("Export PDF impossible");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                      >
                        <FileText className="h-3 w-3" /> PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 flex h-32 items-end gap-1.5">


                {history.map((d) => {
                  const r = classify(d.score);
                  return (
                    <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${Math.max(3, d.score)}%`,
                            backgroundColor: `var(--risk-${r})`,
                            opacity: d.score === 0 ? 0.25 : 0.9,
                          }}
                          title={`${d.label} · score ${d.score}`}
                        />
                      </div>
                      <span className="font-mono text-[8px] text-muted-foreground">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Incidents */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                Signaux enregistrés dans l'aire
              </div>
              {areaIncidents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucun signal enregistré pour cette aire de santé.
                </div>
              ) : (
                areaIncidents.map((i) => <IncidentRow key={i.id} incident={i} />)
              )}
            </div>
          </div>

          <div className="space-y-5">
            {/* Localisation */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Localisation</h2>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Zone de santé</dt>
                  <dd className="font-medium">{zone.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Territoire</dt>
                  <dd className="font-medium">{zone.territory}</dd>
                </div>
                {geoArea && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Centroïde</dt>
                    <dd className="font-mono text-xs">
                      {((geoArea.bounds[0][0] + geoArea.bounds[1][0]) / 2).toFixed(3)},{" "}
                      {((geoArea.bounds[0][1] + geoArea.bounds[1][1]) / 2).toFixed(3)}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Autres aires de la zone
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {zone.areas
                    .filter((a) => a !== areaName)
                    .map((a) => (
                      <Link
                        key={a}
                        to="/aire/$zoneId/$area"
                        params={{ zoneId: zone.id, area: slugify(a) }}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary/50 hover:text-primary"
                      >
                        {a}
                      </Link>
                    ))}
                </div>
              </div>
            </div>

            {/* Actualités */}
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Newspaper className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Actualités · zone de {zone.name}</h2>
              </div>
              <ul>
                {news.map((n) => (
                  <li key={n.id} className="border-b border-border/60 px-4 py-3 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                        {NEWS_TAG_LABEL[n.tag]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {n.publishedAt.slice(0, 10)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-medium">{n.title}</div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{n.summary}</p>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      {n.source}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
