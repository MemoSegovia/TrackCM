const CUSTOM_CICLOS_KEY = 'trackcm_custom_ciclos_escolares';
const ACTIVE_CICLO_KEY = 'trackcm_active_ciclo';
export const DEFAULT_CICLOS = ['2026-2027', '2025-2026'];
export const DEFAULT_ACTIVE_CICLO = '2026-2027';

export function getActiveCicloEscolar(): string {
  if (typeof window === 'undefined') return DEFAULT_ACTIVE_CICLO;
  try {
    return localStorage.getItem(ACTIVE_CICLO_KEY) || DEFAULT_ACTIVE_CICLO;
  } catch (e) {
    return DEFAULT_ACTIVE_CICLO;
  }
}

export function setActiveCicloEscolar(ciclo: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_CICLO_KEY, ciclo.trim());
    window.dispatchEvent(new CustomEvent('trackcm_active_ciclo_changed', { detail: { ciclo: ciclo.trim() } }));
  } catch (e) {
    // ignore
  }
}

export function getCustomCiclosEscolares(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CICLOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getAllCiclosEscolares(extraCiclos: string[] = []): string[] {
  const custom = getCustomCiclosEscolares();
  const set = new Set([...DEFAULT_CICLOS, ...custom, ...extraCiclos]);
  const arr = Array.from(set).filter(Boolean);
  arr.sort((a, b) => b.localeCompare(a));
  return arr;
}

export function addCustomCicloEscolar(ciclo: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const clean = (ciclo || '').trim();
    if (!clean) return false;

    const current = getCustomCiclosEscolares();
    if (!current.includes(clean) && !DEFAULT_CICLOS.includes(clean)) {
      current.push(clean);
      localStorage.setItem(CUSTOM_CICLOS_KEY, JSON.stringify(current));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trackcm_ciclos_updated'));
      }
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function deleteCustomCicloEscolar(ciclo: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const clean = (ciclo || '').trim();
    const current = getCustomCiclosEscolares().filter((c) => c !== clean);
    localStorage.setItem(CUSTOM_CICLOS_KEY, JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trackcm_ciclos_updated'));
    }
    return true;
  } catch (e) {
    return false;
  }
}
