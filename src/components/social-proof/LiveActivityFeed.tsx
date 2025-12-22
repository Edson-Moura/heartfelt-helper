import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LiveActivity {
  id: string;
  name: string;
  action: string;
  timeAgo: string;
  avatarUrl?: string;
  profileUrl?: string;
}

const MOCK_ACTIVITIES: LiveActivity[] = [
  {
    id: "1",
    name: "João M.",
    action: "completou a lição 5",
    timeAgo: "há 2 minutos",
  },
  {
    id: "2",
    name: "Maria S.",
    action: "conquistou o badge \"Semana Perfeita\"",
    timeAgo: "há 5 minutos",
  },
  {
    id: "3",
    name: "Pedro L.",
    action: "atingiu o nível B1",
    timeAgo: "há 12 minutos",
  },
  {
    id: "4",
    name: "Ana R.",
    action: "iniciou o teste grátis",
    timeAgo: "há 18 minutos",
  },
];

interface LiveActivityFeedProps {
  className?: string;
  activities?: LiveActivity[];
  autoUpdateIntervalMs?: number; // padrão ~12s
  onActivityClick?: (activity: LiveActivity) => void;
}

export function LiveActivityFeed({
  className,
  activities,
  autoUpdateIntervalMs = 12000,
  onActivityClick,
}: LiveActivityFeedProps) {
  const baseActivities = useMemo(
    () => activities && activities.length > 0 ? activities : MOCK_ACTIVITIES,
    [activities]
  );

  const [visibleActivities, setVisibleActivities] = useState<LiveActivity[]>(
    baseActivities.slice(0, 4)
  );
  const [index, setIndex] = useState(4 % baseActivities.length);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!baseActivities.length) return;

    const interval = setInterval(() => {
      setVisibleActivities((prev) => {
        const next = baseActivities[index];
        const updated = [...prev.slice(1), next];
        return updated;
      });

      setIndex((prevIndex) => (prevIndex + 1) % baseActivities.length);

      // Auto-scroll suave para o final
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, autoUpdateIntervalMs);

    return () => clearInterval(interval);
  }, [autoUpdateIntervalMs, baseActivities, index]);

  return (
    <aside
      className={cn(
        "fixed bottom-6 right-6 z-30 hidden w-80 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur md:block",
        "animate-fade-in",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-[ping_1.2s_ease-out_infinite] rounded-full bg-destructive/60 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Atividade ao vivo
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Atualizado em tempo real
        </span>
      </div>

      <div
        ref={containerRef}
        className="max-h-64 space-y-2 overflow-hidden pr-1 text-sm"
      >
        {visibleActivities.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => onActivityClick?.(activity)}
            className="flex w-full items-center gap-3 rounded-lg bg-muted/70 px-2 py-2 text-left transition-colors hover:bg-muted"
          >
            <Avatar className="h-8 w-8">
              {activity.avatarUrl && (
                <AvatarImage src={activity.avatarUrl} alt={activity.name} />
              )}
              <AvatarFallback>
                {activity.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground line-clamp-2">
                {activity.name} <span className="font-normal">{activity.action}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {activity.timeAgo}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Versão mobile simplificada – pode ser usada como banner no topo */}
      {/* Para usar no mobile, o componente pode ser renderizado com className="fixed inset-x-4 bottom-4 md:hidden" */}
    </aside>
  );
}
