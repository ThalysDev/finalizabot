/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends metrics to analytics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { trackEvent } from '@/lib/analytics';

export function reportWebVitals() {
  // Largest Contentful Paint (LCP)
  getLCP((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'LCP',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });

  // First Input Delay (FID)
  getFID((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'FID',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });

  // Cumulative Layout Shift (CLS)
  getCLS((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'CLS',
        metric_value: parseFloat((metric.value * 100).toFixed(4)),
        metric_rating: metric.rating,
      },
    });
  });

  // First Contentful Paint (FCP)
  getFCP((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'FCP',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });

  // Time to First Byte (TTFB)
  getTTFB((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'TTFB',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });
}
