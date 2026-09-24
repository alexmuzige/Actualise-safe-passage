import { lazy, Suspense, useEffect, useState } from "react";

const OsmMap = lazy(() => import("./osm-map"));

export function ClientOnlyMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Chargement de la carte…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-muted/30 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Chargement de la carte…
        </div>
      }
    >
      <OsmMap />
    </Suspense>
  );
}
