import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { gamificationEngine } from "@/services/GamificationEngine";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      // Carrega nível do usuário para personalizar e equilibrar os desafios
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("level, proficiency_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao carregar perfil para desafios diários:", profileError);
      }

      const normalizeTag = (value?: string | null) =>
        (value ?? "").toString().trim().toLowerCase();

      const levelTag = normalizeTag(profile?.level);
      const proficiencyTag = normalizeTag(profile?.proficiency_level);
      const userLevelTag = proficiencyTag || levelTag;

      // Mapeia nível/proficiência (A1/A2/B1/B2...) para grupos de dificuldade
      const getDifficultyGroup = (tag: string): "beginner" | "intermediate" | "advanced" | "" => {
        if (!tag) return "";
        if (["a1", "a2", "beginner"].includes(tag)) return "beginner";
        if (["b1", "b2", "intermediate"].includes(tag)) return "intermediate";
        if (["c1", "c2", "advanced"].includes(tag)) return "advanced";
        return "";
      };

      const difficultyGroup = getDifficultyGroup(userLevelTag);

      // Evita repetir o mesmo template nos últimos 3 dias
      const cooldownDays = 3;
      const cooldownStartDate = new Date();
      cooldownStartDate.setDate(cooldownStartDate.getDate() - cooldownDays);
      const cooldownStart = cooldownStartDate.toISOString().split("T")[0];

      const { data: recentUserChallenges, error: recentError } = await supabase
        .from("user_daily_challenges")
        .select("challenge_id, challenge_date")
        .eq("user_id", user.id)
        .gte("challenge_date", cooldownStart);

      if (recentError) {
        console.error("Erro ao carregar desafios recentes do usuário:", recentError);
      }

      const recentChallengeIds = new Set(
        (recentUserChallenges || []).map((c: any) => c.challenge_id)
      );

      // Garante que o usuário tenha desafios de hoje
      const { data: templates, error: templatesError } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("is_active", true);

      if (templatesError) {
        console.error("Erro ao carregar desafios base:", templatesError);
      } else if (templates && templates.length) {
        // Aplica cooldown de templates
        let baseTemplates = (templates as DailyChallenge[]).filter(
          (t) => !recentChallengeIds.has(t.id)
        );

        // Se o cooldown filtrar tudo, volta a considerar todos os templates ativos
        if (!baseTemplates.length) {
          baseTemplates = templates as DailyChallenge[];
        }

        const beginner = baseTemplates.filter(
          (c) => (c.difficulty || "").toLowerCase() === "beginner"
        );
        const intermediate = baseTemplates.filter(
          (c) => (c.difficulty || "").toLowerCase() === "intermediate"
        );
        const advanced = baseTemplates.filter(
          (c) => (c.difficulty || "").toLowerCase() === "advanced"
        );

        let easyPool: DailyChallenge[] = [];
        let mediumPool: DailyChallenge[] = [];
        let hardPool: DailyChallenge[] = [];

        // "Pacote diário": 1 fácil, 1 médio, 1 difícil relativo ao nível do usuário
        switch (difficultyGroup) {
          case "beginner":
            easyPool = beginner.length ? beginner : baseTemplates;
            mediumPool = intermediate.length ? intermediate : baseTemplates;
            hardPool = advanced.length
              ? advanced
              : intermediate.length
                ? intermediate
                : baseTemplates;
            break;
          case "intermediate":
            easyPool = beginner.length ? beginner : baseTemplates;
            mediumPool = intermediate.length ? intermediate : baseTemplates;
            hardPool = advanced.length ? advanced : intermediate.length
              ? intermediate
              : baseTemplates;
            break;
          case "advanced":
            easyPool = intermediate.length ? intermediate : baseTemplates;
            mediumPool = advanced.length ? advanced : baseTemplates;
            hardPool = advanced.length ? advanced : baseTemplates;
            break;
          default:
            // Sem nível definido: usa distribuição equilibrada com fallback
            easyPool = beginner.length ? beginner : baseTemplates;
            mediumPool = intermediate.length ? intermediate : baseTemplates;
            hardPool = advanced.length
              ? advanced
              : intermediate.length
                ? intermediate
                : baseTemplates;
            break;
        }

        const usedTemplateIds = new Set<string>();

        const pickChallenge = (
          pools: DailyChallenge[][],
          type: ChallengeType
        ): DailyChallenge | null => {
          for (const pool of pools) {
            const found = pool.find(
              (c) => c.challenge_type === type && !usedTemplateIds.has(c.id)
            );
            if (found) {
              usedTemplateIds.add(found.id);
              return found;
            }
          }
          return null;
        };

        const main =
          pickChallenge([hardPool, mediumPool, easyPool, baseTemplates], "main") ||
          undefined;
        const secondary =
          pickChallenge([mediumPool, easyPool, hardPool, baseTemplates], "secondary") ||
          undefined;
        const bonus =
          pickChallenge([easyPool, mediumPool, hardPool, baseTemplates], "bonus") ||
          undefined;

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

    try {
      // Marca como concluído no banco
      const { error: updateError } = await supabase
        .from("user_daily_challenges")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", userChallengeId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Erro ao completar desafio:", updateError);
        toast({
          title: "Não foi possível concluir o desafio",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
        return;
      }

      // Busca recompensas do desafio concluído
      const { data, error: fetchError } = await supabase
        .from("user_daily_challenges")
        .select(
          `completed, daily_challenges!inner (title, xp_reward, gems_reward)`
        )
        .eq("id", userChallengeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Erro ao buscar desafio concluído:", fetchError);
      } else if (data?.completed && data.daily_challenges) {
        const xp = data.daily_challenges.xp_reward ?? 0;
        const gems = data.daily_challenges.gems_reward ?? 0;

        try {
          if (xp > 0) {
            await gamificationEngine.addXP(user.id, xp, "daily_challenge_complete");
          }
          if (gems > 0) {
            await gamificationEngine.addGems(user.id, gems, "daily_challenge_complete");
          }

          if (xp > 0 || gems > 0) {
            const parts = [] as string[];
            if (xp > 0) parts.push(`${xp} XP`);
            if (gems > 0) parts.push(`${gems} gems`);

            toast({
              title: "Desafio concluído!",
              description: `Você ganhou ${parts.join(" e ")}.`,
            });
          }
        } catch (rewardError) {
          console.error("Erro ao aplicar recompensas do desafio:", rewardError);
          toast({
            title: "Desafio concluído, mas houve um erro nas recompensas",
            description: "Seu progresso foi salvo, tente atualizar a página.",
            variant: "destructive",
          });
        }
      }
    } finally {
      await loadTodayChallenges();
    }
  };

  return {
    challenges,
    loading,
    reload: loadTodayChallenges,
    completeChallenge,
  };
};
