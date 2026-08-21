export function calculateIMC(pesoKg: number, estaturaCm: number) {
  if (!pesoKg || !estaturaCm || estaturaCm <= 0 || pesoKg <= 0) {
    return { imc: 0, categoria: 'N/A', color: 'text-gray-400', badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  }

  const estaturaM = estaturaCm / 100;
  const imc = parseFloat((pesoKg / (estaturaM * estaturaM)).toFixed(1));

  let categoria = 'Normal';
  let color = 'text-emerald-500';
  let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-500/30';

  if (imc < 18.5) {
    categoria = 'Bajo peso';
    color = 'text-amber-500';
    badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-500/30';
  } else if (imc >= 25 && imc < 30) {
    categoria = 'Sobrepeso';
    color = 'text-orange-500';
    badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-500/30';
  } else if (imc >= 30) {
    categoria = 'Obesidad';
    color = 'text-rose-500';
    badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-500/30';
  }

  return { imc, categoria, color, badgeClass };
}

export function formatStopwatchTime(milliseconds: number): string {
  const totalMs = Math.floor(milliseconds);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

export function generateRecordId(prefix: string): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomHex = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${randomHex}`;
}

export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function parseSecondsFromFormattedTime(timeStr: string): number {
  if (!timeStr || timeStr === '-' || timeStr.toLowerCase().includes('no completada')) return 999999;
  const cleanStr = timeStr.replace(/\s*s$/i, '').trim();
  const parts = cleanStr.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  }
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 999999 : val;
}

export function parseDistanceInMeters(distStr: string): number {
  if (!distStr) return 0;
  const cleanStr = distStr.replace(' m', '').trim();
  return parseFloat(cleanStr) || 0;
}
