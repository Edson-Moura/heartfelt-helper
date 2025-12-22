import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { gamificationEngine, type Streak } from "@/services/GamificationEngine";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UserGamification {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freezes_available: number;
  streak_freezes_used: number;
  total_xp: number;
  current_level: number;
  weekly_xp: number;
  monthly_xp: number;
  gems: number;
}

export const useGamification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: gamification,
    isLoading,
    isError,
  } = useQuery<UserGamification | null>({
    queryKey: ["gamification", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) return data as UserGamification;

      const { data: inserted, error: insertError } = await supabase
        .from("user_gamification")
        .insert({ user_id: user.id })
        .select("*")
        .single();

      if (insertError) throw insertError;
      return inserted as UserGamification;
    },
  });

  const streakMutation = useMutation<Streak | null, unknown, void>({
    mutationFn: async () => {
      if (!user) return null;
      return gamificationEngine.updateStreak(user.id);
    },
    onSuccess: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ["gamification", user.id] });
    },
  });

  const streakFreezeMutation = useMutation<void, unknown, void>({
    mutationFn: async () => {
      if (!user) return;
      await gamificationEngine.useStreakFreeze(user.id);
    },
    onSuccess: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ["gamification", user.id] });
    },
  });

  return {
    gamification,
    loading: isLoading,
    error: isError,
    updateStreak: () => streakMutation.mutateAsync(),
    useStreakFreeze: () => streakFreezeMutation.mutateAsync(),
    updatingStreak: streakMutation.isPending,
    freezingStreak: streakFreezeMutation.isPending,
    refetch: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ["gamification", user.id] });
    },
  };
};
