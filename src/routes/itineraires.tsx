import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useFeature } from "@/lib/features-store";
import { AppLayout } from "@/components/app-layout";
import { RiskMap, MapLegend } from "@/components/risk-map";
import { RiskBadge } from "@/components/risk-badge";
import { useIncidents } from "@/lib/incidents-store";
import {
  itineraries,
  itineraryScore,
  segmentScore,
  classify,
  recommend,
  RECOMMENDATION_LABEL,
  routeSegments,
  healthZones,
  CATEGORY_LABEL,
} from "@/lib/mock-data";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, MinusCircle, XCircle } from "lucide-react";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/itineraires")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ItinerariesPage,
});

function ItinerariesPage() {
  const { id } = Route.useSearch();
  const incidents = useIncidents();
  const selected = itineraries.find((i) => i.id === id) ?? itineraries[0];

  const score = itineraryScore(selected.id, incidents);
  const risk = classify(score);
  const reco = recommend(score);

  const segmentsDetail = useMemo(
    () =>
      selected.segments.map((sid) => {
        const s = routeSegments.find((r) => r.id === sid)!;
        const sc = segmentScore(sid, incidents);
        return {
          id: sid,
          from: healthZones.find((z) => z.id === s.from)!.name,
          to: healthZones.find((z) => z.id === s.to)!.name,
          km: s.distanceKm,
          score: sc,
          risk: classify(sc),
          incidents: incidents.filter((i) => i.segmentId === sid && i.status !== "resolved"),
        };
      }),
    [selected, incidents],
  );

  const canExcel = useFeature("export_excel");

  const RecoIcon = reco === "go" ? CheckCircle2 : reco === "reroute" ? MinusCircle : XCircle;

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Aide à la décision · fusion géospatiale + historique
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analyse d'itinéraire</h1>
          </div>
          {canExcel && (
          <button
            onClick={async () => {
              const XLSX = await import("xlsx");
              const wb = XLSX.utils.book_new();

              const synth = [
                { Champ: "Itinéraire", Valeur: selected.label },
                { Champ: "ID", Valeur: selected.id },
                { Champ: "Score global", Valeur: score },
                { Champ: "Classe de risque", Valeur: risk },
                { Champ: "Recommandation", Valeur: RECOMMENDATION_LABEL[reco].label },
                { Champ: "Détail", Valeur: RECOMMENDATION_LABEL[reco].detail },
                { Champ: "Distance totale (km)", Valeur: segmentsDetail.reduce((a, s) => a + s.km, 0) },
                { Champ: "Tronçons", Valeur: segmentsDetail.length },
                { Champ: "Incidents actifs", Valeur: segmentsDetail.reduce((a, s) => a + s.incidents.length, 0) },
                { Champ: "Généré le", Valeur: new Date().toISOString() },
              ];
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(synth), "Synthèse");

              const segRows = segmentsDetail.map((s, idx) => ({
                Ordre: idx + 1,
                Tronçon: s.id,
                Départ: s.from,
                Arrivée: s.to,
                "Distance (km)": s.km,
                Score: s.score,
                Classe: s.risk,
                "Incidents actifs": s.incidents.length,
              }));
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(segRows), "Tronçons");

              const incRows = segmentsDetail.flatMap((s) =>
                s.incidents.map((i) => ({
                  ID: i.id,
                  Tronçon: `${s.from} → ${s.to}`,
                  Aire: i.area,
                  Catégorie: CATEGORY_LABEL[i.category],
                  Sévérité: i.severity,
                  Statut: i.status,
                  Date: i.createdAt,
                  Description: i.description,
                })),
              );
              XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet(incRows.length ? incRows : [{ Info: "Aucun signal actif" }]),
                "Signaux",
              );

              const stamp = new Date().toISOString().slice(0, 10);
              XLSX.writeFile(wb, `sitrep-nk-itineraire-${selected.id}-${stamp}.xlsx`);
            }}
            className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            Exporter Excel
          </button>
          )}
        </div>


        {/* Selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {itineraries.map((it) => {
            const active = it.id === selected.id;
            return (
              <Link
                key={it.id}
                to="/itineraires"
                search={{ id: it.id }}
                className="rounded-md border px-3 py-1.5 text-xs transition"
                style={{
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  backgroundColor: active ? "color-mix(in oklch, var(--primary) 18%, transparent)" : "var(--card)",
                  color: active ? "var(--primary)" : "var(--foreground)",
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-medium">{selected.label}</div>
              <MapLegend />
            </div>
            <div className="grid-bg aspect-[4/3]">
              <RiskMap incidents={incidents} highlightSegments={selected.segments} className="h-full w-full" />
            </div>
          </section>

          {/* Recommendation panel */}
          <section className="flex flex-col gap-4">
            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: `color-mix(in oklch, var(--risk-${risk}) 45%, var(--border))`,
                backgroundColor: `color-mix(in oklch, var(--risk-${risk}) 8%, var(--card))`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Recommandation opérationnelle
                  </div>
                  <div
                    className="mt-2 font-mono text-3xl font-bold tracking-tight"
                    style={{ color: `var(--risk-${risk})` }}
                  >
                    {RECOMMENDATION_LABEL[reco].label}
                  </div>
                </div>
                <RecoIcon className="h-8 w-8" style={{ color: `var(--risk-${risk})` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{RECOMMENDATION_LABEL[reco].detail}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">Score global</div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold">{score}</span>
                  <RiskBadge risk={risk} />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, backgroundColor: `var(--risk-${risk})` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Décomposition par tronçon
              </div>
              <ul>
                {segmentsDetail.map((s) => (
                  <li key={s.id} className="border-b border-border/60 px-4 py-3 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <span className="truncate">{s.from}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s.to}</span>
                      </div>
                      <RiskBadge risk={s.risk} score={s.score} />
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                      <span>{s.km} km</span>
                      <span>
                        {s.incidents.length} incident{s.incidents.length !== 1 && "s"} actif
                        {s.incidents.length !== 1 && "s"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Contributing incidents */}
        <section className="mt-6 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Signaux contribuant au score
            </div>
            <div className="text-sm font-medium">Rapports actifs sur l'itinéraire</div>
          </div>
          <div className="divide-y divide-border/60">
            {segmentsDetail.flatMap((s) =>
              s.incidents.map((i) => (
                <div key={i.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3">
                  <span className="font-mono text-[11px] text-muted-foreground">{i.id.toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{CATEGORY_LABEL[i.category]}</span>
                      <span className="text-muted-foreground"> · {s.from} → {s.to} · {i.area}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{i.description}</div>
                  </div>
                  <span className="font-mono text-xs">Sév. {i.severity}/5</span>
                </div>
              )),
            )}
            {segmentsDetail.every((s) => s.incidents.length === 0) && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Aucun signal actif sur cet itinéraire.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
