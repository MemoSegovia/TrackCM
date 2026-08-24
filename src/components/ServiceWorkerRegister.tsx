'use client';

import { useEffect } from 'react';
import { initOfflineListeners, syncOfflineQueue } from '@/lib/offlineManager';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Initialize offline event listeners & periodic auto-sync
    initOfflineListeners();

    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('ServiceWorker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed:', err);
        });
    }

    // Try initial sync on load if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncOfflineQueue();
    }
  }, []);

  return null;
}
