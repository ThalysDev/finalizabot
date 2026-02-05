/**
 * Performance Monitoring Hook
 * Monitors and tracks application performance metrics
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

/**
 * Hook to monitor and report performance metrics
 */
export function usePerformanceMonitoring() {
  const pathname = usePathname();

  useEffect(() => {
    // Ensure we have window object
    if (typeof window === 'undefined') return;

    // Wait for navigation to complete
    const handleLoad = () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Performance]', {
          page: pathname,
          totalLoadTime: pageLoadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          firstPaint: perfData.responseEnd - perfData.navigationStart,
        });
      }

      // Send metrics to analytics
      if (window.gtag) {
        window.gtag('event', 'page_load', {
          value: pageLoadTime,
          currency: 'ms',
          path: pathname,
        });
      }
    };

    // Add event listener for page load
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [pathname]);
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): Partial<PerformanceMetrics> | null {
  if (typeof window === 'undefined') return null;

  const perfData = window.performance.timing;
  const perfEntries = window.performance.getEntriesByType('navigation');

  return {
    navigationStart: perfData.navigationStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
    loadComplete: perfData.loadEventEnd - perfData.navigationStart,
  };
}

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}
