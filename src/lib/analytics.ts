'use client';

import { analytics } from '@/lib/firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Logs a custom event to Firebase Analytics.
 * @param eventName The name of the event to log.
 * @param eventParams Optional parameters to associate with the event.
 */
export const logAnalyticsEvent = (
  eventName: string,
  eventParams?: { [key: string]: any }
) => {
  if (typeof window === 'undefined') return;

  analytics.then(fbAnalytics => {
    if (fbAnalytics) {
      firebaseLogEvent(fbAnalytics, eventName, eventParams);
    }
  }).catch(err => {
    console.error("Firebase Analytics not available", err);
  });
};

// Example standard events:
// 'login'
// 'sign_up'
// 'share'
// 'view_item'
// 'generate_lead'
