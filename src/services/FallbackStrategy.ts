/**
 * FallbackStrategy - Gestão inteligente de fallbacks entre providers
 * Escolhe o melhor provider baseado em health status e prioridades
 */

import { healthCheckService } from './HealthCheckService';
import { circuitBreaker } from './CircuitBreaker';
import { logger } from '@/lib/logger';
import { metricsCollector } from './MetricsCollector';

type ProviderType = 'avatar' | 'tts' | 'stt' | 'ai';
type Provider = 'did' | 'heygen' | 'elevenlabs' | 'nvidia' | 'azure' | 'deepgram' | 'openai' | 'browser';

interface ProviderConfig {
  provider: Provider;
  priority: number;
  timeout?: number;
  quality?: 'high' | 'medium' | 'low';
  cost?: number; // Custo estimado por requisição em USD
}

interface FallbackResult<T> {
  result: T;
  provider: Provider;
  latency: number;
  fallbackUsed: boolean;
  fallbackLevel: number; // 0 = primary, 1 = first fallback, etc.
}

// Matriz de fallback com prioridades e características
const FALLBACK_MATRIX: Record<ProviderType, ProviderConfig[]> = {
  avatar: [
    { 
      provider: 'did', 
      priority: 1, 
      timeout: 30000, 
      quality: 'high',
      cost: 0.02 // $0.02 por 15s de vídeo
    },
    { 
      provider: 'elevenlabs', // Fallback: apenas áudio com ElevenLabs
      priority: 2, 
      timeout: 5000, 
      quality: 'medium',
      cost: 0.01 // $0.01 por resposta
    },
    { 
      provider: 'browser', // Último recurso: TTS navegador
      priority: 3, 
      timeout: 1000, 
      quality: 'low',
      cost: 0 // Gratuito
    }
  ],
  tts: [
    { 
      provider: 'elevenlabs', 
      priority: 1, 
      timeout: 5000, 
      quality: 'high',
      cost: 0.01
    },
    { 
      provider: 'nvidia', // Alternativa de alta qualidade
      priority: 2, 
      timeout: 5000, 
      quality: 'high',
      cost: 0.008
    },
    { 
      provider: 'browser', 
      priority: 3, 
      timeout: 1000, 
      quality: 'low',
      cost: 0
    }
  ],
  stt: [
    { 
      provider: 'deepgram', 
      priority: 1, 
      timeout: 5000, 
      quality: 'high',
      cost: 0.003
    }
    // Apenas Deepgram por enquanto
    // TODO: Adicionar Whisper como fallback
  ],
  ai: [
    { 
      provider: 'openai', 
      priority: 1, 
      timeout: 10000, 
      quality: 'high',
      cost: 0.0003
    },
    { 
      provider: 'nvidia', 
      priority: 2, 
      timeout: 10000, 
      quality: 'high',
      cost: 0.0002
    }
  ]
};

class FallbackStrategyService {
  private static instance: FallbackStrategyService;
  
  // Estatísticas de uso de fallback
  private fallbackStats: Record<ProviderType, {
    primary: number;
    fallback1: number;
    fallback2: number;
    totalCost: number;
  }> = {
    avatar: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
    tts: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
    stt: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
    ai: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 }
  };

  private constructor() {
    this.loadStatsFromStorage();
  }

  static getInstance(): FallbackStrategyService {
    if (!FallbackStrategyService.instance) {
      FallbackStrategyService.instance = new FallbackStrategyService();
    }
    return FallbackStrategyService.instance;
  }

  /**
   * Obtém o melhor provider disponível para um tipo
   */
  getBestProvider(type: ProviderType): ProviderConfig {
    const providers = FALLBACK_MATRIX[type];
    
    // Ordena por prioridade e filtra indisponíveis
    const availableProviders = providers
      .filter(config => {
        // Verifica se o circuit breaker permite usar este provider
        if (config.provider === 'browser') return true; // Browser sempre disponível
        
        const providerName = config.provider as any;
        return circuitBreaker.canExecute(providerName);
      })
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      logger.warn('FallbackStrategy: No providers available', { type }, 'FallbackStrategy');
      // Retorna o último da lista (geralmente browser) como último recurso
      return providers[providers.length - 1];
    }

    const best = availableProviders[0];
    
    logger.info('FallbackStrategy: Best provider selected', {
      type,
      provider: best.provider,
      priority: best.priority,
      quality: best.quality
    }, 'FallbackStrategy');

    return best;
  }

  /**
   * Executa uma função com estratégia de fallback automática
   */
  async executeWithFallback<T = any>(
    type: ProviderType,
    executors: Map<Provider, () => Promise<T>>,
    options?: {
      skipProviders?: Provider[];
      forceProvider?: Provider;
    }
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now();
    let providers = FALLBACK_MATRIX[type];

    // Filtra providers ignorados
    if (options?.skipProviders) {
      providers = providers.filter(p => !options.skipProviders!.includes(p.provider));
    }

    // Força um provider específico
    if (options?.forceProvider) {
      const forced = providers.find(p => p.provider === options.forceProvider);
      if (forced) {
        providers = [forced];
      }
    }

    // Ordena por prioridade
    providers = providers.sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;
    let fallbackLevel = 0;

    // Tenta cada provider em ordem de prioridade
    for (const config of providers) {
      const executor = executors.get(config.provider);
      
      if (!executor) {
        logger.debug('FallbackStrategy: No executor for provider', { 
          provider: config.provider 
        }, 'FallbackStrategy');
        continue;
      }

      // Verifica circuit breaker (exceto browser)
      if (config.provider !== 'browser') {
        const providerName = config.provider as any;
        if (!circuitBreaker.canExecute(providerName)) {
          logger.warn('FallbackStrategy: Circuit breaker open, skipping provider', {
            provider: config.provider,
            fallbackLevel
          }, 'FallbackStrategy');
          fallbackLevel++;
          continue;
        }
      }

      try {
        logger.info('FallbackStrategy: Attempting provider', {
          type,
          provider: config.provider,
          fallbackLevel,
          priority: config.priority
        }, 'FallbackStrategy');

        const result = await this.executeWithTimeout(
          executor,
          config.timeout || 10000
        );

        const latency = Date.now() - startTime;

        // Registra sucesso
        this.recordSuccess(type, fallbackLevel, config.cost || 0);
        
        // Reporta sucesso ao circuit breaker
        if (config.provider !== 'browser') {
          circuitBreaker.recordSuccess(config.provider as any);
        }

        logger.info('FallbackStrategy: Success', {
          type,
          provider: config.provider,
          latency,
          fallbackLevel,
          cost: config.cost
        }, 'FallbackStrategy');

        metricsCollector.trackPerformance({
          operation: `${type}_${config.provider}`,
          duration: latency,
          success: true,
          metadata: {
            fallbackLevel,
            quality: config.quality,
            cost: config.cost
          }
        });

        return {
          result,
          provider: config.provider,
          latency,
          fallbackUsed: fallbackLevel > 0,
          fallbackLevel
        };

      } catch (error) {
        lastError = error as Error;
        
        logger.warn('FallbackStrategy: Provider failed, trying next', {
          type,
          provider: config.provider,
          fallbackLevel,
          error: lastError.message
        }, 'FallbackStrategy');

        // Reporta falha ao circuit breaker
        if (config.provider !== 'browser') {
          circuitBreaker.recordFailure(config.provider as any, lastError);
        }

        metricsCollector.trackPerformance({
          operation: `${type}_${config.provider}_failed`,
          duration: Date.now() - startTime,
          success: false,
          metadata: {
            fallbackLevel,
            error: lastError.message
          }
        });

        fallbackLevel++;
        continue; // Tenta próximo provider
      }
    }

    // Se chegou aqui, todos os providers falharam
    logger.error('FallbackStrategy: All providers failed', {
      type,
      attemptedProviders: providers.map(p => p.provider),
      lastError: lastError?.message
    }, 'FallbackStrategy');

    throw new Error(
      `All ${type} providers failed. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  /**
   * Executa função com timeout
   */
  private executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  /**
   * Registra sucesso e custos
   */
  private recordSuccess(type: ProviderType, fallbackLevel: number, cost: number): void {
    const stats = this.fallbackStats[type];
    
    if (fallbackLevel === 0) {
      stats.primary++;
    } else if (fallbackLevel === 1) {
      stats.fallback1++;
    } else {
      stats.fallback2++;
    }
    
    stats.totalCost += cost;
    
    this.saveStatsToStorage();
  }

  /**
   * Obtém estatísticas de fallback
   */
  getStats(): typeof this.fallbackStats {
    return { ...this.fallbackStats };
  }

  /**
   * Obtém custo total estimado
   */
  getTotalCost(): number {
    return Object.values(this.fallbackStats).reduce(
      (sum, stat) => sum + stat.totalCost,
      0
    );
  }

  /**
   * Obtém taxa de uso de fallback por tipo
   */
  getFallbackRate(type: ProviderType): number {
    const stats = this.fallbackStats[type];
    const total = stats.primary + stats.fallback1 + stats.fallback2;
    
    if (total === 0) return 0;
    
    return Math.round(((stats.fallback1 + stats.fallback2) / total) * 100);
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.fallbackStats = {
      avatar: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
      tts: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
      stt: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 },
      ai: { primary: 0, fallback1: 0, fallback2: 0, totalCost: 0 }
    };
    
    localStorage.removeItem('fallback-stats');
    logger.info('FallbackStrategy: Stats reset', undefined, 'FallbackStrategy');
  }

  /**
   * Persiste estatísticas
   */
  private saveStatsToStorage(): void {
    try {
      localStorage.setItem('fallback-stats', JSON.stringify(this.fallbackStats));
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Carrega estatísticas
   */
  private loadStatsFromStorage(): void {
    try {
      const data = localStorage.getItem('fallback-stats');
      if (data) {
        this.fallbackStats = JSON.parse(data);
        logger.info('FallbackStrategy: Stats loaded', { stats: this.fallbackStats }, 'FallbackStrategy');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Exporta relatório detalhado
   */
  exportReport(): string {
    const report = {
      stats: this.fallbackStats,
      totalCost: this.getTotalCost(),
      fallbackRates: {
        avatar: this.getFallbackRate('avatar'),
        tts: this.getFallbackRate('tts'),
        stt: this.getFallbackRate('stt'),
        ai: this.getFallbackRate('ai')
      },
      providerMatrix: FALLBACK_MATRIX,
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const fallbackStrategy = FallbackStrategyService.getInstance();
