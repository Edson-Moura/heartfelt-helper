import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ChallengeType = "main" | "secondary" | "bonus";

export interface DailyChallenge {
  id: string;
  challenge_type: ChallengeType;
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  gems_reward: number;
  difficulty: string;
  icon?: string | null;
}

export interface UserDailyChallenge {
  id: string;
  challenge_id: string;
  challenge_date: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  challenge: DailyChallenge;
}

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<UserDailyChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodayChallenges();
    } else {
      setChallenges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadTodayChallenges = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      // Garantir que o usuário tenha desafios de hoje
      const { data: templates, error: templatesError } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("is_active", true);

      if (templatesError) {
        console.error("Erro ao carregar desafios base:", templatesError);
      } else if (templates && templates.length) {
        const main = templates.find((c) => c.challenge_type === "main");
        const secondary = templates.find((c) => c.challenge_type === "secondary");
        const bonus = templates.find((c) => c.challenge_type === "bonus");

        const selected = [main, secondary, bonus].filter(Boolean) as DailyChallenge[];

        for (const challenge of selected) {
          await supabase
            .from("user_daily_challenges")
            .upsert(
              {
                user_id: user.id,
                challenge_id: challenge.id,
                challenge_date: today,
              },
              { onConflict: "user_id,challenge_id,challenge_date" }
            );
        }
      }

      const { data, error } = await supabase
        .from("user_daily_challenges")
        .select(
          `id, challenge_id, challenge_date, progress, completed, completed_at, 
           daily_challenges!inner (id, challenge_type, title, description, requirement_type, requirement_value, xp_reward, gems_reward, difficulty, icon)`
        )
        .eq("user_id", user.id)
        .eq("challenge_date", today);

      if (error) {
        console.error("Erro ao carregar desafios do usuário:", error);
        setChallenges([]);
      } else {
        const mapped: UserDailyChallenge[] = (data || []).map((row: any) => ({
          id: row.id,
          challenge_id: row.challenge_id,
          challenge_date: row.challenge_date,
          progress: row.progress,
          completed: row.completed,
          completed_at: row.completed_at,
          challenge: {
            id: row.daily_challenges.id,
            challenge_type: row.daily_challenges.challenge_type,
            title: row.daily_challenges.title,
            description: row.daily_challenges.description,
            requirement_type: row.daily_challenges.requirement_type,
            requirement_value: row.daily_challenges.requirement_value,
            xp_reward: row.daily_challenges.xp_reward,
            gems_reward: row.daily_challenges.gems_reward,
            difficulty: row.daily_challenges.difficulty,
            icon: row.daily_challenges.icon,
          },
        }));
        setChallenges(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async (userChallengeId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_daily_challenges")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", userChallengeId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao completar desafio:", error);
      return;
    }

    await loadTodayChallenges();
  };

  return {
    challenges,
    loading,
    reload: loadTodayChallenges,
    completeChallenge,
  };
};
