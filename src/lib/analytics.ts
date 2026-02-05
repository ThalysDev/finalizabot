/**
 * Google Analytics Configuration
 * Centralized analytics utility for event tracking
 */

export type AnalyticsEvent =
  | 'hero_cta_click'
  | 'demo_card_view'
  | 'benefits_section_view'
  | 'sign_up_click'
  | 'sign_in_click'
  | 'dashboard_click'
  | 'how_it_works_view'
  | 'cta_section_view'
  | 'player_search'
  | 'match_view'
  | 'favorite_save'
  | 'share_analysis'
  | 'subscription_click'
  | 'footer_link_click'
  | 'page_view';

export interface AnalyticsEventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

/**
 * Track analytics event with Google Analytics
 */
export const trackEvent = (payload: AnalyticsEventPayload) => {
  if (typeof window === 'undefined') return;

  const { event, properties = {}, timestamp = Date.now() } = payload;

  // Google Analytics tracking
  if (window.gtag) {
    window.gtag('event', event, {
      timestamp,
      ...properties,
    });
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title: string) => {
  trackEvent({
    event: 'page_view',
    properties: {
      path,
      title,
    },
  });
};

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (ctaName: string, section: string) => {
  trackEvent({
    event: 'sign_up_click',
    properties: {
      cta_name: ctaName,
      section,
      timestamp: Date.now(),
    },
  });
};

/**
 * Track feature views
 */
export const trackFeatureView = (featureName: string) => {
  trackEvent({
    event: 'demo_card_view',
    properties: {
      feature: featureName,
    },
  });
};

/**
 * Track engagement metrics
 */
export const trackEngagement = (
  action: 'favorite' | 'share' | 'save',
  itemType: string,
  itemId: string
) => {
  const eventMap = {
    favorite: 'favorite_save',
    share: 'share_analysis',
    save: 'favorite_save',
  };

  trackEvent({
    event: eventMap[action],
    properties: {
      item_type: itemType,
      item_id: itemId,
      action,
    },
  });
};
