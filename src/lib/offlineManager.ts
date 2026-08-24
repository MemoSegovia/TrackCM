import { AlumnoInscrito } from './types';

export interface OfflineRecordItem {
  id: string;
  timestamp: number;
  type: 'atletismo' | 'antropometrico' | 'cualitativo';
  endpoint: string;
  payload: any;
  retryCount: number;
}

const QUEUE_KEY = 'trackcm_offline_queue';
const CACHE_ALUMNOS_KEY = 'trackcm_cached_alumnos';
const CACHE_USER_LEVELS_KEY = 'trackcm_cached_user_levels';

// Dispatch custom event for UI reactivity
function notifyQueueUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trackcm_queue_updated'));
  }
}

function notifyOnlineStatusChanged(isOnline: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('trackcm_offline_status_change', { detail: { isOnline } })
    );
  }
}

// -------------------------------------------------------------
// CACHING ALUMNOS & USER LEVELS FOR OFFLINE USE
// -------------------------------------------------------------

export function saveStudentsCache(alumnos: AlumnoInscrito[], userLevelsByEmail?: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    if (alumnos && alumnos.length > 0) {
      localStorage.setItem(CACHE_ALUMNOS_KEY, JSON.stringify(alumnos));
    }
    if (userLevelsByEmail) {
      localStorage.setItem(CACHE_USER_LEVELS_KEY, JSON.stringify(userLevelsByEmail));
    }
  } catch (e) {
    console.warn('Failed to cache students offline:', e);
  }
}

export function getStudentsCache(): { alumnos: AlumnoInscrito[]; userLevelsByEmail: Record<string, string[]> } {
  if (typeof window === 'undefined') return { alumnos: [], userLevelsByEmail: {} };
  try {
    const rawAlumnos = localStorage.getItem(CACHE_ALUMNOS_KEY);
    const rawLevels = localStorage.getItem(CACHE_USER_LEVELS_KEY);
    return {
      alumnos: rawAlumnos ? JSON.parse(rawAlumnos) : [],
      userLevelsByEmail: rawLevels ? JSON.parse(rawLevels) : {},
    };
  } catch (e) {
    return { alumnos: [], userLevelsByEmail: {} };
  }
}

// -------------------------------------------------------------
// QUEUE MANAGEMENT
// -------------------------------------------------------------

export function getOfflineQueue(): OfflineRecordItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addToOfflineQueue(type: 'atletismo' | 'antropometrico' | 'cualitativo', endpoint: string, payload: any): OfflineRecordItem {
  const queue = getOfflineQueue();
  const newItem: OfflineRecordItem = {
    id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    type,
    endpoint,
    payload,
    retryCount: 0,
  };
  queue.push(newItem);
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  notifyQueueUpdated();
  return newItem;
}

export function removeFromOfflineQueue(id: string) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  notifyQueueUpdated();
}

// -------------------------------------------------------------
// RECORD SUBMISSION (OFFLINE-FIRST)
// -------------------------------------------------------------

export interface SubmitRecordResult {
  success: boolean;
  offline: boolean;
  message: string;
  data?: any;
}

export async function submitRecord(
  type: 'atletismo' | 'antropometrico' | 'cualitativo',
  endpoint: string,
  payload: any
): Promise<SubmitRecordResult> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    addToOfflineQueue(type, endpoint, payload);
    return {
      success: true,
      offline: true,
      message: 'Guardado localmente en el dispositivo (sin conexión). Se sincronizará automáticamente al detectar internet.',
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      return {
        success: true,
        offline: false,
        message: '¡Registro guardado y sincronizado exitosamente!',
        data,
      };
    } else {
      return {
        success: false,
        offline: false,
        message: data.error || 'Error al guardar el registro en el servidor.',
      };
    }
  } catch (err) {
    // Network failure (server unreachable or internet lost during request) -> fallback to offline queue
    console.warn('Network error during fetch. Saving to offline queue:', err);
    addToOfflineQueue(type, endpoint, payload);
    return {
      success: true,
      offline: true,
      message: 'Guardado localmente en el dispositivo (sin conexión). Se sincronizará automáticamente cuando regrese internet.',
    };
  }
}

// -------------------------------------------------------------
// AUTO SYNC OFFLINE QUEUE TO SERVER
// -------------------------------------------------------------

let isSyncing = false;

export async function syncOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof window === 'undefined' || isSyncing) return { syncedCount: 0, failedCount: 0 };
  if (!navigator.onLine) return { syncedCount: 0, failedCount: 0 };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      const data = await res.json();
      if (data.success) {
        removeFromOfflineQueue(item.id);
        syncedCount++;
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
        failedCount++;
      }
    } catch (e) {
      console.warn(`Sync attempt failed for record ${item.id}:`, e);
      failedCount++;
      break; // Stop loop if connection fails mid-sync
    }
  }

  isSyncing = false;
  notifyQueueUpdated();
  return { syncedCount, failedCount };
}

// Initialize global auto-sync listeners
export function initOfflineListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    notifyOnlineStatusChanged(true);
    syncOfflineQueue();
  });

  window.addEventListener('offline', () => {
    notifyOnlineStatusChanged(false);
  });

  // Background timer to retry sync every 30 seconds if online
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineQueue();
    }
  }, 30000);
}
