import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";

interface XPSystemProps {
  displayName?: string | null;
  currentXP?: number | null;
  currentLevel?: number | null;
}

const levelThresholds: { level: number; xp: number }[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 1000 },
  { level: 10, xp: 5000 },
  { level: 20, xp: 20000 },
  { level: 50, xp: 100000 },
];

function getLevelFromXP(xp: number): number {
  let current = 1;
  for (const t of levelThresholds) {
    if (xp >= t.xp) current = t.level;
  }
  if (xp > 100000) {
    current = 50 + Math.floor((xp - 100000) / 5000);
  }
  return current;
}

function getProgress(xp: number): { level: number; progress: number } {
  const level = getLevelFromXP(xp);
  const thresholds = [...levelThresholds].sort((a, b) => a.xp - b.xp);

  const current = [...thresholds].reverse().find((t) => xp >= t.xp) || thresholds[0];
  const next = thresholds.find((t) => t.xp > current.xp) || {
    level: current.level + 1,
    xp: current.xp + 5000,
  };

  const span = next.xp - current.xp || 1;
  const progress = Math.min(100, Math.max(0, ((xp - current.xp) / span) * 100));

  return { level, progress };
}

export const XPSystem: React.FC<XPSystemProps> = ({ displayName, currentXP, currentLevel }) => {
  const xp = currentXP ?? 0;
  const { level, progress } = getProgress(xp);
  const effectiveLevel = currentLevel ?? level;

  const [lastLevel, setLastLevel] = useState(effectiveLevel);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (effectiveLevel > lastLevel) {
      setShowLevelUp(true);
      setLastLevel(effectiveLevel);
    }
  }, [effectiveLevel, lastLevel]);

  const percentageLabel = `${Math.round(progress)}%`;

  return (
    <>
      <Card className="hidden md:flex items-center gap-3 px-3 py-2 bg-muted/60 border-border/60 shadow-none">
        <div className="flex flex-col min-w-[120px]">
          <span className="text-[0.7rem] text-muted-foreground leading-tight">Nível</span>
          <span className="text-xs font-semibold truncate">
            {displayName || "Estudante"} · Nível {effectiveLevel}
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <Progress value={progress} className="h-1.5" />
          <span className="text-[0.65rem] text-muted-foreground text-right">{percentageLabel}</span>
        </div>
      </Card>

      <LevelUpModal
        open={showLevelUp}
        level={effectiveLevel}
        onOpenChange={setShowLevelUp}
      />
    </>
  );
};
