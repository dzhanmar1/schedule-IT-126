import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает уведомления');
      return;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
  };

  const scheduleNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    // Prefer Service Worker notifications (required for PWA on mobile)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
        return;
      } catch {
        // SW not ready or not supported — fall through to basic Notification
      }
    }

    // Fallback for desktop browsers without SW
    try {
      new Notification(title, options);
    } catch {
      // Some browsers block new Notification() in certain contexts
    }
  };

  return { permission, requestPermission, scheduleNotification };
}

