import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRateLimiting } from '@/hooks/useRateLimiting';
import type { Provider } from '@/services/RateLimiter';
import { Activity, Clock, Shield, TrendingUp } from 'lucide-react';

const PROVIDER_NAMES: Record<Provider, string> = {
  nvidia: 'NVIDIA API',
  elevenlabs: 'ElevenLabs TTS',
  did: 'D-ID Avatar',
  deepgram: 'Deepgram STT',
  openai: 'OpenAI',
};

const PROVIDER_ICONS: Record<Provider, React.ReactNode> = {
  nvidia: <Activity className="h-4 w-4" />,
  elevenlabs: <TrendingUp className="h-4 w-4" />,
  did: <Shield className="h-4 w-4" />,
  deepgram: <Activity className="h-4 w-4" />,
  openai: <TrendingUp className="h-4 w-4" />,
};

export const RateLimitMonitor = () => {
  const { status, getCurrentPlan, refreshStatus } = useRateLimiting();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      refreshStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  if (!status) return null;

  const currentPlan = getCurrentPlan();
  const providers = Object.keys(status) as Provider[];

  const formatTimeRemaining = (resetTime: number): string => {
    const remaining = Math.max(0, resetTime - currentTime);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getPlanBadgeVariant = (plan: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (plan) {
      case 'enterprise':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Limiting</h2>
          <p className="text-muted-foreground">
            Monitoramento de limites de requisições por API
          </p>
        </div>
        <Badge variant={getPlanBadgeVariant(currentPlan)} className="text-sm">
          Plano: {currentPlan.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const providerStatus = status[provider];
          const usagePercent = providerStatus.remainingRequests === 0 
            ? 100 
            : ((providerStatus.requestCount / (providerStatus.requestCount + providerStatus.remainingRequests)) * 100);

          return (
            <Card key={provider} className={providerStatus.isLimited ? 'border-destructive' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {PROVIDER_ICONS[provider]}
                    {PROVIDER_NAMES[provider]}
                  </CardTitle>
                  {providerStatus.isLimited && (
                    <Badge variant="destructive" className="text-xs">
                      Limitado
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {providerStatus.requestCount} / {providerStatus.requestCount + providerStatus.remainingRequests} requisições
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress 
                  value={usagePercent} 
                  className={providerStatus.isLimited ? 'bg-destructive/20' : ''}
                />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Reset em
                  </div>
                  <span className="font-medium">
                    {formatTimeRemaining(providerStatus.resetTime)}
                  </span>
                </div>

                {providerStatus.burstCount > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Burst</span>
                      <span className="font-medium">
                        {providerStatus.burstCount} requisições
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
