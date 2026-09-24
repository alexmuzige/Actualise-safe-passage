import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  healthZones,
  routeSegments,
  segmentScore,
  classify,
  CATEGORY_LABEL,
  RISK_LABEL,
  type Incident,
  type RiskClass,
} from "@/lib/mock-data";
import { Plus, Minus, Locate, Maximize2 } from "lucide-react";

const RISK_STROKE: Record<RiskClass, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};

type HoverTarget =
  | { kind: "zone"; id: string; x: number; y: number }
  | { kind: "incident"; id: string; x: number; y: number }
  | { kind: "segment"; id: string; x: number; y: number }
  | null;

const BASE_SIZE = 100;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export function RiskMap({
  incidents,
  highlightSegments,
  className,
  onSelectIncident,
}: {
  incidents: Incident[];
  highlightSegments?: string[];
  className?: string;
  onSelectIncident?: (id: string) => void;
}) {
  const segmentRisks = useMemo(() => {
    return routeSegments.map((s) => {
      const score = segmentScore(s.id, incidents);
      return { seg: s, score, risk: classify(score) };
    });
  }, [incidents]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<HoverTarget>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const clampPan = useCallback((nx: number, ny: number, z: number) => {
    const max = (BASE_SIZE * (z - 1)) / 2;
    return {
      x: Math.max(-max, Math.min(max, nx)),
      y: Math.max(-max, Math.min(max, ny)),
    };
  }, []);

  const viewBox = useMemo(() => {
    const size = BASE_SIZE / zoom;
    const cx = BASE_SIZE / 2 - pan.x / zoom;
    const cy = BASE_SIZE / 2 - pan.y / zoom;
    return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
  }, [zoom, pan]);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor));
        if (next === prev) return prev;
        // Zoom towards cursor if provided
        if (clientX !== undefined && clientY !== undefined && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const px = ((clientX - rect.left) / rect.width - 0.5) * BASE_SIZE;
          const py = ((clientY - rect.top) / rect.height - 0.5) * BASE_SIZE;
          setPan((p) => {
            const ratio = next / prev;
            const nx = px - (px - p.x) * ratio;
            const ny = py - (py - p.y) * ratio;
            return clampPan(nx, ny, next);
          });
        } else {
          setPan((p) => clampPan(p.x, p.y, next));
        }
        return next;
      });
    },
    [clampPan],
  );

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("[data-marker]")) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * BASE_SIZE;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * BASE_SIZE;
    setPan(clampPan(dragStart.current.panX + dx, dragStart.current.panY + dy, zoom));
  };
  const onPointerUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");

  // Aggregate incidents by zone for badge counts
  const zoneIncidentCount = useMemo(() => {
    const m = new Map<string, number>();
    activeIncidents.forEach((i) => m.set(i.zoneId, (m.get(i.zoneId) ?? 0) + 1));
    return m;
  }, [activeIncidents]);

  const hoverData = useMemo(() => {
    if (!hover) return null;
    if (hover.kind === "zone") {
      const z = healthZones.find((h) => h.id === hover.id);
      if (!z) return null;
      const count = zoneIncidentCount.get(z.id) ?? 0;
      return { title: z.name, sub: `${z.territory} · ${z.areas.length} aires`, meta: `${count} signal(s) actif(s)` };
    }
    if (hover.kind === "incident") {
      const i = incidents.find((x) => x.id === hover.id);
      if (!i) return null;
      return {
        title: `${CATEGORY_LABEL[i.category]} — ${i.area}`,
        sub: i.description,
        meta: `Sévérité ${i.severity}/5 · ${i.status}`,
      };
    }
    if (hover.kind === "segment") {
      const sr = segmentRisks.find((s) => s.seg.id === hover.id);
      if (!sr) return null;
      const from = healthZones.find((z) => z.id === sr.seg.from)?.name ?? sr.seg.from;
      const to = healthZones.find((z) => z.id === sr.seg.to)?.name ?? sr.seg.to;
      return { title: `${from} → ${to}`, sub: `${sr.seg.distanceKm} km`, meta: `Score ${sr.score} · ${RISK_LABEL[sr.risk]}` };
    }
    return null;
  }, [hover, incidents, segmentRisks, zoneIncidentCount]);

  // Scale strokes/radii inversely with zoom so they stay legible
  const s = 1 / zoom;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="var(--panel-border)" strokeWidth="0.12" opacity="0.6" />
          </pattern>
          <radialGradient id="terrain" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="var(--panel)" />
            <stop offset="100%" stopColor="var(--background)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--risk-critical)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--risk-critical)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={BASE_SIZE} height={BASE_SIZE} fill="url(#terrain)" />
        <rect x="0" y="0" width={BASE_SIZE} height={BASE_SIZE} fill="url(#grid)" />

        <path
          d="M 12 8 L 78 5 L 88 20 L 84 42 L 82 60 L 76 78 L 68 92 L 42 94 L 22 86 L 10 68 L 8 40 Z"
          fill="var(--muted)"
          fillOpacity="0.35"
          stroke="var(--primary)"
          strokeOpacity="0.55"
          strokeWidth={0.4 * s}
          strokeDasharray={`${1.2 * s} ${0.6 * s}`}
        />

        <ellipse cx="48" cy="90" rx="12" ry="3" fill="oklch(0.65 0.13 240)" fillOpacity="0.55" stroke="oklch(0.55 0.13 240)" strokeWidth={0.2 * s} />
        <text x="42" y="97" fill="var(--muted-foreground)" fontSize={2 * s} fontFamily="var(--font-mono)">
          Lac Kivu
        </text>

        {/* Segments */}
        {segmentRisks.map(({ seg, risk }) => {
          const highlighted = highlightSegments?.includes(seg.id);
          const d = seg.path.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          const mid = seg.path[Math.floor(seg.path.length / 2)];
          return (
            <g key={seg.id}>
              <path d={d} fill="none" stroke="var(--background)" strokeWidth={(highlighted ? 2.4 : 1.6) * s} strokeLinecap="round" opacity={0.9} />
              <path
                d={d}
                fill="none"
                stroke={RISK_STROKE[risk]}
                strokeWidth={(highlighted ? 1.6 : 1) * s}
                strokeLinecap="round"
                opacity={highlightSegments && !highlighted ? 0.35 : 1}
                filter={highlighted ? "url(#glow)" : undefined}
              />
              {/* invisible fat hit target for hover */}
              <path
                data-marker
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={3 * s}
                strokeLinecap="round"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ kind: "segment", id: seg.id, x: mid.x, y: mid.y })}
                onMouseLeave={() => setHover(null)}
              />
              {highlighted && (
                <path d={d} fill="none" stroke={RISK_STROKE[risk]} strokeWidth={0.4 * s} strokeLinecap="round" strokeDasharray={`${0.8 * s} ${0.8 * s}`} opacity={1} />
              )}
            </g>
          );
        })}

        {/* Incidents — with pulse for critical */}
        {activeIncidents.map((i) => {
          const risk = classify([0, 15, 30, 50, 70, 90][i.severity]);
          const isCritical = i.severity >= 4;
          return (
            <g key={i.id} data-marker style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover({ kind: "incident", id: i.id, x: i.x, y: i.y })}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectIncident?.(i.id)}
            >
              {isCritical && (
                <circle cx={i.x} cy={i.y} r={2.5 * s}>
                  <animate attributeName="r" values={`${1.2 * s};${3.5 * s};${1.2 * s}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill" values={RISK_STROKE[risk]} dur="2s" repeatCount="indefinite" />
                  <set attributeName="fill" to={RISK_STROKE[risk]} />
                </circle>
              )}
              <circle cx={i.x} cy={i.y} r={(0.8 + i.severity * 0.4) * s} fill={RISK_STROKE[risk]} opacity={0.3} filter="url(#softGlow)" />
              <circle cx={i.x} cy={i.y} r={(0.55 + i.severity * 0.18) * s} fill={RISK_STROKE[risk]} stroke="var(--background)" strokeWidth={0.25 * s} />
            </g>
          );
        })}

        {/* Zones */}
        {healthZones.map((z) => {
          const count = zoneIncidentCount.get(z.id) ?? 0;
          const labelW = Math.max(z.name.length * 1.15 + 1.6, 6);
          return (
            <g key={z.id} data-marker style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover({ kind: "zone", id: z.id, x: z.x, y: z.y })}
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={z.x} cy={z.y} r={2.4 * s} fill="var(--primary)" opacity="0.18" filter="url(#softGlow)" />
              <circle cx={z.x} cy={z.y} r={1.4 * s} fill="none" stroke="var(--primary)" strokeWidth={0.35 * s} opacity="0.9" />
              <circle cx={z.x} cy={z.y} r={0.7 * s} fill="var(--primary)" stroke="var(--background)" strokeWidth={0.25 * s} />
              <g transform={`translate(${z.x + 1.8 * s}, ${z.y - 1.4 * s}) scale(${s})`}>
                <rect x="0" y="0" rx="0.6" ry="0.6" width={labelW} height="2.8" fill="var(--panel)" fillOpacity="0.92" stroke="var(--panel-border)" strokeWidth="0.12" />
                <text x="0.8" y="2" fill="var(--foreground)" fontSize="1.9" fontFamily="var(--font-sans)" fontWeight="600">
                  {z.name}
                </text>
                {count > 0 && (
                  <g transform={`translate(${labelW - 0.2}, -0.6)`}>
                    <circle cx="0" cy="0" r="0.9" fill="var(--risk-high)" stroke="var(--background)" strokeWidth="0.15" />
                    <text x="0" y="0.5" textAnchor="middle" fill="white" fontSize="1.2" fontWeight="700" fontFamily="var(--font-mono)">
                      {count}
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Controls */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => zoomAt(1.4)}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          aria-label="Zoom avant"
          title="Zoom avant"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1 / 1.4)}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          aria-label="Zoom arrière"
          title="Zoom arrière"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          aria-label="Recentrer"
          title="Recentrer"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 rounded border border-border bg-card/90 px-2 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur">
        <Locate className="mr-1 inline h-3 w-3" />
        {zoom.toFixed(1)}×
      </div>

      {/* Live feed indicator */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded border border-border bg-card/90 px-2 py-1 text-[10px] backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          {activeIncidents.length} signaux · live
        </span>
      </div>

      {/* Tooltip */}
      {hoverData && hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] rounded-md border border-border bg-card/95 p-2 text-xs shadow-lg backdrop-blur"
          style={{
            left: `calc(${((hover.x - (BASE_SIZE / 2 - pan.x / zoom - BASE_SIZE / zoom / 2)) / (BASE_SIZE / zoom)) * 100}% + 12px)`,
            top: `calc(${((hover.y - (BASE_SIZE / 2 - pan.y / zoom - BASE_SIZE / zoom / 2)) / (BASE_SIZE / zoom)) * 100}% + 12px)`,
            transform: "translate(0, 0)",
          }}
        >
          <div className="font-semibold">{hoverData.title}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hoverData.sub}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-primary">{hoverData.meta}</div>
        </div>
      )}
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="font-mono uppercase tracking-wider">Risque tronçon</span>
      {(["low", "moderate", "high", "critical"] as RiskClass[]).map((r) => (
        <span key={r} className="flex items-center gap-1.5">
          <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: RISK_STROKE[r] }} />
          <span className="capitalize">
            {r === "low" ? "faible" : r === "moderate" ? "modéré" : r === "high" ? "élevé" : "critique"}
          </span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-primary ring-2 ring-primary/30" />
        <span>Zone de santé</span>
      </span>
      <span className="ml-auto font-mono text-[10px] opacity-70">Molette : zoom · Glisser : déplacer</span>
    </div>
  );
}
