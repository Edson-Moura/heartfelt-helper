import { Flame, Clock, Calendar, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StreakWidgetProps {
  currentStreak: number;
  weeklyActivity: boolean[]; // 7 dias, começando no domingo
  nextMilestone: 7 | 30 | 100 | 365;
  streakFreezes: number;
  secondsToMidnight: number;
}

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const milestoneLabels: Record<number, string> = {
  7: "Semana Perfeita",
  30: "Mês Dedicado",
  100: "Centurião",
  365: "Lenda",
};

export const StreakWidget: React.FC<StreakWidgetProps> = ({
  currentStreak,
  weeklyActivity,
  nextMilestone,
  streakFreezes,
  secondsToMidnight,
}) => {
  const hours = Math.max(0, Math.floor(secondsToMidnight / 3600));
  const minutes = Math.max(0, Math.floor((secondsToMidnight % 3600) / 60));

  const milestoneProgress = Math.min(100, (currentStreak / nextMilestone) * 100);

  return (
    <Card className="shadow-card hover:shadow-elevated transition-smooth hover-scale bg-gradient-section-neutral">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Flame className={cn("w-5 h-5", currentStreak > 0 ? "text-orange" : "text-muted-foreground")} />
          <CardTitle className="text-sm font-semibold tracking-tight">
            {currentStreak > 0 ? `Sequência de ${currentStreak} dias` : "Comece sua sequência hoje"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Semana atual */}
        <div className="flex items-center justify-between text-xs mb-1">
          {weekdayLabels.map((label, index) => {
            const practiced = weeklyActivity[index];
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-[0.7rem] text-muted-foreground">{label}</span>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] border",
                    practiced
                      ? "bg-orange text-orange-foreground border-orange/60 shadow-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {practiced ? "✓" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* Countdown & mensagem */}
        <div className="flex items-center justify-between text-xs mt-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {currentStreak > 0 ? (
              <span>Pratique hoje para manter sua sequência!</span>
            ) : (
              <span>Pratique hoje e inicie sua sequência.</span>
            )}
          </div>
          <div className="flex items-center gap-1 font-medium text-[0.7rem] text-warning">
            <span>⏰</span>
            <span>
              {hours}h {minutes.toString().padStart(2, "0")}m restantes
            </span>
          </div>
        </div>

        {/* Próximo marco */}
        <div className="space-y-1 mt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="w-3 h-3 text-orange" />
              <span>Próximo marco: {nextMilestone} dias</span>
            </div>
            <span className="text-[0.7rem] text-muted-foreground">{milestoneLabels[nextMilestone]}</span>
          </div>
          <Progress value={milestoneProgress} className="h-1.5" />
        </div>

        {/* Streak Freezes */}
        <div className="flex items-center justify-between pt-2 border-t mt-2">
          <span className="text-xs text-muted-foreground">Streak Freezes disponíveis</span>
          <span className="text-xs font-semibold flex items-center gap-1">
            💎 <span>{streakFreezes}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
