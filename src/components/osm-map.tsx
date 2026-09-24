import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Rectangle, Tooltip, Popup } from "react-leaflet";
import { useNavigate } from "@tanstack/react-router";
import { geoZones, NORD_KIVU_CENTER } from "@/lib/geo-zones";
import { useIncidents } from "@/lib/incidents-store";
import { classify, type RiskClass } from "@/lib/mock-data";
import { slugify } from "@/lib/zone-news";
import { useTheme } from "@/lib/theme";

const RISKS: RiskClass[] = ["low", "moderate", "high", "critical"];

function useRiskColors() {
  const { theme } = useTheme();
  const [colors, setColors] = useState<Record<RiskClass, string>>({
    low: "#22c55e",
    moderate: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
  });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const next = { ...colors };
    RISKS.forEach((r) => {
      const v = cs.getPropertyValue(`--risk-${r}`).trim();
      if (v) next[r] = v;
    });
    setColors(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return colors;
}

export default function OsmMap() {
  const incidents = useIncidents();
  const colors = useRiskColors();
  const navigate = useNavigate();

  const statsFor = (zoneId: string) => {
    const active = incidents.filter((i) => i.zoneId === zoneId && i.status !== "resolved");
    const score = Math.min(
      100,
      active.reduce((acc, i) => acc + [0, 8, 18, 32, 50, 72][i.severity], 0),
    );
    return { count: active.length, score, risk: classify(score) };
  };

  const openArea = (zoneId: string, areaName: string) =>
    navigate({
      to: "/aire/$zoneId/$area",
      params: { zoneId, area: slugify(areaName) },
    });

  return (
    <MapContainer
      center={NORD_KIVU_CENTER}
      zoom={7}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      {/* Utilisation des tuiles Google Maps par défaut (Plan / Standard) */}
      <TileLayer
        attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
        maxZoom={20}
      />
      {geoZones.map((z) => {
        const { count, score, risk } = statsFor(z.id);
        const color = colors[risk];
        return (
          <Fragment key={z.id}>
            {z.areas.map((a) => (
              <Rectangle
                key={a.name}
                bounds={a.bounds}
                pathOptions={{
                  color,
                  weight: 1.5,
                  fillOpacity: 0.12,
                  dashArray: "4 3",
                  className: "cursor-pointer",
                }}
                eventHandlers={{
                  click: () => openArea(z.id, a.name),
                  mouseover: (e) => e.target.setStyle({ fillOpacity: 0.35, weight: 2.5 }),
                  mouseout: (e) => e.target.setStyle({ fillOpacity: 0.12, weight: 1.5 }),
                }}
              >
                <Tooltip direction="top" opacity={1}>
                  <strong>{a.name}</strong> · aire de santé ({z.name})
                  <br />
                  <span style={{ opacity: 0.7 }}>Cliquer pour voir les détails</span>
                </Tooltip>
              </Rectangle>
            ))}
            <CircleMarker
              center={[z.lat, z.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <strong>{z.name}</strong> · {z.areas.length} aires
              </Tooltip>
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600 }}>Zone de santé {z.name}</div>
                  <div>Territoire : {z.territory}</div>
                  <div style={{ marginTop: 4 }}>Aires de santé :</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                    {z.areas.map((a) => (
                      <button
                        key={a.name}
                        type="button"
                        onClick={() => openArea(z.id, a.name)}
                        style={{
                          border: "1px solid currentColor",
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontSize: 11,
                          cursor: "pointer",
                          background: "transparent",
                          color: "inherit",
                        }}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <div>
                    Signaux actifs : {count} · Score {score}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}