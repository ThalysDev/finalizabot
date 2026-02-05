/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends metrics to analytics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { trackEvent } from '@/lib/analytics';

export function reportWebVitals() {
  // Largest Contentful Paint (LCP)
  onLCP((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'LCP',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });

  // Interaction to Next Paint (INP) - replaces FID
  onINP((metric) => {
    trackEvent({
      event: 'page_view',
      properties: {
        metric_name: 'INP',
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
      },
    });
  });

  // Cumulative Layout Shift (CLS)
  onCLS((metric) => {
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
  onFCP((metric) => {
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
  onTTFB((metric) => {
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
