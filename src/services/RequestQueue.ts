/**
 * RequestQueue - Sistema de fila com batching e priorização
 * Gerencia requisições para evitar sobrecarga e otimizar custos
 */

import { logger } from '@/lib/logger';
import { metricsCollector } from './MetricsCollector';

type Priority = 'high' | 'medium' | 'low';
type RequestType = 'avatar' | 'tts' | 'stt' | 'ai';

interface QueuedRequest<T = any> {
  id: string;
  type: RequestType;
  priority: Priority;
  payload: any;
  timestamp: number;
  timeout: number;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retries: number;
  maxRetries: number;
}

interface BatchConfig {
  enabled: boolean;
  maxBatchSize: number;
  maxWaitTime: number; // ms
}

interface QueueConfig {
  maxConcurrent: number;
  defaultTimeout: number;
  batchConfig: Record<RequestType, BatchConfig>;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 5,
  defaultTimeout: 30000,
  batchConfig: {
    avatar: { enabled: false, maxBatchSize: 1, maxWaitTime: 0 },
    tts: { enabled: true, maxBatchSize: 3, maxWaitTime: 500 },
    stt: { enabled: false, maxBatchSize: 1, maxWaitTime: 0 },
    ai: { enabled: true, maxBatchSize: 5, maxWaitTime: 1000 },
  },
};

class RequestQueueService {
  private queue: QueuedRequest[] = [];
  private processing = 0;
  private config: QueueConfig;
  private batchTimers: Map<RequestType, NodeJS.Timeout> = new Map();
  private pendingBatches: Map<RequestType, QueuedRequest[]> = new Map();

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startQueueProcessor();

    logger.info('RequestQueue initialized', { config: this.config }, 'RequestQueue');
  }

  /**
   * Adiciona requisição à fila
   */
  async enqueue<T = any>(
    type: RequestType,
    payload: any,
    options: {
      priority?: Priority;
      timeout?: number;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const {
      priority = 'medium',
      timeout = this.config.defaultTimeout,
      maxRetries = 2,
    } = options;

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: this.generateRequestId(),
        type,
        priority,
        payload,
        timestamp: Date.now(),
        timeout,
        resolve,
        reject,
        retries: 0,
        maxRetries,
      };

      // Se batching está habilitado, adiciona ao batch pendente
      if (this.config.batchConfig[type].enabled) {
        this.addToBatch(request);
      } else {
        this.addToQueue(request);
      }

      logger.debug('Request enqueued', {
        id: request.id,
        type,
        priority,
        queueSize: this.queue.length,
      }, 'RequestQueue');
    });
  }

  /**
   * Adiciona request ao batch pendente
   */
  private addToBatch(request: QueuedRequest): void {
    const { type } = request;
    const batchConfig = this.config.batchConfig[type];

    if (!this.pendingBatches.has(type)) {
      this.pendingBatches.set(type, []);
    }

    const batch = this.pendingBatches.get(type)!;
    batch.push(request);

    // Se atingiu o tamanho máximo do batch, processa imediatamente
    if (batch.length >= batchConfig.maxBatchSize) {
      this.processBatch(type);
      return;
    }

    // Configura timer para processar batch após maxWaitTime
    if (!this.batchTimers.has(type)) {
      const timer = setTimeout(() => {
        this.processBatch(type);
      }, batchConfig.maxWaitTime);
      this.batchTimers.set(type, timer);
    }
  }

  /**
   * Processa batch de requisições
   */
  private processBatch(type: RequestType): void {
    const batch = this.pendingBatches.get(type);
    if (!batch || batch.length === 0) return;

    // Limpa timer
    const timer = this.batchTimers.get(type);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(type);
    }

    // Adiciona todas as requisições do batch à fila principal
    batch.forEach(request => this.addToQueue(request));

    // Limpa batch
    this.pendingBatches.set(type, []);

    logger.info('Batch processed', {
      type,
      batchSize: batch.length,
    }, 'RequestQueue');
  }

  /**
   * Adiciona requisição à fila principal
   */
  private addToQueue(request: QueuedRequest): void {
    this.queue.push(request);
    this.sortQueue();
  }

  /**
   * Ordena fila por prioridade e timestamp
   */
  private sortQueue(): void {
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    this.queue.sort((a, b) => {
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Processa fila continuamente
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 100);
  }

  /**
   * Processa próximas requisições da fila
   */
  private async processQueue(): Promise<void> {
    while (this.processing < this.config.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      this.processing++;
      this.executeRequest(request).finally(() => {
        this.processing--;
      });
    }
  }

  /**
   * Executa requisição individual
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();

    try {
      // Verifica timeout
      if (Date.now() - request.timestamp > request.timeout) {
        throw new Error(`Request timeout after ${request.timeout}ms`);
      }

      // Executa processador específico do tipo
      const result = await this.processRequestByType(request);

      // Registra métrica de sucesso
      metricsCollector.trackPerformance({
        operation: `queue_${request.type}`,
        duration: Date.now() - startTime,
        success: true,
        metadata: {
          priority: request.priority,
          retries: request.retries,
        },
      });

      request.resolve(result);

      logger.debug('Request completed', {
        id: request.id,
        type: request.type,
        duration: Date.now() - startTime,
      }, 'RequestQueue');
    } catch (error) {
      // Tenta retry se possível
      if (request.retries < request.maxRetries) {
        request.retries++;
        this.addToQueue(request);

        logger.warn('Request retry', {
          id: request.id,
          type: request.type,
          retries: request.retries,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'RequestQueue');

        return;
      }

      // Registra métrica de erro
      metricsCollector.trackPerformance({
        operation: `queue_${request.type}`,
        duration: Date.now() - startTime,
        success: false,
        metadata: {
          priority: request.priority,
          retries: request.retries,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      request.reject(error instanceof Error ? error : new Error('Unknown error'));

      logger.error('Request failed', {
        id: request.id,
        type: request.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'RequestQueue');
    }
  }

  /**
   * Processa requisição baseado no tipo
   */
  private async processRequestByType(request: QueuedRequest): Promise<any> {
    // Aqui você implementaria a lógica específica para cada tipo
    // Por enquanto, retorna um mock
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: request.payload };
  }

  /**
   * Obtém estatísticas da fila
   */
  getStats() {
    const stats = {
      queueSize: this.queue.length,
      processing: this.processing,
      byPriority: {
        high: this.queue.filter(r => r.priority === 'high').length,
        medium: this.queue.filter(r => r.priority === 'medium').length,
        low: this.queue.filter(r => r.priority === 'low').length,
      },
      byType: {} as Record<RequestType, number>,
      pendingBatches: {} as Record<RequestType, number>,
    };

    (['avatar', 'tts', 'stt', 'ai'] as RequestType[]).forEach(type => {
      stats.byType[type] = this.queue.filter(r => r.type === type).length;
      stats.pendingBatches[type] = this.pendingBatches.get(type)?.length || 0;
    });

    return stats;
  }

  /**
   * Limpa fila
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });

    this.queue = [];
    this.pendingBatches.clear();
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();

    logger.info('Queue cleared', undefined, 'RequestQueue');
  }

  /**
   * Gera ID único para requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const requestQueue = new RequestQueueService();
