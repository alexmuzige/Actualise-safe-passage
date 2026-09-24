import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { ShieldCheck, Lock, RotateCcw, ToggleLeft, Megaphone, Plus, Trash2, Eye, EyeOff, Filter, GripVertical } from "lucide-react";
import { useState } from "react";
import {
  useAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  removeAnnouncement,
  reorderAnnouncements,
  resetAnnouncements,
  KIND_LABEL,
  KIND_COLOR,
  type AnnouncementKind,
} from "@/lib/announcements-store";
import { toast } from "sonner";
import {
  FEATURES,
  ROLES,
  ROLE_LABEL,
  SUPER_ADMIN_ROLE,
  setFeature,
  setFeatureForAll,
  resetFeatures,
  useFeatureMatrix,
  useIsSuperAdmin,
} from "@/lib/features-store";
import { useProfile } from "@/lib/profile-store";
import { healthZones } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration · Droits d'accès — HUMASAFE" },
      {
        name: "description",
        content:
          "Panneau super-admin HUMASAFE : activer ou désactiver les fonctionnalités (exports, rapports, partage) par rôle utilisateur.",
      },
      { property: "og:title", content: "Administration · Droits d'accès — HUMASAFE" },
      {
        property: "og:description",
        content:
          "Contrôlez par rôle les boutons et fonctions disponibles pour les utilisateurs terrain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const matrix = useFeatureMatrix();
  const isAdmin = useIsSuperAdmin();
  const profile = useProfile();

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-5">
          <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-risk-high/15 text-risk-high">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-lg font-semibold">Accès restreint</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Le panneau d'administration est réservé au rôle «&nbsp;
              {ROLE_LABEL[SUPER_ADMIN_ROLE]}&nbsp;». Votre rôle actuel est «&nbsp;
              {ROLE_LABEL[profile.role]}&nbsp;».
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
              Modifiez votre rôle depuis la page Profil pour tester le panneau.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const enabledCount = FEATURES.reduce(
    (acc, f) => acc + ROLES.filter((r) => matrix[f.id]?.[r]).length,
    0,
  );
  const total = FEATURES.length * ROLES.length;

  return (
    <AppLayout>
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Super-admin · Contrôle d'accès
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Administration des fonctionnalités
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Activez ou désactivez les boutons de l'application pour chaque rôle utilisateur. Les
              modifications s'appliquent immédiatement à l'interface.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs">
              {enabledCount}/{total} droits actifs
            </div>
            <button
              onClick={() => {
                resetFeatures();
                toast.success("Droits réinitialisés", {
                  description: "La matrice est revenue aux valeurs par défaut.",
                });
              }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Fonctionnalité
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className="px-2 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {ROLE_LABEL[r]}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tout
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => {
                const row = matrix[f.id];
                const allOn = ROLES.every((r) => row?.[r]);
                return (
                  <tr key={f.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{f.label}</div>
                      <div className="mt-0.5 max-w-sm text-[11px] text-muted-foreground">
                        {f.description}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                        {f.scope}
                      </div>
                    </td>
                    {ROLES.map((r) => {
                      const on = !!row?.[r];
                      return (
                        <td key={r} className="px-2 py-3 text-center align-middle">
                          <button
                            role="switch"
                            aria-checked={on}
                            aria-label={`${f.label} — ${ROLE_LABEL[r]}`}
                            onClick={() => {
                              setFeature(f.id, r, !on);
                              toast.success(
                                `${f.label} ${!on ? "activé" : "désactivé"} · ${ROLE_LABEL[r]}`,
                              );
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                              on
                                ? "border-primary/60 bg-primary/80"
                                : "border-border bg-muted"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform ${
                                on ? "translate-x-[18px]" : "translate-x-[3px]"
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right align-middle">
                      <button
                        onClick={() => {
                          setFeatureForAll(f.id, !allOn);
                          toast.success(
                            `${f.label} ${!allOn ? "activé" : "désactivé"} pour tous les rôles`,
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent"
                      >
                        <ToggleLeft className="h-3.5 w-3.5" />
                        {allOn ? "Tout couper" : "Tout activer"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AnnouncementsAdmin />

        <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
          Prototype front-end : la matrice est persistée localement (localStorage) et appliquée au
          rôle du profil actif.
        </p>
      </div>
    </AppLayout>
  );
}

const KINDS: AnnouncementKind[] = ["info", "alerte", "actualite"];

function AnnouncementsAdmin() {
  const items = useAnnouncements();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("actualite");
  const [zoneId, setZoneId] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const zoneName = (id?: string) =>
    id ? (healthZones.find((z) => z.id === id)?.name ?? id) : "Toutes les zones";

  const visible =
    filterZone === "all"
      ? items
      : items.filter((a) => (a.zoneId ?? "") === (filterZone === "none" ? "" : filterZone));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAnnouncement({
      title: title.trim(),
      body: body.trim(),
      kind,
      zoneId,
      date: new Date().toISOString().slice(0, 10),
      published: true,
    });
    setTitle("");
    setBody("");
    toast.success("Actualité publiée", { description: "Elle défile sur la page d'accueil." });
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Page d'accueil · Slider
          </div>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Megaphone className="h-5 w-5 text-primary" />
            Informations & actualités
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              aria-label="Filtrer par zone de santé"
              className="bg-transparent text-xs outline-none"
            >
              <option value="all">Toutes zones de santé</option>
              <option value="none">Sans zone (globale)</option>
              {healthZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              resetAnnouncements();
              toast.success("Actualités réinitialisées");
            }}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Titre
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Contenu
          </span>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Type
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AnnouncementKind)}
              className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k].fr}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Zone de santé
            </span>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Toutes les zones</option>
              {healthZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Publier
          </button>
        </div>
      </form>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Glissez-déposez les cartes pour définir l'ordre d'affichage du slider
      </p>

      <ul className="mt-2 space-y-2">
        {visible.map((a) => (
          <li
            key={a.id}
            draggable={filterZone === "all"}
            onDragStart={() => setDragId(a.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (overId !== a.id) setOverId(a.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) {
                reorderAnnouncements(dragId, a.id);
                toast.success("Ordre du slider mis à jour");
              }
              setDragId(null);
              setOverId(null);
            }}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border bg-card p-3 transition-colors ${
              overId === a.id && dragId && dragId !== a.id
                ? "border-primary"
                : "border-border"
            } ${dragId === a.id ? "opacity-50" : ""}`}
          >
            <span
              className={`mt-1 text-muted-foreground ${
                filterZone === "all" ? "cursor-grab active:cursor-grabbing" : "opacity-30"
              }`}
              title={
                filterZone === "all"
                  ? "Glisser pour réordonner"
                  : "Réordonnancement disponible sans filtre"
              }
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: KIND_COLOR[a.kind],
                    backgroundColor: `color-mix(in oklch, ${KIND_COLOR[a.kind]} 15%, transparent)`,
                  }}
                >
                  {KIND_LABEL[a.kind].fr}
                </span>
                <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {zoneName(a.zoneId)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {a.date}
                </span>
                {!a.published && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    masquée
                  </span>
                )}
              </div>
              <div className="mt-1 truncate text-sm font-medium">{a.title}</div>
              <div className="text-[12px] text-muted-foreground">{a.body}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <select
                value={a.zoneId ?? ""}
                onChange={(e) => updateAnnouncement(a.id, { zoneId: e.target.value })}
                aria-label="Zone de santé"
                className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary"
              >
                <option value="">Toutes</option>
                {healthZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => updateAnnouncement(a.id, { published: !a.published })}
                aria-label={a.published ? "Masquer" : "Publier"}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                {a.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  removeAnnouncement(a.id);
                  toast.success("Actualité supprimée");
                }}
                aria-label="Supprimer"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-risk-critical hover:bg-accent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucune annonce pour ce filtre.
          </li>
        )}
      </ul>
    </section>
  );
}

