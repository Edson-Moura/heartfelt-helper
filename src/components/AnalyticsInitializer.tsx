/**
 * Componente que inicializa o Analytics e rastreia page views automaticamente
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AnalyticsInitializer = () => {
  const location = useLocation();
  const analytics = useAnalytics();

  // Track page views on route change
  useEffect(() => {
    try {
      if (analytics.isInitialized) {
        analytics.trackPage(location.pathname);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [location.pathname, analytics]);

  return null;
};
