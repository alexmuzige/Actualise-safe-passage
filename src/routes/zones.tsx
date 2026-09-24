import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { RiskBadge } from "@/components/risk-badge";
import { useIncidents } from "@/lib/incidents-store";
import { healthZones, classify } from "@/lib/mock-data";
import { useMemo } from "react";
import { useFeature } from "@/lib/features-store";

export const Route = createFileRoute("/zones")({
  component: ZonesPage,
});

function ZonesPage() {
  const incidents = useIncidents();
  const canExcel = useFeature("export_excel");

  const rows = useMemo(() => {
    return healthZones
      .map((z) => {
        const active = incidents.filter((i) => i.zoneId === z.id && i.status !== "resolved");
        const rawScore = active.reduce(
          (acc, i) => acc + [0, 8, 18, 32, 50, 72][i.severity],
          0,
        );
        const score = Math.min(100, rawScore);
        return { z, active, score, risk: classify(score) };
      })
      .sort((a, b) => b.score - a.score);
  }, [incidents]);

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Couverture · {healthZones.length} zones de santé suivies
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Zones de santé — Nord-Kivu</h1>
          </div>
          {canExcel && (
          <button
            onClick={async () => {
              const { exportToExcel } = await import("@/lib/export-excel");
              exportToExcel(
                rows.map(({ z, active, score, risk }) => ({
                  Zone: z.name,
                  Territoire: z.territory,
                  Aires: z.areas.length,
                  "Incidents actifs": active.length,
                  Score: score,
                  Classe: risk,
                })),
                "sitrep-nk-zones",
                "Zones",
              );
            }}
            className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            Exporter Excel
          </button>
          )}
        </div>


        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[1.4fr_1fr_auto_1.2fr_auto] gap-3 border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Zone</span>
            <span>Territoire</span>
            <span className="text-right">Incidents actifs</span>
            <span>Score</span>
            <span className="text-right">Classe</span>
          </div>
          {rows.map(({ z, active, score, risk }) => (
            <div
              key={z.id}
              className="grid grid-cols-[1.4fr_1fr_auto_1.2fr_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium">{z.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {z.areas.length} aires · {z.areas.slice(0, 3).join(", ")}
                  {z.areas.length > 3 && "…"}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{z.territory}</div>
              <div className="text-right font-mono tabular-nums">{active.length}</div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${score}%`, backgroundColor: `var(--risk-${risk})` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs">{score}</span>
              </div>
              <RiskBadge risk={risk} />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
