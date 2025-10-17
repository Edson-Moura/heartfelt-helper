/**
 * MetricsCollector - Coleta e armazena métricas do sistema
 * Rastreia performance, uso de APIs, cache, e recursos
 */

import { logger } from '@/lib/logger';

interface ApiMetric {
  endpoint: string;
  provider: 'nvidia' | 'elevenlabs' | 'did' | 'deepgram' | 'openai';
  latency: number;
  status: 'success' | 'error' | 'timeout';
  timestamp: Date;
  cacheHit?: boolean;
  errorCode?: number;
}

interface CacheMetric {
  operation: 'hit' | 'miss' | 'set' | 'invalidate';
  key: string;
  size?: number;
  timestamp: Date;
}

interface ResourceMetric {
  resource: string;
  used: number;
  limit: number;
  percentage: number;
  timestamp: Date;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface MetricsSummary {
  apis: {
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
    byProvider: Record<string, {
      calls: number;
      avgLatency: number;
      errors: number;
    }>;
  };
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    size: number;
  };
  resources: {
    nvidia: { used: number; limit: number; percentage: number };
    elevenlabs: { used: number; limit: number; percentage: number };
    did: { used: number; limit: number; percentage: number };
  };
  performance: {
    avgDuration: number;
    successRate: number;
    slowOperations: Array<{ operation: string; duration: number }>;
  };
}

class MetricsCollectorService {
  private apiMetrics: ApiMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private resourceMetrics: ResourceMetric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  
  private maxStoredMetrics = 1000; // Limite de métricas armazenadas
  private metricsWindow = 3600000; // 1 hora em ms

  constructor() {
    this.loadMetricsFromStorage();
    this.startCleanupInterval();
  }

  /**
   * Registra métrica de chamada de API
   */
  trackApiCall(metric: Omit<ApiMetric, 'timestamp'>): void {
    const apiMetric: ApiMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.apiMetrics.push(apiMetric);
    this.trimMetrics();
    this.persistMetrics();

    logger.debug('API call tracked', {
      provider: metric.provider,
      latency: metric.latency,
      status: metric.status,
      cacheHit: metric.cacheHit
    }, 'MetricsCollector');
  }

  /**
   * Registra métrica de cache
   */
  trackCache(metric: Omit<CacheMetric, 'timestamp'>): void {
    const cacheMetric: CacheMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.cacheMetrics.push(cacheMetric);
    this.trimMetrics();
    this.persistMetrics();
  }

  /**
   * Registra uso de recurso (quotas, limits)
   */
  trackResource(metric: Omit<ResourceMetric, 'timestamp'>): void {
    const resourceMetric: ResourceMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.resourceMetrics.push(resourceMetric);
    this.trimMetrics();
    this.persistMetrics();

    // Alerta se uso > 80%
    if (metric.percentage > 80) {
      logger.warn('Resource usage high', {
        resource: metric.resource,
        percentage: metric.percentage
      }, 'MetricsCollector');
    }
  }

  /**
   * Registra métrica de performance
   */
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const perfMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.performanceMetrics.push(perfMetric);
    this.trimMetrics();
    this.persistMetrics();

    // Alerta se operação muito lenta
    if (metric.duration > 5000) {
      logger.warn('Slow operation detected', {
        operation: metric.operation,
        duration: metric.duration
      }, 'MetricsCollector');
    }
  }

  /**
   * Obtém resumo de todas as métricas
   */
  getSummary(): MetricsSummary {
    const now = Date.now();
    const windowStart = now - this.metricsWindow;

    // Filtrar métricas da janela de tempo
    const recentApiMetrics = this.apiMetrics.filter(
      m => m.timestamp.getTime() > windowStart
    );
    const recentCacheMetrics = this.cacheMetrics.filter(
      m => m.timestamp.getTime() > windowStart
    );
    const recentPerfMetrics = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > windowStart
    );

    // Calcular métricas de API
    const apisByProvider: Record<string, { calls: number; totalLatency: number; errors: number }> = {};
    let totalApiCalls = 0;
    let totalApiLatency = 0;
    let totalApiErrors = 0;

    recentApiMetrics.forEach(metric => {
      totalApiCalls++;
      totalApiLatency += metric.latency;
      
      if (metric.status === 'error') {
        totalApiErrors++;
      }

      if (!apisByProvider[metric.provider]) {
        apisByProvider[metric.provider] = { calls: 0, totalLatency: 0, errors: 0 };
      }
      
      apisByProvider[metric.provider].calls++;
      apisByProvider[metric.provider].totalLatency += metric.latency;
      
      if (metric.status === 'error') {
        apisByProvider[metric.provider].errors++;
      }
    });

    const byProvider: Record<string, { calls: number; avgLatency: number; errors: number }> = {};
    Object.keys(apisByProvider).forEach(provider => {
      const data = apisByProvider[provider];
      byProvider[provider] = {
        calls: data.calls,
        avgLatency: data.calls > 0 ? Math.round(data.totalLatency / data.calls) : 0,
        errors: data.errors
      };
    });

    // Calcular métricas de cache
    const cacheHits = recentCacheMetrics.filter(m => m.operation === 'hit').length;
    const cacheMisses = recentCacheMetrics.filter(m => m.operation === 'miss').length;
    const totalCacheOps = cacheHits + cacheMisses;
    const cacheSize = recentCacheMetrics
      .filter(m => m.size)
      .reduce((sum, m) => sum + (m.size || 0), 0);

    // Calcular métricas de performance
    const totalPerfDuration = recentPerfMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulPerf = recentPerfMetrics.filter(m => m.success).length;
    const slowOps = recentPerfMetrics
      .filter(m => m.duration > 3000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(m => ({ operation: m.operation, duration: m.duration }));

    // Obter últimas métricas de recursos
    const latestResources = this.getLatestResourceMetrics();

    return {
      apis: {
        totalCalls: totalApiCalls,
        successRate: totalApiCalls > 0 
          ? Math.round(((totalApiCalls - totalApiErrors) / totalApiCalls) * 100) / 100
          : 1,
        averageLatency: totalApiCalls > 0 
          ? Math.round(totalApiLatency / totalApiCalls)
          : 0,
        errorRate: totalApiCalls > 0
          ? Math.round((totalApiErrors / totalApiCalls) * 100) / 100
          : 0,
        byProvider
      },
      cache: {
        hitRate: totalCacheOps > 0 
          ? Math.round((cacheHits / totalCacheOps) * 100) / 100
          : 0,
        totalHits: cacheHits,
        totalMisses: cacheMisses,
        size: cacheSize
      },
      resources: latestResources,
      performance: {
        avgDuration: recentPerfMetrics.length > 0
          ? Math.round(totalPerfDuration / recentPerfMetrics.length)
          : 0,
        successRate: recentPerfMetrics.length > 0
          ? Math.round((successfulPerf / recentPerfMetrics.length) * 100) / 100
          : 1,
        slowOperations: slowOps
      }
    };
  }

  /**
   * Obtém últimas métricas de recursos por tipo
   */
  private getLatestResourceMetrics(): MetricsSummary['resources'] {
    const defaults = { used: 0, limit: 0, percentage: 0 };
    const resources: MetricsSummary['resources'] = {
      nvidia: { ...defaults },
      elevenlabs: { ...defaults },
      did: { ...defaults }
    };

    ['nvidia', 'elevenlabs', 'did'].forEach(resource => {
      const latest = this.resourceMetrics
        .filter(m => m.resource === resource)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (latest) {
        resources[resource as keyof typeof resources] = {
          used: latest.used,
          limit: latest.limit,
          percentage: latest.percentage
        };
      }
    });

    return resources;
  }

  /**
   * Remove métricas antigas
   */
  private trimMetrics(): void {
    const now = Date.now();
    const cutoff = now - this.metricsWindow;

    this.apiMetrics = this.apiMetrics
      .filter(m => m.timestamp.getTime() > cutoff)
      .slice(-this.maxStoredMetrics);
    
    this.cacheMetrics = this.cacheMetrics
      .filter(m => m.timestamp.getTime() > cutoff)
      .slice(-this.maxStoredMetrics);
    
    this.resourceMetrics = this.resourceMetrics
      .filter(m => m.timestamp.getTime() > cutoff)
      .slice(-this.maxStoredMetrics);
    
    this.performanceMetrics = this.performanceMetrics
      .filter(m => m.timestamp.getTime() > cutoff)
      .slice(-this.maxStoredMetrics);
  }

  /**
   * Persiste métricas no localStorage
   */
  private persistMetrics(): void {
    try {
      const data = {
        api: this.apiMetrics.slice(-100),
        cache: this.cacheMetrics.slice(-100),
        resource: this.resourceMetrics.slice(-100),
        performance: this.performanceMetrics.slice(-100)
      };
      localStorage.setItem('metrics-data', JSON.stringify(data));
    } catch (error) {
      // Silently fail if localStorage is full
    }
  }

  /**
   * Carrega métricas do localStorage
   */
  private loadMetricsFromStorage(): void {
    try {
      const stored = localStorage.getItem('metrics-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.apiMetrics = (data.api || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        this.cacheMetrics = (data.cache || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        this.resourceMetrics = (data.resource || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        this.performanceMetrics = (data.performance || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Inicia limpeza automática de métricas antigas
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.trimMetrics();
      this.persistMetrics();
    }, 300000); // 5 minutos
  }

  /**
   * Limpa todas as métricas
   */
  clearAll(): void {
    this.apiMetrics = [];
    this.cacheMetrics = [];
    this.resourceMetrics = [];
    this.performanceMetrics = [];
    localStorage.removeItem('metrics-data');
    logger.info('All metrics cleared', undefined, 'MetricsCollector');
  }

  /**
   * Exporta métricas como JSON
   */
  export(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      raw: {
        api: this.apiMetrics,
        cache: this.cacheMetrics,
        resource: this.resourceMetrics,
        performance: this.performanceMetrics
      }
    }, null, 2);
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollectorService();
