'use client';

import { useEffect } from 'react';

interface ServiceWorkerManagerProps {
  disabled: boolean;
}

export function ServiceWorkerManager({ disabled }: ServiceWorkerManagerProps) {
  useEffect(() => {
    if (!disabled) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }

    if (typeof caches !== 'undefined') {
      caches.keys().then(keys => {
        keys.forEach(key => {
          caches.delete(key);
        });
      });
    }
  }, [disabled]);

  return null;
}
