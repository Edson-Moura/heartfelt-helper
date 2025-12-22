import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";

export const FreemiumBanner = () => {
  const { 
    planType, 
    limits, 
    loading,
    getUsagePercentage,
    getConversationMinutesPercentage
  } = useFreemiumLimits();

  // Don't show for premium users
  if (planType === 'premium' || loading || !limits) {
    return null;
  }

  const lessonsUsagePercent = getUsagePercentage('lesson');
  const conversationMinutesPercent = getConversationMinutesPercentage();
  
  // Determine if approaching limit (>80%)
  const isApproachingLimit = lessonsUsagePercent >= 80 || conversationMinutesPercent >= 80;

  return (
    <div 
      className={`sticky top-0 z-40 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border backdrop-blur-sm transition-all duration-300 ${
        isApproachingLimit ? 'animate-pulse' : ''
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Plan Badge */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Crown className="w-3 h-3" />
              Plano Gratuito
            </Badge>
          </div>

          {/* Center: Usage Progress */}
          <div className="flex-1 max-w-md w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uso Diário</span>
              <span>
                {limits.usage.lessonsToday}/{limits.limits.lessonsPerDay === Infinity ? '∞' : limits.limits.lessonsPerDay} lições | 
                {' '}{limits.usage.conversationMinutesToday}/{limits.limits.dailyConversationMinutes === Infinity ? '∞' : limits.limits.dailyConversationMinutes} min
              </span>
            </div>
            
            <div className="space-y-1">
              {/* Lessons Progress */}
              {limits.limits.lessonsPerDay !== Infinity && (
                <div className="flex items-center gap-2">
                  <Progress 
                    value={lessonsUsagePercent} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {lessonsUsagePercent}%
                  </span>
                </div>
              )}
              
              {/* Conversation Minutes Progress */}
              {limits.limits.dailyConversationMinutes !== Infinity && (
                <div className="flex items-center gap-2">
                  <Progress 
                    value={conversationMinutesPercent} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {conversationMinutesPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Upgrade Button */}
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2 animate-shimmer"
            asChild
          >
            <Link to="/freemium-landing">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Fazer Upgrade</span>
              <span className="sm:hidden">Upgrade</span>
            </Link>
          </Button>
        </div>

        {/* Warning Message when approaching limit */}
        {isApproachingLimit && (
          <div className="mt-2 text-xs text-center text-orange animate-fade-in">
            ⚠️ Você está próximo do seu limite diário. Faça upgrade para continuar sem interrupções!
          </div>
        )}
      </div>
    </div>
  );
};
