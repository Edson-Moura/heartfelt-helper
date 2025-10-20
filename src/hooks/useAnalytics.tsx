import { useEffect, useCallback } from 'react';
import { analyticsService, AnalyticsProvider } from '@/services/AnalyticsService';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { logger } from '@/lib/logger';

interface UseAnalyticsOptions {
  provider?: AnalyticsProvider;
  autoTrackPages?: boolean;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { provider = 'none', autoTrackPages = true } = options;
  const { user } = useAuth();
  const { subscriptionData } = useSubscription();

  // Inicializa analytics
  useEffect(() => {
    analyticsService.initialize(provider);
  }, [provider]);

  // Identifica usuário quando login
  useEffect(() => {
    if (user && analyticsService.isInitialized()) {
      analyticsService.identify({
        userId: user.id,
        email: user.email,
        plan: subscriptionData?.subscription_tier || 'free',
        createdAt: user.created_at,
      });
    }
  }, [user, subscriptionData]);

  // Auto-track page views (disabled, use trackPage manually instead)
  // This prevents errors during initialization

  // Reset ao fazer logout
  useEffect(() => {
    if (!user && analyticsService.isInitialized()) {
      analyticsService.reset();
    }
  }, [user]);

  /**
   * Rastreia um evento customizado
   */
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analyticsService.track(event, properties, user?.id);
    logger.info('Analytics event tracked', { event, properties }, 'useAnalytics', user?.id);
  }, [user?.id]);

  /**
   * Rastreia visualização de página manualmente
   */
  const trackPage = useCallback((pageName: string, properties?: Record<string, any>) => {
    analyticsService.page(pageName, properties);
  }, []);

  /**
   * Inicia timer para evento
   */
  const timeEvent = useCallback((event: string) => {
    analyticsService.timeEvent(event);
  }, []);

  /**
   * Rastreia receita
   */
  const trackRevenue = useCallback((amount: number, properties?: Record<string, any>) => {
    analyticsService.revenue(amount, properties);
  }, []);

  /**
   * Eventos pré-definidos para facilitar o uso
   */
  const trackEvent = {
    // Autenticação
    signup: () => track('User Signed Up', { plan: 'free' }),
    login: () => track('User Logged In'),
    logout: () => track('User Logged Out'),
    
    // Lições
    lessonStarted: (lessonId: string, lessonTitle: string) => 
      track('Lesson Started', { lessonId, lessonTitle }),
    lessonCompleted: (lessonId: string, lessonTitle: string, score?: number) => 
      track('Lesson Completed', { lessonId, lessonTitle, score }),
    
    // Exercícios
    exerciseCompleted: (type: string, score: number, timeSpent?: number) => 
      track('Exercise Completed', { type, score, timeSpent }),
    
    // Assinatura
    subscriptionStarted: (plan: string, amount: number) => {
      track('Subscription Started', { plan });
      trackRevenue(amount, { plan, type: 'subscription' });
    },
    subscriptionCanceled: (plan: string) => 
      track('Subscription Canceled', { plan }),
    
    // Conquistas
    achievementUnlocked: (achievementId: string, achievementName: string) => 
      track('Achievement Unlocked', { achievementId, achievementName }),
    
    // Chat
    chatMessageSent: (messageLength: number, hasVoice: boolean) => 
      track('Chat Message Sent', { messageLength, hasVoice }),
    
    // Feedback
    feedbackSubmitted: (rating: number, category: string) => 
      track('Feedback Submitted', { rating, category }),
    
    // E-book
    ebookDownloaded: () => track('Ebook Downloaded'),
    ebookSubscribed: (email: string) => 
      track('Ebook Subscription', { email }),
  };

  return {
    track,
    trackPage,
    timeEvent,
    trackRevenue,
    trackEvent,
    isInitialized: analyticsService.isInitialized(),
    provider: analyticsService.getProvider(),
  };
};
