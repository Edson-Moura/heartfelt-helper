/**
 * RateLimiter - Controle de taxa de requisições
 * Implementa sliding window algorithm para limitar chamadas por provider
 */

import { logger } from '@/lib/logger';
import { metricsCollector } from './MetricsCollector';
import { abuseDetector } from './AbuseDetector';

type Provider = 'nvidia' | 'elevenlabs' | 'did' | 'deepgram' | 'openai';
type PlanType = 'free' | 'premium' | 'enterprise';

interface RateLimitConfig {
  maxRequests: number; // Máximo de requisições
  windowMs: number; // Janela de tempo em ms
  burstLimit?: number; // Limite de burst (requisições em rajada)
  burstWindowMs?: number; // Janela de burst em ms
}

interface RateLimitStatus {
  provider: Provider;
  requestCount: number;
  burstCount: number;
  resetTime: number;
  burstResetTime: number;
  isLimited: boolean;
  remainingRequests: number;
}

interface RequestRecord {
  timestamp: number;
  provider: Provider;
}

// Configurações padrão por plano
const PLAN_CONFIGS: Record<PlanType, Record<Provider, RateLimitConfig>> = {
  free: {
    nvidia: { maxRequests: 20, windowMs: 60000, burstLimit: 5, burstWindowMs: 10000 }, // 20/min, burst 5/10s
    elevenlabs: { maxRequests: 10, windowMs: 60000, burstLimit: 3, burstWindowMs: 10000 }, // 10/min, burst 3/10s
    did: { maxRequests: 5, windowMs: 60000, burstLimit: 2, burstWindowMs: 10000 }, // 5/min, burst 2/10s
    deepgram: { maxRequests: 30, windowMs: 60000, burstLimit: 10, burstWindowMs: 10000 }, // 30/min, burst 10/10s
    openai: { maxRequests: 15, windowMs: 60000, burstLimit: 5, burstWindowMs: 10000 } // 15/min, burst 5/10s
  },
  premium: {
    nvidia: { maxRequests: 100, windowMs: 60000, burstLimit: 20, burstWindowMs: 10000 },
    elevenlabs: { maxRequests: 50, windowMs: 60000, burstLimit: 15, burstWindowMs: 10000 },
    did: { maxRequests: 30, windowMs: 60000, burstLimit: 10, burstWindowMs: 10000 },
    deepgram: { maxRequests: 150, windowMs: 60000, burstLimit: 40, burstWindowMs: 10000 },
    openai: { maxRequests: 75, windowMs: 60000, burstLimit: 20, burstWindowMs: 10000 }
  },
  enterprise: {
    nvidia: { maxRequests: 500, windowMs: 60000, burstLimit: 100, burstWindowMs: 10000 },
    elevenlabs: { maxRequests: 200, windowMs: 60000, burstLimit: 50, burstWindowMs: 10000 },
    did: { maxRequests: 100, windowMs: 60000, burstLimit: 30, burstWindowMs: 10000 },
    deepgram: { maxRequests: 500, windowMs: 60000, burstLimit: 100, burstWindowMs: 10000 },
    openai: { maxRequests: 300, windowMs: 60000, burstLimit: 75, burstWindowMs: 10000 }
  }
};

class RateLimiterService {
  private requests: Map<Provider, RequestRecord[]> = new Map();
  private currentPlan: PlanType = 'free';
  private configs: Map<Provider, RateLimitConfig> = new Map();
  private warningThreshold = 0.8; // Avisa quando usar 80% do limite

  constructor() {
    this.loadFromStorage();
    this.initializeConfigs();
    this.startCleanup();
  }

  /**
   * Inicializa configurações baseadas no plano
   */
  private initializeConfigs(): void {
    const providers: Provider[] = ['nvidia', 'elevenlabs', 'did', 'deepgram', 'openai'];
    
    providers.forEach(provider => {
      const config = PLAN_CONFIGS[this.currentPlan][provider];
      this.configs.set(provider, config);
      
      if (!this.requests.has(provider)) {
        this.requests.set(provider, []);
      }
    });

    logger.info('Rate limiter initialized', 
      { plan: this.currentPlan }, 
      'RateLimiter'
    );
  }

  /**
   * Define o plano do usuário
   */
  setPlan(plan: PlanType): void {
    this.currentPlan = plan;
    this.initializeConfigs();
    
    logger.info('Plan updated', { plan }, 'RateLimiter');
  }

  /**
   * Configura limites customizados para um provider
   */
  configureLimit(provider: Provider, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.configs.get(provider) || PLAN_CONFIGS[this.currentPlan][provider];
    this.configs.set(provider, { ...currentConfig, ...config });
    
    logger.info('Rate limit configured', { provider, config }, 'RateLimiter');
  }

  /**
   * Verifica se uma requisição pode ser feita
   */
  canMakeRequest(provider: Provider, userId?: string | null): boolean {
    // Verifica abuse detector primeiro
    if (userId && !abuseDetector.canPerformAction(userId, 'api_call')) {
      logger.warn('Request blocked by abuse detector', { provider, userId }, 'RateLimiter');
      return false;
    }

    const config = this.configs.get(provider);
    if (!config) return true;

    const now = Date.now();
    const requests = this.requests.get(provider) || [];

    // Limpa requisições antigas
    this.cleanOldRequests(provider);

    // Verifica limite da janela principal
    const windowStart = now - config.windowMs;
    const requestsInWindow = requests.filter(r => r.timestamp > windowStart).length;

    if (requestsInWindow >= config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        provider,
        limit: config.maxRequests,
        window: `${config.windowMs}ms`,
        current: requestsInWindow
      }, 'RateLimiter');

      metricsCollector.trackPerformance({
        operation: `${provider}_rate_limit_exceeded`,
        duration: 0,
        success: false,
        metadata: { requestsInWindow, limit: config.maxRequests }
      });

      return false;
    }

    // Verifica limite de burst se configurado
    if (config.burstLimit && config.burstWindowMs) {
      const burstStart = now - config.burstWindowMs;
      const requestsInBurst = requests.filter(r => r.timestamp > burstStart).length;

      if (requestsInBurst >= config.burstLimit) {
        logger.warn('Burst limit exceeded', {
          provider,
          burstLimit: config.burstLimit,
          burstWindow: `${config.burstWindowMs}ms`,
          current: requestsInBurst
        }, 'RateLimiter');

        metricsCollector.trackPerformance({
          operation: `${provider}_burst_limit_exceeded`,
          duration: 0,
          success: false,
          metadata: { requestsInBurst, burstLimit: config.burstLimit }
        });

        return false;
      }
    }

    // Aviso quando próximo do limite
    const usage = requestsInWindow / config.maxRequests;
    if (usage >= this.warningThreshold && usage < 1) {
      logger.warn('Approaching rate limit', {
        provider,
        usage: `${Math.round(usage * 100)}%`,
        remaining: config.maxRequests - requestsInWindow
      }, 'RateLimiter');
    }

    return true;
  }

  /**
   * Registra uma requisição
   */
  recordRequest(provider: Provider, userId?: string | null): void {
    const requests = this.requests.get(provider) || [];
    
    requests.push({
      timestamp: Date.now(),
      provider
    });

    this.requests.set(provider, requests);
    this.saveToStorage();

    // Registra no abuse detector
    if (userId) {
      abuseDetector.recordAction(userId, 'api_call', { provider });
    }

    metricsCollector.trackPerformance({
      operation: `${provider}_request_recorded`,
      duration: 0,
      success: true
    });
  }

  /**
   * Tenta fazer uma requisição (verifica e registra)
   */
  async tryRequest<T>(
    provider: Provider,
    fn: () => Promise<T>,
    onLimited?: () => void,
    userId?: string | null
  ): Promise<T | null> {
    if (!this.canMakeRequest(provider, userId)) {
      if (onLimited) {
        onLimited();
      }
      return null;
    }

    this.recordRequest(provider, userId);

    try {
      const result = await fn();
      
      // Registra sucesso no abuse detector
      if (userId) {
        abuseDetector.recordAction(userId, 'api_call', { 
          provider, 
          success: true 
        });
      }
      
      return result;
    } catch (error) {
      // Registra falha no abuse detector
      if (userId) {
        abuseDetector.recordAction(userId, 'api_call', { 
          provider, 
          success: false,
          error: (error as Error).message
        });
      }
      
      logger.error('Request failed', {
        provider,
        error: (error as Error).message
      }, 'RateLimiter');
      throw error;
    }
  }

  /**
   * Obtém status atual de um provider
   */
  getStatus(provider: Provider): RateLimitStatus {
    const config = this.configs.get(provider) || PLAN_CONFIGS[this.currentPlan][provider];
    const now = Date.now();
    const requests = this.requests.get(provider) || [];

    const windowStart = now - config.windowMs;
    const requestsInWindow = requests.filter(r => r.timestamp > windowStart);
    const requestCount = requestsInWindow.length;

    let burstCount = 0;
    let burstResetTime = 0;

    if (config.burstLimit && config.burstWindowMs) {
      const burstStart = now - config.burstWindowMs;
      const requestsInBurst = requests.filter(r => r.timestamp > burstStart);
      burstCount = requestsInBurst.length;
      
      if (requestsInBurst.length > 0) {
        const oldestBurstRequest = requestsInBurst[0].timestamp;
        burstResetTime = oldestBurstRequest + config.burstWindowMs;
      }
    }

    const resetTime = requestsInWindow.length > 0
      ? requestsInWindow[0].timestamp + config.windowMs
      : now + config.windowMs;

    return {
      provider,
      requestCount,
      burstCount,
      resetTime,
      burstResetTime,
      isLimited: requestCount >= config.maxRequests || 
                 (config.burstLimit ? burstCount >= config.burstLimit : false),
      remainingRequests: Math.max(0, config.maxRequests - requestCount)
    };
  }

  /**
   * Obtém status de todos os providers
   */
  getAllStatus(): Record<Provider, RateLimitStatus> {
    const providers: Provider[] = ['nvidia', 'elevenlabs', 'did', 'deepgram', 'openai'];
    const status: any = {};

    providers.forEach(provider => {
      status[provider] = this.getStatus(provider);
    });

    return status;
  }

  /**
   * Obtém tempo até reset em ms
   */
  getTimeUntilReset(provider: Provider): number {
    const status = this.getStatus(provider);
    return Math.max(0, status.resetTime - Date.now());
  }

  /**
   * Limpa requisições antigas
   */
  private cleanOldRequests(provider: Provider): void {
    const config = this.configs.get(provider);
    if (!config) return;

    const now = Date.now();
    const cutoff = now - config.windowMs;
    const requests = this.requests.get(provider) || [];

    const recentRequests = requests.filter(r => r.timestamp > cutoff);
    this.requests.set(provider, recentRequests);
  }

  /**
   * Reseta limites de um provider
   */
  reset(provider: Provider): void {
    this.requests.set(provider, []);
    this.saveToStorage();
    logger.info('Rate limit reset', { provider }, 'RateLimiter');
  }

  /**
   * Reseta todos os limites
   */
  resetAll(): void {
    this.requests.clear();
    this.saveToStorage();
    logger.info('All rate limits reset', undefined, 'RateLimiter');
  }

  /**
   * Salva no localStorage
   */
  private saveToStorage(): void {
    try {
      const data: any = {};
      this.requests.forEach((requests, provider) => {
        data[provider] = requests.slice(-100); // Mantém últimas 100 requisições
      });
      localStorage.setItem('rate-limiter-data', JSON.stringify({
        requests: data,
        plan: this.currentPlan
      }));
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Carrega do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('rate-limiter-data');
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.plan) {
          this.currentPlan = data.plan;
        }

        if (data.requests) {
          Object.entries(data.requests).forEach(([provider, requests]) => {
            this.requests.set(
              provider as Provider,
              (requests as any[]).map(r => ({
                timestamp: r.timestamp,
                provider: r.provider
              }))
            );
          });
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Limpeza periódica de requisições antigas
   */
  private startCleanup(): void {
    setInterval(() => {
      const providers: Provider[] = ['nvidia', 'elevenlabs', 'did', 'deepgram', 'openai'];
      providers.forEach(provider => {
        this.cleanOldRequests(provider);
      });
      this.saveToStorage();
    }, 30000); // A cada 30 segundos
  }

  /**
   * Exporta dados para debug
   */
  export(): string {
    return JSON.stringify({
      plan: this.currentPlan,
      status: this.getAllStatus(),
      configs: Array.from(this.configs.entries())
    }, null, 2);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiterService();
