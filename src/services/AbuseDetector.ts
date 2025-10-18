/**
 * AbuseDetector - Detecção de padrões suspeitos e prevenção de abuso
 * Detecta comportamentos anormais e protege contra uso malicioso
 */

import { logger } from '@/lib/logger';
import { metricsCollector } from './MetricsCollector';

type ActionType = 
  | 'api_call' 
  | 'login' 
  | 'signup' 
  | 'password_reset' 
  | 'lesson_access'
  | 'audio_upload'
  | 'chat_message';

interface ActionRecord {
  userId: string | null;
  action: ActionType;
  timestamp: number;
  metadata?: Record<string, any>;
  ipHash?: string; // Hash do IP para privacidade
  userAgent?: string;
}

interface UserPattern {
  userId: string;
  totalActions: number;
  actionsPerMinute: number;
  consecutiveFailures: number;
  uniqueIPs: Set<string>;
  actionIntervals: number[]; // Intervalos entre ações em ms
  suspicionScore: number;
  lastThrottled: number;
  isThrottled: boolean;
}

interface AnomalyReport {
  userId: string;
  suspicionScore: number;
  reasons: string[];
  actionsTaken: string[];
  timestamp: number;
}

class AbuseDetectorService {
  private actions: Map<string, ActionRecord[]> = new Map();
  private patterns: Map<string, UserPattern> = new Map();
  private throttledUsers: Set<string> = new Set();
  private anomalyReports: AnomalyReport[] = [];

  // Configurações de detecção
  private readonly MAX_ACTIONS_PER_MINUTE = 30;
  private readonly MAX_FAILURES_CONSECUTIVE = 5;
  private readonly BOT_PATTERN_THRESHOLD = 0.9; // Regularidade das ações
  private readonly SUSPICION_THRESHOLD = 0.7;
  private readonly THROTTLE_DURATION = 300000; // 5 minutos
  private readonly ACTION_WINDOW = 3600000; // 1 hora
  private readonly MAX_STORED_ACTIONS = 1000;

  constructor() {
    this.loadFromStorage();
    this.startCleanup();
  }

  /**
   * Registra uma ação do usuário
   */
  recordAction(
    userId: string | null,
    action: ActionType,
    metadata?: Record<string, any>
  ): void {
    // Gera hash simples do IP (se disponível no metadata)
    const ipHash = metadata?.ip ? this.hashString(metadata.ip) : undefined;
    
    const record: ActionRecord = {
      userId: userId || 'anonymous',
      action,
      timestamp: Date.now(),
      metadata,
      ipHash,
      userAgent: navigator.userAgent
    };

    const key = record.userId;
    const userActions = this.actions.get(key) || [];
    userActions.push(record);
    this.actions.set(key, userActions);

    // Atualiza padrão do usuário
    this.updateUserPattern(key, userActions);

    // Limpa ações antigas
    this.trimOldActions();
    this.saveToStorage();

    logger.debug('Action recorded', {
      userId: key,
      action,
      suspicionScore: this.patterns.get(key)?.suspicionScore || 0
    }, 'AbuseDetector');
  }

  /**
   * Verifica se uma ação pode ser executada
   */
  canPerformAction(userId: string | null, action: ActionType): boolean {
    const key = userId || 'anonymous';

    // Verifica se está throttled
    if (this.isUserThrottled(key)) {
      logger.warn('Action blocked - user throttled', { userId: key, action }, 'AbuseDetector');
      return false;
    }

    const pattern = this.patterns.get(key);
    if (!pattern) return true;

    // Verifica rate limit
    if (pattern.actionsPerMinute > this.MAX_ACTIONS_PER_MINUTE) {
      this.throttleUser(key, 'rate_limit_exceeded');
      return false;
    }

    // Verifica score de suspeita
    if (pattern.suspicionScore > this.SUSPICION_THRESHOLD) {
      this.throttleUser(key, 'high_suspicion_score');
      return false;
    }

    return true;
  }

  /**
   * Verifica se o usuário está throttled
   */
  isUserThrottled(userId: string): boolean {
    const pattern = this.patterns.get(userId);
    if (!pattern || !pattern.isThrottled) return false;

    const now = Date.now();
    const throttleEnd = pattern.lastThrottled + this.THROTTLE_DURATION;

    if (now > throttleEnd) {
      // Throttle expirado
      pattern.isThrottled = false;
      this.throttledUsers.delete(userId);
      logger.info('User throttle expired', { userId }, 'AbuseDetector');
      return false;
    }

    return true;
  }

  /**
   * Analisa padrão do usuário e detecta anomalias
   */
  async detectAnomaly(userId: string): Promise<AnomalyReport | null> {
    const pattern = this.patterns.get(userId);
    if (!pattern) return null;

    const reasons: string[] = [];
    let suspicionScore = 0;

    // 1. Rate excessivo
    if (pattern.actionsPerMinute > this.MAX_ACTIONS_PER_MINUTE * 0.8) {
      reasons.push(`High action rate: ${pattern.actionsPerMinute.toFixed(1)}/min`);
      suspicionScore += 0.3;
    }

    // 2. Múltiplos IPs
    if (pattern.uniqueIPs.size > 3) {
      reasons.push(`Multiple IPs: ${pattern.uniqueIPs.size}`);
      suspicionScore += 0.2;
    }

    // 3. Padrão de bot (intervalos muito regulares)
    const botScore = this.detectBotPattern(pattern.actionIntervals);
    if (botScore > this.BOT_PATTERN_THRESHOLD) {
      reasons.push(`Bot-like pattern detected: ${(botScore * 100).toFixed(0)}%`);
      suspicionScore += 0.3;
    }

    // 4. Falhas consecutivas
    if (pattern.consecutiveFailures >= this.MAX_FAILURES_CONSECUTIVE) {
      reasons.push(`Consecutive failures: ${pattern.consecutiveFailures}`);
      suspicionScore += 0.2;
    }

    // 5. User agent suspeito
    const userActions = this.actions.get(userId) || [];
    const latestAction = userActions[userActions.length - 1];
    if (latestAction?.userAgent && this.isSuspiciousUserAgent(latestAction.userAgent)) {
      reasons.push('Suspicious user agent');
      suspicionScore += 0.15;
    }

    // Atualiza score no padrão
    pattern.suspicionScore = Math.min(suspicionScore, 1);

    if (suspicionScore > this.SUSPICION_THRESHOLD) {
      const report: AnomalyReport = {
        userId,
        suspicionScore,
        reasons,
        actionsTaken: [],
        timestamp: Date.now()
      };

      // Throttle automático
      if (suspicionScore > 0.8) {
        this.throttleUser(userId, 'high_anomaly_score');
        report.actionsTaken.push('user_throttled');
      }

      // Notifica admins (em produção, enviar para serviço de alertas)
      this.notifyAdmins(report);
      
      this.anomalyReports.push(report);
      this.saveToStorage();

      logger.error('Anomaly detected', {
        userId,
        suspicionScore,
        reasons
      }, 'AbuseDetector');

      return report;
    }

    return null;
  }

  /**
   * Detecta padrão de bot baseado em intervalos regulares
   */
  private detectBotPattern(intervals: number[]): number {
    if (intervals.length < 5) return 0;

    // Calcula variância dos intervalos
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variação (menor = mais regular = mais suspeito)
    const cv = stdDev / mean;

    // Score inversamente proporcional ao coeficiente de variação
    // CV < 0.2 = muito regular (bot)
    // CV > 1.0 = muito irregular (humano)
    if (cv < 0.2) return 1;
    if (cv > 1.0) return 0;
    
    return 1 - cv;
  }

  /**
   * Verifica se user agent é suspeito
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
      'python', 'java', 'ruby', 'perl', 'php'
    ];
    
    const ua = userAgent.toLowerCase();
    return suspicious.some(term => ua.includes(term));
  }

  /**
   * Throttle de usuário
   */
  private throttleUser(userId: string, reason: string): void {
    const pattern = this.patterns.get(userId);
    if (!pattern) return;

    pattern.isThrottled = true;
    pattern.lastThrottled = Date.now();
    this.throttledUsers.add(userId);

    logger.warn('User throttled', { userId, reason }, 'AbuseDetector');

    metricsCollector.trackPerformance({
      operation: 'user_throttled',
      duration: 0,
      success: true,
      metadata: { userId, reason }
    });
  }

  /**
   * Remove throttle manualmente
   */
  unthrottleUser(userId: string): void {
    const pattern = this.patterns.get(userId);
    if (pattern) {
      pattern.isThrottled = false;
      this.throttledUsers.delete(userId);
      logger.info('User unthrottled', { userId }, 'AbuseDetector');
    }
  }

  /**
   * Atualiza padrão do usuário
   */
  private updateUserPattern(userId: string, actions: ActionRecord[]): void {
    const now = Date.now();
    const recentActions = actions.filter(a => now - a.timestamp < this.ACTION_WINDOW);

    // Calcula ações por minuto
    const windowMinutes = this.ACTION_WINDOW / 60000;
    const actionsPerMinute = recentActions.length / windowMinutes;

    // Conta IPs únicos
    const uniqueIPs = new Set(
      recentActions
        .filter(a => a.ipHash)
        .map(a => a.ipHash!)
    );

    // Calcula intervalos entre ações
    const intervals: number[] = [];
    for (let i = 1; i < recentActions.length; i++) {
      intervals.push(recentActions[i].timestamp - recentActions[i - 1].timestamp);
    }

    // Conta falhas consecutivas (metadata.success === false)
    let consecutiveFailures = 0;
    for (let i = recentActions.length - 1; i >= 0; i--) {
      if (recentActions[i].metadata?.success === false) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    const existingPattern = this.patterns.get(userId);
    const pattern: UserPattern = {
      userId,
      totalActions: recentActions.length,
      actionsPerMinute,
      consecutiveFailures,
      uniqueIPs,
      actionIntervals: intervals.slice(-20), // Últimos 20 intervalos
      suspicionScore: existingPattern?.suspicionScore || 0,
      lastThrottled: existingPattern?.lastThrottled || 0,
      isThrottled: existingPattern?.isThrottled || false
    };

    this.patterns.set(userId, pattern);
  }

  /**
   * Notifica admins sobre anomalia
   */
  private notifyAdmins(report: AnomalyReport): void {
    // Em produção, integrar com serviço de alertas (email, Slack, PagerDuty)
    logger.error('ADMIN ALERT: Anomaly detected', report, 'AbuseDetector');
    
    // TODO: Integrar com webhook ou serviço de notificação
    // await fetch('/api/admin/alert', { method: 'POST', body: JSON.stringify(report) });
  }

  /**
   * Obtém status de um usuário
   */
  getUserStatus(userId: string): {
    pattern: UserPattern | null;
    isThrottled: boolean;
    canPerformActions: boolean;
    recentAnomalies: AnomalyReport[];
  } {
    const pattern = this.patterns.get(userId) || null;
    const isThrottled = this.isUserThrottled(userId);
    const canPerformActions = !isThrottled && (pattern?.suspicionScore || 0) < this.SUSPICION_THRESHOLD;
    const recentAnomalies = this.anomalyReports.filter(r => r.userId === userId);

    return {
      pattern,
      isThrottled,
      canPerformActions,
      recentAnomalies
    };
  }

  /**
   * Obtém estatísticas gerais
   */
  getStatistics(): {
    totalUsers: number;
    throttledUsers: number;
    suspiciousUsers: number;
    totalAnomalies: number;
    actionsInLastHour: number;
  } {
    const now = Date.now();
    const hourAgo = now - this.ACTION_WINDOW;

    let actionsInLastHour = 0;
    this.actions.forEach(userActions => {
      actionsInLastHour += userActions.filter(a => a.timestamp > hourAgo).length;
    });

    const suspiciousUsers = Array.from(this.patterns.values())
      .filter(p => p.suspicionScore > this.SUSPICION_THRESHOLD).length;

    return {
      totalUsers: this.patterns.size,
      throttledUsers: this.throttledUsers.size,
      suspiciousUsers,
      totalAnomalies: this.anomalyReports.length,
      actionsInLastHour
    };
  }

  /**
   * Hash simples para IP (privacidade)
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Remove ações antigas
   */
  private trimOldActions(): void {
    const now = Date.now();
    const cutoff = now - this.ACTION_WINDOW;

    this.actions.forEach((actions, userId) => {
      const recentActions = actions
        .filter(a => a.timestamp > cutoff)
        .slice(-this.MAX_STORED_ACTIONS);
      
      if (recentActions.length === 0) {
        this.actions.delete(userId);
        this.patterns.delete(userId);
      } else {
        this.actions.set(userId, recentActions);
      }
    });

    // Remove anomalias antigas (mantém últimas 100)
    this.anomalyReports = this.anomalyReports
      .filter(r => now - r.timestamp < 86400000) // 24 horas
      .slice(-100);
  }

  /**
   * Limpeza periódica
   */
  private startCleanup(): void {
    setInterval(() => {
      this.trimOldActions();
      this.saveToStorage();
      
      // Verifica anomalias para todos os usuários ativos
      this.patterns.forEach(async (pattern) => {
        if (pattern.suspicionScore > 0.5) {
          await this.detectAnomaly(pattern.userId);
        }
      });
    }, 60000); // A cada minuto
  }

  /**
   * Salva no localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        actions: Array.from(this.actions.entries()).map(([userId, actions]) => ({
          userId,
          actions: actions.slice(-50) // Últimas 50 ações por usuário
        })),
        patterns: Array.from(this.patterns.entries()).map(([userId, pattern]) => ({
          userId,
          pattern: {
            ...pattern,
            uniqueIPs: Array.from(pattern.uniqueIPs)
          }
        })),
        throttledUsers: Array.from(this.throttledUsers),
        anomalyReports: this.anomalyReports.slice(-20)
      };
      
      localStorage.setItem('abuse-detector-data', JSON.stringify(data));
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Carrega do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('abuse-detector-data');
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.actions) {
          data.actions.forEach(({ userId, actions }: any) => {
            this.actions.set(userId, actions);
          });
        }

        if (data.patterns) {
          data.patterns.forEach(({ userId, pattern }: any) => {
            this.patterns.set(userId, {
              ...pattern,
              uniqueIPs: new Set(pattern.uniqueIPs)
            });
          });
        }

        if (data.throttledUsers) {
          this.throttledUsers = new Set(data.throttledUsers);
        }

        if (data.anomalyReports) {
          this.anomalyReports = data.anomalyReports;
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Limpa todos os dados
   */
  clearAll(): void {
    this.actions.clear();
    this.patterns.clear();
    this.throttledUsers.clear();
    this.anomalyReports = [];
    localStorage.removeItem('abuse-detector-data');
    logger.info('Abuse detector data cleared', undefined, 'AbuseDetector');
  }

  /**
   * Exporta dados para análise
   */
  export(): string {
    return JSON.stringify({
      statistics: this.getStatistics(),
      patterns: Array.from(this.patterns.entries()),
      anomalyReports: this.anomalyReports,
      throttledUsers: Array.from(this.throttledUsers)
    }, null, 2);
  }
}

// Singleton instance
export const abuseDetector = new AbuseDetectorService();
