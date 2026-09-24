import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone, Pause, Play } from "lucide-react";
import {
  usePublishedAnnouncements,
  KIND_LABEL,
  KIND_COLOR,
} from "@/lib/announcements-store";
import type { Lang } from "@/lib/lang";
import { healthZones } from "@/lib/mock-data";

export function NewsSlider({ lang }: { lang: Lang }) {
  const items = usePublishedAnnouncements();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index > items.length - 1) setIndex(0);
  }, [items.length, index]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const safeIndex = Math.min(index, items.length - 1);
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);

  return (
    <section
      aria-label={lang === "fr" ? "Actualités" : "News"}
      className="mx-auto w-full max-w-6xl px-4 sm:px-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card/70 backdrop-blur">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Megaphone className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {lang === "fr" ? "Informations & actualités" : "Information & news"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Lecture" : "Pause"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
            <button
              onClick={() => go(-1)}
              aria-label={lang === "fr" ? "Précédent" : "Previous"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label={lang === "fr" ? "Suivant" : "Next"}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {items.map((a) => (
              <article key={a.id} className="w-full shrink-0 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: KIND_COLOR[a.kind],
                      backgroundColor: `color-mix(in oklch, ${KIND_COLOR[a.kind]} 15%, transparent)`,
                    }}
                  >
                    {KIND_LABEL[a.kind][lang]}
                  </span>
                  {a.zoneId && (
                    <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {healthZones.find((z) => z.id === a.zoneId)?.name ?? a.zoneId}
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {a.date}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold leading-snug sm:text-lg">
                  {a.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-border/60 py-2">
          {items.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setIndex(i)}
              aria-label={`${lang === "fr" ? "Aller à" : "Go to"} ${i + 1}`}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === safeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40")
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
