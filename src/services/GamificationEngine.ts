import { supabase } from "@/integrations/supabase/client";

export interface Streak {
  current: number;
  longest: number;
  lastActivityDate: string | null;
}

export interface Reward {
  type: "xp" | "gems" | "item";
  amount: number;
  description?: string;
}

export interface Challenge {
  id: string;
  title: string;
  type: string;
  progress: number;
  target: number;
  xpReward?: number | null;
  gemsReward?: number | null;
}

export interface Battle {
  id: string;
  player1_id: string;
  player2_id: string;
  battle_type: string;
  status: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  total_xp: number;
  current_level: number;
  current_streak: number;
}

/**
 * GamificationEngine centraliza toda a lógica de XP, streaks, gems e desafios
 * usando as tabelas do Supabase (profiles, user_gamification, daily_challenges, user_daily_challenges, battles, events).
 */
class GamificationEngine {
  private lastLevelUp = new Map<string, boolean>();

  // Helpers
  private async getOrCreateGamificationRow(userId: string) {
    const { data, error } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
      .from("user_gamification")
      .insert({ user_id: userId })
      .select("*")
      .single();

    if (insertError) throw insertError;
    return inserted;
  }

  private async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Perfil não encontrado para o usuário");
    return data;
  }

  // XP & Levels
  async addXP(userId: string, amount: number, _source: string): Promise<void> {
    if (amount <= 0) return;

    const profile = await this.getProfile(userId);
    const currentXP = profile.current_xp ?? 0;
    const newTotalXP = currentXP + amount;

    const newLevel = await this.calculateLevel(newTotalXP);
    const leveledUp = (profile.current_level ?? 1) < newLevel;
    this.lastLevelUp.set(userId, leveledUp);

    // Atualiza perfil (fonte primária de XP/nível usada no app hoje)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        current_xp: newTotalXP,
        current_level: newLevel,
        points: (profile.points ?? 0) + amount,
      })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    // Atualiza tabela agregada de gamificação
    const gamification = await this.getOrCreateGamificationRow(userId);
    const { error: gamificationError } = await supabase
      .from("user_gamification")
      .update({
        total_xp: (gamification.total_xp ?? 0) + amount,
        current_level: newLevel,
        weekly_xp: (gamification.weekly_xp ?? 0) + amount,
        monthly_xp: (gamification.monthly_xp ?? 0) + amount,
      })
      .eq("user_id", userId);

    if (gamificationError) throw gamificationError;
  }

  async calculateLevel(totalXP: number): Promise<number> {
    const { data, error } = await supabase.rpc("calculate_level", { xp: totalXP });
    if (error) {
      // Fallback simples caso a função RPC falhe por algum motivo
      if (totalXP < 100) return 1;
      if (totalXP < 250) return 2;
      if (totalXP < 500) return 3;
      if (totalXP < 1000) return 4;
      if (totalXP < 2000) return 5;
      if (totalXP < 3500) return 6;
      if (totalXP < 5000) return 7;
      if (totalXP < 7500) return 8;
      if (totalXP < 10000) return 9;
      if (totalXP < 15000) return 10;
      return 10 + Math.floor((totalXP - 15000) / 5000);
    }
    return data as number;
  }

  async checkLevelUp(userId: string): Promise<boolean> {
    const leveledUp = this.lastLevelUp.get(userId) ?? false;
    this.lastLevelUp.delete(userId);
    return leveledUp;
  }

  // Streaks
  async updateStreak(userId: string): Promise<Streak> {
    const profile = await this.getProfile(userId);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const lastActivity = profile.last_activity as string | null;
    const currentStreak = profile.streak_count ?? 0;

    let newStreak = currentStreak || 0;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const last = new Date(lastActivity);
      const diffDays = Math.floor(
        (today.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        newStreak = currentStreak || 1;
      } else if (diffDays === 1) {
        newStreak = (currentStreak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        streak_count: newStreak,
        last_activity: todayStr,
      })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    const gamification = await this.getOrCreateGamificationRow(userId);
    const newLongest = Math.max(gamification.longest_streak ?? 0, newStreak);

    const { error: gamificationError } = await supabase
      .from("user_gamification")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: todayStr,
      })
      .eq("user_id", userId);

    if (gamificationError) throw gamificationError;

    return {
      current: newStreak,
      longest: newLongest,
      lastActivityDate: todayStr,
    };
  }

  async useStreakFreeze(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);
    const available = profile.streak_freezes_available ?? 1;
    if (available <= 0) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ streak_freezes_available: available - 1 })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    const gamification = await this.getOrCreateGamificationRow(userId);
    const { error: gamificationError } = await supabase
      .from("user_gamification")
      .update({
        streak_freezes_available: (gamification.streak_freezes_available ?? 1) - 1,
        streak_freezes_used: (gamification.streak_freezes_used ?? 0) + 1,
      })
      .eq("user_id", userId);

    if (gamificationError) throw gamificationError;
  }

  async checkStreakMilestone(streak: number): Promise<Reward | null> {
    if (streak === 7) return { type: "gems", amount: 20, description: "Streak de 7 dias" };
    if (streak === 30) return { type: "gems", amount: 50, description: "Streak de 30 dias" };
    if (streak === 100) return { type: "gems", amount: 100, description: "Streak de 100 dias" };
    return null;
  }

  // Desafios
  async generateDailyChallenges(_userId: string): Promise<Challenge[]> {
    // A geração real já é tratada via tabelas daily_challenges e user_daily_challenges.
    // Aqui retornamos os desafios atuais do usuário para integração futura.
    const { data, error } = await supabase
      .from("user_daily_challenges")
      .select(
        "id, progress, challenge_id, challenge:daily_challenges(title, challenge_type, requirement_value, xp_reward, gems_reward)"
      );

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.challenge.title,
      type: row.challenge.challenge_type,
      progress: row.progress ?? 0,
      target: row.challenge.requirement_value,
      xpReward: row.challenge.xp_reward,
      gemsReward: row.challenge.gems_reward,
    }));
  }

  async updateChallengeProgress(
    userId: string,
    challengeKey: string,
    progressDelta: number
  ): Promise<void> {
    if (progressDelta <= 0) return;

    // Interpreta challengeKey como o tipo de desafio (ex: "daily_lessons")
    const { data: challenge, error: challengeError } = await supabase
      .from("daily_challenges")
      .select("id")
      .eq("challenge_type", challengeKey)
      .eq("is_active", true)
      .maybeSingle();

    if (challengeError) throw challengeError;
    if (!challenge) return; // Nenhum desafio desse tipo hoje

    const today = new Date().toISOString().split("T")[0];

    // Busca ou cria o registro de progresso do usuário para esse desafio e dia
    const { data: userChallenge, error: userChallengeError } = await supabase
      .from("user_daily_challenges")
      .select("id, progress")
      .eq("user_id", userId)
      .eq("challenge_id", challenge.id)
      .eq("challenge_date", today)
      .maybeSingle();

    if (userChallengeError) throw userChallengeError;

    if (!userChallenge) {
      const { error: insertError } = await supabase
        .from("user_daily_challenges")
        .insert({
          user_id: userId,
          challenge_id: challenge.id,
          challenge_date: today,
          progress: progressDelta,
        });

      if (insertError) throw insertError;
      return;
    }

    const { error: updateError } = await supabase
      .from("user_daily_challenges")
      .update({ progress: (userChallenge.progress ?? 0) + progressDelta })
      .eq("id", userChallenge.id);

    if (updateError) throw updateError;
  }

  // Batalhas (placeholders para implementação futura)
  async createBattle(_player1: string, _player2: string, _type: string): Promise<Battle> {
    throw new Error("createBattle ainda não implementado");
  }

  async submitBattleAnswer(_battleId: string, _playerId: string, _answer: any): Promise<void> {
    throw new Error("submitBattleAnswer ainda não implementado");
  }

  async completeBattle(_battleId: string): Promise<{ winner: string; rewards: Reward }> {
    throw new Error("completeBattle ainda não implementado");
  }

  // Gems
  async addGems(userId: string, amount: number, _source: string): Promise<void> {
    if (amount <= 0) return;

    const profile = await this.getProfile(userId);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ gems: (profile.gems ?? 0) + amount })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    const gamification = await this.getOrCreateGamificationRow(userId);
    const { error: gamificationError } = await supabase
      .from("user_gamification")
      .update({ gems: (gamification.gems ?? 0) + amount })
      .eq("user_id", userId);

    if (gamificationError) throw gamificationError;
  }

  async purchaseItem(_userId: string, _itemId: string): Promise<void> {
    throw new Error("purchaseItem ainda não implementado");
  }

  // Leaderboards (esqueleto para futura implementação real)
  async getLeaderboard(_type: "global" | "friends" | "weekly", _limit: number): Promise<LeaderboardEntry[]> {
    throw new Error("getLeaderboard ainda não implementado");
  }

  async getUserRank(_userId: string, _type: string): Promise<number> {
    throw new Error("getUserRank ainda não implementado");
  }
}

export const gamificationEngine = new GamificationEngine();

export { GamificationEngine };
