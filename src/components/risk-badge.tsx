import { cn } from "@/lib/utils";
import type { RiskClass } from "@/lib/mock-data";
import { RISK_LABEL } from "@/lib/mock-data";

const styles: Record<RiskClass, string> = {
  low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/40",
  high: "bg-risk-high/15 text-risk-high border-risk-high/40",
  critical: "bg-risk-critical/20 text-risk-critical border-risk-critical/50",
};

export function RiskBadge({
  risk,
  score,
  className,
}: {
  risk: RiskClass;
  score?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
        styles[risk],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {RISK_LABEL[risk]}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
