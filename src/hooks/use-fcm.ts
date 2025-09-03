
'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { saveSubscription } from '@/app/actions/notifications';

export const useFcm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // This effect should only run on the client side
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !user) {
      return;
    }

    const messaging = getMessaging(app);

    // Request permission and get token
    const requestPermissionAndToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          const currentToken = await getToken(messaging, { 
            vapidKey: 'BFvP8Xp_lZ6T9fPz-8yqXfJ3yQ...YOUR_VAPID_KEY...wKVw', // Replace with your actual VAPID key from Firebase Console
            serviceWorkerRegistration: await navigator.serviceWorker.ready,
          });

          if (currentToken) {
            setFcmToken(currentToken);
            // Send this token to your server
            await saveSubscription(user.uid, currentToken);
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    requestPermissionAndToken();

    // Handle incoming messages while the app is in the foreground
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, [user, toast]);

  return { fcmToken };
};
