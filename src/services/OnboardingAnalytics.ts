import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface OnboardingMetrics {
  step_1_completion_rate: number;
  step_2_completion_rate: number;
  step_3_completion_rate: number;
  step_4_completion_rate: number; // Mais crítico!
  step_5_completion_rate: number;
  total_completion_rate: number;
  average_time_per_step: number[];
  drop_off_points: string[]; // Onde usuários desistem
  
  // Específicos
  voice_usage_rate: number; // Quantos usam voz vs digitam
  level_distribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  goals_distribution: { [key: string]: number };
}

interface OnboardingEvent {
  user_id: string;
  event_type: 'step_started' | 'step_completed' | 'step_skipped' | 'voice_used' | 'onboarding_completed' | 'onboarding_abandoned';
  step_number?: number;
  metadata?: {
    time_spent?: number;
    level_selected?: string;
    goal_selected?: string;
    voice_used?: boolean;
    [key: string]: any;
  };
  timestamp: string;
}

class OnboardingAnalyticsService {
  private stepStartTimes: Map<number, number> = new Map();

  /**
   * Track quando um step do onboarding começa
   */
  trackStepStarted(stepNumber: number, userId: string) {
    this.stepStartTimes.set(stepNumber, Date.now());
    
    this.logEvent({
      user_id: userId,
      event_type: 'step_started',
      step_number: stepNumber,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Onboarding step started', { stepNumber, userId }, 'OnboardingAnalytics');
  }

  /**
   * Track quando um step é completado
   */
  trackStepCompleted(stepNumber: number, userId: string, metadata?: any) {
    const startTime = this.stepStartTimes.get(stepNumber);
    const timeSpent = startTime ? Date.now() - startTime : undefined;
    
    this.logEvent({
      user_id: userId,
      event_type: 'step_completed',
      step_number: stepNumber,
      metadata: {
        time_spent: timeSpent,
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Onboarding step completed', { 
      stepNumber, 
      userId, 
      timeSpent,
      ...metadata 
    }, 'OnboardingAnalytics');
    
    // Limpar o timer do step
    this.stepStartTimes.delete(stepNumber);
  }

  /**
   * Track quando usuário usa voz no step 4
   */
  trackVoiceUsed(userId: string) {
    this.logEvent({
      user_id: userId,
      event_type: 'voice_used',
      step_number: 4,
      metadata: {
        voice_used: true,
      },
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Voice feature used in onboarding', { userId }, 'OnboardingAnalytics');
  }

  /**
   * Track quando onboarding é completado
   */
  trackOnboardingCompleted(userId: string, metadata?: any) {
    this.logEvent({
      user_id: userId,
      event_type: 'onboarding_completed',
      metadata,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('Onboarding completed', { userId, ...metadata }, 'OnboardingAnalytics');
    
    // Limpar todos os timers
    this.stepStartTimes.clear();
  }

  /**
   * Track quando usuário abandona o onboarding
   */
  trackOnboardingAbandoned(userId: string, lastStep: number) {
    this.logEvent({
      user_id: userId,
      event_type: 'onboarding_abandoned',
      step_number: lastStep,
      timestamp: new Date().toISOString(),
    });
    
    logger.warn('Onboarding abandoned', { userId, lastStep }, 'OnboardingAnalytics');
    
    // Limpar todos os timers
    this.stepStartTimes.clear();
  }

  /**
   * Track quando usuário pula o onboarding
   */
  trackOnboardingSkipped(userId: string, currentStep: number) {
    this.logEvent({
      user_id: userId,
      event_type: 'step_skipped',
      step_number: currentStep,
      timestamp: new Date().toISOString(),
    });
    
    logger.warn('Onboarding skipped', { userId, currentStep }, 'OnboardingAnalytics');
    
    // Limpar todos os timers
    this.stepStartTimes.clear();
  }

  /**
   * Log event para tabela de analytics (se existir) ou console
   */
  private async logEvent(event: OnboardingEvent) {
    try {
      // Tentar salvar no Supabase (assumindo que há uma tabela de analytics)
      // Se não existir, apenas loga no console
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: event.event_type,
          table_name: 'onboarding_analytics',
          user_id: event.user_id,
          metadata: event.metadata,
          severity: 'info',
        });

      if (error) {
        console.warn('Could not save onboarding analytics to database:', error);
      }
    } catch (error) {
      console.warn('Error logging onboarding event:', error);
    }
  }

  /**
   * Calcular métricas agregadas (admin only)
   * Este método seria usado em um dashboard de admin
   */
  async calculateMetrics(): Promise<Partial<OnboardingMetrics>> {
    try {
      // Query para buscar eventos de onboarding
      const { data: events, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'onboarding_analytics')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!events || events.length === 0) {
        return {
          total_completion_rate: 0,
          voice_usage_rate: 0,
        };
      }

      // Calcular métricas básicas
      const completedCount = events.filter(e => e.event_type === 'onboarding_completed').length;
      const voiceUsedCount = events.filter(e => e.event_type === 'voice_used').length;
      const totalUsers = new Set(events.map(e => e.user_id)).size;

      return {
        total_completion_rate: totalUsers > 0 ? (completedCount / totalUsers) * 100 : 0,
        voice_usage_rate: totalUsers > 0 ? (voiceUsedCount / totalUsers) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error calculating onboarding metrics', error as Error, 'OnboardingAnalytics');
      return {};
    }
  }
}

export const onboardingAnalytics = new OnboardingAnalyticsService();
