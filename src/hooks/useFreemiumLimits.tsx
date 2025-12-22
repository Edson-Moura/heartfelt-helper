import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserPlanType, 
  getRemainingLimits, 
  checkLessonLimit,
  checkConversationLimit,
  checkDailyUsage,
  incrementUsage,
  incrementConversationMinutes,
  isFeatureAvailable,
  PlanType,
  ActionType,
  LimitCheckResult,
  RemainingLimits
} from '@/lib/freemiumLimits';
import { trackFreemiumEvent } from '@/services/FreemiumAnalytics';

export const useFreemiumLimits = () => {
  const { user } = useAuth();
  const [planType, setPlanType] = useState<PlanType>('free');
  const [limits, setLimits] = useState<RemainingLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeTrigger, setUpgradeTrigger] = useState<'lesson_limit' | 'conversation_limit' | 'avatar_locked' | 'feature_locked'>('feature_locked');

  // Load plan and limits
  useEffect(() => {
    if (user?.id) {
      loadPlanAndLimits();
    }
  }, [user?.id]);

  const loadPlanAndLimits = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [plan, remainingLimits] = await Promise.all([
        getUserPlanType(user.id),
        getRemainingLimits(user.id)
      ]);
      
      setPlanType(plan);
      setLimits(remainingLimits);
    } catch (error) {
      console.error('Error loading plan and limits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if an action is allowed
  const canDoAction = useCallback(async (action: ActionType): Promise<LimitCheckResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'User not logged in', current: 0, limit: 0, remaining: 0 };
    }

    let result: LimitCheckResult;
    
    switch (action) {
      case 'lesson':
        result = await checkLessonLimit(user.id, planType);
        break;
      case 'conversation':
        result = await checkConversationLimit(user.id, planType);
        break;
      default:
        result = await checkDailyUsage(user.id, action, planType);
    }

    // Track when limit is reached
    if (!result.allowed) {
      trackFreemiumEvent('limit_reached', {
        userId: user.id,
        planType,
        limitType: action,
        current: result.current,
        limit: result.limit
      });
    }

    return result;
  }, [user?.id, planType]);

  // Get remaining actions for a specific type
  const remainingActions = useCallback((action: ActionType): number => {
    if (!limits) return 0;
    
    switch (action) {
      case 'lesson':
        return limits.remaining.lessonsToday;
      case 'conversation':
        return limits.remaining.conversationsToday;
      case 'ai_interaction':
        return limits.remaining.aiInteractionsToday;
      case 'pronunciation':
        return limits.remaining.pronunciationChecksToday;
      default:
        return 0;
    }
  }, [limits]);

  // Record usage of an action
  const recordUsage = useCallback(async (action: ActionType, amount: number = 1): Promise<boolean> => {
    if (!user?.id) return false;
    
    const success = await incrementUsage(user.id, action, amount);
    
    if (success) {
      // Reload limits to update UI
      await loadPlanAndLimits();
    }
    
    return success;
  }, [user?.id]);

  // Record conversation minutes
  const recordConversationMinutes = useCallback(async (minutes: number): Promise<boolean> => {
    if (!user?.id) return false;
    
    const success = await incrementConversationMinutes(user.id, minutes);
    
    if (success) {
      await loadPlanAndLimits();
      
      // Check if approaching limit (80%)
      if (limits) {
        const percentUsed = (limits.usage.conversationMinutesToday / limits.limits.dailyConversationMinutes) * 100;
        if (percentUsed >= 80 && percentUsed < 100) {
          trackFreemiumEvent('approaching_limit', {
            userId: user.id,
            planType,
            limitType: 'conversation_minutes',
            percentUsed
          });
        }
      }
    }
    
    return success;
  }, [user?.id, planType, limits]);

  // Check if a feature is available
  const checkFeature = useCallback(async (feature: keyof RemainingLimits['features']): Promise<boolean> => {
    if (!user?.id) return false;
    return await isFeatureAvailable(user.id, feature);
  }, [user?.id]);

  // Show upgrade modal with specific message
  const triggerUpgrade = useCallback((
    trigger: 'lesson_limit' | 'conversation_limit' | 'avatar_locked' | 'feature_locked',
    message?: string
  ) => {
    setUpgradeTrigger(trigger);
    setUpgradeMessage(message || 'Faça upgrade para continuar!');
    setShowUpgradeModal(true);
    
    trackFreemiumEvent('upgrade_modal_shown', {
      userId: user?.id || '',
      planType,
      trigger
    });
  }, [user?.id, planType]);

  // Hide upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  // Get usage percentage for display
  const getUsagePercentage = useCallback((action: ActionType): number => {
    if (!limits) return 0;
    
    switch (action) {
      case 'lesson': {
        if (limits.limits.lessonsPerDay === Infinity) return 0;
        return Math.round((limits.usage.lessonsToday / limits.limits.lessonsPerDay) * 100);
      }
      case 'conversation': {
        if (limits.limits.conversationsPerDay === Infinity) return 0;
        return Math.round((limits.usage.conversationsToday / limits.limits.conversationsPerDay) * 100);
      }
      case 'ai_interaction': {
        if (limits.limits.aiInteractionsPerDay === Infinity) return 0;
        return Math.round((limits.usage.aiInteractionsToday / limits.limits.aiInteractionsPerDay) * 100);
      }
      default:
        return 0;
    }
  }, [limits]);

  // Get conversation minutes percentage
  const getConversationMinutesPercentage = useCallback((): number => {
    if (!limits || limits.limits.dailyConversationMinutes === Infinity) return 0;
    return Math.round((limits.usage.conversationMinutesToday / limits.limits.dailyConversationMinutes) * 100);
  }, [limits]);

  return {
    // State
    planType,
    limits,
    loading,
    showUpgradeModal,
    upgradeMessage,
    upgradeTrigger,
    
    // Functions
    canDoAction,
    remainingActions,
    recordUsage,
    recordConversationMinutes,
    checkFeature,
    triggerUpgrade,
    closeUpgradeModal,
    getUsagePercentage,
    getConversationMinutesPercentage,
    refreshLimits: loadPlanAndLimits,
    
    // Computed
    isPremium: planType === 'premium',
    isFree: planType === 'free',
    isBasic: planType === 'basic',
  };
};
