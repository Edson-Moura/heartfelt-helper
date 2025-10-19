/**
 * Analytics Service - Integração com Mixpanel/Amplitude
 * Suporta múltiplos provedores de analytics
 */

import { logger } from '@/lib/logger';

export type AnalyticsProvider = 'mixpanel' | 'amplitude' | 'none';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  plan?: string;
  [key: string]: any;
}

class AnalyticsService {
  private provider: AnalyticsProvider = 'none';
  private initialized = false;
  private mixpanelToken?: string;
  private amplitudeApiKey?: string;

  /**
   * Inicializa o serviço de analytics
   */
  async initialize(provider: AnalyticsProvider = 'none'): Promise<void> {
    this.provider = provider;

    try {
      if (provider === 'mixpanel') {
        await this.initializeMixpanel();
      } else if (provider === 'amplitude') {
        await this.initializeAmplitude();
      }

      this.initialized = provider !== 'none';
      logger.info('Analytics initialized', { provider }, 'AnalyticsService');
    } catch (error) {
      logger.error('Failed to initialize analytics', { error, provider }, 'AnalyticsService');
    }
  }

  /**
   * Inicializa Mixpanel
   */
  private async initializeMixpanel(): Promise<void> {
    // Token deve vir de environment variable ou Supabase secret
    this.mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;
    
    if (!this.mixpanelToken) {
      logger.warn('Mixpanel token not found', undefined, 'AnalyticsService');
      return;
    }

    // Lazy load Mixpanel SDK
    if (typeof window !== 'undefined' && !(window as any).mixpanel) {
      const script = document.createElement('script');
      script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      (window as any).mixpanel.init(this.mixpanelToken);
      logger.info('Mixpanel SDK loaded', undefined, 'AnalyticsService');
    }
  }

  /**
   * Inicializa Amplitude
   */
  private async initializeAmplitude(): Promise<void> {
    // API key deve vir de environment variable ou Supabase secret
    this.amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
    
    if (!this.amplitudeApiKey) {
      logger.warn('Amplitude API key not found', undefined, 'AnalyticsService');
      return;
    }

    // Lazy load Amplitude SDK
    if (typeof window !== 'undefined' && !(window as any).amplitude) {
      const script = document.createElement('script');
      script.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.3.8-min.js.gz';
      script.async = true;
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      (window as any).amplitude.init(this.amplitudeApiKey);
      logger.info('Amplitude SDK loaded', undefined, 'AnalyticsService');
    }
  }

  /**
   * Identifica o usuário
   */
  identify(properties: UserProperties): void {
    if (!this.initialized) {
      logger.debug('Analytics not initialized, skipping identify', { properties }, 'AnalyticsService');
      return;
    }

    try {
      if (this.provider === 'mixpanel' && (window as any).mixpanel) {
        (window as any).mixpanel.identify(properties.userId);
        (window as any).mixpanel.people.set(properties);
      } else if (this.provider === 'amplitude' && (window as any).amplitude) {
        (window as any).amplitude.setUserId(properties.userId);
        (window as any).amplitude.setUserProperties(properties);
      }

      logger.info('User identified', { userId: properties.userId, provider: this.provider }, 'AnalyticsService');
    } catch (error) {
      logger.error('Failed to identify user', { error, properties }, 'AnalyticsService');
    }
  }

  /**
   * Rastreia um evento
   */
  track(event: string, properties?: Record<string, any>, userId?: string): void {
    if (!this.initialized) {
      logger.debug('Analytics not initialized, skipping track', { event, properties }, 'AnalyticsService');
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        provider: this.provider,
        ...(userId && { userId }),
      };

      if (this.provider === 'mixpanel' && (window as any).mixpanel) {
        (window as any).mixpanel.track(event, enrichedProperties);
      } else if (this.provider === 'amplitude' && (window as any).amplitude) {
        (window as any).amplitude.track(event, enrichedProperties);
      }

      logger.info('Event tracked', { event, properties: enrichedProperties }, 'AnalyticsService');
    } catch (error) {
      logger.error('Failed to track event', { error, event, properties }, 'AnalyticsService');
    }
  }

  /**
   * Rastreia uma visualização de página
   */
  page(pageName: string, properties?: Record<string, any>): void {
    this.track('Page Viewed', {
      ...properties,
      page: pageName,
      url: window.location.href,
      path: window.location.pathname,
    });
  }

  /**
   * Rastreia tempo gasto
   */
  timeEvent(event: string): void {
    if (!this.initialized) return;

    try {
      if (this.provider === 'mixpanel' && (window as any).mixpanel) {
        (window as any).mixpanel.time_event(event);
      }
      // Amplitude não tem time_event nativo, precisaria implementar manualmente
    } catch (error) {
      logger.error('Failed to start time event', { error, event }, 'AnalyticsService');
    }
  }

  /**
   * Reseta o usuário (logout)
   */
  reset(): void {
    if (!this.initialized) return;

    try {
      if (this.provider === 'mixpanel' && (window as any).mixpanel) {
        (window as any).mixpanel.reset();
      } else if (this.provider === 'amplitude' && (window as any).amplitude) {
        (window as any).amplitude.reset();
      }

      logger.info('Analytics reset', { provider: this.provider }, 'AnalyticsService');
    } catch (error) {
      logger.error('Failed to reset analytics', { error }, 'AnalyticsService');
    }
  }

  /**
   * Registra uma conversão/revenue
   */
  revenue(amount: number, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      if (this.provider === 'mixpanel' && (window as any).mixpanel) {
        (window as any).mixpanel.people.track_charge(amount, properties);
      } else if (this.provider === 'amplitude' && (window as any).amplitude) {
        const revenue = new (window as any).amplitude.Revenue()
          .setPrice(amount)
          .setEventProperties(properties || {});
        (window as any).amplitude.revenue(revenue);
      }

      this.track('Revenue', { amount, ...properties });
      logger.info('Revenue tracked', { amount, properties }, 'AnalyticsService');
    } catch (error) {
      logger.error('Failed to track revenue', { error, amount, properties }, 'AnalyticsService');
    }
  }

  /**
   * Retorna o provider atual
   */
  getProvider(): AnalyticsProvider {
    return this.provider;
  }

  /**
   * Verifica se está inicializado
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Instância singleton
export const analyticsService = new AnalyticsService();
