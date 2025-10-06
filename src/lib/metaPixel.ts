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

// Standard conversion events
export const MetaPixelEvents = {
  // User registration/signup
  CompleteRegistration: 'CompleteRegistration',
  
  // Subscription/purchase events
  Subscribe: 'Subscribe',
  Purchase: 'Purchase',
  
  // Onboarding milestone
  Lead: 'Lead',
  
  // Search functionality
  Search: 'Search',
  
  // Content views
  ViewContent: 'ViewContent',
} as const;
