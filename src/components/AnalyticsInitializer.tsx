/**
 * Componente que inicializa o Analytics e rastreia page views automaticamente
 */

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AnalyticsInitializer = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    try {
      const track = () => {
        if (analytics.isInitialized) {
          analytics.trackPage(window.location.pathname);
        }
      };

      // Track initial load
      track();

      // Listen to history changes (pushState/replaceState) and back/forward (popstate)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      const notify = () => window.dispatchEvent(new Event('analytics:location-change'));

      history.pushState = function(...args) {
        const ret = originalPushState.apply(this, args as any);
        notify();
        return ret;
      } as any;

      history.replaceState = function(...args) {
        const ret = originalReplaceState.apply(this, args as any);
        notify();
        return ret;
      } as any;

      const onChange = () => track();
      window.addEventListener('popstate', onChange);
      window.addEventListener('analytics:location-change', onChange);

      return () => {
        window.removeEventListener('popstate', onChange);
        window.removeEventListener('analytics:location-change', onChange);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [analytics]);

  return null;
};
