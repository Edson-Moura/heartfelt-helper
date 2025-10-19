import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { rateLimiter } from '@/services/RateLimiter';
import type { Provider } from '@/services/RateLimiter';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type RateLimitStatus = {
  provider: Provider;
  requestCount: number;
  burstCount: number;
  resetTime: number;
  burstResetTime: number;
  isLimited: boolean;
  remainingRequests: number;
};

export const useRateLimiting = () => {
  const { user } = useAuth();
  const { subscriptionData } = useSubscription();
  const { toast } = useToast();
  const [status, setStatus] = useState<Record<Provider, RateLimitStatus> | null>(null);

  // Map subscription tier to rate limiter plan
  const mapTierToPlan = (tier: string | null): 'free' | 'premium' | 'enterprise' => {
    if (!tier) return 'free';
    
    const lowerTier = tier.toLowerCase();
    if (lowerTier === 'premium') return 'premium';
    if (lowerTier === 'pro') return 'enterprise';
    
    return 'free';
  };

  // Update rate limiter when subscription changes
  useEffect(() => {
    const plan = mapTierToPlan(subscriptionData.subscription_tier);
    rateLimiter.setPlan(plan);
    
    logger.info('Rate limiter plan updated', { 
      tier: subscriptionData.subscription_tier,
      plan 
    }, 'useRateLimiting', user?.id);

    // Update status
    setStatus(rateLimiter.getAllStatus());
  }, [subscriptionData.subscription_tier, user?.id]);

  // Check if a request can be made
  const canMakeRequest = useCallback((provider: Provider): boolean => {
    const allowed = rateLimiter.canMakeRequest(provider, user?.id);
    
    if (!allowed) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(provider);
      const minutes = Math.ceil(timeUntilReset / 60000);
      
      toast({
        title: "Limite de requisições atingido",
        description: `Por favor, aguarde ${minutes} minuto(s) antes de tentar novamente.`,
        variant: "destructive",
      });

      logger.warn('Rate limit exceeded', { 
        provider, 
        timeUntilReset 
      }, 'useRateLimiting', user?.id);
    }
    
    return allowed;
  }, [user?.id, toast]);

  // Record a request
  const recordRequest = useCallback((provider: Provider) => {
    rateLimiter.recordRequest(provider, user?.id);
    setStatus(rateLimiter.getAllStatus());
  }, [user?.id]);

  // Try to make a request with automatic rate limiting
  const tryRequest = useCallback(async <T,>(
    provider: Provider,
    fn: () => Promise<T>,
    onLimited?: () => void
  ): Promise<T | null> => {
    const result = await rateLimiter.tryRequest(
      provider,
      fn,
      () => {
        const timeUntilReset = rateLimiter.getTimeUntilReset(provider);
        const minutes = Math.ceil(timeUntilReset / 60000);
        
        toast({
          title: "Limite de requisições atingido",
          description: `Por favor, aguarde ${minutes} minuto(s) antes de tentar novamente.`,
          variant: "destructive",
        });

        if (onLimited) onLimited();
      },
      user?.id
    );

    setStatus(rateLimiter.getAllStatus());
    return result;
  }, [user?.id, toast]);

  // Get status for a specific provider
  const getProviderStatus = useCallback((provider: Provider): RateLimitStatus | null => {
    return status ? status[provider] : null;
  }, [status]);

  // Get time until reset for a provider
  const getTimeUntilReset = useCallback((provider: Provider): number => {
    return rateLimiter.getTimeUntilReset(provider);
  }, []);

  // Get current plan
  const getCurrentPlan = useCallback(() => {
    return mapTierToPlan(subscriptionData.subscription_tier);
  }, [subscriptionData.subscription_tier]);

  // Refresh status
  const refreshStatus = useCallback(() => {
    setStatus(rateLimiter.getAllStatus());
  }, []);

  return {
    canMakeRequest,
    recordRequest,
    tryRequest,
    getProviderStatus,
    getTimeUntilReset,
    getCurrentPlan,
    refreshStatus,
    status,
  };
};
