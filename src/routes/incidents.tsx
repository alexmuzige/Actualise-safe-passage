import { createFileRoute } from "@tanstack/react-router";
import { useFeature } from "@/lib/features-store";
import { AppLayout } from "@/components/app-layout";
import { IncidentRow } from "@/components/incident-row";
import { useIncidents } from "@/lib/incidents-store";
import { CATEGORY_LABEL, type IncidentCategory, healthZones } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
});

function IncidentsPage() {
  const incidents = useIncidents();
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"" | "verified" | "unverified" | "resolved">("");
  const [minSev, setMinSev] = useState(1);
  const canCsv = useFeature("export_csv");
  const canExcel = useFeature("export_excel");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return incidents.filter((i) => {
      if (zone && i.zoneId !== zone) return false;
      if (category && i.category !== category) return false;
      if (status && i.status !== status) return false;
      if (i.severity < minSev) return false;
      if (qq && !(i.description.toLowerCase().includes(qq) || i.area.toLowerCase().includes(qq) || i.id.includes(qq))) return false;
      return true;
    });
  }, [incidents, q, zone, category, status, minSev]);

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Historique · {filtered.length} / {incidents.length} rapports
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Incidents</h1>
          </div>
          <div className="flex gap-2">
            {canCsv && (<button
              onClick={() => {
                const csv = ["id,zone,aire,catégorie,sévérité,statut,date,description"]
                  .concat(
                    filtered.map((i) =>
                      [i.id, i.zoneId, i.area, i.category, i.severity, i.status, i.createdAt, `"${i.description.replace(/"/g, '""')}"`].join(","),
                    ),
                  )
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `humasafe-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Exporter CSV
            </button>)}
            {canExcel && (<button
              onClick={async () => {
                const { exportToExcel } = await import("@/lib/export-excel");
                exportToExcel(
                  filtered.map((i) => ({
                    ID: i.id,
                    Zone: i.zoneId,
                    Aire: i.area,
                    Catégorie: CATEGORY_LABEL[i.category],
                    Sévérité: i.severity,
                    Statut: i.status,
                    Date: i.createdAt,
                    Description: i.description,
                  })),
                  "humasafe-nk-incidents",
                  "Incidents",
                );
              }}
              className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              Exporter Excel
            </button>)}
          </div>
          {!canCsv && !canExcel && (
            <span className="rounded-md border border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              Exports désactivés par l'administrateur
            </span>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (id, aire, description)…"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Toutes les zones</option>
              {healthZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Toutes catégories</option>
              {(Object.keys(CATEGORY_LABEL) as IncidentCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Tous statuts</option>
              <option value="verified">Vérifiés</option>
              <option value="unverified">À vérifier</option>
              <option value="resolved">Résolus</option>
            </select>
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Sév. ≥
              <input
                type="range"
                min={1}
                max={5}
                value={minSev}
                onChange={(e) => setMinSev(Number(e.target.value))}
                className="w-16 accent-primary"
              />
              <span className="font-mono text-foreground">{minSev}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted-foreground">
              Aucun rapport ne correspond aux filtres.
            </div>
          ) : (
            filtered.map((i) => <IncidentRow key={i.id} incident={i} />)
          )}
        </div>
      </div>
    </AppLayout>
  );
}
