import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, X, Sparkles, MessageSquare, BookOpen, Mic, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { trackUpgradeClicked } from "@/services/FreemiumAnalytics";
import { useAuth } from "@/hooks/useAuth";

export type UpgradeTrigger = 'lesson_limit' | 'conversation_limit' | 'avatar_locked' | 'feature_locked';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  trigger: UpgradeTrigger;
  context?: {
    current?: number;
    limit?: number;
    feature?: string;
  };
}

const TRIGGER_CONFIG = {
  lesson_limit: {
    icon: BookOpen,
    title: "Você completou suas 3 lições gratuitas! 🎓",
    description: "Continue aprendendo sem limites com o plano Premium",
    color: "text-primary",
    stats: "Você já provou que está comprometido com seu inglês!",
  },
  conversation_limit: {
    icon: MessageSquare,
    title: "Limite diário de conversação atingido! 💬",
    description: "Pratique quantas horas quiser com o plano Premium",
    color: "text-teal",
    stats: "Você está progredindo rápido! Continue sem parar.",
  },
  avatar_locked: {
    icon: Mic,
    title: "Conversas com avatar IA são Premium! 🤖",
    description: "Tenha conversas mais realistas com avatar animado",
    color: "text-orange",
    stats: "Melhore sua conversação 3x mais rápido com avatar IA!",
  },
  feature_locked: {
    icon: Trophy,
    title: "Este recurso é exclusivo Premium! ⭐",
    description: "Desbloqueie todos os recursos da plataforma",
    color: "text-green",
    stats: "Acelere seu aprendizado com recursos avançados!",
  },
};

const PREMIUM_BENEFITS = [
  "Lições ilimitadas - aprenda no seu ritmo",
  "Conversação ilimitada com IA",
  "Avatar IA interativo e realista",
  "Análise avançada de pronúncia",
  "Download offline de conteúdo",
  "Simulações de situações reais",
  "Acesso à comunidade exclusiva",
  "Certificado de conclusão",
  "Suporte prioritário 24/7",
];

export const UpgradeModal = ({ open, onClose, trigger, context }: UpgradeModalProps) => {
  const { user } = useAuth();
  const config = TRIGGER_CONFIG[trigger];
  const Icon = config.icon;

  const handleUpgradeClick = (plan: string) => {
    if (user?.id) {
      trackUpgradeClicked(user.id, 'free', trigger, plan);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with Icon and Badge */}
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ${config.color}`}>
              <Icon className="w-12 h-12" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl text-center font-bold">
            {config.title}
          </DialogTitle>
          
          <DialogDescription className="text-center text-base mt-2">
            {config.description}
          </DialogDescription>

          {/* Stats/Context */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm font-medium text-foreground">
              {config.stats}
            </p>
            {context?.current !== undefined && context?.limit !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Você usou {context.current}/{context.limit} do seu limite diário
              </p>
            )}
          </div>
        </DialogHeader>

        {/* Benefits List */}
        <div className="py-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">O que você vai desbloquear:</h3>
          </div>
          
          <div className="grid gap-3">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="default" className="text-xs">
                🔥 OFERTA ESPECIAL
              </Badge>
            </div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-bold">R$ 29,90</span>
              <span className="text-muted-foreground mb-2">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Menos de R$ 1 por dia para fluência em inglês
            </p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-success" />
              <span>Mais de 10.000 alunos</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-success" />
              <span>Garantia de 7 dias</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Voltar Amanhã
            <span className="text-xs ml-2 text-muted-foreground">(limite reinicia)</span>
          </Button>
          <Button 
            variant="default" 
            className="w-full sm:flex-1 gap-2 text-lg py-6"
            asChild
            onClick={() => handleUpgradeClick('premium')}
          >
            <Link to="/pricing">
              <Sparkles className="w-5 h-5" />
              Começar Teste Premium de 7 Dias
            </Link>
          </Button>
        </DialogFooter>

        {/* Trust Badge */}
        <div className="text-center text-xs text-muted-foreground mt-2">
          <p className="flex items-center justify-center gap-1">
            <Check className="w-3 h-3 text-success" />
            Cancele quando quiser • Pagamento 100% seguro
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
