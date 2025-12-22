import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Zap, 
  Users, 
  Clock, 
  Gift,
  Sparkles,
  Flame,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

type EventType = "weekend" | "thematic" | "community" | "battle_royale" | null;

interface EventData {
  id: string;
  type: EventType;
  title: string;
  description: string;
  icon: React.ReactNode;
  startDate: Date;
  endDate: Date;
  progress?: number;
  goal?: number;
  rewards: {
    xp?: number;
    gems?: number;
    badge?: string;
    special?: string;
  };
  multiplier?: number;
  theme?: string;
  participants?: number;
}

const MOCK_EVENTS: EventData[] = [
  {
    id: "weekend-1",
    type: "weekend",
    title: "Desafio de Fim de Semana",
    description: "3x XP em todas as atividades! Complete desafios exclusivos.",
    icon: <Zap className="h-6 w-6" />,
    startDate: new Date("2025-01-04"),
    endDate: new Date("2025-01-05"),
    multiplier: 3,
    rewards: {
      xp: 1000,
      gems: 150,
    },
  },
  {
    id: "community-1",
    type: "community",
    title: "Desafio Comunitário",
    description: "1 Milhão de Lições",
    icon: <Users className="h-6 w-6" />,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-07"),
    progress: 847000,
    goal: 1000000,
    participants: 15430,
    rewards: {
      xp: 500,
      gems: 100,
      special: "Avatar Exclusivo",
    },
  },
  {
    id: "thematic-1",
    type: "thematic",
    title: "🎄 Vocabulário de Natal",
    description: "Aprenda expressões festivas e ganhe recompensas especiais!",
    icon: <Sparkles className="h-6 w-6" />,
    startDate: new Date("2024-12-20"),
    endDate: new Date("2024-12-26"),
    theme: "christmas",
    rewards: {
      xp: 750,
      gems: 200,
      badge: "Espírito Natalino",
    },
  },
  {
    id: "battle-royale-1",
    type: "battle_royale",
    title: "Torneio Battle Royale",
    description: "128 jogadores, apenas 1 campeão!",
    icon: <Trophy className="h-6 w-6" />,
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-01-12"),
    participants: 128,
    rewards: {
      gems: 500,
      special: "Troféu Lendário + Avatar Dourado",
    },
  },
];

interface EventBannerProps {
  className?: string;
  compact?: boolean;
}

export function EventBanner({ className, compact = false }: EventBannerProps) {
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Find active event
    const now = new Date();
    const activeEvent = MOCK_EVENTS.find(
      (event) => event.startDate <= now && event.endDate >= now
    );
    setCurrentEvent(activeEvent || MOCK_EVENTS[1]); // Default to community challenge for demo
  }, []);

  useEffect(() => {
    if (!currentEvent) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = currentEvent.endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Encerrado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`Faltam ${days} dia${days > 1 ? "s" : ""}`);
      } else if (hours > 0) {
        setTimeRemaining(`Faltam ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`Faltam ${minutes} minutos`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentEvent]);

  if (!currentEvent) return null;

  const getEventGradient = (type: EventType) => {
    switch (type) {
      case "weekend":
        return "from-orange-500/20 to-red-500/20 border-orange-500/30";
      case "community":
        return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
      case "thematic":
        return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
      case "battle_royale":
        return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      default:
        return "from-primary/20 to-accent/20 border-primary/30";
    }
  };

  const progressPercentage = currentEvent.progress && currentEvent.goal
    ? (currentEvent.progress / currentEvent.goal) * 100
    : 0;

  if (compact) {
    return (
      <Card
        className={cn(
          "relative overflow-hidden border-2 bg-gradient-to-br p-4",
          getEventGradient(currentEvent.type),
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-background/80 p-2 backdrop-blur">
            {currentEvent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{currentEvent.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {timeRemaining} ⏰
            </p>
          </div>
          {currentEvent.multiplier && (
            <Badge variant="destructive" className="animate-pulse">
              {currentEvent.multiplier}x XP
            </Badge>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 bg-gradient-to-br p-6",
        getEventGradient(currentEvent.type),
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-background/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-background/80 p-3 backdrop-blur">
              {currentEvent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{currentEvent.title}</h2>
                {currentEvent.multiplier && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Flame className="h-3 w-3 mr-1" />
                    {currentEvent.multiplier}x XP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentEvent.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            {timeRemaining}
          </div>
        </div>

        {/* Progress for Community Challenges */}
        {currentEvent.type === "community" && currentEvent.progress && currentEvent.goal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Progresso da Comunidade
              </span>
              <span className="text-muted-foreground">
                {currentEvent.progress.toLocaleString()} / {currentEvent.goal.toLocaleString()}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            {currentEvent.participants && (
              <p className="text-xs text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                {currentEvent.participants.toLocaleString()} participantes
              </p>
            )}
          </div>
        )}

        {/* Battle Royale Info */}
        {currentEvent.type === "battle_royale" && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background/50 backdrop-blur">
            <Target className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Torneio Eliminatório</p>
              <p className="text-xs text-muted-foreground">
                {currentEvent.participants} jogadores inscritos
              </p>
            </div>
            <Badge variant="outline">Inscreva-se</Badge>
          </div>
        )}

        {/* Rewards */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Gift className="h-4 w-4" />
            Recompensas:
          </div>
          <div className="flex flex-wrap gap-2">
            {currentEvent.rewards.xp && (
              <Badge variant="secondary">
                {currentEvent.rewards.xp.toLocaleString()} XP
              </Badge>
            )}
            {currentEvent.rewards.gems && (
              <Badge variant="secondary">
                💎 {currentEvent.rewards.gems} Gems
              </Badge>
            )}
            {currentEvent.rewards.badge && (
              <Badge variant="secondary">
                🏆 {currentEvent.rewards.badge}
              </Badge>
            )}
            {currentEvent.rewards.special && (
              <Badge variant="default">
                ✨ {currentEvent.rewards.special}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
