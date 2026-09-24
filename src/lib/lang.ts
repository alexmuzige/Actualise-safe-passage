import { useEffect, useState } from "react";

export type Lang = "fr" | "en";
const KEY = "sitrep-nk-lang";

const listeners = new Set<() => void>();
let current: Lang = "fr";

function notify() {
  listeners.forEach((l) => l());
}

export function useLang() {
  const [lang, setLang] = useState<Lang>(current);

  useEffect(() => {
    const stored =
      (typeof localStorage !== "undefined" && (localStorage.getItem(KEY) as Lang | null)) || null;
    if (stored === "fr" || stored === "en") {
      current = stored;
      setLang(stored);
    }
    const cb = () => setLang(current);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  function change(next: Lang) {
    current = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    notify();
  }

  function toggle() {
    change(lang === "fr" ? "en" : "fr");
  }

  return { lang, change, toggle };
}

type Dict = Record<string, { fr: string; en: string }>;

export const landingDict = {
  navCapabilities: { fr: "Capacités", en: "Capabilities" },
  navProcess: { fr: "Processus", en: "Process" },
  navField: { fr: "Terrain", en: "Field" },
  signIn: { fr: "Se connecter", en: "Sign in" },
  requestAccess: { fr: "Demander un accès", en: "Request access" },
  activeNode: { fr: "Nœud actif · Goma · Nord-Kivu", en: "Active node · Goma · North Kivu" },
  heroTitle1: { fr: "La décision", en: "The decision" },
  heroTitleAccent: { fr: "avant", en: "before" },
  heroTitle2: { fr: "le départ.", en: "departure." },
  heroBody: {
    fr: "SITREP-NK agrège les signaux du terrain — incidents, checkpoints, affrontements, entraves — et transforme chaque itinéraire humanitaire en un score de risque exploitable en moins de deux minutes.",
    en: "SITREP-NK aggregates field signals — incidents, checkpoints, clashes, obstructions — and turns every humanitarian route into an actionable risk score in under two minutes.",
  },
  openDashboard: { fr: "Ouvrir le tableau de bord", en: "Open the dashboard" },
  sendReport: { fr: "Envoyer un rapport terrain", en: "Send a field report" },
  statReports: { fr: "Rapports / semaine", en: "Reports / week" },
  statAreas: { fr: "Aires de santé", en: "Health areas" },
  statDecision: { fr: "Temps de décision", en: "Decision time" },
  route: { fr: "itinéraire · goma → rutshuru", en: "route · goma → rutshuru" },
  recommendation: { fr: "Recommandation", en: "Recommendation" },
  deviation: { fr: "→ Déviation conseillée", en: "→ Deviation advised" },
  capsKicker: { fr: "Capacités opérationnelles", en: "Operational capabilities" },
  capsTitle: {
    fr: "Un outil conçu avec les équipes terrain.",
    en: "A tool designed with field teams.",
  },
  cap1t: { fr: "Cartographie du risque", en: "Risk mapping" },
  cap1b: {
    fr: "Visualisation par tronçon et par zone de santé, mise à jour en continu.",
    en: "Segment- and health-zone-level visualization, continuously updated.",
  },
  cap2t: { fr: "Moteur de score", en: "Scoring engine" },
  cap2b: {
    fr: "Pondération par gravité, catégorie, ancienneté et corroboration des sources.",
    en: "Weighted by severity, category, recency and source corroboration.",
  },
  cap3t: { fr: "Recommandations", en: "Recommendations" },
  cap3b: {
    fr: "Passage, déviation ou report — une consigne claire pour chaque itinéraire.",
    en: "Go, divert or postpone — a clear directive for every route.",
  },
  cap4t: { fr: "Offline-first", en: "Offline-first" },
  cap4b: {
    fr: "Saisie et synchronisation différée pour les zones à connectivité intermittente.",
    en: "Deferred capture and sync for areas with intermittent connectivity.",
  },
  cap5t: { fr: "Réseau d'informateurs", en: "Informant network" },
  cap5b: {
    fr: "Rôles gradués : informateur, analyste, coordinateur — traçabilité complète.",
    en: "Graded roles: informant, analyst, coordinator — full traceability.",
  },
  cap6t: { fr: "Confidentialité", en: "Confidentiality" },
  cap6b: {
    fr: "Anonymisation des sources, contrôle d'accès granulaire par zone.",
    en: "Source anonymization, granular per-zone access control.",
  },
  step1t: { fr: "Signaler", en: "Report" },
  step1d: {
    fr: "Un informateur envoie un rapport structuré depuis le terrain.",
    en: "An informant sends a structured report from the field.",
  },
  step2t: { fr: "Corroborer", en: "Corroborate" },
  step2d: {
    fr: "Le système croise les sources et évalue la fiabilité.",
    en: "The system cross-checks sources and rates reliability.",
  },
  step3t: { fr: "Scorer", en: "Score" },
  step3d: {
    fr: "Chaque tronçon reçoit un score de risque dynamique.",
    en: "Every segment gets a dynamic risk score.",
  },
  step4t: { fr: "Décider", en: "Decide" },
  step4d: {
    fr: "L'équipe reçoit une recommandation claire avant départ.",
    en: "The team gets a clear recommendation before departure.",
  },
  ctaKicker: { fr: "Rejoindre le réseau", en: "Join the network" },
  ctaTitle: {
    fr: "Chaque rapport terrain sauve un trajet.",
    en: "Every field report saves a trip.",
  },
  ctaBody: {
    fr: "SITREP-NK est réservé aux organisations humanitaires accréditées opérant en République Démocratique du Congo.",
    en: "SITREP-NK is reserved for accredited humanitarian organizations operating in the Democratic Republic of the Congo.",
  },
  haveAccount: { fr: "J'ai déjà un compte", en: "I already have an account" },
  footer: { fr: "© 2026 · Nord-Kivu Operational Node", en: "© 2026 · North Kivu Operational Node" },
  themeToLight: { fr: "Passer en mode clair", en: "Switch to light mode" },
  themeToDark: { fr: "Passer en mode sombre", en: "Switch to dark mode" },
  langLabel: { fr: "Langue", en: "Language" },
  capOpen: { fr: "Ouvrir", en: "Open" },
  capClose: { fr: "Fermer", en: "Close" },
  capLiveData: { fr: "Données en direct", en: "Live data" },
  capZoneCol: { fr: "Zone de santé", en: "Health zone" },
  capScoreCol: { fr: "Score", en: "Score" },
  capRiskCol: { fr: "Risque", en: "Risk" },
  capSignalsCol: { fr: "Signaux", en: "Signals" },
  capItinCol: { fr: "Itinéraire", en: "Itinerary" },
  capRecoCol: { fr: "Reco", en: "Reco" },
  capReporterCol: { fr: "Informateur", en: "Informant" },
  capReportsCol: { fr: "Rapports", en: "Reports" },
  capCategoryCol: { fr: "Catégorie", en: "Category" },
  capSeverityCol: { fr: "Sévérité", en: "Severity" },
  capStatusCol: { fr: "Statut", en: "Status" },
  capPendingSync: { fr: "En attente de synchronisation", en: "Pending sync" },
  capFormula: { fr: "Formule de pondération", en: "Weighting formula" },
  capCategoryWeights: { fr: "Poids par catégorie", en: "Category weights" },
  capSeverityWeights: { fr: "Poids par sévérité", en: "Severity weights" },
  capZonesCount: { fr: "zones suivies", en: "tracked zones" },
  capActiveSignals: { fr: "signaux actifs", en: "active signals" },
  capAvgScore: { fr: "score moyen", en: "average score" },
  capTopZone: { fr: "zone la plus à risque", en: "highest-risk zone" },
  capRoutesAnalyzed: { fr: "itinéraires analysés", en: "routes analyzed" },
  capMainReco: { fr: "recommandation principale", en: "main recommendation" },
  capPendingReports: { fr: "rapports en attente", en: "pending reports" },
  capInformants: { fr: "informateurs actifs", en: "active informants" },
  capTotalReports: { fr: "rapports collectés", en: "reports collected" },
  capVerified: { fr: "vérifiés", en: "verified" },
  capUnverified: { fr: "non vérifiés", en: "unverified" },
} satisfies Dict;

export function t<K extends keyof typeof landingDict>(key: K, lang: Lang): string {
  return landingDict[key][lang];
}
