import { Diamond } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";

interface GemsSystemProps {
  compact?: boolean;
}

/**
 * Exibe o saldo atual de gems do usuário e um pequeno resumo de como ganhar.
 * Futuramente pode ser conectado a eventos reais de recompensa.
 */
export const GemsSystem: React.FC<GemsSystemProps> = ({ compact = false }) => {
  const { profile } = useProfile();
  const gems = profile?.gems ?? 0;

  if (compact) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-1 text-xs font-medium text-foreground shadow-sm hover-scale"
        aria-label={`${gems} gems disponíveis`}
      >
        <Diamond className="h-3 w-3 text-yellow-400" />
        <span>{gems}</span>
      </button>
    );
  }

  return (
    <Card className="flex items-center gap-3 px-3 py-2 bg-muted/60 border-border/60 shadow-none">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
        <Diamond className="h-4 w-4 text-yellow-300" />
      </div>
      <div className="flex flex-col">
        <span className="text-[0.7rem] text-muted-foreground leading-tight">Gems disponíveis</span>
        <span className="text-sm font-semibold">{gems.toLocaleString("pt-BR")}</span>
      </div>
    </Card>
  );
};
