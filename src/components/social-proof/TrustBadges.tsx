import { ShieldCheck, Lock, CreditCard, Trophy, Award, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
  return (
    <section
      className={cn(
        "mx-auto mt-8 max-w-4xl rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm md:mt-12 md:p-6",
        "animate-fade-in",
        className,
      )}
      aria-label="Selo de confiança e parceiros"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3 md:max-w-sm">
          <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            Confiado por milhares de alunos
          </h3>
          <p className="text-sm text-muted-foreground">
            Pagamento seguro, criptografia de ponta a ponta e reconhecimento de
            qualidade para você aprender com tranquilidade.
          </p>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2">
              <CreditCard className="h-4 w-4" />
              <span>Pagamento seguro</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2">
              <Lock className="h-4 w-4" />
              <span>SSL criptografado</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Certificado oficial</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2">
              <Trophy className="h-4 w-4" />
              <span>Melhor app de inglês 2024</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Parceiros e reconhecimentos
          </p>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 border-primary/40 text-[11px] text-primary"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Parceria universidades</span>
            </Badge>
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 border-primary/40 text-[11px] text-primary"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Instrutores certificados</span>
            </Badge>
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 border-primary/40 text-[11px] text-primary"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>+100k aulas concluídas</span>
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
