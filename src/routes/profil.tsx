import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import {
  CHANNEL_LABEL,
  resetProfile,
  syncProfileFromServer,
  updateProfile,
  useProfile,
  type AlertChannel,
} from "@/lib/profile-store";
import { healthZones } from "@/lib/mock-data";
import { authStore } from "@/lib/auth-store";
import { saveUserIdentity } from "@/api/users.api";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  UserCircle2,
  Building2,
  MapPinned,
  Bell,
  RotateCcw,
  Save,
  Shield,
  LogOut,
  Settings,
  ChevronDown,
  Camera,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil utilisateur · HUMASAFE" },
      {
        name: "description",
        content:
          "Identité, organisation, zones d'affectation et préférences opérationnelles de l'analyste terrain HUMASAFE.",
      },
      { property: "og:title", content: "Profil · HUMASAFE" },
      { property: "og:description", content: "Configurez votre identité opérationnelle HUMASAFE." },
    ],
  }),
  component: ProfilePage,
});

const TERRITORIES = [
  "Beni",
  "Butembo",
  "Goma",
  "Lubero",
  "Masisi",
  "Nyiragongo",
  "Rutshuru",
  "Walikale",
];

const AVATAR_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
];

function ProfilePage() {
  const profile = useProfile();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(profile);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile]);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function set<K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function toggleZone(id: string) {
    set(
      "zoneIds",
      draft.zoneIds.includes(id) ? draft.zoneIds.filter((z) => z !== id) : [...draft.zoneIds, id],
    );
  }

  function toggleChannel(c: AlertChannel) {
    set(
      "alertChannels",
      draft.alertChannels.includes(c)
        ? draft.alertChannels.filter((x) => x !== c)
        : [...draft.alertChannels, c],
    );
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!authStore.get()) {
      toast.error("Connectez-vous pour enregistrer une photo de profil.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choisissez une image au format JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo doit faire au maximum 5 Mo.");
      return;
    }

    setAvatarProcessing(true);
    try {
      const avatarImage = await optimizeAvatar(file);
      updateProfile({ avatarImage });
      setDraft((currentDraft) => ({ ...currentDraft, avatarImage }));
      toast.success("Photo de profil enregistrée sur cet appareil.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger cette photo.");
    } finally {
      setAvatarProcessing(false);
    }
  }

  function removeAvatar() {
    try {
      updateProfile({ avatarImage: null });
      setDraft((currentDraft) => ({ ...currentDraft, avatarImage: null }));
      toast.success("Photo de profil supprimée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer cette photo.");
    }
  }

  async function save() {
    const user = authStore.get();
    if (!user) {
      toast.error("Connectez-vous pour enregistrer votre profil.");
      return;
    }

    const nameParts = draft.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      toast.error("Saisissez au moins le prénom et le nom.");
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await saveUserIdentity(user, {
        prenom: nameParts[0]!,
        nom: nameParts[nameParts.length - 1]!,
        postnom: nameParts.slice(1, -1).join(" "),
      });
      updateProfile({
        avatarColor: draft.avatarColor,
        baseCity: draft.baseCity,
        territory: draft.territory,
        zoneIds: draft.zoneIds,
        language: draft.language,
        offlineFirst: draft.offlineFirst,
        alertChannels: draft.alertChannels,
        minAlertSeverity: draft.minAlertSeverity,
      });
      syncProfileFromServer(updatedUser);
      toast.success("Profil enregistré sur le serveur");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    resetProfile();
    toast.message("Préférences locales réinitialisées. L'identité serveur est conservée.");
  }

  function handleLogout() {
    authStore.logout();
    toast.success("Déconnexion réussie");
    navigate({ to: "/" });
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Identité du compte serveur · préférences locales
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Profil utilisateur</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton du Profil avec menu déroulant séparé */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-xs transition hover:bg-accent"
              >
                <ProfileAvatar
                  image={draft.avatarImage}
                  initials={draft.initials}
                  color={draft.avatarColor}
                  className="h-5 w-5 text-[10px]"
                />
                <span className="max-w-[100px] truncate">{draft.fullName}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-md border border-border bg-card py-1.5 shadow-xl z-50">
                  <div className="border-b border-border px-3 py-1.5 mb-1">
                    <p className="text-xs font-semibold truncate">{draft.fullName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {draft.organization || "Analyste terrain"}
                    </p>
                  </div>

                  {/* Option 1 : Modifier le profil */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      toast.info("Mode modification actif");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-primary" />
                    <span>Modifier le profil</span>
                  </button>

                  <div className="my-1 border-t border-border" />

                  {/* Option 2 : Se déconnecter */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition font-medium cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition disabled:opacity-40 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>

        {/* Identity card */}
        <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
          <SectionHeader
            icon={UserCircle2}
            title="Identité"
            subtitle="Nom synchronisé avec le compte serveur"
          />
          <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3">
              <ProfileAvatar
                image={draft.avatarImage}
                initials={draft.initials}
                color={draft.avatarColor}
                className="h-24 w-24 text-3xl shadow-inner"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <Camera className="h-3.5 w-3.5" />
                  {avatarProcessing
                    ? "Chargement..."
                    : draft.avatarImage
                      ? "Changer la photo"
                      : "Ajouter une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={avatarProcessing}
                    onChange={handleAvatarChange}
                  />
                </label>
                {draft.avatarImage && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
              <p className="max-w-48 text-center text-[11px] text-muted-foreground">
                JPEG, PNG ou WebP · 5 Mo maximum · conservée sur cet appareil
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => set("avatarColor", c)}
                    aria-label={`Couleur ${c}`}
                    className="h-5 w-5 rounded-full border transition cursor-pointer"
                    style={{
                      backgroundColor: c,
                      borderColor: draft.avatarColor === c ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Field label="Nom complet">
                <input
                  value={draft.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Les initiales sont calculées à partir du nom enregistré.
              </p>
            </div>
          </div>
        </section>

        {/* Organization */}
        <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
          <SectionHeader
            icon={Building2}
            title="Organisation & rôle"
            subtitle="Rattachement et fonction sur le terrain"
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            <Field label="ONG / Agence">
              <input
                value={draft.organization}
                readOnly
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
              />
            </Field>
            <Field label="Fonction">
              <input
                value={draft.role}
                readOnly
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
              />
            </Field>
            <Field label="Ville de base">
              <input
                value={draft.baseCity}
                onChange={(e) => set("baseCity", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Territoire principal">
              <select
                value={draft.territory}
                onChange={(e) => set("territory", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {TERRITORIES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* Zones */}
        <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
          <SectionHeader
            icon={MapPinned}
            title="Zones d'affectation"
            subtitle={`${draft.zoneIds.length} zone(s) suivie(s) par défaut`}
          />
          <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {healthZones.map((z) => {
              const active = draft.zoneIds.includes(z.id);
              return (
                <button
                  key={z.id}
                  onClick={() => toggleZone(z.id)}
                  className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition cursor-pointer ${
                    active ? "border-primary bg-primary/10" : "border-border bg-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{z.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{z.territory}</div>
                  </div>
                  <div
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                      active ? "border-primary bg-primary" : "border-border bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
          <SectionHeader
            icon={Bell}
            title="Préférences opérationnelles"
            subtitle="Langue, mode hors-ligne et canaux d'alerte"
          />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Langue de travail">
              <select
                value={draft.language}
                onChange={(e) => set("language", e.target.value as typeof draft.language)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </Field>

            <Field label="Sévérité minimale d'alerte">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={draft.minAlertSeverity}
                  onChange={(e) =>
                    set("minAlertSeverity", Number(e.target.value) as typeof draft.minAlertSeverity)
                  }
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-right font-mono text-sm">
                  {draft.minAlertSeverity}/5
                </span>
              </div>
            </Field>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Canaux d'alerte
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CHANNEL_LABEL) as AlertChannel[]).map((c) => {
                  const active = draft.alertChannels.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleChannel(c)}
                      className={`rounded-full border px-3 py-1 text-xs transition cursor-pointer ${
                        active
                          ? "border-primary bg-primary/15 text-primary font-medium"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {CHANNEL_LABEL[c]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background/50 px-3 py-3">
              <input
                type="checkbox"
                checked={draft.offlineFirst}
                onChange={(e) => set("offlineFirst", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <div>
                <div className="text-sm font-medium">Mode hors-ligne prioritaire</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Les rapports sont conservés localement et synchronisés dès qu'un lien SAT ou GSM
                  est détecté.
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Section Déconnexion classique */}
        <section className="mb-4 overflow-hidden rounded-lg border border-destructive/30 bg-card">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <LogOut className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Session & Sécurité</div>
                <div className="text-[11px] text-muted-foreground">
                  Fermer la session active sur cet appareil
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-xs transition hover:bg-destructive/90 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Se déconnecter
            </button>
          </div>
        </section>

        <div className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-risk-low" />
          L'identité, le rôle et l'organisation proviennent de votre compte serveur. Les préférences
          opérationnelles restent enregistrées localement pour ce compte.
        </div>
      </div>
    </AppLayout>
  );
}

async function optimizeAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 512 / bitmap.width, 512 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer cette image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/webp", 0.85);
    if (!/^data:image\/(?:png|jpeg|webp);base64,/.test(image)) {
      throw new Error("Le format de cette image n'est pas pris en charge.");
    }
    if (image.length > 750_000) {
      throw new Error("Cette image reste trop volumineuse après compression.");
    }
    return image;
  } finally {
    bitmap.close();
  }
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof UserCircle2;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
