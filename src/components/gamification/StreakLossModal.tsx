import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Flame, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface StreakLossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStreak: number;
  streakFreezes: number;
  onUseStreakFreeze?: () => Promise<void> | void;
}

export const StreakLossModal: React.FC<StreakLossModalProps> = ({
  open,
  onOpenChange,
  currentStreak,
  streakFreezes,
  onUseStreakFreeze,
}) => {
  const handleUseFreeze = async () => {
    if (!onUseStreakFreeze || streakFreezes <= 0) return;
    await onUseStreakFreeze();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange" />
            <DialogTitle className="flex items-center gap-2">
              Sua sequência está em risco!
            </DialogTitle>
          </div>
          <DialogDescription className="space-y-2">
            <p>
              Você está com uma sequência de <strong>{currentStreak} dias</strong>, mas ainda não praticou hoje.
            </p>
            <p>
              Pratique agora para manter sua sequência ou use um <strong>Streak Freeze</strong> para salvar o dia.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="w-3 h-3" />
          <span>Se o dia acabar sem prática, sua sequência será reiniciada.</span>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
          <Button asChild className="w-full sm:w-auto" variant="default">
            <Link to="/lessons">Praticar agora</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center gap-1"
            disabled={streakFreezes <= 0 || !onUseStreakFreeze}
            onClick={handleUseFreeze}
          >
            <span>Usar Streak Freeze</span>
            <span className="text-xs">(restam {streakFreezes})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
