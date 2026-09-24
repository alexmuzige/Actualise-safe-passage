import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Route as RouteIcon,
  MapPinned,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useProfile, ROLE_LABEL } from "@/lib/profile-store";
import { useIsSuperAdmin } from "@/lib/features-store";



const nav: Array<{
  to: "/dashboard" | "/rapport" | "/incidents" | "/itineraires" | "/zones";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/rapport", label: "Nouveau rapport", icon: FilePlus2 },
  { to: "/incidents", label: "Incidents", icon: ListChecks },
  { to: "/itineraires", label: "Analyse d'itinéraire", icon: RouteIcon },
  { to: "/zones", label: "Zones de santé", icon: MapPinned },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const profile = useProfile();
  const isSuperAdmin = useIsSuperAdmin();




  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-sm font-semibold tracking-wider">HUMASAFE</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Analyse d'itinéraires
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Opérations
          </div>
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isSuperAdmin && (
            <>
              <div className="mt-5 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Administration
              </div>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Droits d'accès</span>
              </Link>
            </>
          )}
        </nav>


        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
            </span>
            Nœud opérationnel · Nord-Kivu
          </div>
          <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">
            v0.4 · offline-ready
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              République Démocratique du Congo · Nord-Kivu
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs md:flex">
              <Radio className="h-3.5 w-3.5 text-risk-low" />
              <span className="text-muted-foreground">Synchro</span>
              <span className="font-mono">OK · il y a 2 min</span>
            </div>
            <button
              onClick={toggle}
              aria-label="Basculer le thème"
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/profil"
              className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-accent"
              title="Voir mon profil"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-background"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.initials}
              </div>
              <div className="hidden text-right text-xs leading-tight md:block">
                <div className="font-medium">{profile.fullName}</div>
                <div className="text-muted-foreground">
                  {ROLE_LABEL[profile.role]} · {profile.baseCity}
                </div>
              </div>
            </Link>

          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
