import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const subscribe = async () => {
    if (!user || !isSupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Разрешение на уведомления не получено.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.error('VAPID Public Key is missing.');
        return;
      }

      // Convert VAPID key for use with PushManager
      const base64UrlToUint8Array = (base64UrlData: string) => {
        const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
        const base64 = (base64UrlData + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = base64UrlToUint8Array(publicVapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      const subData = JSON.parse(JSON.stringify(subscription));

      // Save to Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth
      }, { onConflict: 'user_id,endpoint' });

      if (error) throw error;

      setIsSubscribed(true);
      alert('Уведомления успешно включены!');
    } catch (err) {
      console.error('Error subscribing to push:', err);
      alert('Ошибка при подписке на уведомления.');
    }
  };

  return { isSupported, isSubscribed, subscribe };
}
