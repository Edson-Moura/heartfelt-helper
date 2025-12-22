import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SocialProofEvent {
  id: string;
  name: string;
  location: string;
  action: string;
  minutesAgo: number;
  avatarUrl?: string;
}

const MOCK_EVENTS: SocialProofEvent[] = [
  {
    id: "1",
    name: "João",
    location: "Porto Alegre",
    action: "acabou de assinar o plano Premium",
    minutesAgo: 3,
  },
  {
    id: "2",
    name: "Marina",
    location: "São Paulo",
    action: "iniciou o teste grátis",
    minutesAgo: 5,
  },
  {
    id: "3",
    name: "Carlos",
    location: "Curitiba",
    action: "concluiu a primeira lição",
    minutesAgo: 8,
  },
  {
    id: "4",
    name: "Ana",
    location: "Lisboa",
    action: "atualizou para o plano Anual",
    minutesAgo: 2,
  },
];

interface SocialProofPopupProps {
  className?: string;
  events?: SocialProofEvent[];
  minIntervalMs?: number; // padrão 30s
  maxIntervalMs?: number; // padrão 60s
  autoHideMs?: number; // padrão 5s
  onClick?: (event: SocialProofEvent) => void;
}

export function SocialProofPopup({
  className,
  events = MOCK_EVENTS,
  minIntervalMs = 30000,
  maxIntervalMs = 60000,
  autoHideMs = 5000,
  onClick,
}: SocialProofPopupProps) {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SocialProofEvent | null>(null);

  const pool = useMemo(
    () => (events.length > 0 ? events : MOCK_EVENTS),
    [events],
  );

  useEffect(() => {
    if (pool.length === 0) return;

    let timeoutId: number | undefined;
    let hideTimeoutId: number | undefined;

    const scheduleNext = () => {
      const delay =
        Math.random() * (maxIntervalMs - minIntervalMs) + minIntervalMs;

      timeoutId = window.setTimeout(() => {
        const randomEvent = pool[Math.floor(Math.random() * pool.length)];
        setCurrentEvent(randomEvent);
        setVisible(true);

        hideTimeoutId = window.setTimeout(() => {
          setVisible(false);
        }, autoHideMs);

        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (hideTimeoutId) window.clearTimeout(hideTimeoutId);
    };
  }, [pool, minIntervalMs, maxIntervalMs, autoHideMs]);

  if (!visible || !currentEvent) return null;

  const initials = currentEvent.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick?.(currentEvent)}
      className={cn(
        "fixed bottom-4 left-4 z-40 flex max-w-xs items-center gap-3 rounded-xl border bg-card/95 px-3 py-2 text-left shadow-lg backdrop-blur-sm",
        "animate-fade-in",
        "hover:bg-muted/90 transition-colors",
        className,
      )}
    >
      <Avatar className="h-8 w-8">
        {currentEvent.avatarUrl && (
          <AvatarImage src={currentEvent.avatarUrl} alt={currentEvent.name} />
        )}
        <AvatarFallback className="text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 text-xs leading-snug text-foreground">
        <p className="font-medium">
          {currentEvent.name} de {currentEvent.location}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {currentEvent.action}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/80">
          há {currentEvent.minutesAgo} min
        </p>
      </div>
    </button>
  );
}
