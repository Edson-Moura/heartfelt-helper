import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
}

const DEFAULT_STATS: StatItem[] = [
  {
    id: "students",
    label: "Alunos praticando",
    value: 2847,
  },
  {
    id: "lessons",
    label: "Lições completas",
    value: 187_392,
  },
  {
    id: "rating",
    label: "Avaliação média",
    value: 4.8,
    suffix: "/5.0 ⭐",
  },
  {
    id: "satisfaction",
    label: "Taxa de satisfação",
    value: 94,
    suffix: "%",
  },
];

interface StatsCounterProps {
  stats?: StatItem[];
  className?: string;
  animationDurationMs?: number;
}

export function StatsCounter({
  stats = DEFAULT_STATS,
  className,
  animationDurationMs = 1500,
}: StatsCounterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [displayValues, setDisplayValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(stats.map((stat) => [stat.id, 0]))
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true);
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDurationMs, 1);

      setDisplayValues(() => {
        const updated: Record<string, number> = {};

        stats.forEach((stat) => {
          const isDecimal = !Number.isInteger(stat.value);
          const eased = easeOutCubic(progress);
          const raw = stat.value * eased;
          updated[stat.id] = isDecimal ? Number(raw.toFixed(1)) : Math.round(raw);
        });

        return updated;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [hasStarted, stats, animationDurationMs]);

  return (
    <section
      ref={containerRef}
      className={cn(
        "mx-auto grid max-w-4xl gap-4 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:grid-cols-2 md:gap-6 md:p-6",
        "animate-fade-in",
        className
      )}
      aria-label="Estatísticas de alunos e resultados"
    >
      {stats.map((stat) => {
        const value = displayValues[stat.id] ?? 0;
        const isPercentage = stat.suffix === "%";
        const isRating = stat.id === "rating";

        const formatted = isRating
          ? value.toFixed(1)
          : new Intl.NumberFormat("pt-BR").format(isPercentage ? Math.round(value) : value);

        return (
          <div
            key={stat.id}
            className="flex flex-col items-start justify-center rounded-xl bg-muted/70 px-4 py-3 shadow-sm transition-transform duration-200 hover:scale-[1.02] md:px-5 md:py-4"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {formatted}
              </span>
              {stat.suffix && (
                <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span>
              )}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
