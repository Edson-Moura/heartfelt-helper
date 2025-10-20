/**
 * Componente que inicializa o Analytics e rastreia page views automaticamente
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AnalyticsInitializer = () => {
  const location = useLocation();
  const { trackPage } = useAnalytics();

  // Track page views on route change
  useEffect(() => {
    trackPage(location.pathname);
  }, [location.pathname, trackPage]);

  return null;
};
