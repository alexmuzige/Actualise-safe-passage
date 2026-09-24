import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useFeature } from "@/lib/features-store";
import { AppLayout } from "@/components/app-layout";
import { RiskMap, MapLegend } from "@/components/risk-map";
import { IncidentRow } from "@/components/incident-row";
import { RiskBadge } from "@/components/risk-badge";
import { useIncidents } from "@/lib/incidents-store";
import {
  itineraries,
  itineraryScore,
  classify,
  recommend,
  RECOMMENDATION_LABEL,
  routeSegments,
  segmentScore,
  healthZones,
} from "@/lib/mock-data";
import { ArrowUpRight, TrendingUp, Activity, AlertTriangle, Users, Filter, X, Share2, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const dashboardSearchSchema = z.object({
  zone: fallback(z.string(), "all").default("all"),
  minSev: fallback(z.number().int(), 1).default(1),
  since: fallback(z.string(), "").default(""),
  until: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: zodValidator(dashboardSearchSchema),
  component: Dashboard,
});

function Dashboard() {
  const incidents = useIncidents();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard" });

  // Sanitize values read from URL
  const fZone =
    search.zone === "all" || healthZones.some((z) => z.id === search.zone)
      ? search.zone
      : "all";
  const fMinSev = Math.max(1, Math.min(5, search.minSev));
  const fSince = search.since;
  const fUntil = search.until;

  const setFilter = (
    patch: Partial<{ zone: string; minSev: number; since: string; until: string }>,
  ) => {
    navigate({
      search: (prev: z.infer<typeof dashboardSearchSchema>) => ({
        zone: patch.zone ?? prev.zone,
        minSev: patch.minSev ?? prev.minSev,
        since: patch.since ?? prev.since,
        until: patch.until ?? prev.until,
      }),
      replace: true,
    });
  };


  const setFZone = (v: string) => setFilter({ zone: v });
  const setFMinSev = (v: number) => setFilter({ minSev: v });
  const setFSince = (v: string) => setFilter({ since: v });
  const setFUntil = (v: string) => setFilter({ until: v });

  const filteredIncidents = useMemo(() => {
    const since = fSince ? new Date(fSince).getTime() : null;
    const until = fUntil ? new Date(fUntil).getTime() + 24 * 3600 * 1000 - 1 : null;
    return incidents.filter((i) => {
      if (fZone !== "all" && i.zoneId !== fZone) return false;
      if (i.severity < fMinSev) return false;
      const t = new Date(i.createdAt).getTime();
      if (since !== null && t < since) return false;
      if (until !== null && t > until) return false;
      return true;
    });
  }, [incidents, fZone, fMinSev, fSince, fUntil]);

  const filtersActive = fZone !== "all" || fMinSev > 1 || fSince !== "" || fUntil !== "";
  const resetFilters = () => {
    navigate({
      search: () => ({ zone: "all", minSev: 1, since: "", until: "" }),
      replace: true,
    });
  };

  const [copied, setCopied] = useState(false);
  const canShare = useFeature("share_filters");
  const shareFilters = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Lien copié", {
        description: "Les filtres actuels sont inclus dans le lien partagé.",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Échec de la copie", {
        description: "Votre navigateur n'a pas autorisé l'accès au presse-papiers.",
      });
    }
  };


  const stats = useMemo(() => {
    const last72h = incidents.filter(
      (i) => Date.now() - new Date(i.createdAt).getTime() < 72 * 3600 * 1000,
    );
    const criticalSegments = routeSegments
      .map((s) => ({ id: s.id, score: segmentScore(s.id, incidents) }))
      .filter((s) => s.score >= 50).length;
    return {
      total: incidents.length,
      last72h: last72h.length,
      criticalSegments,
      zonesActive: new Set(incidents.filter((i) => i.status !== "resolved").map((i) => i.zoneId)).size,
    };
  }, [incidents]);


  const rankedItineraries = itineraries
    .map((it) => {
      const score = itineraryScore(it.id, incidents);
      return { it, score, risk: classify(score), reco: recommend(score) };
    })
    .sort((a, b) => a.score - b.score);

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Situation opérationnelle
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Tableau de bord — Nord-Kivu
            </h1>
          </div>
          <Link
            to="/rapport"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Nouveau rapport terrain
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Rapports actifs" value={stats.total} icon={Activity} hint="Base opérationnelle" />
          <Kpi label="Nouveaux (72 h)" value={stats.last72h} icon={TrendingUp} hint="Fenêtre courante" />
          <Kpi
            label="Tronçons à risque"
            value={stats.criticalSegments}
            icon={AlertTriangle}
            hint="Score ≥ 50"
            tone="warn"
          />
          <Kpi label="Zones concernées" value={stats.zonesActive} icon={Users} hint={`${healthZones.length} zones suivies`} />
        </div>

        {/* Map + itineraries */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Carte opérationnelle
                </div>
                <div className="text-sm font-medium">Incidents et risque par tronçon</div>
              </div>
              <MapLegend />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 border-b border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Filter className="h-3 w-3" />
                Filtres carte
              </div>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Zone de santé
                </span>
                <select
                  value={fZone}
                  onChange={(e) => setFZone(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="all">Toutes ({healthZones.length})</option>
                  {healthZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sévérité min
                </span>
                <select
                  value={fMinSev}
                  onChange={(e) => setFMinSev(Number(e.target.value))}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      ≥ {n}/5
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Depuis
                </span>
                <input
                  type="date"
                  value={fSince}
                  onChange={(e) => setFSince(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Jusqu'au
                </span>
                <input
                  type="date"
                  value={fUntil}
                  onChange={(e) => setFUntil(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                />
              </label>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {filteredIncidents.length}/{incidents.length} signaux
                </span>
                {canShare && (
                <button
                  type="button"
                  onClick={shareFilters}
                  title="Copier le lien avec les filtres"
                  disabled={copied}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    copied
                      ? "border-risk-low/40 bg-risk-low/10 text-risk-low"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                  {copied ? "Lien copié" : "Partager"}
                </button>
                )}
                {filtersActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="grid-bg aspect-[4/3] w-full">
              <RiskMap incidents={filteredIncidents} className="h-full w-full" />
            </div>
          </section>


          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Recommandations
              </div>
              <div className="text-sm font-medium">Itinéraires suivis</div>
            </div>
            <ul>
              {rankedItineraries.map(({ it, score, risk, reco }) => (
                <li
                  key={it.id}
                  className="border-b border-border/60 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{it.label}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {it.segments.length} tronçons · score {score}
                      </div>
                    </div>
                    <RiskBadge risk={risk} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="font-mono text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: `var(--risk-${risk})` }}
                    >
                      → {RECOMMENDATION_LABEL[reco].label}
                    </span>
                    <Link
                      to="/itineraires"
                      search={{ id: it.id }}
                      className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Analyser
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Feed */}
        <section className="mt-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Flux terrain
              </div>
              <div className="text-sm font-medium">Rapports récents</div>
            </div>
            <Link
              to="/incidents"
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div>
            {incidents.slice(0, 6).map((i) => (
              <IncidentRow key={i.id} incident={i} compact />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Activity;
  tone?: "warn";
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border"
          style={{
            color: tone === "warn" ? "var(--risk-high)" : "var(--primary)",
            backgroundColor: tone === "warn" ? "color-mix(in oklch, var(--risk-high) 12%, transparent)" : "color-mix(in oklch, var(--primary) 12%, transparent)",
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
