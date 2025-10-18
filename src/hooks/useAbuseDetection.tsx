/**
 * Hook para facilitar o uso do AbuseDetector nos componentes
 */

import { useEffect, useState } from 'react';
import { abuseDetector } from '@/services/AbuseDetector';
import { useAuth } from './useAuth';

type ActionType = 
  | 'api_call' 
  | 'login' 
  | 'signup' 
  | 'password_reset' 
  | 'lesson_access'
  | 'audio_upload'
  | 'chat_message';

export function useAbuseDetection() {
  const { user } = useAuth();
  const [isThrottled, setIsThrottled] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const status = abuseDetector.getUserStatus(user.id);
      setIsThrottled(status.isThrottled);
      setSuspicionScore(status.pattern?.suspicionScore || 0);
    }
  }, [user?.id]);

  /**
   * Registra uma ação do usuário
   */
  const recordAction = (
    action: ActionType,
    metadata?: Record<string, any>
  ) => {
    abuseDetector.recordAction(user?.id || null, action, metadata);
    
    // Atualiza status após registrar
    if (user?.id) {
      const status = abuseDetector.getUserStatus(user.id);
      setIsThrottled(status.isThrottled);
      setSuspicionScore(status.pattern?.suspicionScore || 0);
    }
  };

  /**
   * Verifica se pode executar uma ação
   */
  const canPerformAction = (action: ActionType): boolean => {
    return abuseDetector.canPerformAction(user?.id || null, action);
  };

  /**
   * Detecta anomalias para o usuário atual
   */
  const detectAnomaly = async () => {
    if (!user?.id) return null;
    return await abuseDetector.detectAnomaly(user.id);
  };

  /**
   * Obtém status completo do usuário
   */
  const getUserStatus = () => {
    if (!user?.id) return null;
    return abuseDetector.getUserStatus(user.id);
  };

  return {
    isThrottled,
    suspicionScore,
    recordAction,
    canPerformAction,
    detectAnomaly,
    getUserStatus
  };
}
