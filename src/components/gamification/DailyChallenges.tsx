import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, Zap } from "lucide-react";
import { useDailyChallenges } from "@/hooks/useDailyChallenges";

const typeConfig = {
  main: {
    label: "Desafio Principal",
    icon: Sparkles,
    accentClass: "text-primary",
  },
  secondary: {
    label: "Desafio Secundário",
    icon: Target,
    accentClass: "text-teal",
  },
  bonus: {
    label: "Desafio Bônus",
    icon: Zap,
    accentClass: "text-orange",
  },
} as const;

export const DailyChallenges: React.FC = () => {
  const { challenges, loading, completeChallenge } = useDailyChallenges();

  return (
    <Card className="shadow-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Desafios Diários
        </CardTitle>
        <CardDescription>
          Conclua desafios hoje e ganhe XP extra.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {loading && (
          <p className="text-xs text-muted-foreground">Carregando desafios...</p>
        )}

        {!loading && challenges.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum desafio disponível para hoje.</p>
        )}

        {!loading &&
          challenges
            .sort((a, b) => a.challenge.challenge_type.localeCompare(b.challenge.challenge_type))
            .map((userChallenge) => {
              const cfg = typeConfig[userChallenge.challenge.challenge_type];
              const Icon = cfg.icon;
              const { challenge } = userChallenge;

              const progressValue = Math.min(
                100,
                (userChallenge.progress / Math.max(1, challenge.requirement_value)) * 100
              );

              return (
                <div
                  key={userChallenge.id}
                  className="p-3 rounded-lg border bg-muted/40 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cfg.accentClass}`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{cfg.label}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {challenge.title}
                        </span>
                      </div>
                    </div>
                    <div className="text-[0.7rem] text-muted-foreground text-right min-w-[88px]">
                      +{challenge.xp_reward} XP
                      {challenge.gems_reward ? ` + ${challenge.gems_reward} 💎` : ""}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {challenge.description}
                  </p>

                  <div className="flex items-center justify-between text-[0.7rem] mt-1">
                    <span className="text-muted-foreground">
                      {userChallenge.progress}/{challenge.requirement_value}
                    </span>
                    <span className="text-muted-foreground capitalize">
                      {challenge.requirement_type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <Progress value={progressValue} className="h-1.5" />

                  <div className="flex justify-end mt-1">
                    <Button
                      size="sm"
                      variant={userChallenge.completed ? "outline" : "default"}
                      disabled={userChallenge.completed}
                      onClick={() => completeChallenge(userChallenge.id)}
                    >
                      {userChallenge.completed ? "Concluído" : "Marcar como concluído"}
                    </Button>
                  </div>
                </div>
              );
            })}
      </CardContent>
    </Card>
  );
};
