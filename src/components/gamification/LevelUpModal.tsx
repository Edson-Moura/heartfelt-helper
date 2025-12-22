import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Share2 } from "lucide-react";

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ open, onOpenChange, level }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "MyEnglishOne",
        text: `Acabei de alcançar o nível ${level} em inglês no MyEnglishOne!`,
        url: window.location.origin,
      }).catch(() => undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/40 bg-gradient-section-alt animate-bounce-in">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span role="img" aria-label="confete">
              🎉
            </span>
            LEVEL UP!
          </DialogTitle>
          <DialogDescription className="text-base text-foreground">
            Você alcançou o <strong>nível {level}</strong>! Continue praticando para desbloquear novas conquistas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 border border-border/60 px-3 py-2 text-sm">
          <Trophy className="w-5 h-5 text-orange" />
          <div className="flex flex-col">
            <span className="font-semibold">Novas recompensas em breve</span>
            <span className="text-xs text-muted-foreground">
              Em versões futuras, níveis vão desbloquear avatares, temas e modos especiais.
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Continuar estudando
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            type="button"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
