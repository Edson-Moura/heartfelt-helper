/**
 * CircuitBreaker - Proteção contra sobrecarga de APIs
 * Implementa padrão Circuit Breaker com estados: CLOSED, OPEN, HALF_OPEN
 */

import { logger } from '@/lib/logger';
import { metricsCollector } from './MetricsCollector';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
type Provider = 'nvidia' | 'elevenlabs' | 'did' | 'deepgram' | 'openai';

interface CircuitConfig {
  failureThreshold: number; // Número de falhas antes de abrir o circuito
  successThreshold: number; // Número de sucessos para fechar circuito em HALF_OPEN
  timeout: number; // Tempo em ms antes de tentar HALF_OPEN
  monitoringPeriod: number; // Período de monitoramento de falhas em ms
}

interface CircuitStatus {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5, // 5 falhas consecutivas
  successThreshold: 2, // 2 sucessos para fechar
  timeout: 60000, // 1 minuto
  monitoringPeriod: 120000 // 2 minutos
};

class CircuitBreakerService {
  private circuits: Map<Provider, CircuitStatus> = new Map();
  private configs: Map<Provider, CircuitConfig> = new Map();
  private failureTimestamps: Map<Provider, number[]> = new Map();

  constructor() {
    this.initializeCircuits();
    this.startMonitoring();
  }

  /**
   * Inicializa circuitos para cada provider
   */
  private initializeCircuits(): void {
    const providers: Provider[] = ['nvidia', 'elevenlabs', 'did', 'deepgram', 'openai'];
    
    providers.forEach(provider => {
      this.circuits.set(provider, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        nextAttemptTime: null
      });
      this.configs.set(provider, { ...DEFAULT_CONFIG });
      this.failureTimestamps.set(provider, []);
    });

    logger.info('Circuit breakers initialized', 
      { providers: providers.join(', ') }, 
      'CircuitBreaker'
    );
  }

  /**
   * Configura um circuito específico
   */
  configureCircuit(provider: Provider, config: Partial<CircuitConfig>): void {
    const currentConfig = this.configs.get(provider) || DEFAULT_CONFIG;
    this.configs.set(provider, { ...currentConfig, ...config });
    
    logger.info('Circuit configured', 
      { provider, config }, 
      'CircuitBreaker'
    );
  }

  /**
   * Verifica se uma chamada pode ser executada
   */
  canExecute(provider: Provider): boolean {
    const circuit = this.circuits.get(provider);
    if (!circuit) return true;

    const now = Date.now();

    switch (circuit.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Verifica se já passou o timeout
        if (circuit.nextAttemptTime && now >= circuit.nextAttemptTime) {
          this.transitionToHalfOpen(provider);
          return true;
        }
        logger.warn('Circuit is OPEN, request blocked', 
          { 
            provider, 
            nextAttempt: circuit.nextAttemptTime ? new Date(circuit.nextAttemptTime).toISOString() : 'unknown' 
          }, 
          'CircuitBreaker'
        );
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  /**
   * Registra sucesso de uma chamada
   */
  recordSuccess(provider: Provider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    const config = this.configs.get(provider) || DEFAULT_CONFIG;

    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++;
      
      if (circuit.successes >= config.successThreshold) {
        this.transitionToClosed(provider);
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset failure counter on success
      circuit.failures = 0;
      this.cleanOldFailures(provider);
    }

    metricsCollector.trackPerformance({
      operation: `${provider}_circuit_success`,
      duration: 0,
      success: true,
      metadata: { state: circuit.state }
    });
  }

  /**
   * Registra falha de uma chamada
   */
  recordFailure(provider: Provider, error?: Error): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    const config = this.configs.get(provider) || DEFAULT_CONFIG;
    const now = Date.now();

    // Adiciona timestamp da falha
    const timestamps = this.failureTimestamps.get(provider) || [];
    timestamps.push(now);
    this.failureTimestamps.set(provider, timestamps);

    circuit.failures++;
    circuit.lastFailureTime = now;

    // Remove sucessos em HALF_OPEN
    if (circuit.state === 'HALF_OPEN') {
      circuit.successes = 0;
      this.transitionToOpen(provider);
      return;
    }

    // Verifica se deve abrir o circuito
    if (circuit.state === 'CLOSED') {
      this.cleanOldFailures(provider);
      const recentFailures = this.failureTimestamps.get(provider)?.length || 0;
      
      if (recentFailures >= config.failureThreshold) {
        this.transitionToOpen(provider);
      }
    }

    logger.error('Circuit failure recorded', 
      { 
        provider, 
        failures: circuit.failures,
        state: circuit.state,
        error: error?.message 
      }, 
      'CircuitBreaker'
    );

    metricsCollector.trackPerformance({
      operation: `${provider}_circuit_failure`,
      duration: 0,
      success: false,
      metadata: { state: circuit.state, error: error?.message }
    });
  }

  /**
   * Executa uma função com proteção de circuit breaker
   */
  async execute<T>(
    provider: Provider,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (!this.canExecute(provider)) {
      if (fallback) {
        logger.info('Using fallback due to open circuit', 
          { provider }, 
          'CircuitBreaker'
        );
        return fallback();
      }
      throw new Error(`Circuit breaker is OPEN for ${provider}`);
    }

    const startTime = Date.now();

    try {
      const result = await fn();
      const latency = Date.now() - startTime;
      
      this.recordSuccess(provider);
      
      metricsCollector.trackApiCall({
        endpoint: provider,
        provider,
        latency,
        status: 'success'
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      
      this.recordFailure(provider, error as Error);
      
      metricsCollector.trackApiCall({
        endpoint: provider,
        provider,
        latency,
        status: 'error',
        errorCode: (error as any)?.status || 500
      });

      if (fallback) {
        logger.warn('Executing fallback after circuit failure', 
          { provider, error: (error as Error).message }, 
          'CircuitBreaker'
        );
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Transição para estado OPEN
   */
  private transitionToOpen(provider: Provider): void {
    const circuit = this.circuits.get(provider);
    const config = this.configs.get(provider);
    if (!circuit || !config) return;

    circuit.state = 'OPEN';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.nextAttemptTime = Date.now() + config.timeout;

    logger.warn('Circuit OPENED', 
      { 
        provider, 
        nextAttempt: new Date(circuit.nextAttemptTime).toISOString() 
      }, 
      'CircuitBreaker'
    );
  }

  /**
   * Transição para estado HALF_OPEN
   */
  private transitionToHalfOpen(provider: Provider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    circuit.state = 'HALF_OPEN';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.nextAttemptTime = null;

    logger.info('Circuit transitioned to HALF_OPEN', 
      { provider }, 
      'CircuitBreaker'
    );
  }

  /**
   * Transição para estado CLOSED
   */
  private transitionToClosed(provider: Provider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.lastFailureTime = null;
    circuit.nextAttemptTime = null;
    
    // Limpa histórico de falhas
    this.failureTimestamps.set(provider, []);

    logger.info('Circuit CLOSED', 
      { provider }, 
      'CircuitBreaker'
    );
  }

  /**
   * Remove falhas antigas fora do período de monitoramento
   */
  private cleanOldFailures(provider: Provider): void {
    const config = this.configs.get(provider) || DEFAULT_CONFIG;
    const timestamps = this.failureTimestamps.get(provider) || [];
    const now = Date.now();
    const cutoff = now - config.monitoringPeriod;

    const recentFailures = timestamps.filter(t => t > cutoff);
    this.failureTimestamps.set(provider, recentFailures);
  }

  /**
   * Obtém status de um circuito
   */
  getStatus(provider: Provider): CircuitStatus | null {
    return this.circuits.get(provider) || null;
  }

  /**
   * Obtém status de todos os circuitos
   */
  getAllStatus(): Record<Provider, CircuitStatus> {
    const status: any = {};
    this.circuits.forEach((circuit, provider) => {
      status[provider] = { ...circuit };
    });
    return status;
  }

  /**
   * Reseta um circuito específico
   */
  reset(provider: Provider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.lastFailureTime = null;
    circuit.nextAttemptTime = null;
    this.failureTimestamps.set(provider, []);

    logger.info('Circuit reset', { provider }, 'CircuitBreaker');
  }

  /**
   * Reseta todos os circuitos
   */
  resetAll(): void {
    this.circuits.forEach((_, provider) => {
      this.reset(provider);
    });
    logger.info('All circuits reset', undefined, 'CircuitBreaker');
  }

  /**
   * Monitora circuitos periodicamente
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.circuits.forEach((circuit, provider) => {
        this.cleanOldFailures(provider);
        
        // Auto-reset OPEN circuits após timeout dobrado (fallback)
        if (circuit.state === 'OPEN' && circuit.nextAttemptTime) {
          const config = this.configs.get(provider) || DEFAULT_CONFIG;
          const autoResetTime = circuit.nextAttemptTime + (config.timeout * 2);
          
          if (Date.now() >= autoResetTime) {
            logger.warn('Auto-resetting stuck OPEN circuit', 
              { provider }, 
              'CircuitBreaker'
            );
            this.reset(provider);
          }
        }
      });
    }, 30000); // A cada 30 segundos
  }
}

// Singleton instance
export const circuitBreaker = new CircuitBreakerService();
