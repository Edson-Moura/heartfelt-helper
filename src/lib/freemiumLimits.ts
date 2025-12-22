import { supabase } from '@/integrations/supabase/client';

// Plan types
export type PlanType = 'free' | 'basic' | 'premium';

// Limit structure
export interface PlanLimits {
  // Lessons
  totalLessons: number;
  lessonsPerDay: number;
  
  // Conversation with AI
  dailyConversationMinutes: number;
  conversationsPerDay: number;
  
  // Exercises
  exercisesPerLesson: number;
  
  // Feature flags
  avatarEnabled: boolean;
  downloadOffline: boolean;
  advancedScenarios: boolean;
  liveClasses: boolean;
  certificateEnabled: boolean;
  communityAccess: boolean;
  
  // Other limits
  aiInteractionsPerDay: number;
  pronunciationChecks: number;
}

// Plan limits configuration
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    // Lessons
    totalLessons: 3,
    lessonsPerDay: 1,
    
    // Conversation with AI
    dailyConversationMinutes: 5,
    conversationsPerDay: 3,
    
    // Exercises
    exercisesPerLesson: 5,
    
    // Blocked features
    avatarEnabled: false,
    downloadOffline: false,
    advancedScenarios: false,
    liveClasses: false,
    certificateEnabled: false,
    communityAccess: false,
    
    // Other limits
    aiInteractionsPerDay: 10,
    pronunciationChecks: 5,
  },
  basic: {
    totalLessons: Infinity,
    lessonsPerDay: Infinity,
    dailyConversationMinutes: 15,
    conversationsPerDay: 10,
    exercisesPerLesson: Infinity,
    avatarEnabled: true,
    downloadOffline: false,
    advancedScenarios: false,
    liveClasses: false,
    certificateEnabled: true,
    communityAccess: false,
    aiInteractionsPerDay: 50,
    pronunciationChecks: 20,
  },
  premium: {
    totalLessons: Infinity,
    lessonsPerDay: Infinity,
    dailyConversationMinutes: Infinity,
    conversationsPerDay: Infinity,
    exercisesPerLesson: Infinity,
    avatarEnabled: true,
    downloadOffline: true,
    advancedScenarios: true,
    liveClasses: true,
    certificateEnabled: true,
    communityAccess: true,
    aiInteractionsPerDay: Infinity,
    pronunciationChecks: Infinity,
  }
};

// Daily usage interface
export interface DailyUsage {
  id: string;
  user_id: string;
  date: string;
  lessons_completed: number;
  conversation_minutes: number;
  conversations_count: number;
  ai_interactions: number;
  pronunciation_checks: number;
  exercises_completed: number;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get or create daily usage record
export const getOrCreateDailyUsage = async (userId: string): Promise<DailyUsage | null> => {
  const today = getTodayDate();
  
  // Try to get existing record
  const { data: existing, error: fetchError } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error fetching daily usage:', fetchError);
    return null;
  }
  
  if (existing) {
    return existing as DailyUsage;
  }
  
  // Create new record for today
  const { data: created, error: createError } = await supabase
    .from('daily_usage')
    .insert({
      user_id: userId,
      date: today,
      lessons_completed: 0,
      conversation_minutes: 0,
      conversations_count: 0,
      ai_interactions: 0,
      pronunciation_checks: 0,
      exercises_completed: 0,
    })
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating daily usage:', createError);
    return null;
  }
  
  return created as DailyUsage;
};

// Get user's plan type from subscription
export const getUserPlanType = async (userId: string): Promise<PlanType> => {
  const { data, error } = await supabase
    .from('subscribers')
    .select('subscribed, subscription_tier')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data || !data.subscribed) {
    return 'free';
  }
  
  const tier = data.subscription_tier?.toLowerCase();
  if (tier === 'premium' || tier === 'pro') {
    return 'premium';
  }
  if (tier === 'basic') {
    return 'basic';
  }
  
  return 'free';
};

// Get total lessons completed by user
const getTotalLessonsCompleted = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');
  
  if (error) {
    console.error('Error fetching total lessons:', error);
    return 0;
  }
  
  return count || 0;
};

// Check lesson limit
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  remaining: number;
}

export const checkLessonLimit = async (userId: string, planType?: PlanType): Promise<LimitCheckResult> => {
  const plan = planType || await getUserPlanType(userId);
  const limits = PLAN_LIMITS[plan];
  
  // Check total lessons limit
  const totalCompleted = await getTotalLessonsCompleted(userId);
  if (limits.totalLessons !== Infinity && totalCompleted >= limits.totalLessons) {
    return {
      allowed: false,
      reason: 'Você atingiu o limite total de lições do plano gratuito. Faça upgrade para continuar aprendendo!',
      current: totalCompleted,
      limit: limits.totalLessons,
      remaining: 0,
    };
  }
  
  // Check daily lessons limit
  const dailyUsage = await getOrCreateDailyUsage(userId);
  if (!dailyUsage) {
    return { allowed: true, current: 0, limit: limits.lessonsPerDay, remaining: limits.lessonsPerDay };
  }
  
  if (limits.lessonsPerDay !== Infinity && dailyUsage.lessons_completed >= limits.lessonsPerDay) {
    return {
      allowed: false,
      reason: 'Você atingiu o limite diário de lições. Volte amanhã ou faça upgrade!',
      current: dailyUsage.lessons_completed,
      limit: limits.lessonsPerDay,
      remaining: 0,
    };
  }
  
  const remaining = limits.lessonsPerDay === Infinity 
    ? Infinity 
    : limits.lessonsPerDay - dailyUsage.lessons_completed;
  
  return {
    allowed: true,
    current: dailyUsage.lessons_completed,
    limit: limits.lessonsPerDay,
    remaining,
  };
};

// Check conversation limit
export const checkConversationLimit = async (userId: string, planType?: PlanType): Promise<LimitCheckResult> => {
  const plan = planType || await getUserPlanType(userId);
  const limits = PLAN_LIMITS[plan];
  
  const dailyUsage = await getOrCreateDailyUsage(userId);
  if (!dailyUsage) {
    return { allowed: true, current: 0, limit: limits.conversationsPerDay, remaining: limits.conversationsPerDay };
  }
  
  // Check conversation count
  if (limits.conversationsPerDay !== Infinity && dailyUsage.conversations_count >= limits.conversationsPerDay) {
    return {
      allowed: false,
      reason: 'Você atingiu o limite diário de conversas. Volte amanhã ou faça upgrade!',
      current: dailyUsage.conversations_count,
      limit: limits.conversationsPerDay,
      remaining: 0,
    };
  }
  
  // Check conversation minutes
  if (limits.dailyConversationMinutes !== Infinity && dailyUsage.conversation_minutes >= limits.dailyConversationMinutes) {
    return {
      allowed: false,
      reason: `Você usou seus ${limits.dailyConversationMinutes} minutos diários de conversação. Volte amanhã ou faça upgrade!`,
      current: dailyUsage.conversation_minutes,
      limit: limits.dailyConversationMinutes,
      remaining: 0,
    };
  }
  
  const remaining = limits.conversationsPerDay === Infinity 
    ? Infinity 
    : limits.conversationsPerDay - dailyUsage.conversations_count;
  
  return {
    allowed: true,
    current: dailyUsage.conversations_count,
    limit: limits.conversationsPerDay,
    remaining,
  };
};

// Check daily usage for specific action type
export type ActionType = 'lesson' | 'conversation' | 'ai_interaction' | 'pronunciation' | 'exercise';

export const checkDailyUsage = async (
  userId: string, 
  actionType: ActionType, 
  planType?: PlanType
): Promise<LimitCheckResult> => {
  const plan = planType || await getUserPlanType(userId);
  const limits = PLAN_LIMITS[plan];
  
  const dailyUsage = await getOrCreateDailyUsage(userId);
  if (!dailyUsage) {
    return { allowed: true, current: 0, limit: Infinity, remaining: Infinity };
  }
  
  switch (actionType) {
    case 'lesson':
      return checkLessonLimit(userId, plan);
      
    case 'conversation':
      return checkConversationLimit(userId, plan);
      
    case 'ai_interaction': {
      const limit = limits.aiInteractionsPerDay;
      const current = dailyUsage.ai_interactions;
      if (limit !== Infinity && current >= limit) {
        return {
          allowed: false,
          reason: 'Você atingiu o limite diário de interações com IA. Volte amanhã ou faça upgrade!',
          current,
          limit,
          remaining: 0,
        };
      }
      return {
        allowed: true,
        current,
        limit,
        remaining: limit === Infinity ? Infinity : limit - current,
      };
    }
    
    case 'pronunciation': {
      const limit = limits.pronunciationChecks;
      const current = dailyUsage.pronunciation_checks;
      if (limit !== Infinity && current >= limit) {
        return {
          allowed: false,
          reason: 'Você atingiu o limite diário de verificações de pronúncia. Volte amanhã ou faça upgrade!',
          current,
          limit,
          remaining: 0,
        };
      }
      return {
        allowed: true,
        current,
        limit,
        remaining: limit === Infinity ? Infinity : limit - current,
      };
    }
    
    case 'exercise': {
      const limit = limits.exercisesPerLesson;
      const current = dailyUsage.exercises_completed;
      return {
        allowed: limit === Infinity || current < limit,
        current,
        limit,
        remaining: limit === Infinity ? Infinity : Math.max(0, limit - current),
      };
    }
    
    default:
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity };
  }
};

// Get all remaining limits for a user
export interface RemainingLimits {
  planType: PlanType;
  limits: PlanLimits;
  usage: {
    lessonsToday: number;
    lessonsTotal: number;
    conversationsToday: number;
    conversationMinutesToday: number;
    aiInteractionsToday: number;
    pronunciationChecksToday: number;
    exercisesToday: number;
  };
  remaining: {
    lessonsToday: number;
    lessonsTotal: number;
    conversationsToday: number;
    conversationMinutesToday: number;
    aiInteractionsToday: number;
    pronunciationChecksToday: number;
  };
  features: {
    avatarEnabled: boolean;
    downloadOffline: boolean;
    advancedScenarios: boolean;
    liveClasses: boolean;
    certificateEnabled: boolean;
    communityAccess: boolean;
  };
}

export const getRemainingLimits = async (userId: string): Promise<RemainingLimits> => {
  const planType = await getUserPlanType(userId);
  const limits = PLAN_LIMITS[planType];
  const dailyUsage = await getOrCreateDailyUsage(userId);
  const totalLessons = await getTotalLessonsCompleted(userId);
  
  const usage = {
    lessonsToday: dailyUsage?.lessons_completed || 0,
    lessonsTotal: totalLessons,
    conversationsToday: dailyUsage?.conversations_count || 0,
    conversationMinutesToday: dailyUsage?.conversation_minutes || 0,
    aiInteractionsToday: dailyUsage?.ai_interactions || 0,
    pronunciationChecksToday: dailyUsage?.pronunciation_checks || 0,
    exercisesToday: dailyUsage?.exercises_completed || 0,
  };
  
  const calcRemaining = (current: number, limit: number) => 
    limit === Infinity ? Infinity : Math.max(0, limit - current);
  
  return {
    planType,
    limits,
    usage,
    remaining: {
      lessonsToday: calcRemaining(usage.lessonsToday, limits.lessonsPerDay),
      lessonsTotal: calcRemaining(usage.lessonsTotal, limits.totalLessons),
      conversationsToday: calcRemaining(usage.conversationsToday, limits.conversationsPerDay),
      conversationMinutesToday: calcRemaining(usage.conversationMinutesToday, limits.dailyConversationMinutes),
      aiInteractionsToday: calcRemaining(usage.aiInteractionsToday, limits.aiInteractionsPerDay),
      pronunciationChecksToday: calcRemaining(usage.pronunciationChecksToday, limits.pronunciationChecks),
    },
    features: {
      avatarEnabled: limits.avatarEnabled,
      downloadOffline: limits.downloadOffline,
      advancedScenarios: limits.advancedScenarios,
      liveClasses: limits.liveClasses,
      certificateEnabled: limits.certificateEnabled,
      communityAccess: limits.communityAccess,
    },
  };
};

// Increment usage counters
export const incrementUsage = async (
  userId: string, 
  actionType: ActionType, 
  amount: number = 1
): Promise<boolean> => {
  const dailyUsage = await getOrCreateDailyUsage(userId);
  if (!dailyUsage) return false;
  
  const columnMap: Record<ActionType, string> = {
    lesson: 'lessons_completed',
    conversation: 'conversations_count',
    ai_interaction: 'ai_interactions',
    pronunciation: 'pronunciation_checks',
    exercise: 'exercises_completed',
  };
  
  const column = columnMap[actionType];
  const currentValue = dailyUsage[column as keyof DailyUsage] as number;
  
  const { error } = await supabase
    .from('daily_usage')
    .update({ [column]: currentValue + amount })
    .eq('id', dailyUsage.id);
  
  if (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
  
  return true;
};

// Increment conversation minutes specifically
export const incrementConversationMinutes = async (
  userId: string, 
  minutes: number
): Promise<boolean> => {
  const dailyUsage = await getOrCreateDailyUsage(userId);
  if (!dailyUsage) return false;
  
  const { error } = await supabase
    .from('daily_usage')
    .update({ 
      conversation_minutes: dailyUsage.conversation_minutes + minutes,
      conversations_count: dailyUsage.conversations_count + 1,
    })
    .eq('id', dailyUsage.id);
  
  if (error) {
    console.error('Error incrementing conversation minutes:', error);
    return false;
  }
  
  return true;
};

// Check if a feature is available for the user's plan
export const isFeatureAvailable = async (
  userId: string, 
  feature: keyof Pick<PlanLimits, 'avatarEnabled' | 'downloadOffline' | 'advancedScenarios' | 'liveClasses' | 'certificateEnabled' | 'communityAccess'>
): Promise<boolean> => {
  const planType = await getUserPlanType(userId);
  return PLAN_LIMITS[planType][feature];
};
