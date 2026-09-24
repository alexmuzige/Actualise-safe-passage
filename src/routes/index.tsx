import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  Radio,
  MapPinned,
  Activity,
  ArrowUpRight,
  Compass,
  Lock,
  Zap,
  Users,
  Sun,
  Moon,
  Languages,
  MessagesSquare,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useLang, t } from "@/lib/lang";
import { useIncidents } from "@/lib/incidents-store";
import { ClientOnlyMap } from "@/components/client-only-map";
import { NewsSlider } from "@/components/news-slider";
import { ContactDialog } from "@/components/contact-dialog";
import {
  healthZones,
  itineraries,
  routeSegments,
  segmentScore,
  itineraryScore,
  recommend,
  RECOMMENDATION_LABEL,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HUMASAFE · Plateforme d'analyse de risque humanitaire" },
      {
        name: "description",
        content:
          "Centralisez les rapports terrain, évaluez les itinéraires et décidez en toute sécurité au Nord-Kivu.",
      },
    ],
  }),
  component: Landing,
});

type CapKey = "map" | "score" | "reco" | "offline" | "network" | "privacy";

function Landing() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, change: setLang } = useLang();
  const tr = (k: Parameters<typeof t>[0]) => t(k, lang);
  const incidents = useIncidents();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 78% 15%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%), radial-gradient(50% 40% at 12% 85%, color-mix(in oklch, var(--risk-critical) 18%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
              <div className="leading-tight">
                <div className="font-mono text-[13px] font-semibold tracking-wider">
                  HUMASAFE
                </div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  {lang === "fr" ? "Analyse d'itinéraires" : "Route analysis"}
                </div>
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#capacites" className="hover:text-foreground">{tr("navCapabilities")}</a>
            <a href="#processus" className="hover:text-foreground">{tr("navProcess")}</a>
            <a href="#terrain" className="hover:text-foreground">{tr("navField")}</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Language switcher */}
            <div
              role="group"
              aria-label={tr("langLabel")}
              className="flex items-center overflow-hidden rounded-md border border-border bg-card/60 font-mono text-[10px] uppercase tracking-widest"
            >
              <Languages className="ml-2 h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => setLang("fr")}
                className={
                  "px-2 py-1 transition " +
                  (lang === "fr"
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
                aria-pressed={lang === "fr"}
              >
                FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={
                  "px-2 py-1 transition " +
                  (lang === "en"
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
                aria-pressed={lang === "en"}
              >
                EN
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? tr("themeToLight") : tr("themeToDark")}
              title={theme === "dark" ? tr("themeToLight") : tr("themeToDark")}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/login"
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              {tr("signIn")}
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">{tr("requestAccess")}</span>
              <span className="sm:hidden">{lang === "fr" ? "Accès" : "Access"}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-5 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-risk-low" />
              </span>
              {tr("activeNode")}
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl md:text-6xl">
              {tr("heroTitle1")} <span className="text-primary">{tr("heroTitleAccent")}</span> {tr("heroTitle2")}
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {tr("heroBody")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:flex-none"
              >
                {tr("openDashboard")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/rapport"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card/60 px-5 py-2.5 text-sm text-foreground transition hover:bg-card sm:flex-none"
              >
                {tr("sendReport")}
              </Link>
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/20 sm:flex-none"
              >
                <MessagesSquare className="h-4 w-4 text-primary" />
                {lang === "fr" ? "Contactez-nous" : "Contact us"}
              </button>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-2 gap-4 border-t border-border/70 pt-6 sm:grid-cols-3">
              {[
                { k: "128", l: tr("statReports") },
                { k: "34", l: tr("statAreas") },
                { k: "< 2 min", l: tr("statDecision") },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-mono text-2xl font-semibold tracking-tight">
                    {s.k}
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Console preview avec image de fond "volcan.jpg" */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-risk-critical/10 blur-2xl" />
            
            <div 
              className="relative overflow-hidden rounded-xl border border-border/80 p-4 shadow-2xl backdrop-blur-md"
              style={{
                backgroundImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.88)), url('/volcan.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-risk-critical/70" />
                  <span className="h-2 w-2 rounded-full bg-risk-moderate/70" />
                  <span className="h-2 w-2 rounded-full bg-risk-low/70" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                  {tr("route")}
                </div>
                <Radio className="h-3.5 w-3.5 text-risk-low" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Goma — Kibumba", score: 22, tone: "low" },
                  { name: "Kibumba — Rugari", score: 58, tone: "moderate" },
                  { name: "Rugari — Rutshuru", score: 81, tone: "critical" },
                ].map((s) => (
                  <div
                    key={s.name}
                    className="rounded-md border border-white/10 bg-black/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{s.name}</span>
                      <span
                        className="font-mono text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: `var(--risk-${s.tone})` }}
                      >
                        {s.score}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${s.score}%`,
                          backgroundColor: `var(--risk-${s.tone})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                  {tr("recommendation")}
                </div>
                <div className="rounded-md bg-risk-high/20 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-risk-high">
                  {tr("deviation")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actualités défilantes (gérées par l'admin) */}
      <NewsSlider lang={lang} />

      {/* OpenStreetMap — zones & aires de santé */}
      <section id="carte" className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            OpenStreetMap · Nord-Kivu
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {lang === "fr"
              ? "Zones de santé et aires encadrées"
              : "Health zones and framed health areas"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {lang === "fr"
              ? "Chaque zone de santé est géolocalisée ; ses aires de santé sont encadrées et colorées selon le niveau de risque en cours."
              : "Each health zone is geolocated; its health areas are framed and coloured by current risk level."}
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card/60">
          <div className="h-[300px] w-full sm:h-[420px]">
            <ClientOnlyMap />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">
              {lang === "fr" ? "Niveau de risque" : "Risk level"}
            </span>
            {(["low", "moderate", "high", "critical"] as const).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: `var(--risk-${r})` }}
                />
                {r === "low"
                  ? lang === "fr" ? "faible" : "low"
                  : r === "moderate"
                    ? lang === "fr" ? "modéré" : "moderate"
                    : r === "high"
                      ? lang === "fr" ? "élevé" : "high"
                      : lang === "fr" ? "critique" : "critical"}
              </span>
            ))}
            <span className="ml-auto font-mono text-[10px] opacity-70">
              {lang === "fr" ? "Rectangle = aire de santé" : "Rectangle = health area"}
            </span>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capacites" className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {tr("capsKicker")}
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {tr("capsTitle")}
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilityCards({ tr, lang, incidents }).map((c) => (
            <Link
              key={c.key}
              to={c.to}
              className="group relative flex flex-col rounded-lg border border-border bg-card/60 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border"
                  style={{
                    color: "var(--primary)",
                    backgroundColor:
                      "color-mix(in oklch, var(--primary) 12%, transparent)",
                  }}
                >
                  <c.icon className="h-4 w-4" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                  {c.badge}
                  <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                {c.stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-mono text-lg font-semibold leading-none tracking-tight">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-primary opacity-80 transition group-hover:opacity-100">
                {tr("capOpen")}
                <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="processus" className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="rounded-xl border border-border bg-card/60 p-5 sm:p-6 md:p-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: tr("step1t"), d: tr("step1d") },
              { n: "02", t: tr("step2t"), d: tr("step2d") },
              { n: "03", t: tr("step3t"), d: tr("step3d") },
              { n: "04", t: tr("step4t"), d: tr("step4d") },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="font-mono text-xs font-semibold tracking-widest text-primary">
                  {s.n}
                </div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terrain CTA */}
      <section id="terrain" className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/80 to-background p-6 sm:p-8 md:p-12">
          <div className="grid-bg absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {tr("ctaKicker")}
            </div>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              {tr("ctaTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {tr("ctaBody")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                {tr("requestAccess")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background/50 px-5 py-2.5 text-sm text-foreground transition hover:bg-background"
              >
                {tr("haveAccount")}
              </Link>
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background/50 px-5 py-2.5 text-sm text-foreground transition hover:bg-background"
              >
                <MessagesSquare className="h-4 w-4 text-primary" />
                {lang === "fr" ? "Contactez-nous" : "Contact us"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:px-5">
          <div className="font-mono">HUMASAFE · v0.4</div>
          <div>{tr("footer")}</div>
        </div>
      </footer>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} lang={lang} />

      {/* Bouton flottant contact */}
      <button
        onClick={() => setContactOpen(true)}
        aria-label={lang === "fr" ? "Contactez-nous" : "Contact us"}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-xl transition hover:opacity-90"
      >
        <MessagesSquare className="h-4 w-4" />
        <span className="hidden sm:inline">{lang === "fr" ? "Contactez-nous" : "Contact us"}</span>
      </button>
    </div>
  );
}

// ---- Capability cards with live data previews ----

type Incident = ReturnType<typeof useIncidents>[number];

function capabilityCards({
  tr,
  lang,
  incidents,
}: {
  tr: (k: Parameters<typeof t>[0]) => string;
  lang: "fr" | "en";
  incidents: Incident[];
}) {
  const activeSignals = incidents.filter((i) => i.status !== "resolved").length;

  const zoneRows = healthZones
    .map((z) => {
      const zoneSegments = routeSegments
        .filter((s) => s.from === z.id || s.to === z.id)
        .map((s) => segmentScore(s.id, incidents));
      const score = zoneSegments.length
        ? Math.round(zoneSegments.reduce((a, b) => a + b, 0) / zoneSegments.length)
        : 0;
      const signals = incidents.filter(
        (i) => i.zoneId === z.id && i.status !== "resolved",
      ).length;
      return { z, score, signals };
    })
    .sort((a, b) => b.score - a.score);

  const avgScore = zoneRows.length
    ? Math.round(zoneRows.reduce((a, b) => a + b.score, 0) / zoneRows.length)
    : 0;

  const topZone = zoneRows[0];

  const itinRows = itineraries.map((it) => ({
    it,
    score: itineraryScore(it.id, incidents),
    reco: recommend(itineraryScore(it.id, incidents)),
  }));

  const mainReco =
    itinRows.length > 0
      ? itinRows.sort((a, b) => b.score - a.score)[0].reco
      : "go";

  const pending = incidents.filter((i) => i.status === "unverified").length;

  const reporters = new Set(incidents.map((i) => i.reporter));

  const verified = incidents.filter((i) => i.status === "verified").length;
  const unverified = incidents.filter((i) => i.status === "unverified").length;

  const stats = (key: CapKey) => {
    switch (key) {
      case "map":
        return [
          { value: healthZones.length, label: tr("capZonesCount") },
          { value: activeSignals, label: tr("capActiveSignals") },
        ];
      case "score":
        return [
          { value: avgScore, label: tr("capAvgScore") },
          {
            value: topZone ? topZone.z.name.split(" ")[0] : "—",
            label: tr("capTopZone"),
          },
        ];
      case "reco":
        return [
          { value: itineraries.length, label: tr("capRoutesAnalyzed") },
          {
            value:
              lang === "fr"
                ? RECOMMENDATION_LABEL[mainReco].label
                : RECOMMENDATION_LABEL[mainReco].labelEn,
            label: tr("capMainReco"),
          },
        ];
      case "offline":
        return [
          { value: pending, label: tr("capPendingReports") },
          { value: activeSignals, label: tr("capActiveSignals") },
        ];
      case "network":
        return [
          { value: reporters.size, label: tr("capInformants") },
          { value: incidents.length, label: tr("capTotalReports") },
        ];
      case "privacy":
        return [
          { value: verified, label: tr("capVerified") },
          { value: unverified, label: tr("capUnverified") },
        ];
      default:
        return [];
    }
  };

  const badges: Record<CapKey, string> = {
    map: tr("capLiveData"),
    score: tr("capLiveData"),
    reco: tr("capLiveData"),
    offline: tr("capPendingSync"),
    network: tr("capLiveData"),
    privacy: tr("capLiveData"),
  };

  const routes: Record<CapKey, string> = {
    map: "/dashboard",
    score: "/zones",
    reco: "/itineraires",
    offline: "/rapport",
    network: "/incidents",
    privacy: "/profil",
  };

  const cards = [
    { key: "map" as CapKey, icon: MapPinned, title: tr("cap1t"), body: tr("cap1b") },
    { key: "score" as CapKey, icon: Activity, title: tr("cap2t"), body: tr("cap2b") },
    { key: "reco" as CapKey, icon: Compass, title: tr("cap3t"), body: tr("cap3b") },
    { key: "offline" as CapKey, icon: Zap, title: tr("cap4t"), body: tr("cap4b") },
    { key: "network" as CapKey, icon: Users, title: tr("cap5t"), body: tr("cap5b") },
    { key: "privacy" as CapKey, icon: Lock, title: tr("cap6t"), body: tr("cap6b") },
  ];

  return cards.map((c) => ({
    ...c,
    to: routes[c.key],
    badge: badges[c.key],
    stats: stats(c.key),
  }));
}