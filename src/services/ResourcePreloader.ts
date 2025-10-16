/**
 * Sistema de Pre-loading de Recursos
 * Pré-carrega avatares comuns durante idle time para reduzir latência
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './CacheService';
import { logger } from '@/lib/logger';

interface PreloadConfig {
  enabled: boolean;
  idleTimeBeforePreload: number; // ms antes de iniciar preload
  commonPhrases: string[];
  maxConcurrentPreloads: number;
}

interface PreloadStats {
  totalPreloaded: number;
  successCount: number;
  failureCount: number;
  averageTime: number;
  lastPreloadTime: number;
}

class ResourcePreloader {
  private static instance: ResourcePreloader;
  private config: PreloadConfig = {
    enabled: true,
    idleTimeBeforePreload: 5000, // 5 segundos de idle
    maxConcurrentPreloads: 2,
    commonPhrases: [
      // Greetings
      "Hello! I'm Alex, your English tutor. What would you like to talk about today?",
      "Hi there! Ready to practice your English?",
      "Welcome back! Let's continue your English learning journey.",
      
      // Encouragement
      "That's correct! Well done!",
      "Great job! Keep going!",
      "Excellent! You're making great progress.",
      "Perfect! You got it right!",
      "Amazing work! Keep it up!",
      
      // Corrections
      "Let me explain that differently.",
      "Not quite. Let me help you with that.",
      "Good attempt! Here's the correct way.",
      
      // Common responses
      "Could you repeat that, please?",
      "I didn't quite understand. Can you say it again?",
      "Let's practice that again.",
      "That's a great question!",
    ],
  };

  private stats: PreloadStats = {
    totalPreloaded: 0,
    successCount: 0,
    failureCount: 0,
    averageTime: 0,
    lastPreloadTime: 0,
  };

  private isPreloading = false;
  private idleTimer: number | null = null;
  private preloadQueue: string[] = [];

  private constructor() {
    this.loadStatsFromStorage();
  }

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  /**
   * Inicia o sistema de preloading
   */
  start(): void {
    if (!this.config.enabled) {
      logger.info('ResourcePreloader: Disabled', undefined, 'ResourcePreloader');
      return;
    }

    logger.info('ResourcePreloader: Starting', undefined, 'ResourcePreloader');
    
    // Detecta idle time do usuário
    this.setupIdleDetection();
    
    // Pré-aquece conexões
    this.warmUpConnections();
  }

  /**
   * Para o sistema de preloading
   */
  stop(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    logger.info('ResourcePreloader: Stopped', undefined, 'ResourcePreloader');
  }

  /**
   * Detecta quando o usuário está idle e inicia preload
   */
  private setupIdleDetection(): void {
    const resetIdleTimer = () => {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }

      this.idleTimer = window.setTimeout(() => {
        logger.info('ResourcePreloader: User idle, starting preload', undefined, 'ResourcePreloader');
        this.startPreloading();
      }, this.config.idleTimeBeforePreload);
    };

    // Eventos que indicam atividade do usuário
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Inicia o timer inicial
    resetIdleTimer();
  }

  /**
   * Pré-aquece conexões com providers
   */
  private async warmUpConnections(): Promise<void> {
    logger.info('ResourcePreloader: Warming up connections', undefined, 'ResourcePreloader');
    
    try {
      // Faz uma requisição leve para "acordar" as edge functions
      // Isso reduz latência da primeira chamada real
      const warmupPromises = [
        this.warmupFunction('openai-chat'),
        this.warmupFunction('elevenlabs-tts'),
        this.warmupFunction('did-avatar'),
      ];

      await Promise.allSettled(warmupPromises);
      logger.info('ResourcePreloader: Connections warmed up', undefined, 'ResourcePreloader');
    } catch (error) {
      logger.warn('ResourcePreloader: Warmup failed', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      }, 'ResourcePreloader');
    }
  }

  /**
   * Aquece uma edge function específica
   */
  private async warmupFunction(functionName: string): Promise<void> {
    try {
      // Chamada mínima apenas para estabelecer conexão
      // A maioria das functions vai rejeitar, mas a conexão já estará quente
      await supabase.functions.invoke(functionName, {
        body: { warmup: true },
      });
    } catch (error) {
      // Esperado - apenas queremos estabelecer a conexão
    }
  }

  /**
   * Inicia o processo de preloading
   */
  private async startPreloading(): Promise<void> {
    if (this.isPreloading) {
      logger.debug('ResourcePreloader: Already preloading', undefined, 'ResourcePreloader');
      return;
    }

    this.isPreloading = true;
    this.preloadQueue = [...this.config.commonPhrases];

    logger.info('ResourcePreloader: Starting preload', { 
      queueSize: this.preloadQueue.length 
    }, 'ResourcePreloader');

    await this.processPreloadQueue();
    
    this.isPreloading = false;
    this.saveStatsToStorage();
  }

  /**
   * Processa a fila de preload
   */
  private async processPreloadQueue(): Promise<void> {
    const batchSize = this.config.maxConcurrentPreloads;
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, batchSize);
      
      const promises = batch.map(phrase => this.preloadAvatar(phrase));
      await Promise.allSettled(promises);
      
      // Aguarda um pouco entre batches para não sobrecarregar
      if (this.preloadQueue.length > 0) {
        await this.sleep(2000);
      }
    }

    logger.info('ResourcePreloader: Preload completed', { 
      stats: this.stats 
    }, 'ResourcePreloader');
  }

  /**
   * Pré-carrega um avatar específico
   */
  private async preloadAvatar(text: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Verifica se já está em cache
      const cached = cacheService.get(text);
      if (cached) {
        logger.debug('ResourcePreloader: Already cached', { 
          text: text.substring(0, 30) + '...' 
        }, 'ResourcePreloader');
        return;
      }

      logger.debug('ResourcePreloader: Preloading', { 
        text: text.substring(0, 30) + '...' 
      }, 'ResourcePreloader');

      // Tenta gerar avatar D-ID
      const { data: createData, error: createError } = await supabase.functions.invoke('did-avatar', {
        body: {
          text,
          action: 'create',
        },
      });

      if (createError || !createData?.id) {
        throw new Error('Failed to create D-ID talk');
      }

      const streamId = createData.id;

      // Polling até completar
      let attempts = 0;
      const maxAttempts = 15; // 30 segundos max
      
      while (attempts < maxAttempts) {
        await this.sleep(2000);
        
        const { data: statusData, error: statusError } = await supabase.functions.invoke('did-avatar', {
          body: { action: 'status', streamId },
        });

        if (statusError) {
          throw statusError;
        }

        if (statusData.status === 'done') {
          // Cacheia o resultado
          cacheService.set(text, statusData.result_url);
          
          const duration = Date.now() - startTime;
          this.updateStats(true, duration);
          
          logger.info('ResourcePreloader: Avatar preloaded', { 
            text: text.substring(0, 30) + '...',
            duration 
          }, 'ResourcePreloader');
          
          return;
        } else if (statusData.status === 'error' || statusData.status === 'failed') {
          throw new Error('D-ID generation failed');
        }

        attempts++;
      }

      throw new Error('Preload timeout');

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStats(false, duration);
      
      logger.warn('ResourcePreloader: Preload failed', { 
        text: text.substring(0, 30) + '...',
        error: error instanceof Error ? error.message : 'Unknown',
        duration 
      }, 'ResourcePreloader');

      // Fallback: gera apenas TTS
      try {
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
          body: { text, voice: 'Sarah', model: 'eleven_turbo_v2_5' },
        });

        if (!ttsError && ttsData?.audioContent) {
          const audioUrl = `data:audio/mpeg;base64,${ttsData.audioContent}`;
          cacheService.set(text, undefined, audioUrl);
          
          logger.info('ResourcePreloader: TTS preloaded (fallback)', { 
            text: text.substring(0, 30) + '...' 
          }, 'ResourcePreloader');
        }
      } catch (ttsError) {
        // Silently fail
      }
    }
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(success: boolean, duration: number): void {
    this.stats.totalPreloaded++;
    if (success) {
      this.stats.successCount++;
    } else {
      this.stats.failureCount++;
    }
    
    // Atualiza média móvel do tempo
    this.stats.averageTime = 
      (this.stats.averageTime * (this.stats.totalPreloaded - 1) + duration) / 
      this.stats.totalPreloaded;
    
    this.stats.lastPreloadTime = Date.now();
  }

  /**
   * Força preload de frases específicas
   */
  async preloadSpecific(phrases: string[]): Promise<void> {
    logger.info('ResourcePreloader: Manual preload requested', { 
      count: phrases.length 
    }, 'ResourcePreloader');
    
    this.preloadQueue = [...phrases, ...this.preloadQueue];
    await this.processPreloadQueue();
  }

  /**
   * Obtém estatísticas
   */
  getStats(): PreloadStats {
    return { ...this.stats };
  }

  /**
   * Utilitário de sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Persiste estatísticas
   */
  private saveStatsToStorage(): void {
    try {
      localStorage.setItem('preloader-stats', JSON.stringify(this.stats));
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Carrega estatísticas
   */
  private loadStatsFromStorage(): void {
    try {
      const data = localStorage.getItem('preloader-stats');
      if (data) {
        this.stats = JSON.parse(data);
        logger.info('ResourcePreloader: Stats loaded', { stats: this.stats }, 'ResourcePreloader');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Limpa estatísticas
   */
  clearStats(): void {
    this.stats = {
      totalPreloaded: 0,
      successCount: 0,
      failureCount: 0,
      averageTime: 0,
      lastPreloadTime: 0,
    };
    localStorage.removeItem('preloader-stats');
    logger.info('ResourcePreloader: Stats cleared', undefined, 'ResourcePreloader');
  }
}

export const resourcePreloader = ResourcePreloader.getInstance();
