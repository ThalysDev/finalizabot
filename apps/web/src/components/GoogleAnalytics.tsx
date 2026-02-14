/**
 * Google Analytics Script Component
 * Initializes Google Analytics 4 tracking
 */

import Script from "next/script";

interface GoogleAnalyticsProps {
  gaId?: string;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<unknown>;
  }
}

export function GoogleAnalytics({
  gaId = process.env.NEXT_PUBLIC_GA_ID,
}: GoogleAnalyticsProps) {
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Global Script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      {/* Initialize Google Analytics */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization: false,
            });
          `,
        }}
      />
    </>
  );
}
