import { ConnectedUserItem, UserSession } from './types';

interface ActiveSessionEntry {
  user: UserSession;
  lastPing: number;
}

// In-memory active session store across requests
const activeSessionsStore = new Map<string, ActiveSessionEntry>();

// Active timeout threshold: 5 minutes (300,000 ms)
const ACTIVE_TIMEOUT_MS = 5 * 60 * 1000;

export function registerActiveSession(user: UserSession): void {
  if (!user || !user.id) return;
  activeSessionsStore.set(user.id, {
    user,
    lastPing: Date.now(),
  });
}

export function removeActiveSession(userId: string): void {
  if (!userId) return;
  activeSessionsStore.delete(userId);
}

export function getActiveSessions(): ConnectedUserItem[] {
  const now = Date.now();
  const activeList: ConnectedUserItem[] = [];

  activeSessionsStore.forEach((entry, userId) => {
    if (now - entry.lastPing <= ACTIVE_TIMEOUT_MS) {
      activeList.push({
        id: entry.user.id,
        nombre: entry.user.nombre,
        correo: entry.user.correo,
        rol: entry.user.rol,
        nivelAsignado: entry.user.nivelAsignado || 'Educación Física',
        estado: 'En línea',
        ultimoAcceso: 'Ahora mismo',
      });
    } else {
      activeSessionsStore.delete(userId);
    }
  });

  return activeList;
}
