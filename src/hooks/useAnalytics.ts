/**
 * Analytics Hook
 * Provides analytics tracking in React components
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackPageView,
  trackEvent,
  type AnalyticsEvent,
  type AnalyticsEventPayload,
} from '@/lib/analytics';

/**
 * Hook to automatically track page views
 */
export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    trackPageView(pathname, document.title);
  }, [pathname]);
}

/**
 * Hook to track specific events
 */
export function useTrackEvent() {
  return (payload: AnalyticsEventPayload) => {
    trackEvent(payload);
  };
}

/**
 * Hook for tracking clicks on specific elements
 */
export function useTrackClick(event: AnalyticsEvent, properties?: Record<string, any>) {
  return (e?: React.MouseEvent) => {
    trackEvent({
      event,
      properties,
    });
  };
}
