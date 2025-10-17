/**
 * useAdaptiveQuality - Ajusta qualidade baseado em condições de rede e device
 * Reduz custos e melhora UX em conexões lentas
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { metricsCollector } from '@/services/MetricsCollector';

export type QualityLevel = 'high' | 'medium' | 'low';

interface QualitySettings {
  level: QualityLevel;
  useVideo: boolean;
  useHighQualityAudio: boolean;
  videoResolution: 'high' | 'medium' | 'low';
  audioModel: 'eleven_turbo_v2_5' | 'eleven_turbo_v2' | 'browser';
  maxLatencyMs: number;
}

interface NetworkInfo {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isLowEndDevice: boolean;
  connectionType: string;
}

const QUALITY_CONFIGS: Record<QualityLevel, QualitySettings> = {
  high: {
    level: 'high',
    useVideo: true,
    useHighQualityAudio: true,
    videoResolution: 'high',
    audioModel: 'eleven_turbo_v2_5',
    maxLatencyMs: 3000
  },
  medium: {
    level: 'medium',
    useVideo: true,
    useHighQualityAudio: true,
    videoResolution: 'medium',
    audioModel: 'eleven_turbo_v2',
    maxLatencyMs: 5000
  },
  low: {
    level: 'low',
    useVideo: false, // Apenas áudio
    useHighQualityAudio: false,
    videoResolution: 'low',
    audioModel: 'browser',
    maxLatencyMs: 10000
  }
};

export function useAdaptiveQuality() {
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [settings, setSettings] = useState<QualitySettings>(QUALITY_CONFIGS.high);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({});
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isLowEndDevice: false,
    connectionType: 'unknown'
  });
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [autoAdjust, setAutoAdjust] = useState(true);

  /**
   * Detecta informações do device
   */
  useEffect(() => {
    const detectDevice = () => {
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Detecta device de baixo desempenho
      const isLowEndDevice = 
        navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 2 : false;

      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setDeviceInfo({
        isMobile,
        isLowEndDevice,
        connectionType: connection?.effectiveType || 'unknown'
      });

      logger.info('AdaptiveQuality: Device detected', {
        isMobile,
        isLowEndDevice,
        connectionType: connection?.effectiveType
      }, 'useAdaptiveQuality');
    };

    detectDevice();
  }, []);

  /**
   * Monitora conexão de rede
   */
  useEffect(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      logger.warn('AdaptiveQuality: Network Information API not supported', undefined, 'useAdaptiveQuality');
      return;
    }

    const updateNetworkInfo = () => {
      const info: NetworkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      setNetworkInfo(info);

      logger.debug('AdaptiveQuality: Network info updated', info, 'useAdaptiveQuality');

      // Auto-ajusta qualidade se habilitado
      if (autoAdjust) {
        adjustQualityBasedOnNetwork(info);
      }
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, [autoAdjust]);

  /**
   * Ajusta qualidade baseado em condições de rede
   */
  const adjustQualityBasedOnNetwork = (network: NetworkInfo) => {
    let newQuality: QualityLevel = 'high';

    // Respeita preferência de economia de dados
    if (network.saveData) {
      newQuality = 'low';
      logger.info('AdaptiveQuality: Data saver mode detected', undefined, 'useAdaptiveQuality');
    }
    // Conexão muito lenta
    else if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      newQuality = 'low';
      logger.info('AdaptiveQuality: Slow connection detected (2G)', undefined, 'useAdaptiveQuality');
    }
    // Conexão 3G
    else if (network.effectiveType === '3g') {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: Medium connection detected (3G)', undefined, 'useAdaptiveQuality');
    }
    // Alta latência (RTT > 300ms)
    else if (network.rtt && network.rtt > 300) {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: High latency detected', { rtt: network.rtt }, 'useAdaptiveQuality');
    }
    // Baixa banda (< 1 Mbps)
    else if (network.downlink && network.downlink < 1) {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: Low bandwidth detected', { downlink: network.downlink }, 'useAdaptiveQuality');
    }

    // Ajusta ainda mais em devices móveis de baixo desempenho
    if (deviceInfo.isLowEndDevice && newQuality === 'high') {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: Adjusted for low-end device', undefined, 'useAdaptiveQuality');
    }

    if (newQuality !== quality) {
      changeQuality(newQuality, 'auto');
    }
  };

  /**
   * Registra latência observada
   */
  const recordLatency = (latencyMs: number) => {
    const newHistory = [...latencyHistory, latencyMs].slice(-10); // Mantém últimas 10
    setLatencyHistory(newHistory);

    // Calcula média
    const avgLatency = newHistory.reduce((sum, l) => sum + l, 0) / newHistory.length;

    logger.debug('AdaptiveQuality: Latency recorded', {
      current: latencyMs,
      average: avgLatency,
      count: newHistory.length
    }, 'useAdaptiveQuality');

    // Auto-ajusta baseado em latência observada (se habilitado)
    if (autoAdjust && newHistory.length >= 3) {
      adjustQualityBasedOnLatency(avgLatency);
    }

    metricsCollector.trackPerformance({
      operation: 'adaptive_quality_latency',
      duration: latencyMs,
      success: true,
      metadata: { quality, avgLatency }
    });
  };

  /**
   * Ajusta qualidade baseado em latência observada
   */
  const adjustQualityBasedOnLatency = (avgLatency: number) => {
    let newQuality: QualityLevel = quality;

    if (avgLatency > 10000 && quality !== 'low') {
      newQuality = 'low';
      logger.warn('AdaptiveQuality: High latency detected, reducing quality', { 
        avgLatency 
      }, 'useAdaptiveQuality');
    } else if (avgLatency > 5000 && quality === 'high') {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: Moderate latency, switching to medium', { 
        avgLatency 
      }, 'useAdaptiveQuality');
    } else if (avgLatency < 3000 && quality === 'low') {
      newQuality = 'medium';
      logger.info('AdaptiveQuality: Good latency, upgrading quality', { 
        avgLatency 
      }, 'useAdaptiveQuality');
    } else if (avgLatency < 2000 && quality === 'medium') {
      newQuality = 'high';
      logger.info('AdaptiveQuality: Excellent latency, upgrading to high', { 
        avgLatency 
      }, 'useAdaptiveQuality');
    }

    if (newQuality !== quality) {
      changeQuality(newQuality, 'latency');
    }
  };

  /**
   * Muda qualidade manualmente ou automaticamente
   */
  const changeQuality = (newQuality: QualityLevel, reason: 'manual' | 'auto' | 'latency' = 'manual') => {
    if (newQuality === quality) return;

    logger.info('AdaptiveQuality: Quality changed', {
      from: quality,
      to: newQuality,
      reason
    }, 'useAdaptiveQuality');

    setQuality(newQuality);
    setSettings(QUALITY_CONFIGS[newQuality]);

    metricsCollector.trackPerformance({
      operation: 'adaptive_quality_change',
      duration: 0,
      success: true,
      metadata: {
        from: quality,
        to: newQuality,
        reason,
        networkInfo,
        deviceInfo
      }
    });
  };

  /**
   * Força uma qualidade específica (desabilita auto-ajuste)
   */
  const setManualQuality = (newQuality: QualityLevel) => {
    setAutoAdjust(false);
    changeQuality(newQuality, 'manual');
  };

  /**
   * Reabilita auto-ajuste
   */
  const enableAutoAdjust = () => {
    setAutoAdjust(true);
    logger.info('AdaptiveQuality: Auto-adjust enabled', undefined, 'useAdaptiveQuality');
    
    // Re-avalia imediatamente
    if (Object.keys(networkInfo).length > 0) {
      adjustQualityBasedOnNetwork(networkInfo);
    }
  };

  /**
   * Obtém recomendação de qualidade atual
   */
  const getRecommendation = (): {
    recommended: QualityLevel;
    reason: string;
  } => {
    if (networkInfo.saveData) {
      return {
        recommended: 'low',
        reason: 'Data saver mode enabled'
      };
    }

    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') {
      return {
        recommended: 'low',
        reason: 'Very slow connection (2G)'
      };
    }

    if (networkInfo.effectiveType === '3g') {
      return {
        recommended: 'medium',
        reason: '3G connection'
      };
    }

    if (deviceInfo.isLowEndDevice) {
      return {
        recommended: 'medium',
        reason: 'Low-end device'
      };
    }

    const avgLatency = latencyHistory.length > 0
      ? latencyHistory.reduce((sum, l) => sum + l, 0) / latencyHistory.length
      : 0;

    if (avgLatency > 5000) {
      return {
        recommended: 'low',
        reason: `High latency (${Math.round(avgLatency)}ms)`
      };
    }

    return {
      recommended: 'high',
      reason: 'Good connection and device'
    };
  };

  return {
    quality,
    settings,
    networkInfo,
    deviceInfo,
    autoAdjust,
    latencyHistory,
    
    // Métodos
    setManualQuality,
    enableAutoAdjust,
    recordLatency,
    getRecommendation,
    
    // Configurações disponíveis
    availableQualities: ['high', 'medium', 'low'] as QualityLevel[],
    qualityConfigs: QUALITY_CONFIGS
  };
}
