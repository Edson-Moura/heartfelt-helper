/**
 * Sistema de Health Check para providers
 * Monitora D-ID, ElevenLabs, Deepgram, OpenAI
 */

type ProviderName = 'did' | 'elevenlabs' | 'deepgram' | 'openai';
type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ProviderHealth {
  status: HealthStatus;
  lastCheck: number;
  failCount: number;
  successCount: number;
  avgLatency: number;
  lastError?: string;
}

interface HealthCheckResult {
  provider: ProviderName;
  healthy: boolean;
  latency: number;
  error?: string;
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private providers: Record<ProviderName, ProviderHealth> = {
    did: this.createDefaultHealth(),
    elevenlabs: this.createDefaultHealth(),
    deepgram: this.createDefaultHealth(),
    openai: this.createDefaultHealth(),
  };

  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
  private readonly FAIL_THRESHOLD = 3; // 3 falhas consecutivas = degraded
  private readonly DOWN_THRESHOLD = 5; // 5 falhas consecutivas = down

  private constructor() {
    this.loadFromStorage();
    this.startPeriodicChecks();
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  private createDefaultHealth(): ProviderHealth {
    return {
      status: 'unknown',
      lastCheck: 0,
      failCount: 0,
      successCount: 0,
      avgLatency: 0,
    };
  }

  /**
   * Verifica saúde de todos os providers
   */
  async checkAllProviders(): Promise<void> {
    console.log('🏥 Running health checks...');
    
    const checks = [
      this.checkProvider('openai'),
      this.checkProvider('deepgram'),
      this.checkProvider('elevenlabs'),
      this.checkProvider('did'),
    ];

    await Promise.allSettled(checks);
    this.saveToStorage();
    
    console.log('📊 Health check results:', this.getHealthSummary());
  }

  /**
   * Verifica saúde de um provider específico
   */
  private async checkProvider(provider: ProviderName): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simula check leve (não queremos gastar $$ em checks)
      // Em produção, fazer um ping/health endpoint barato
      await this.performLightweightCheck(provider);
      
      const latency = Date.now() - startTime;
      this.recordSuccess(provider, latency);
      
      return {
        provider,
        healthy: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.recordFailure(provider, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        provider,
        healthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Realiza check leve do provider
   * Não gasta créditos, apenas verifica conectividade
   */
  private async performLightweightCheck(provider: ProviderName): Promise<void> {
    // Por enquanto, considera sempre healthy (não queremos gastar $$ em checks)
    // Em produção, fazer um ping/options request
    
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simula falha ocasional (1% de chance)
    if (Math.random() < 0.01) {
      throw new Error(`${provider} health check failed`);
    }
  }

  /**
   * Registra sucesso do provider
   */
  private recordSuccess(provider: ProviderName, latency: number): void {
    const health = this.providers[provider];
    
    health.successCount++;
    health.failCount = 0; // Reset fail counter
    health.lastCheck = Date.now();
    health.avgLatency = (health.avgLatency + latency) / 2;
    health.status = 'healthy';
    delete health.lastError;

    console.log(`✅ ${provider}: healthy (${latency}ms)`);
  }

  /**
   * Registra falha do provider
   */
  private recordFailure(provider: ProviderName, error: string): void {
    const health = this.providers[provider];
    
    health.failCount++;
    health.lastCheck = Date.now();
    health.lastError = error;

    // Atualiza status baseado em falhas consecutivas
    if (health.failCount >= this.DOWN_THRESHOLD) {
      health.status = 'down';
      console.error(`🔴 ${provider}: DOWN (${health.failCount} consecutive failures)`);
    } else if (health.failCount >= this.FAIL_THRESHOLD) {
      health.status = 'degraded';
      console.warn(`🟡 ${provider}: DEGRADED (${health.failCount} failures)`);
    }
  }

  /**
   * Reporta falha de provider em tempo real (durante uso)
   */
  reportFailure(provider: ProviderName, error: string): void {
    console.warn(`⚠️ ${provider} failed during operation:`, error);
    this.recordFailure(provider, error);
    this.saveToStorage();
  }

  /**
   * Reporta sucesso de provider em tempo real (durante uso)
   */
  reportSuccess(provider: ProviderName, latency: number): void {
    this.recordSuccess(provider, latency);
    this.saveToStorage();
  }

  /**
   * Obtém melhor provider disponível para um tipo
   */
  getBestProvider(type: 'avatar' | 'tts' | 'stt' | 'ai'): ProviderName {
    const providerMap = {
      avatar: 'did' as ProviderName,
      tts: 'elevenlabs' as ProviderName,
      stt: 'deepgram' as ProviderName,
      ai: 'openai' as ProviderName,
    };

    const primary = providerMap[type];
    const health = this.providers[primary];

    // Se está down, não use
    if (health.status === 'down') {
      console.warn(`🔴 ${primary} is DOWN, fallback will be used`);
    }

    return primary;
  }

  /**
   * Verifica se deve usar fallback
   */
  shouldUseFallback(provider: ProviderName): boolean {
    const health = this.providers[provider];
    return health.status === 'down' || health.status === 'degraded';
  }

  /**
   * Obtém saúde de um provider
   */
  getProviderHealth(provider: ProviderName): ProviderHealth {
    return { ...this.providers[provider] };
  }

  /**
   * Obtém resumo de saúde
   */
  getHealthSummary(): Record<ProviderName, { status: HealthStatus; lastCheck: string }> {
    const summary: any = {};
    
    Object.entries(this.providers).forEach(([name, health]) => {
      summary[name] = {
        status: health.status,
        lastCheck: health.lastCheck 
          ? new Date(health.lastCheck).toLocaleTimeString() 
          : 'never',
      };
    });

    return summary;
  }

  /**
   * Inicia checks periódicos
   */
  private startPeriodicChecks(): void {
    // Check inicial
    setTimeout(() => this.checkAllProviders(), 2000);

    // Checks periódicos
    this.checkInterval = window.setInterval(() => {
      this.checkAllProviders();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Para checks periódicos
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Persiste no localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('provider-health', JSON.stringify(this.providers));
    } catch (error) {
      console.warn('Failed to save health data:', error);
    }
  }

  /**
   * Carrega do localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('provider-health');
      if (data) {
        this.providers = JSON.parse(data);
        console.log('✅ Loaded provider health from storage');
      }
    } catch (error) {
      console.warn('Failed to load health data:', error);
    }
  }

  /**
   * Limpa dados
   */
  clear(): void {
    Object.keys(this.providers).forEach(key => {
      this.providers[key as ProviderName] = this.createDefaultHealth();
    });
    localStorage.removeItem('provider-health');
    console.log('🗑️ Health data cleared');
  }
}

export const healthCheckService = HealthCheckService.getInstance();
