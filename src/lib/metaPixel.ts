// Meta Pixel tracking utility
// This provides type-safe access to Meta Pixel events

declare global {
  interface Window {
    fbq: (action: string, eventName: string, params?: Record<string, any>) => void;
  }
}

export const trackMetaPixelEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

// Track page view (for route changes)
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// Standard conversion events
export const MetaPixelEvents = {
  // Standard Meta Pixel events
  PageView: 'PageView',
  CompleteRegistration: 'CompleteRegistration',
  InitiateCheckout: 'InitiateCheckout',
  Subscribe: 'Subscribe',
  Purchase: 'Purchase',
  
  // Custom events
  FirstScan: 'FirstScan',
  AddToCollection: 'AddToCollection',
  UpgradePlan: 'UpgradePlan',
  AddScanPack: 'AddScanPack',
  ActiveUserD7: 'ActiveUserD7',
  RefreshStats: 'RefreshStats',
  
  // Legacy events (keeping for backward compatibility)
  Lead: 'Lead',
  Search: 'Search',
  ViewContent: 'ViewContent',
} as const;
