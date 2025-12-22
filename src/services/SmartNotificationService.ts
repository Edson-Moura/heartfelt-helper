import { sendNotification } from "@/lib/notifications";

const QUIET_HOURS_START = 22; // 22h
const QUIET_HOURS_END = 7; // 7h
const MAX_NOTIFICATIONS_PER_DAY = 3;

export type SmartNotificationKind =
  | "streak_in_danger"
  | "daily_challenge"
  | "friend_active"
  | "battle_request"
  | "milestone_near"
  | "reengagement";

interface CanSendOptions {
  userId: string;
  kind: SmartNotificationKind;
  now?: Date;
}

const getDailyKey = (userId: string, date: string) =>
  `smartNotif_${userId}_${date}`;

const isQuietHours = (date: Date) => {
  const hour = date.getHours();
  if (QUIET_HOURS_START > QUIET_HOURS_END) {
    // Intervalo que atravessa a meia-noite
    return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
  }
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;
};

const canSendNotification = ({ userId, kind, now = new Date() }: CanSendOptions) => {
  if (isQuietHours(now)) return false;

  const today = now.toDateString();
  const key = getDailyKey(userId, today);
  const stored = localStorage.getItem(key);

  if (!stored) {
    localStorage.setItem(
      key,
      JSON.stringify({ count: 1, kinds: [kind], lastSentAt: now.toISOString() }),
    );
    return true;
  }

  try {
    const parsed = JSON.parse(stored) as {
      count: number;
      kinds: SmartNotificationKind[];
      lastSentAt: string;
    };

    if (parsed.count >= MAX_NOTIFICATIONS_PER_DAY) return false;

    const updated = {
      count: parsed.count + 1,
      kinds: [...parsed.kinds, kind],
      lastSentAt: now.toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch {
    localStorage.setItem(
      key,
      JSON.stringify({ count: 1, kinds: [kind], lastSentAt: now.toISOString() }),
    );
    return true;
  }
};

export const SmartNotificationService = {
  async notifyStreakInDanger(userId: string, streakCount: number, hoursToMidnight: number) {
    const now = new Date();
    if (hoursToMidnight > 2 || hoursToMidnight <= 0) return;
    if (!canSendNotification({ userId, kind: "streak_in_danger", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "streak_reminder",
      title: `🔥 Sua sequência está em perigo!`,
      body: `Sua sequência de ${streakCount} dias vai quebrar em ${Math.max(
        1,
        Math.round(hoursToMidnight),
      )}h. Pratique agora para manter o fogo aceso!`,
      metadata: { streakCount, hoursToMidnight },
    });
  },

  async notifyDailyChallenge(userId: string, preferredHour: number = 9) {
    const now = new Date();
    if (now.getHours() !== preferredHour) return;
    if (!canSendNotification({ userId, kind: "daily_challenge", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "daily_goal",
      title: "🎯 Novos desafios disponíveis!",
      body: "Complete os desafios de hoje e ganhe XP extra para acelerar seu progresso.",
      metadata: { preferredHour },
    });
  },

  async notifyFriendActive(userId: string, friendName: string) {
    const now = new Date();
    if (!canSendNotification({ userId, kind: "friend_active", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "lesson_reminder",
      title: "👥 Seu amigo está estudando agora!",
      body: `${friendName} acabou de completar uma lição. Entre e mostre que você também consegue!`,
      metadata: { friendName },
    });
  },

  async notifyBattleRequest(userId: string, challengerName: string) {
    const now = new Date();
    if (!canSendNotification({ userId, kind: "battle_request", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "achievement",
      title: "⚔️ Novo desafio de batalha!",
      body: `${challengerName} te desafiou! Aceite nos próximos 30 minutos e mostre suas habilidades.`,
      metadata: { challengerName },
    });
  },

  async notifyMilestoneNear(userId: string, currentLevel: number, lessonsToNext: number) {
    if (lessonsToNext > 3) return;
    const now = new Date();
    if (!canSendNotification({ userId, kind: "milestone_near", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "achievement",
      title: "📊 Você está perto de um marco!",
      body: `Faltam apenas ${lessonsToNext} lições para você alcançar o Nível ${
        currentLevel + 1
      }!`,
      metadata: { currentLevel, lessonsToNext },
    });
  },

  async notifyReengagement(userId: string, daysInactive: number) {
    if (daysInactive < 3) return;
    const now = new Date();
    if (!canSendNotification({ userId, kind: "reengagement", now })) return;

    await sendNotification({
      userId,
      type: "both",
      category: "weekly_summary",
      title: "😢 Sentimos sua falta!",
      body: "Volte hoje e ganhe 100 XP de bônus no seu primeiro treino do dia.",
      metadata: { daysInactive },
    });
  },
};
