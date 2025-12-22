import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Flame, 
  Target, 
  Star, 
  Clock, 
  BookOpen, 
  Zap, 
  Crown,
  Calendar,
  Award
} from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  requirement: number;
  type: string;
  category: string;
  points_reward: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface UserAchievement {
  badgeId: string;
  unlockedAt: Date;
  isNew: boolean;
}

// Icon mapping for achievement types
const getIconForCategory = (category: string) => {
  switch (category) {
    case 'milestone':
    case 'learning':
      return BookOpen;
    case 'consistency':
    case 'dedication':
      return Flame;
    case 'mastery':
      return Star;
    case 'level':
      return Crown;
    case 'engagement':
    case 'competition':
      return Trophy;
    case 'social':
      return Award;
    case 'special':
      return Zap;
    default:
      return Award;
  }
};

export const useAchievements = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { progress, getMasteredCount, dailyActivities } = useProgress();
  const { toast } = useToast();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Load achievement templates from database
  useEffect(() => {
    loadAchievementTemplates();
  }, []);

  // Load user achievements from database on component mount
  useEffect(() => {
    if (user) {
      loadUserAchievements();
    }
  }, [user]);

  // Check for new achievements when stats change
  useEffect(() => {
    if (user && profile && !loading && badges.length > 0) {
      checkForNewAchievements();
    }
  }, [user, profile, progress, dailyActivities, loading, badges]);

  const loadAchievementTemplates = async () => {
    try {
      const defaultBadges: Badge[] = [
        // APRENDIZADO (📚)
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Primeira Lição",
          description: "Complete sua primeira lição",
          icon: getIconForCategory("learning"),
          color: "text-green-500",
          requirement: 1,
          type: "lessons_completed",
          category: "learning",
          points_reward: 50,
          rarity: "bronze",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440010",
          name: "10 Lições Completadas",
          description: "Complete 10 lições",
          icon: getIconForCategory("learning"),
          color: "text-primary",
          requirement: 10,
          type: "lessons_completed",
          category: "learning",
          points_reward: 150,
          rarity: "bronze",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          name: "50 Lições Completadas",
          description: "Complete 50 lições",
          icon: getIconForCategory("learning"),
          color: "text-blue-500",
          requirement: 50,
          type: "lessons_completed",
          category: "learning",
          points_reward: 400,
          rarity: "silver",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440012",
          name: "100 Lições Completadas",
          description: "Complete 100 lições",
          icon: getIconForCategory("learning"),
          color: "text-purple-500",
          requirement: 100,
          type: "lessons_completed",
          category: "learning",
          points_reward: 800,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440013",
          name: "500 Lições Completadas (Mestre)",
          description: "Complete 500 lições ao longo da sua jornada",
          icon: getIconForCategory("learning"),
          color: "text-yellow-500",
          requirement: 500,
          type: "lessons_completed",
          category: "learning",
          points_reward: 3000,
          rarity: "diamond",
        },

        // DEDICAÇÃO (🔥)
        {
          id: "550e8400-e29b-41d4-a716-446655440020",
          name: "Primeira Semana",
          description: "Estude 7 dias seguidos",
          icon: getIconForCategory("dedication"),
          color: "text-orange-500",
          requirement: 7,
          type: "streak_days",
          category: "dedication",
          points_reward: 100,
          rarity: "bronze",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440021",
          name: "Streak 7 dias",
          description: "Mantenha uma sequência de 7 dias",
          icon: getIconForCategory("dedication"),
          color: "text-red-500",
          requirement: 7,
          type: "streak_days",
          category: "dedication",
          points_reward: 150,
          rarity: "silver",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440022",
          name: "Streak 30 dias",
          description: "Mantenha uma sequência de 30 dias",
          icon: getIconForCategory("dedication"),
          color: "text-red-500",
          requirement: 30,
          type: "streak_days",
          category: "dedication",
          points_reward: 500,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440023",
          name: "Streak 100 dias",
          description: "Mantenha uma sequência de 100 dias",
          icon: getIconForCategory("dedication"),
          color: "text-red-600",
          requirement: 100,
          type: "streak_days",
          category: "dedication",
          points_reward: 2000,
          rarity: "platinum",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440024",
          name: "Streak 365 dias (Lenda)",
          description: "Mantenha uma sequência de 365 dias",
          icon: getIconForCategory("dedication"),
          color: "text-red-700",
          requirement: 365,
          type: "streak_days",
          category: "dedication",
          points_reward: 10000,
          rarity: "diamond",
        },

        // MAESTRIA (🎯)
        {
          id: "550e8400-e29b-41d4-a716-446655440030",
          name: "10 Exercícios Perfeitos",
          description: "Complete 10 exercícios sem erros",
          icon: getIconForCategory("mastery"),
          color: "text-primary",
          requirement: 10,
          type: "perfect_exercises",
          category: "mastery",
          points_reward: 200,
          rarity: "silver",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440031",
          name: "100 Pronúncias Perfeitas",
          description: "Acerte 100 pronúncias perfeitas",
          icon: getIconForCategory("mastery"),
          color: "text-teal",
          requirement: 100,
          type: "perfect_pronunciations",
          category: "mastery",
          points_reward: 500,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440032",
          name: "Nível B1 Alcançado",
          description: "Alcance o nível de proficiência B1",
          icon: getIconForCategory("level"),
          color: "text-blue-500",
          requirement: 1,
          type: "level_b1",
          category: "mastery",
          points_reward: 800,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440033",
          name: "Nível C2 Alcançado",
          description: "Alcance o nível máximo de proficiência C2",
          icon: getIconForCategory("level"),
          color: "text-purple-600",
          requirement: 1,
          type: "level_c2",
          category: "mastery",
          points_reward: 3000,
          rarity: "diamond",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440034",
          name: "1000 Palavras Aprendidas",
          description: "Aprenda 1000 palavras ao longo da sua jornada",
          icon: getIconForCategory("mastery"),
          color: "text-green-600",
          requirement: 1000,
          type: "words_learned",
          category: "mastery",
          points_reward: 5000,
          rarity: "diamond",
        },

        // COMPETIÇÃO (⚔️) - dependem do sistema de batalhas
        {
          id: "550e8400-e29b-41d4-a716-446655440040",
          name: "Primeira Batalha Vencida",
          description: "Vença sua primeira batalha 1v1",
          icon: getIconForCategory("competition"),
          color: "text-primary",
          requirement: 1,
          type: "battles_won",
          category: "competition",
          points_reward: 200,
          rarity: "bronze",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440041",
          name: "10 Batalhas Vencidas",
          description: "Vença 10 batalhas 1v1",
          icon: getIconForCategory("competition"),
          color: "text-primary",
          requirement: 10,
          type: "battles_won",
          category: "competition",
          points_reward: 800,
          rarity: "silver",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440042",
          name: "100 Batalhas Vencidas",
          description: "Vença 100 batalhas 1v1",
          icon: getIconForCategory("competition"),
          color: "text-primary",
          requirement: 100,
          type: "battles_won",
          category: "competition",
          points_reward: 5000,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440043",
          name: "Top 10 Semanal",
          description: "Fique entre o top 10 do ranking semanal",
          icon: getIconForCategory("competition"),
          color: "text-yellow-500",
          requirement: 1,
          type: "weekly_top10",
          category: "competition",
          points_reward: 1500,
          rarity: "platinum",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440044",
          name: "Campeão Mensal",
          description: "Termine o mês como campeão do ranking",
          icon: getIconForCategory("competition"),
          color: "text-yellow-600",
          requirement: 1,
          type: "monthly_champion",
          category: "competition",
          points_reward: 8000,
          rarity: "diamond",
        },

        // SOCIAL (👥)
        {
          id: "550e8400-e29b-41d4-a716-446655440050",
          name: "Primeiro Amigo Adicionado",
          description: "Adicione seu primeiro amigo na plataforma",
          icon: getIconForCategory("social"),
          color: "text-blue-500",
          requirement: 1,
          type: "friends_added",
          category: "social",
          points_reward: 100,
          rarity: "bronze",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440051",
          name: "5 Amigos Convidados",
          description: "Convide 5 amigos para estudar com você",
          icon: getIconForCategory("social"),
          color: "text-blue-500",
          requirement: 5,
          type: "friends_invited",
          category: "social",
          points_reward: 400,
          rarity: "silver",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440052",
          name: "10 Pessoas Ajudadas",
          description: "Ajude 10 pessoas em dúvidas ou correções",
          icon: getIconForCategory("social"),
          color: "text-green-500",
          requirement: 10,
          type: "people_helped",
          category: "social",
          points_reward: 800,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440053",
          name: "100 Mensagens no Chat",
          description: "Envie 100 mensagens no chat",
          icon: getIconForCategory("social"),
          color: "text-purple-500",
          requirement: 100,
          type: "chat_messages",
          category: "social",
          points_reward: 1200,
          rarity: "platinum",
        },

        // ESPECIAIS (🎁) - destravados manualmente por eventos
        {
          id: "550e8400-e29b-41d4-a716-446655440060",
          name: "Easter Egg Hunter",
          description: "Encontre um segredo escondido na plataforma",
          icon: getIconForCategory("special"),
          color: "text-teal",
          requirement: 1,
          type: "special_event",
          category: "special",
          points_reward: 500,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440061",
          name: "Evento de Halloween",
          description: "Participe do evento especial de Halloween",
          icon: getIconForCategory("special"),
          color: "text-orange-500",
          requirement: 1,
          type: "special_event",
          category: "special",
          points_reward: 800,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440062",
          name: "Evento de Natal",
          description: "Participe do evento especial de Natal",
          icon: getIconForCategory("special"),
          color: "text-green-500",
          requirement: 1,
          type: "special_event",
          category: "special",
          points_reward: 800,
          rarity: "gold",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440063",
          name: "Beta Tester Original",
          description: "Faça parte do grupo original de beta testers",
          icon: getIconForCategory("special"),
          color: "text-primary",
          requirement: 1,
          type: "special_event",
          category: "special",
          points_reward: 1500,
          rarity: "platinum",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440064",
          name: "Primeiro Premium",
          description: "Ative sua primeira assinatura premium",
          icon: getIconForCategory("special"),
          color: "text-yellow-500",
          requirement: 1,
          type: "first_premium",
          category: "special",
          points_reward: 2000,
          rarity: "diamond",
        },
      ];

      setBadges(defaultBadges);
    } catch (error) {
      console.error('Error loading achievement templates:', error);
    }
  };

  const loadUserAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading achievements:', error);
        setUserAchievements([]);
        setLoading(false);
        return;
      }

      const achievements = data?.map(achievement => ({
        badgeId: achievement.achievement_template_id,
        unlockedAt: new Date(achievement.unlocked_at),
        isNew: achievement.is_new
      })) || [];

      setUserAchievements(achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
      setUserAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    if (!user || !profile) return;

    const currentStats = {
      streak: profile.streak_count || 0,
      sentences: getMasteredCount(),
      points: profile.points || 0,
      dailyGoalDays: getDailyGoalStreak(),
      wordsLearned: profile.total_phrases_learned || 0,
      proficiencyLevel: profile.proficiency_level || null,
    };

    const newlyUnlocked: Badge[] = [];

    for (const badge of badges) {
      const isAlreadyUnlocked = userAchievements.some((ua) => ua.badgeId === badge.id);
      if (isAlreadyUnlocked) continue;

      let shouldUnlock = false;

      switch (badge.type) {
        case 'streak_days':
          shouldUnlock = currentStats.streak >= badge.requirement;
          break;
        case 'phrases_mastered':
        case 'sentences_mastered':
          shouldUnlock = currentStats.sentences >= badge.requirement;
          break;
        case 'daily_goal':
          shouldUnlock = currentStats.dailyGoalDays >= badge.requirement;
          break;
        case 'lessons_completed':
          // Aproximação: assume ~5 frases por lição
          shouldUnlock = currentStats.sentences >= badge.requirement * 5;
          break;
        case 'words_learned':
          shouldUnlock = currentStats.wordsLearned >= badge.requirement;
          break;
        case 'level_b1':
          shouldUnlock = currentStats.proficiencyLevel === 'B1' || currentStats.proficiencyLevel === 'B2' || currentStats.proficiencyLevel === 'C1' || currentStats.proficiencyLevel === 'C2';
          break;
        case 'level_c2':
          shouldUnlock = currentStats.proficiencyLevel === 'C2';
          break;
        // Tipos dependentes de sistemas futuros (batalhas, social, eventos) são
        // desbloqueados manualmente via triggerSpecialAchievement ou lógica dedicada.
        default:
          shouldUnlock = false;
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(badge);
        newlyUnlocked.push(badge);
      }
    }

    if (newlyUnlocked.length > 0) {
      setNewBadges(newlyUnlocked);
      // Apenas popup de celebração – sem toasts duplicados
    }
  };

  const unlockAchievement = async (badge: Badge) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          achievement_template_id: badge.id,
          unlocked_at: new Date().toISOString(),
          is_new: true
        });

      if (error) {
        console.error('Error unlocking achievement:', error);
        // Still add locally for now
      }

      const newAchievement: UserAchievement = {
        badgeId: badge.id,
        unlockedAt: new Date(),
        isNew: true
      };
      
      setUserAchievements(prev => [...prev, newAchievement]);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      // Still add locally since the database might not have the proper schema
      const newAchievement: UserAchievement = {
        badgeId: badge.id,
        unlockedAt: new Date(),
        isNew: true
      };
      
      setUserAchievements(prev => [...prev, newAchievement]);
    }
  };

  const getDailyGoalStreak = (): number => {
    if (!dailyActivities || dailyActivities.length === 0) return 0;
    
    // Calculate consecutive days where daily goal was met
    let streak = 0;
    const sortedActivities = [...dailyActivities].sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    );

    for (const activity of sortedActivities) {
      if (activity.sentences_practiced >= (profile?.daily_goal || 5)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Method to trigger special achievements manually
  const triggerSpecialAchievement = async (badgeId: string) => {
    const badge = badges.find(b => b.id === badgeId);
    if (!badge || userAchievements.some(ua => ua.badgeId === badgeId)) return;

    await unlockAchievement(badge);
    setNewBadges([badge]);
    toast({
      title: `🎉 Nova Conquista Desbloqueada!`,
      description: `${badge.name}: ${badge.description}`,
      duration: 5000,
    });
  };

  const getBadgeById = (id: string): Badge | undefined => {
    return badges.find(badge => badge.id === id);
  };

  const getUnlockedBadges = (): Badge[] => {
    const uniqueBadgeIds = [...new Set(userAchievements.map(ua => ua.badgeId))];
    return uniqueBadgeIds
      .map(badgeId => getBadgeById(badgeId))
      .filter(Boolean) as Badge[];
  };

  const getLockedBadges = (): Badge[] => {
    const unlockedIds = userAchievements.map(ua => ua.badgeId);
    return badges.filter(badge => !unlockedIds.includes(badge.id));
  };

  const getBadgeProgress = (badge: Badge): number => {
    const currentStats = {
      streak: profile?.streak_count || 0,
      sentences: getMasteredCount(),
      points: profile?.points || 0,
      wordsLearned: profile?.total_phrases_learned || 0,
    };

    switch (badge.type) {
      case 'streak_days':
        return Math.min((currentStats.streak / badge.requirement) * 100, 100);
      case 'phrases_mastered':
      case 'sentences_mastered':
      case 'lessons_completed':
        return Math.min((currentStats.sentences / (badge.type === 'lessons_completed' ? badge.requirement * 5 : badge.requirement)) * 100, 100);
      case 'words_learned':
        return Math.min((currentStats.wordsLearned / badge.requirement) * 100, 100);
      default:
        return 0;
    }
  };

  const dismissNewBadges = async () => {
    if (!user || newBadges.length === 0) return;

    // Mark badges as not new in database
    const newBadgeIds = newBadges.map(b => b.id);
    try {
      await supabase
        .from('achievements')
        .update({ is_new: false })
        .eq('user_id', user.id)
        .in('achievement_template_id', newBadgeIds);
    } catch (error) {
      console.error('Error updating achievements:', error);
    }

    setNewBadges([]);
    setUserAchievements(prev => 
      prev.map(ua => ({ ...ua, isNew: false }))
    );
  };

  return {
    badges,
    userAchievements,
    newBadges,
    loading,
    getUnlockedBadges,
    getLockedBadges,
    getBadgeProgress,
    getBadgeById,
    dismissNewBadges,
    triggerSpecialAchievement,
    totalBadges: badges.length,
    unlockedCount: userAchievements.length
  };
};