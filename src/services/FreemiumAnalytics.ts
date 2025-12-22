import { supabase } from '@/integrations/supabase/client';

/**
 * Track freemium-related events for analytics and optimization
 */

export type FreemiumEventType =
  | 'limit_reached'
  | 'approaching_limit'
  | 'upgrade_modal_shown'
  | 'upgrade_modal_dismissed'
  | 'upgrade_clicked'
  | 'free_to_paid_conversion'
  | 'feature_clicked_locked'
  | 'daily_limit_reset'
  | 'first_lesson_completed'
  | 'first_conversation_completed';

export interface FreemiumEventData {
  userId: string;
  planType: 'free' | 'basic' | 'premium';
  limitType?: string;
  trigger?: string;
  current?: number;
  limit?: number;
  percentUsed?: number;
  conversionValue?: number;
  [key: string]: any;
}

/**
 * Track a freemium event to audit_logs for analytics
 */
export const trackFreemiumEvent = async (
  eventType: FreemiumEventType,
  data: FreemiumEventData
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: `freemium_${eventType}`,
        user_id: data.userId || null,
        table_name: 'freemium_analytics',
        action: eventType,
        metadata: data,
        severity: 'info',
      });

    if (error) {
      console.error('Error tracking freemium event:', error);
    }
  } catch (error) {
    console.error('Error tracking freemium event:', error);
  }
};

/**
 * Track when a user reaches a limit
 */
export const trackLimitReached = async (
  userId: string,
  planType: 'free' | 'basic' | 'premium',
  limitType: string,
  current: number,
  limit: number
): Promise<void> => {
  await trackFreemiumEvent('limit_reached', {
    userId,
    planType,
    limitType,
    current,
    limit,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when upgrade modal is shown
 */
export const trackUpgradeModalShown = async (
  userId: string,
  planType: 'free' | 'basic' | 'premium',
  trigger: string
): Promise<void> => {
  await trackFreemiumEvent('upgrade_modal_shown', {
    userId,
    planType,
    trigger,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user clicks upgrade button
 */
export const trackUpgradeClicked = async (
  userId: string,
  planType: 'free' | 'basic' | 'premium',
  trigger: string,
  targetPlan: string
): Promise<void> => {
  await trackFreemiumEvent('upgrade_clicked', {
    userId,
    planType,
    trigger,
    targetPlan,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user converts from free to paid
 */
export const trackConversion = async (
  userId: string,
  fromPlan: 'free' | 'basic',
  toPlan: 'basic' | 'premium',
  conversionValue: number
): Promise<void> => {
  await trackFreemiumEvent('free_to_paid_conversion', {
    userId,
    planType: fromPlan,
    targetPlan: toPlan,
    conversionValue,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user tries to access a locked feature
 */
export const trackFeatureClickedLocked = async (
  userId: string,
  planType: 'free' | 'basic' | 'premium',
  feature: string
): Promise<void> => {
  await trackFreemiumEvent('feature_clicked_locked', {
    userId,
    planType,
    feature,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get analytics data for a specific user
 */
export const getUserAnalytics = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .like('event_type', 'freemium_%')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching user analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return [];
  }
};

/**
 * Get conversion metrics
 */
export const getConversionMetrics = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'freemium_free_to_paid_conversion')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversion metrics:', error);
      return {
        total: 0,
        last7Days: 0,
        last30Days: 0,
        conversionRate: 0,
      };
    }

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const conversions7Days = data.filter(
      (record) => new Date(record.created_at) >= last7Days
    ).length;

    const conversions30Days = data.filter(
      (record) => new Date(record.created_at) >= last30Days
    ).length;

    return {
      total: data.length,
      last7Days: conversions7Days,
      last30Days: conversions30Days,
      conversionRate: 0, // Calculate based on total users
    };
  } catch (error) {
    console.error('Error fetching conversion metrics:', error);
    return {
      total: 0,
      last7Days: 0,
      last30Days: 0,
      conversionRate: 0,
    };
  }
};

/**
 * Get most common limit reached
 */
export const getMostCommonLimitReached = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('metadata')
      .eq('event_type', 'freemium_limit_reached')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !data) {
      return { limitType: 'unknown', count: 0 };
    }

    const limitCounts: Record<string, number> = {};
    data.forEach((record) => {
      const limitType = (record.metadata as any)?.limitType || 'unknown';
      limitCounts[limitType] = (limitCounts[limitType] || 0) + 1;
    });

    const mostCommon = Object.entries(limitCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      limitType: mostCommon?.[0] || 'unknown',
      count: mostCommon?.[1] || 0,
    };
  } catch (error) {
    console.error('Error fetching most common limit:', error);
    return { limitType: 'unknown', count: 0 };
  }
};

/**
 * Get upgrade modal stats
 */
export const getUpgradeModalStats = async () => {
  try {
    const { count: shownCount, error: shownError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'freemium_upgrade_modal_shown');

    const { count: clickedCount, error: clickedError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'freemium_upgrade_clicked');

    if (shownError || clickedError) {
      return { shown: 0, clicked: 0, clickThroughRate: 0 };
    }

    const shown = shownCount || 0;
    const clicked = clickedCount || 0;
    const clickThroughRate = shown > 0 ? (clicked / shown) * 100 : 0;

    return {
      shown,
      clicked,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching upgrade modal stats:', error);
    return { shown: 0, clicked: 0, clickThroughRate: 0 };
  }
};
