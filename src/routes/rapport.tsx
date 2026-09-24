import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useFeature } from "@/lib/features-store";
import { AppLayout } from "@/components/app-layout";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CATEGORY_LABEL, healthZones, routeSegments, type IncidentCategory, type Severity } from "@/lib/mock-data";
import { incidentsStore } from "@/lib/incidents-store";
import { Paperclip, MapPin, Send, WifiOff } from "lucide-react";

export const Route = createFileRoute("/rapport")({
  component: NewReport,
});

const schema = z.object({
  zoneId: z.string().min(1, "Sélectionner une zone"),
  area: z.string().min(1, "Aire de santé requise"),
  category: z.string().min(1, "Catégorie requise"),
  severity: z.number().int().min(1).max(5),
  description: z.string().trim().min(15, "Décrivez brièvement l'événement (min. 15 caractères)").max(1200),
  reporter: z.string().trim().min(2, "Identifiant informateur requis").max(30),
  segmentId: z.string().optional(),
  when: z.string().min(1, "Date/heure requise"),
});

function NewReport() {
  const canReport = useFeature("new_report");
  const navigate = useNavigate();
  const [zoneId, setZoneId] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<IncidentCategory | "">("");
  const [severity, setSeverity] = useState<Severity>(3);
  const [description, setDescription] = useState("");
  const [reporter, setReporter] = useState("IN-");
  const [segmentId, setSegmentId] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [attachments, setAttachments] = useState(0);
  const [offline, setOffline] = useState(false);

  const zone = healthZones.find((z) => z.id === zoneId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ zoneId, area, category, severity, description, reporter, segmentId: segmentId || undefined, when });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    const id = `r-${1043 + Math.floor(Math.random() * 900)}`;
    const zoneObj = healthZones.find((z) => z.id === zoneId)!;
    incidentsStore.add({
      id,
      zoneId,
      area,
      category: category as IncidentCategory,
      severity,
      description: description.trim(),
      reporter: reporter.trim(),
      createdAt: new Date(when).toISOString(),
      x: zoneObj.x + (Math.random() - 0.5) * 4,
      y: zoneObj.y + (Math.random() - 0.5) * 4,
      segmentId: segmentId || undefined,
      attachments,
      status: "unverified",
    });
    if (offline) {
      toast.success("Rapport en file · sera synchronisé au retour du réseau");
    } else {
      toast.success(`Rapport ${id.toUpperCase()} transmis`);
    }
    navigate({ to: "/incidents" });
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-5 py-6 lg:px-8">
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Collecte terrain · formulaire structuré
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Nouveau rapport</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisie rapide, offline-first. Les données minimales sont obligatoires ; les pièces jointes restent optionnelles.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-border bg-card">
          <Section title="1 · Localisation">
            <Field label="Zone de santé" required>
              <select
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value);
                  setArea("");
                }}
                className={inputCls}
              >
                <option value="">— sélectionner —</option>
                {healthZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} · {z.territory}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Aire de santé" required>
              <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls} disabled={!zone}>
                <option value="">— sélectionner —</option>
                {zone?.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tronçon routier (si connu)">
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className={inputCls}>
                <option value="">— aucun —</option>
                {routeSegments.map((s) => {
                  const f = healthZones.find((z) => z.id === s.from)?.name;
                  const t = healthZones.find((z) => z.id === s.to)?.name;
                  return (
                    <option key={s.id} value={s.id}>
                      {f} → {t} ({s.distanceKm} km)
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Coordonnées GPS">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                onClick={() => toast.info("Capture GPS simulée — position du chef-lieu utilisée")}
              >
                <MapPin className="h-4 w-4" /> Capturer la position
              </button>
            </Field>
          </Section>

          <Section title="2 · Événement">
            <Field label="Catégorie" required>
              <select value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)} className={inputCls}>
                <option value="">— sélectionner —</option>
                {(Object.keys(CATEGORY_LABEL) as IncidentCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date et heure observées" required>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
            </Field>
            <Field label={`Gravité perçue · ${severity}/5`} required full>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as Severity[]).map((n) => {
                  const active = severity === n;
                  const color = ["risk-low", "risk-low", "risk-moderate", "risk-high", "risk-critical"][n - 1];
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setSeverity(n)}
                      className="rounded-md border px-2 py-2 font-mono text-sm transition"
                      style={{
                        borderColor: active ? `var(--${color})` : "var(--border)",
                        backgroundColor: active ? `color-mix(in oklch, var(--${color}) 20%, transparent)` : "transparent",
                        color: active ? `var(--${color})` : "var(--muted-foreground)",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Mineur</span>
                <span>Critique</span>
              </div>
            </Field>
            <Field label="Description libre" required full>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1200}
                placeholder="Décrire les faits observés : acteurs, comportement, impact sur la circulation…"
                className={inputCls + " resize-none"}
              />
              <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                {description.length}/1200
              </div>
            </Field>
          </Section>

          <Section title="3 · Source & annexes">
            <Field label="Identifiant informateur" required>
              <input value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder="IN-000" className={inputCls} />
            </Field>
            <Field label="Pièces jointes (facultatives)">
              <button
                type="button"
                onClick={() => setAttachments((a) => a + 1)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" /> Ajouter {attachments > 0 && `(${attachments})`}
              </button>
            </Field>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={offline}
                onChange={(e) => setOffline(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <WifiOff className="h-3.5 w-3.5" /> Mode hors ligne · file d'attente locale
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              {canReport ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Send className="h-4 w-4" /> Transmettre
                </button>
              ) : (
                <span className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground">
                  Soumission désactivée par l'administrateur
                </span>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border p-5">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}
