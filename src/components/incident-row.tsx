import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CATEGORY_LABEL, type Incident, classify } from "@/lib/mock-data";
import { RiskBadge } from "./risk-badge";
import { cn } from "@/lib/utils";
import { Paperclip, ShieldCheck, Clock3, MapPin } from "lucide-react";

function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr }));
  }, [iso]);
  return <>{label ?? ""}</>;
}

export function IncidentRow({ incident, compact }: { incident: Incident; compact?: boolean }) {
  const risk = classify([0, 15, 30, 50, 70, 90][incident.severity]);
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-accent/30",
        compact && "py-2.5",
      )}
    >
      <div
        className="mt-1 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: `var(--risk-${risk})`,
          boxShadow: `0 0 0 3px color-mix(in oklch, var(--risk-${risk}) 20%, transparent)`,
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-muted-foreground">
            {incident.id.toUpperCase()}
          </span>
          <span className="text-sm font-medium">{CATEGORY_LABEL[incident.category]}</span>
          <RiskBadge risk={risk} />
          {incident.status === "verified" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-risk-low">
              <ShieldCheck className="h-3 w-3" /> Vérifié
            </span>
          )}
          {incident.status === "unverified" && (
            <span className="text-[11px] text-muted-foreground">À vérifier</span>
          )}
          {incident.status === "resolved" && (
            <span className="text-[11px] text-muted-foreground line-through">Résolu</span>
          )}
        </div>
        {!compact && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {incident.area}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            <RelativeTime iso={incident.createdAt} />
          </span>
          <span className="font-mono">Sév. {incident.severity}/5</span>
          <span className="font-mono opacity-70">{incident.reporter}</span>
          {incident.attachments ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> {incident.attachments}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
